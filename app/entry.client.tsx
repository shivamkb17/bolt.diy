import { RemixBrowser } from '@remix-run/react';
import { startTransition, StrictMode, useEffect } from 'react';
import { hydrateRoot } from 'react-dom/client';

import posthog from 'posthog-js';

function PosthogInit() {
  useEffect(() => {
    posthog.init('phc_Df3dveOW6gG1ERjM1TQ8qBp7BRwEvLCjiB2FPUJPSwj', {
      api_host: 'https://us.i.posthog.com',
    });
  }, []);

  return null;
}

startTransition(() => {
  hydrateRoot(
    document.getElementById('root')!,
    <StrictMode>
      <RemixBrowser />
      <PosthogInit />
    </StrictMode>,
  );
});
