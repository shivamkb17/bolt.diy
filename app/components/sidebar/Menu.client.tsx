import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { db, deleteById, getAll, chatId, type ChatHistoryItem } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { logger } from '~/utils/logger';
import { HistoryItem } from './HistoryItem';
import { DeploymentItem } from './DeploymentItem';

import { binDates } from './date-binning';
import { useStore } from '@nanostores/react';
import { userStore } from '~/lib/stores/user';
import { Form, Link, useFetcher } from '@remix-run/react';
import { classNames } from '~/utils/classNames';
import styles from './Menu.module.scss';
import { deploymentStore, type Deployment } from '~/lib/stores/deployments';
import DeploymentPopup from '../popup/DeploymentPopup';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-150px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type ChatDialogContent = { type: 'delete'; item: ChatHistoryItem } | null;
type DeploymentDialogContent = { type: 'delete'; item: Deployment } | null;

export function Menu() {
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [chatDialogContent, setChatDialogContent] = useState<ChatDialogContent>(null);
  const [deploymentDialogContent, setDeploymentDialogContent] = useState<DeploymentDialogContent>(null);
  const fetcher = useFetcher<{ success: boolean; error: string }>();

  const user = useStore(userStore);
  const deployments = useStore(deploymentStore);

  const deploymentMap = new Map<string, Deployment>();
  if (deployments !== undefined) {
    for (const deployment of deployments) {
      if (deployment.name) {
        deploymentMap.set(deployment.name, deployment);
      }
    }
  }

  for (const item of list) {
    //check if the id is in the map
    if (deploymentMap.has(item.id)) {
      // set the deployment
      item.deployment = deploymentMap.get(item.id);
      deploymentMap.delete(item.id);
    }
  }

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteChatItem = useCallback((event: React.UIEvent, item: ChatHistoryItem) => {
    event.preventDefault();

    if (db) {
      deleteById(db, item.id)
        .then(() => {
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          toast.error('Failed to delete conversation');
          logger.error(error);
        });
    }
  }, []);

  const deleteDeploymentItem = useCallback((event: React.UIEvent, item: Deployment) => {
    event.preventDefault();

    if (user?.accountId) {
      try {
        fetcher.submit(
          {
            deployment_name: item.name,
            account_id: user.accountId,
          },
          {
            method: 'delete',
            action: '/api/destroy',
            encType: 'multipart/form-data',
          },
        );
      } catch (error) {
        console.error('Failed to submit deployment:', error);
      }
    }
  }, []);

  const closeChatDialog = () => {
    setChatDialogContent(null);
  };

  const closeDeploymentDialog = () => {
    setDeploymentDialogContent(null);
  };

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  useEffect(() => {
    const enterThreshold = 40;
    const exitThreshold = 40;

    function onMouseMove(event: MouseEvent) {
      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  // Close the menu when the deployment is deleted
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (fetcher.state === 'submitting') {
      setSubmitting(true);
    } else if (submitting) {
      setSubmitting(false);
      if (fetcher.data?.success) {
        closeDeploymentDialog();
      } else {
        toast.error('Failed to delete deployment');
      }
    }
  }, [fetcher.state, fetcher.data, submitting]);

  return (
    <>
      <DeploymentPopup />
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        className="flex flex-col side-menu fixed top-0 w-[70vw] sm:w-[360px] h-full bg-bolt-elements-background-depth-2 border-r rounded-r-3xl border-bolt-elements-borderColor z-sidebar shadow-xl shadow-bolt-elements-sidebar-dropdownShadow text-sm"
      >
        <div className="flex items-center h-[var(--header-height)]">{/* Placeholder */}</div>
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4">
            <Link
              to="/"
              reloadDocument
              className="flex gap-2 items-center bg-bolt-elements-sidebar-buttonBackgroundDefault text-bolt-elements-sidebar-buttonText hover:bg-bolt-elements-sidebar-buttonBackgroundHover rounded-md p-2 transition-theme"
            >
              <span className="inline-block i-bolt:chat scale-110" />
              Start new chat
            </Link>
          </div>
          <div className="text-bolt-elements-textPrimary font-medium pl-6 pr-5 my-2">Your Deployments</div>
          {user ? (
            <div className={classNames(styles.NoScrollbar, 'pl-4 pr-5 pb-5 overflow-y-auto')}>
              {(deployments === undefined || deployments.length === 0) && (
                <div className="pl-2 text-bolt-elements-textTertiary">No deployments</div>
              )}
              <DialogRoot open={deploymentDialogContent !== null}>
                <div className="mt-4 first:mt-0 space-y-1">
                  {list
                    .filter((item) => item.deployment !== undefined)
                    .map((item) => (
                      <DeploymentItem
                        key={item.description}
                        description={item.description || 'unknown'}
                        item={item.deployment as Deployment}
                        onDelete={() =>
                          setDeploymentDialogContent({ type: 'delete', item: item.deployment as Deployment })
                        }
                      />
                    ))
                    .concat(
                      Array.from(deploymentMap.values()).map((item) => (
                        <DeploymentItem
                          key={item.name}
                          description={`${item.name} - created on other device`}
                          item={item}
                          onDelete={() => setDeploymentDialogContent({ type: 'delete', item })}
                        />
                      )),
                    )}
                  <Dialog onBackdrop={closeDeploymentDialog} onClose={closeDeploymentDialog}>
                    {deploymentDialogContent?.type === 'delete' && (
                      <>
                        <DialogTitle>Delete Deployment?</DialogTitle>
                        {fetcher.state === 'submitting' ? (
                          <>
                            <DialogDescription asChild>
                              <div className="flex gap-1 items-center">
                                <div className="i-svg-spinners:90-ring-with-bg"></div>
                                <p>Deleting deployment...</p>
                              </div>
                            </DialogDescription>
                          </>
                        ) : (
                          <>
                            <DialogDescription asChild>
                              <div>
                                <p>
                                  You are about to delete <strong>{deploymentDialogContent.item.name}</strong>.
                                </p>
                                <p className="mt-1">Are you sure you want to delete this deployment?</p>
                              </div>
                            </DialogDescription>
                            <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                              <DialogButton type="secondary" onClick={closeDeploymentDialog}>
                                Cancel
                              </DialogButton>
                              <DialogButton
                                type="danger"
                                onClick={(event) => {
                                  deleteDeploymentItem(event, deploymentDialogContent.item);
                                }}
                              >
                                Delete
                              </DialogButton>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </Dialog>
                </div>
              </DialogRoot>
            </div>
          ) : (
            <div className=" pl-4 pr-5 pb-5">
              <div className="pl-2 text-bolt-elements-textTertiary">Login to view your deployments</div>
            </div>
          )}

          <div className="text-bolt-elements-textPrimary font-medium pl-6 pr-5 my-2">Your Chats</div>
          {user ? (
            <div className={classNames(styles.NoScrollbar, 'flex-1 pl-4 pr-5 pb-5 overflow-y-auto')}>
              {list.length === 0 && (
                <div className="pl-2 text-bolt-elements-textTertiary">No previous conversations</div>
              )}
              <DialogRoot open={chatDialogContent !== null}>
                {binDates(list).map(({ category, items }) => (
                  <div key={category} className="mt-4 first:mt-0 space-y-1">
                    <div className="text-bolt-elements-textTertiary sticky top-0 z-1 bg-bolt-elements-background-depth-2 pl-2 pt-2 pb-1">
                      {category}
                    </div>
                    {items.map((item) => (
                      <HistoryItem
                        key={item.id}
                        item={item}
                        onDelete={() => setChatDialogContent({ type: 'delete', item })}
                      />
                    ))}
                  </div>
                ))}
                <Dialog onBackdrop={closeChatDialog} onClose={closeChatDialog}>
                  {chatDialogContent?.type === 'delete' && (
                    <>
                      <DialogTitle>Delete Chat?</DialogTitle>
                      <DialogDescription asChild>
                        <div>
                          <p>
                            You are about to delete <strong>{chatDialogContent.item.description}</strong>.
                          </p>
                          <p className="mt-1">Are you sure you want to delete this chat?</p>
                        </div>
                      </DialogDescription>
                      <div className="px-5 pb-4 bg-bolt-elements-background-depth-2 flex gap-2 justify-end">
                        <DialogButton type="secondary" onClick={closeChatDialog}>
                          Cancel
                        </DialogButton>
                        <DialogButton
                          type="danger"
                          onClick={(event) => {
                            deleteChatItem(event, chatDialogContent.item);
                            closeChatDialog();
                          }}
                        >
                          Delete
                        </DialogButton>
                      </div>
                    </>
                  )}
                </Dialog>
              </DialogRoot>
            </div>
          ) : (
            <div className="flex-1 pl-4 pr-5 pb-5">
              <div className="pl-2 text-bolt-elements-textTertiary">Login to view your chat history</div>
            </div>
          )}

          {user && (
            <div className="flex items-center border-t border-bolt-elements-borderColor p-4 justify-between items-center bg-bolt-elements-sidebar-buttonBackgroundSecondary w-full">
              <Form method="post" action="/api/auth/logout" className="w-full">
                <button
                  type="submit"
                  className="text-start w-full inline-flex h-[35px] items-center justify-center rounded-lg px-4 text-sm leading-none focus:outline-none bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text hover:bg-bolt-elements-button-primary-backgroundHover"
                >
                  Logout
                </button>
              </Form>
            </div>
          )}
          <div className="flex items-center border-t border-bolt-elements-borderColor p-4 justify-between items-center">
            <div className="flex gap-2 items-center">
              {user?.pictureUrl !== undefined && (
                <>
                  <img src={user.pictureUrl as string} alt="User avatar" className="w-9 h-9 rounded-full" />
                  <p className="text-bolt-elements-textPrimary font-medium">{user.firstName}</p>
                </>
              )}
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </motion.div>
    </>
  );
}
