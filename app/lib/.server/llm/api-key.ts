import { env } from 'node:process';

export function getAPIKeys(cloudflareEnv: Env) {
  return {
    openRouter: env.OPENROUTER_API_KEY || cloudflareEnv.OPENROUTER_API_KEY || "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",
    anthropic: env.ANTHROPIC_API_KEY || cloudflareEnv.ANTHROPIC_API_KEY,
  };
}
