import { json, type ActionFunctionArgs } from '@remix-run/cloudflare';
import { initializeAuth } from '~/auth/auth.server';

// Updated action function to include rate limiting
export async function action(args: ActionFunctionArgs) {
  const { context, request } = args;

  const auth = initializeAuth(context.cloudflare.env);
  const userWithToken = await auth.getUserWithAccessToken(request, context);

  if (userWithToken.user === undefined) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();

  const deployment_name = formData.get('deployment_name');
  const account_id = formData.get('account_id')?.toString();
  if (!account_id) {
    return json({ success: false, error: 'account_id is required' }, { status: 400 });
  }

  // forwards to this url
  const url = `https://cloud.launchflow.com/v1/deployments/${deployment_name}?account_id=${encodeURIComponent(account_id)}`;

  // print the body of the form data in raw format

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${userWithToken.accessToken}`,
    },
  });

  if (response.status !== 200) {
    return json({ success: false, error: 'An unexpected error occurred' }, { status: 500 });
  }

  return json({ success: true });
}
