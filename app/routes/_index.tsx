import { json, type LoaderFunctionArgs, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { initializeAuth } from '../auth/auth.server';
import { useLoaderData } from '@remix-run/react';
import { userStore } from '../lib/stores/user';
import { useEffect } from 'react';
import { chatStore } from '~/lib/stores/chat';
import { getQuota } from '~/quota/quota.server';
import { Footer } from '~/components/footer/Footer';
import { deploymentStore, type Deployment } from '~/lib/stores/deployments';

export const meta: MetaFunction = () => {
  return [
    { title: 'LaunchFlow' },
    { name: 'description', content: 'AI agent for generating and deploying Python APIs.' },
  ];
};

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const auth = initializeAuth(context.cloudflare.env);
  const userWithToken = await auth.getUserWithAccessToken(request, context, { forceRefresh: true });
  const user = userWithToken.user;

  let dailyQuotaRemaining: number | undefined = undefined;
  let bonusQuotaRemaining: number | undefined = undefined;
  let deployments: Deployment[] = [];
  let accountId: string | undefined = undefined;

  if (user?.userId !== undefined) {
    const quota = await getQuota(context.cloudflare.env, user.userId);
    dailyQuotaRemaining = quota.dailyQuotaRemaining;
    bonusQuotaRemaining = quota.bonusQuotaRemaining;

    let accounts: undefined | { id: string }[] = [];
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
  }

  return json({ user: user, dailyQuotaRemaining, bonusQuotaRemaining, deployments, accountId });
};

export default function Index() {
  const { user, dailyQuotaRemaining, bonusQuotaRemaining, deployments, accountId } = useLoaderData<typeof loader>();

  // We use this store to pass the user data around the app.
  useEffect(() => {
    userStore.set(
      user !== undefined
        ? {
            firstName: user.firstName!,
            email: user.email!,
            pictureUrl: user.properties?.picture_url as any,
            accountId: accountId,
          }
        : undefined,
    );
  }, [user, accountId]);

  // We use this store to pass deployment data around the app.
  useEffect(() => {
    deploymentStore.set(deployments);
  }, [deployments]);

  // We use this store to pass the user data around the app.
  useEffect(() => {
    chatStore.setKey('dailyQuotaRemaining', dailyQuotaRemaining);
    chatStore.setKey('bonusQuotaRemaining', bonusQuotaRemaining);
  }, [dailyQuotaRemaining, bonusQuotaRemaining]);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
      <Footer />
    </div>
  );
}
