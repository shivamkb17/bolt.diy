// Global state to simulate quota and feedback in local development
let localQuotaState = {
  dailyQuotaRemaining: 1,
  bonusQuotaRemaining: 0,
  feedbackSubmitted: {} as Record<string, boolean>, // Map of feedback form ID to completion status
};

export type QuotaResponse = {
  dailyQuotaRemaining: number;
  bonusQuotaRemaining: number;
  feedbackSubmitted: Record<string, boolean>;
};

export async function getQuota(env: Env, userId: string) {
  // Checks if we are in development mode and returns a fixed quota if so
  // if (process.env.NODE_ENV === 'development') {
  //   return localQuotaState;
  // }

  const quotaId = env.API_QUOTA.idFromName(userId);
  const quotaObject = env.API_QUOTA.get(quotaId);

  const response = await quotaObject.fetch(`http:/ws/get-quota?userId=${userId}`);
  const data: QuotaResponse = await response.json();

  return data;
}

export async function decreaseQuota(env: Env, userId: string, amount: number = 1) {
  // Checks if we are in development mode and returns a fixed quota if so
  // if (process.env.NODE_ENV === 'development') {
  //   localQuotaState.dailyQuotaRemaining = Math.max(0, localQuotaState.dailyQuotaRemaining - amount);
  //   return localQuotaState;
  // }

  const quotaId = env.API_QUOTA.idFromName(userId);
  const quotaObject = env.API_QUOTA.get(quotaId);
  try {
    const response = await quotaObject.fetch(`https://ws/decrease-quota?amount=${amount}&userId=${userId}`);
    const data: QuotaResponse = await response.json();
    return data;
  } catch (e) {
    console.error('Error decreasing quota:', e);
    return { dailyQuotaRemaining: 0, bonusQuotaRemaining: 0, feedbackSubmitted: {} };
  }
}

export async function increaseQuota(env: Env, userId: string, amount: number = 1) {
  // Checks if we are in development mode and returns a fixed quota if so
  // if (process.env.NODE_ENV === 'development') {
  //   localQuotaState.dailyQuotaRemaining += amount;
  //   return localQuotaState;
  // }

  const quotaId = env.API_QUOTA.idFromName(userId);
  const quotaObject = env.API_QUOTA.get(quotaId);

  const response = await quotaObject.fetch(`https://ws/increase-quota?amount=${amount}&userId=${userId}`);
  const data: QuotaResponse = await response.json();

  return data;
}

export async function markFeedbackComplete(env: Env, userId: string, feedbackFormId: string) {
  // Checks if we are in development mode and updates the local state if so
  // if (process.env.NODE_ENV === 'development') {
  //   localQuotaState.feedbackSubmitted[feedbackFormId] = true;
  //   return localQuotaState;
  // }

  const quotaId = env.API_QUOTA.idFromName(userId);
  const quotaObject = env.API_QUOTA.get(quotaId);

  const response = await quotaObject.fetch(
    `https://ws/mark-feedback-complete?feedbackFormId=${feedbackFormId}&userId=${userId}`,
  );

  if (!response.ok) {
    console.error('Error marking feedback as complete:', response.statusText);
    return { dailyQuotaRemaining: 0, bonusQuotaRemaining: 0, feedbackSubmitted: {} };
  }

  const data: QuotaResponse = await response.json();
  return data;
}
