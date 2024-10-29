import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';

import { Link } from '@remix-run/react';

export function Footer() {
  const chat = useStore(chatStore);

  return (
    <footer
      className={classNames('flex justify-between items-center z-0  p-4 border-b h-[var(--header-height)] ', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="text-bolt-elements-textPrimary i-ph:sidebar-simple-duotone text-xl" />

      <div className="flex items-center gap-4 pr-2 z-logo text-bolt-elements-textSecondary cursor-pointer">
        <Link to="https://x.com/LaunchFlowCloud" target="_blank">
          <span className="i-ph:x-logo inline-block" />
        </Link>
        <Link to="https://github.com/launchflow/launchflow" target="_blank">
          <span className="i-ph:github-logo inline-block" />
        </Link>
        <Link
          to="https://join.slack.com/t/launchflowusers/shared_invite/zt-2pc3o5cbq-HZrMzlZXW2~Xs1CABbgPKQ"
          target="_blank"
        >
          <span className="i-ph:slack-logo inline-block" />
        </Link>

        {/* <div className="dot"></div>
        <span className="hidden sm:inline-block">About</span>
        <div className="dot hidden sm:inline-block"></div>
        <span className="hidden sm:inline-block">Terms</span>
        <span className="hidden sm:inline-block">Privacy</span>
        <div className="dot hidden sm:inline-block"></div>
        <Link to="/" reloadDocument className="flex items-center text-xl gap-1">
          <span className="i-bolt:launchflow-logo inline-block" />
          <span className=" font-bold">LaunchFlow</span>
        </Link> */}
      </div>
    </footer>
  );
}
