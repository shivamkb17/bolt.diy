import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { DialogButton } from '../ui/Dialog';
import { userStore } from '~/lib/stores/user';
import { Link, useNavigate } from '@remix-run/react';

import { popupStore } from '~/lib/stores/popups';

export function Header() {
  const chat = useStore(chatStore);
  const user = useStore(userStore);
  const navigate = useNavigate();

  return (
    <header
      className={classNames('flex items-center justify-between p-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center z-logo text-bolt-elements-textPrimary cursor-pointer">
        <Link to="/" reloadDocument className="flex items-center text-xl gap-1">
          {/* changes the color  */}
          <span className="i-bolt:launchflow-logo inline-block" />
          <span className=" font-bold">LaunchFlow</span>
          <span className="hidden sm:block text-xs font-medium text-gray-400 bg-gray-700 px-2 py-1 ml-1 rounded-lg">
            AI
          </span>
        </Link>
      </div>
      <span className="hidden sm:flex px-4 truncate text-center text-bolt-elements-textPrimary">
        <ClientOnly>{() => <ChatDescription />}</ClientOnly>
      </span>
      {user === undefined && (
        <div className="text-4xl text-white text-center flex flex-row gap-2">
          <DialogButton type="secondary" onClick={() => navigate('/api/auth/login')}>
            Login
          </DialogButton>
          <DialogButton type="primary" onClick={() => navigate('/api/auth/signup')}>
            Sign Up
          </DialogButton>
        </div>
      )}
      {chat.started && (
        <DialogButton
          type="primary"
          onClick={() => {
            popupStore.setKey('deployment', true);
          }}
        >
          <div className="flex items-center gap-1">
            <div className="i-ph:rocket text-xl" />
            Deploy
          </div>
        </DialogButton>
      )}
    </header>
  );
}
