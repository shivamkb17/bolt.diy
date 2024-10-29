import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';
import { initializeAuth } from '~/auth/auth.server';
import { getQuota } from '~/quota/quota.server';
import type { Deployment } from '~/lib/stores/deployments';

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  const auth = initializeAuth(context.cloudflare.env);
  const userWithToken = await auth.getUserWithAccessTokenOrRedirect(request, context, { forceRefresh: true });

  const quota = await getQuota(context.cloudflare.env, userWithToken.user!.userId);

  let deployments: Deployment[] = [];
  let accountId: string | undefined = undefined;

  let accounts: { id: string }[] = [];
  while (accounts.length === 0) {
    const accountsResponse = await fetch('https://cloud.launchflow.com/accounts', {
      headers: {
        Authorization: `Bearer ${userWithToken.accessToken}`,
      },
    });
    const accountsJson: { accounts: { id: string }[] } = await accountsResponse.json();
    accounts = accountsJson.accounts;
  }
  accountId = accounts[0].id;
  const deploymentsResponse = await fetch(`https://cloud.launchflow.com/v1/deployments?account_id=${accountId}`, {
    headers: {
      Authorization: `Bearer ${userWithToken.accessToken}`,
    },
  });
  const deploymentsJson: {
    deployments: Deployment[];
  } = await deploymentsResponse.json();
  deployments = deploymentsJson.deployments;

  return json({
    id: params.id, // this is consumed by the useChatHistory hook
    user: userWithToken.user,
    dailyQuotaRemaining: quota.dailyQuotaRemaining,
    bonusQuotaRemaining: quota.bonusQuotaRemaining,
    deployments,
    accountId,
  });
}

export default IndexRoute;
