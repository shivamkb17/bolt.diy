import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { StreamingTextResponse, parseStreamPart } from 'ai';
import { initializeAuth } from '~/auth/auth.server';
import { streamText } from '~/lib/.server/llm/stream-text';
import { decreaseQuota, getQuota, type QuotaResponse } from '~/quota/quota.server';
import { stripIndents } from '~/utils/stripIndent';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

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

  return enhancerAction(args, newQuota);
}

async function enhancerAction(
  { context, request }: ActionFunctionArgs,
  { dailyQuotaRemaining, bonusQuotaRemaining }: QuotaResponse,
) {
  const { message } = await request.json<{ message: string }>();

  try {
    const result = await streamText(
      [
        {
          role: 'user',
          content: stripIndents`
          I want you to improve the user prompt that is wrapped in \`<original_prompt>\` tags.

          IMPORTANT: Only respond with the improved prompt and nothing else!

          <original_prompt>
            ${message}
          </original_prompt>
        `,
        },
      ],
      context.cloudflare.env,
    );

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const processedChunk = decoder
          .decode(chunk)
          .split('\n')
          .filter((line) => line !== '')
          .map(parseStreamPart)
          .map((part) => part.value)
          .join('');

        controller.enqueue(encoder.encode(processedChunk));
      },
    });

    const transformedStream = result.toAIStream().pipeThrough(transformStream);

    return new StreamingTextResponse(transformedStream, {
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
