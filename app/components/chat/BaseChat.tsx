import type { Message } from 'ai';
import React, { useState, type RefCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { IconButton } from '~/components/ui/IconButton';
import { Workbench } from '~/components/workbench/Workbench.client';
import { classNames } from '~/utils/classNames';
import { Messages } from './Messages.client';
import { SendButton } from './SendButton.client';
import { toast } from 'react-toastify';

import styles from './BaseChat.module.scss';
import Popup from '../popup/Popup';
import { userStore } from '~/lib/stores/user';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import FeedbackPopup from '../popup/FeedbackPopup';
import { popupStore } from '~/lib/stores/popups';

interface BaseChatProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement> | undefined;
  messageRef?: RefCallback<HTMLDivElement> | undefined;
  scrollRef?: RefCallback<HTMLDivElement> | undefined;
  showChat?: boolean;
  chatStarted?: boolean;
  isStreaming?: boolean;
  messages?: Message[];
  enhancingPrompt?: boolean;
  promptEnhanced?: boolean;
  input?: string;
  handleStop?: () => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  handleInputChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  enhancePrompt?: () => void;
}

const EXAMPLE_PROMPTS = [
  { text: 'Simple CRUD API for a todo list' },
  { text: 'JWT authentication for user logins' },
  { text: 'Generate images with openai DALL-E' },
  { text: 'Basic landing page with a contact form' },
  { text: 'Image processing API (resizing / compression)' },
];

const TEXTAREA_MIN_HEIGHT = 76;

