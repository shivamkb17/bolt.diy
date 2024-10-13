import { env } from 'node:process';

export function getAPIKeys(cloudflareEnv: Env) {
  return {
    openRouter: env.OPENROUTER_API_KEY || cloudflareEnv.OPENROUTER_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY,
  };
}
