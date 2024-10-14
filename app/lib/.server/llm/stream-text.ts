import { streamText as _streamText, convertToCoreMessages } from 'ai';
import { getAPIKeys } from '~/lib/.server/llm/api-key';
import { getModel } from '~/lib/.server/llm/model';
import { MAX_TOKENS } from './constants';
import { getSystemPrompt } from './prompts';
import type { Provider } from '~/lib/stores/provider';

interface ToolResult<Name extends string, Args, Result> {
  toolCallId: string;
  toolName: Name;
  args: Args;
  result: Result;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolResult<string, unknown, unknown>[];
}

export type Messages = Message[];

export type StreamingOptions = Omit<Parameters<typeof _streamText>[0], 'model'>;


export function streamText(messages: Messages, env: Env, provider: Provider, options?: StreamingOptions) {
  
  const apiKey = getAPIKeys(env);
  const apiKeyToUse = provider.apiKey || apiKey.openRouter;
  return _streamText({
    model: getModel('openrouter', apiKeyToUse, provider.model),

    system: getSystemPrompt(),
    messages: convertToCoreMessages(messages.map(message => ({
      ...message,
      toolInvocations: message.toolInvocations?.map(invocation => ({
        ...invocation,
        state: "result" as const
      }))
    }))),
    ...options,
  });
}
