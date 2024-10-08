import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from "@openrouter/ai-sdk-provider";


export function getModel(apiKeys: { openRouter?: string; anthropic?: string }) {
  if (apiKeys.openRouter) {
    return getOpenRouterModel(apiKeys.openRouter);
  } else if (apiKeys.anthropic) {
    return getAnthropicModel(apiKeys.anthropic);
  }
  throw new Error('No valid API key found for OpenRouter or Anthropic');
}

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getOpenRouterModel(apiKey: string) {
  const openRouter = createOpenRouter({
    apiKey,
  });

  return openRouter('anthropic/claude-3.5-sonnet:beta');
}