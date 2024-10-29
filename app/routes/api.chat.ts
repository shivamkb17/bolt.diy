import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { initializeAuth } from '~/auth/auth.server';
import { MAX_RESPONSE_SEGMENTS, MAX_TOKENS } from '~/lib/.server/llm/constants';
import { CONTINUE_PROMPT } from '~/lib/.server/llm/prompts';
import { streamText, type Messages, type StreamingOptions } from '~/lib/.server/llm/stream-text';
import SwitchableStream from '~/lib/.server/llm/switchable-stream';
import { decreaseQuota, getQuota, type QuotaResponse } from '~/quota/quota.server';

// Updated action function to include rate limiting
export async function action(args: ActionFunctionArgs) {
  const { context, request } = args;

  const auth = initializeAuth(context.cloudflare.env);
  const user = await auth.getUser(request, context);

  if (user === undefined) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const initialQuota = await getQuota(context.cloudflare.env, user.userId);

  if (initialQuota.dailyQuotaRemaining <= 0 && initialQuota.bonusQuotaRemaining <= 0) {
    return json({ error: 'Quota exceeded. You can only perform 10 chat actions per day.' }, { status: 429 });
  }

  // Decrease the quota by 1
  const newQuota = await decreaseQuota(context.cloudflare.env, user.userId);

  // If within quota, proceed with the chat action and pass along the context
  return await chatAction(args, newQuota);
}

async function chatAction(
  { context, request }: ActionFunctionArgs,
  { dailyQuotaRemaining, bonusQuotaRemaining }: QuotaResponse,
) {
  const { messages } = await request.json<{ messages: Messages }>();

  const stream = new SwitchableStream();

  try {
    const options: StreamingOptions = {
      toolChoice: 'none',
      onFinish: async ({ text: content, finishReason }) => {
        if (finishReason !== 'length') {
          return stream.close();
        }

        if (stream.switches >= MAX_RESPONSE_SEGMENTS) {
          throw Error('Cannot continue message: Maximum segments reached');
        }

        const switchesLeft = MAX_RESPONSE_SEGMENTS - stream.switches;

        console.log(`Reached max token limit (${MAX_TOKENS}): Continuing message (${switchesLeft} switches left)`);

        messages.push({ role: 'assistant', content });
        messages.push({ role: 'user', content: CONTINUE_PROMPT });

        const result = await streamText(messages, context.cloudflare.env, options);

        return stream.switchSource(result.toAIStream());
      },
    };

    const result = await streamText(messages, context.cloudflare.env, options);

    stream.switchSource(result.toAIStream());

    return new Response(stream.readable, {
      status: 200,
      headers: {
        contentType: 'text/plain; charset=utf-8',
        'x-daily-quota-remaining': dailyQuotaRemaining?.toString() || '0',
        'x-bonus-quota-remaining': bonusQuotaRemaining?.toString() || '0',
      },
    });
  } catch (error) {
    console.error(error);

    throw new Response(null, {
      status: 500,
      statusText: 'Internal Server Error',
    });
  }
}
