import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";

export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getOpenRouterModel(apiKey: string, modelName: string) {
  const openRouter = createOpenRouter({
    apiKey,
  });

  return openRouter(modelName);
}
export function getTogetherAIModel(apiKey: string, modelName: string) {
  const together = createOpenAI({
    apiKey,
    baseURL: "https://api.together.xyz/v1",
  });

  return together(modelName);
}

export function getModel(provider: 'anthropic' | 'together' | 'openrouter', apiKey: string, modelName?: string) {
  return provider === 'anthropic' 
    ? getAnthropicModel(apiKey) 
    : provider === 'together'
    ? getTogetherAIModel(apiKey, modelName || 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo')
    : getOpenRouterModel(apiKey, modelName || 'nousresearch/hermes-3-llama-3.1-405b:free');
}
