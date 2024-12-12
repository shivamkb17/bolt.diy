import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

export function getAnthropicModel(env: Env) {
  const anthropic = createAnthropic({
    apiKey: env.VITE_ANTHROPIC_API_KEY,
  });

  return anthropic('claude-3-5-sonnet-20240620');
}

export function getOpenAIModel(env: Env) {
  const openai = createOpenAI({
    baseUrl: env.VITE_OPENAI_BASE_URL,
    apiKey: env.VITE_OPENAI_API_KEY,
  });

  return openai(env.VITE_OPENAI_MODEL_NAME);
}

export function getModel(env: Env) {
  let provider = env.VITE_LLM_PROVIDER;

  switch (provider) {
    case 'Anthropic':
      return getAnthropicModel(env);
    case 'OpenAI':
      return getOpenAIModel(env);
    default:
      return getAnthropicModel(env);
  }
}