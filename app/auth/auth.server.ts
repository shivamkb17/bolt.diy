import { initRemixAuth } from '@propelauth/remix';

let auth: ReturnType<typeof initRemixAuth> | undefined;

export function initializeAuth(env: Env) {
  if (!auth) {
    auth = initRemixAuth({
      authUrl: env.REMIX_PUBLIC_AUTH_URL,
      integrationApiKey: env.PROPELAUTH_API_KEY,
      verifierKey: env.PROPELAUTH_VERIFIER_KEY,
      redirectUri: env.PROPELAUTH_REDIRECT_URI,
    });
  }
  return auth;
}
