import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { initializeAuth } from '~/auth/auth.server';
import { getQuota, increaseQuota, markFeedbackComplete } from '~/quota/quota.server';
import { sendToSlack } from '~/slack/slack.server';

// TODO: Abstract this better once we need to support more than 1 feedback form
const FEEDBACK_ID = 'alpha-feedback';
const FEEDBACK_INCREASE_AMOUNT = 25;

// Updated action function to include rate limiting
export async function action(args: ActionFunctionArgs) {
  const { context, request } = args;

  const formData = await request.formData();

  const apiGenerationRating = formData.get('apiGenerationRating');
  const deploymentRating = formData.get('deploymentRating');
  const toolUsageFrequency = formData.get('toolUsageFrequency');

  if (!deploymentRating || !apiGenerationRating || !toolUsageFrequency) {
    return json({ success: false, error: 'Feedback cannot be empty' }, { status: 400 });
  }

  const auth = initializeAuth(context.cloudflare.env);
  const user = await auth.getUser(request, context);

  if (user === undefined) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const quota = await getQuota(context.cloudflare.env, user.userId);

  if (quota.feedbackSubmitted[FEEDBACK_ID]) {
    return json(
      { success: false, error: 'Feedback already submitted. Email team@launchflow.com for more bonus quota.' },
      { status: 400 },
    );
  }

  await sendToSlack(
    {
      userId: user.userId,
      userName: user.firstName + ' ' + user.lastName,
      userEmail: user.email,
      feedback: {
        deploymentRating: deploymentRating.toString(),
        apiGenerationRating: apiGenerationRating.toString(),
        toolUsageFrequency: toolUsageFrequency.toString(),
      },
    },
    context.cloudflare.env.SLACK_WEBHOOK_URL,
  );

  // TODO: Determine if we should combine these into a single call
  await increaseQuota(context.cloudflare.env, user.userId, FEEDBACK_INCREASE_AMOUNT);
  await markFeedbackComplete(context.cloudflare.env, user.userId, FEEDBACK_ID);

  return json({ success: true });
}