export const BaseChat = React.forwardRef<HTMLDivElement, BaseChatProps>(
  (
    {
      textareaRef,
      messageRef,
      scrollRef,
      showChat = true,
      chatStarted = false,
      isStreaming = false,
      enhancingPrompt = false,
      promptEnhanced = false,
      messages,
      input = '',
      sendMessage,
      handleInputChange,
      enhancePrompt,
      handleStop,
    },
    ref,
  ) => {
    const TEXTAREA_MAX_HEIGHT = chatStarted ? 400 : 200;

    const user = useStore(userStore);
    const { login, feedback } = useStore(popupStore);
    const { dailyQuotaRemaining, bonusQuotaRemaining } = useStore(chatStore);

    // checks if the user is none, if so open the popup, otherwise call the sendMessage function
    const enhancePromptWithAuthCheck = (event: React.UIEvent) => {
      event.stopPropagation();
      if (!user) {
        popupStore.setKey('login', true);
        return;
      }
      // if the daily quota and bonus quota are both 0, open the feedback form to let the user earn more
      if (dailyQuotaRemaining === 0 && bonusQuotaRemaining === 0) {
        toast.error('Quota Exceeded.');
        popupStore.setKey('feedback', true);
        return;
      }
      return enhancePrompt?.();
    };

    // checks if the user is none, if so open the popup, otherwise call the sendMessage function
    const sendMessageWithAuthCheck = (event: React.UIEvent, messageInput?: string) => {
      event.stopPropagation();
      if (!user) {
        popupStore.setKey('login', true);
        return;
      }
      // if the daily quota and bonus quota are both 0, open the feedback form to let the user earn more
      if (dailyQuotaRemaining === 0 && bonusQuotaRemaining === 0) {
        toast.error('Quota Exceeded.');
        popupStore.setKey('feedback', true);
        return;
      }
      return sendMessage?.(event, messageInput);
    };

    return (
      <div
        ref={ref}
        className={classNames(styles.BaseChat, 'relative flex h-full w-full overflow-hidden ')}
        data-chat-visible={showChat}
      >
        <ClientOnly>{() => <Menu />}</ClientOnly>
        <Popup />
        <FeedbackPopup />

        <div ref={scrollRef} className="flex  w-full h-full justify-center">
          <div className={classNames(styles.Chat, 'flex flex-col flex-grow min-w-[var(--chat-min-width)] h-full')}>
            {!chatStarted && (
              <div id="intro" className="mt-[18vh] sm:max-w-[60rem] mx-auto">
                <h1 className="text-4xl sm:text-4xl text-center font-semibold text-bolt-elements-textPrimary mb-3">
                  FastAPI Generator
                </h1>
                <p className="mb-2 text-center text-bolt-elements-textSecondary text-xl sm:text-xl max-w-screen">
                  Generate, edit, and deploy Python APIs <br className="sm:hidden" />
                  in your browser
                </p>
              </div>
            )}
            <div
              className={classNames('pt-6 px-6', {
                'h-full flex flex-col': chatStarted,
              })}
            >
              <ClientOnly>
                {() => {
                  return chatStarted ? (
                    <Messages
                      ref={messageRef}
                      className={classNames(
                        styles.NoScrollbar,
                        'flex flex-col w-full flex-1 max-w-screen sm:max-w-[36rem] px-6 pb-6 mx-auto z-1 overflow-y-auto max-h-[calc(100vh-200px)] overflow-hidden',
                      )}
                      messages={messages}
                      isStreaming={isStreaming}
                    />
                  ) : null;
                }}
              </ClientOnly>
              <div
                className={classNames(' px-4 relative w-full max-w-screen sm:max-w-[36rem] mx-auto z-prompt', {
                  'sticky bottom-0': chatStarted,
                })}
              >
                <div
                  className={classNames(
                    'shadow-sm border border-bolt-elements-borderColor bg-bolt-elements-prompt-background backdrop-filter backdrop-blur-[8px] rounded-lg overflow-hidden mb-6',
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    className={`w-full pl-4 pt-4 pr-16 focus:outline-none resize-none text-md text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent`}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (event.shiftKey) {
                          return;
                        }

                        event.preventDefault();

                        sendMessageWithAuthCheck?.(event);
                      }
                    }}
                    value={input}
                    onChange={(event) => {
                      handleInputChange?.(event);
                    }}
                    style={{
                      minHeight: TEXTAREA_MIN_HEIGHT,
                      maxHeight: TEXTAREA_MAX_HEIGHT,
                    }}
                    placeholder={
                      chatStarted ? 'Ask questions and request code changes' : 'What would you like to launch?'
                    }
                    translate="no"
                  />
                  <ClientOnly>
                    {() => (
                      <SendButton
                        show={input.length > 0 || isStreaming}
                        isStreaming={isStreaming}
                        onClick={(event) => {
                          if (isStreaming) {
                            handleStop?.();
                            return;
                          }

                          sendMessageWithAuthCheck?.(event);
                        }}
                      />
                    )}
                  </ClientOnly>
                  <div className="flex justify-between text-sm p-4 pt-2">
                    <div className="flex gap-2">
                      <div className="flex gap-1 items-center">
                        <IconButton
                          title="Enhance prompt"
                          disabled={input.length === 0 || enhancingPrompt}
                          className={classNames({
                            'opacity-100!': enhancingPrompt,
                            'text-bolt-elements-item-contentAccent! pr-1.5 enabled:hover:bg-bolt-elements-item-backgroundAccent!':
                              promptEnhanced,
                          })}
                          onClick={(event) => {
                            enhancePromptWithAuthCheck?.(event);
                          }}
                        >
                          {enhancingPrompt ? (
                            <>
                              <div className="i-svg-spinners:90-ring-with-bg text-bolt-elements-loader-progress text-xl"></div>
                              <div className="ml-1.5">Enhancing prompt...</div>
                            </>
                          ) : (
                            <>
                              <div className="i-bolt:stars text-xl"></div>
                              {promptEnhanced && <div className="ml-1.5">Prompt enhanced</div>}
                            </>
                          )}
                        </IconButton>
                      </div>
                      {dailyQuotaRemaining !== undefined && (
                        <div className="flex gap-1 items-center">
                          <div className="text-bolt-elements-textTertiary">Daily quota:</div>
                          <div className="text-bolt-elements-textPrimary">{dailyQuotaRemaining}</div>
                        </div>
                      )}
                      {bonusQuotaRemaining !== undefined && bonusQuotaRemaining > 0 && (
                        <div className="flex gap-1 items-center">
                          <div className="text-bolt-elements-textTertiary">Bonus quota:</div>
                          <div className="text-bolt-elements-textPrimary">{bonusQuotaRemaining}</div>
                        </div>
                      )}
                    </div>
                    {input.length > 3 ? (
                      <div className="text-xs text-bolt-elements-textTertiary flex gap-1 items-center justify-self-end">
                        Use <kbd className="kdb">Shift</kbd> + <kbd className="kdb">Return</kbd> for a new line
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            {!chatStarted && (
              <div id="examples" className="relative w-full max-w-sm sm:max-w-xl mx-auto mt-8 flex justify-center">
                <div className="flex flex-col space-y-2 [mask-image:linear-gradient(to_bottom,black_0%,transparent_200%)] hover:[mask-image:none]">
                  {EXAMPLE_PROMPTS.map((examplePrompt, index) => {
                    return (
                      <button
                        key={index}
                        onClick={(event) => {
                          sendMessageWithAuthCheck?.(event, examplePrompt.text);
                        }}
                        className="group flex items-center w-full gap-2 justify-center bg-transparent text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary transition-theme"
                      >
                        {examplePrompt.text}
                        <div className="i-ph:arrow-bend-down-left" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <ClientOnly>{() => <Workbench chatStarted={chatStarted} isStreaming={isStreaming} />}</ClientOnly>
        </div>
      </div>
    );
  },
);
