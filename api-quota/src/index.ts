import { DurableObject } from 'cloudflare:workers';

/**
 * Associate bindings declared in wrangler.toml with the TypeScript type system
 */
export interface Env {
  API_QUOTA: DurableObjectNamespace<APIQuota>;
}

const DAILY_LIMIT = 10;

export interface UserQuotaData {
  dailyQuota: number;
  lastAccess: number;
  bonusQuota: number;
  feedbackSubmitted: Record<string, boolean>; // Map of feedback form ID to completion status
}

export class APIQuota extends DurableObject {
  storage: DurableObjectStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.storage = ctx.storage;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response('Missing userId parameter', { status: 400 });
    }

    switch (url.pathname) {
      case '/get-quota':
        return await this.handleGetQuota(userId);

      case '/decrease-quota':
        const decreaseAmount = parseInt(url.searchParams.get('amount') || '1', 10);
        if (isNaN(decreaseAmount) || decreaseAmount <= 0) {
          return new Response('Invalid amount value', { status: 400 });
        }
        return await this.handleDecreaseQuota(userId, decreaseAmount);

      case '/increase-quota':
        const increaseAmount = parseInt(url.searchParams.get('amount') || '1', 10);
        if (isNaN(increaseAmount) || increaseAmount <= 0) {
          return new Response('Invalid amount value', { status: 400 });
        }
        return await this.handleIncreaseQuota(userId, increaseAmount);

      case '/mark-feedback-complete':
        const feedbackFormId = url.searchParams.get('feedbackFormId');
        if (!feedbackFormId) {
          return new Response('Missing feedbackFormId parameter', { status: 400 });
        }
        return await this.handleMarkFeedbackComplete(userId, feedbackFormId);

      default:
        return new Response('Not Found', { status: 404 });
    }
  }

  // Shared utility functions
  private async getUserData(userId: string): Promise<UserQuotaData> {
    let data = await this.storage.get<UserQuotaData>(userId);
    if (
      !data ||
      data.dailyQuota === undefined ||
      data.lastAccess === undefined ||
      data.bonusQuota === undefined ||
      data.feedbackSubmitted === undefined
    ) {
      data = { dailyQuota: 0, lastAccess: Date.now(), bonusQuota: 0, feedbackSubmitted: {} };
    }
    return data;
  }

  private async saveUserData(userId: string, data: UserQuotaData): Promise<void> {
    await this.storage.put(userId, data);
  }

  // Handler for /get-quota
  private async handleGetQuota(userId: string): Promise<Response> {
    const data = await this.getUserData(userId);
    return new Response(
      JSON.stringify({
        dailyQuotaRemaining: DAILY_LIMIT - data.dailyQuota,
        bonusQuotaRemaining: data.bonusQuota,
        feedbackSubmitted: data.feedbackSubmitted,
      }),
      { status: 200 },
    );
  }

  // Handler for /decrease-quota
  private async handleDecreaseQuota(userId: string, amount: number): Promise<Response> {
    const now = Date.now();
    let data = await this.getUserData(userId);

    // Reset daily count if more than 24 hours have passed
    if (now - data.lastAccess > 24 * 60 * 60 * 1000) {
      data.dailyQuota = 0;
      data.lastAccess = now;
    }

    let dailyQuotaRemaining = DAILY_LIMIT - data.dailyQuota;
    let updatedBonusQuota = data.bonusQuota;

    // Try to decrease daily quota first
    if (dailyQuotaRemaining >= amount) {
      data.dailyQuota += amount;
      dailyQuotaRemaining -= amount;
    } else {
      // Use remaining daily quota first, then use bonus quota if needed
      const totalQuotaAvailable = dailyQuotaRemaining + updatedBonusQuota;
      if (totalQuotaAvailable >= amount) {
        const bonusNeeded = amount - dailyQuotaRemaining;
        data.dailyQuota += dailyQuotaRemaining; // Use up remaining daily quota
        dailyQuotaRemaining = 0;
        updatedBonusQuota -= bonusNeeded; // Decrease bonus quota for the remaining amount
        data.bonusQuota = updatedBonusQuota;
      } else {
        // Quota exceeded
        return new Response(
          JSON.stringify({
            dailyQuotaRemaining: 0,
            bonusQuotaRemaining: updatedBonusQuota,
          }),
          { status: 429 },
        );
      }
    }

    // Update the storage with the new counts
    await this.saveUserData(userId, data);

    return new Response(
      JSON.stringify({
        dailyQuotaRemaining,
        bonusQuotaRemaining: updatedBonusQuota,
      }),
      { status: 200 },
    );
  }

  // Handler for /increase-quota
  private async handleIncreaseQuota(userId: string, quota: number): Promise<Response> {
    if (isNaN(quota) || quota <= 0) {
      return new Response('Invalid quota value', { status: 400 });
    }

    let data = await this.getUserData(userId);

    // Add the bonus quota
    data.bonusQuota += quota;

    // Update the storage with the new bonus quota
    await this.saveUserData(userId, data);

    return new Response(
      JSON.stringify({
        dailyQuotaRemaining: DAILY_LIMIT - data.dailyQuota,
        bonusQuotaRemaining: data.bonusQuota,
      }),
      { status: 200 },
    );
  }

  // Handler for /mark-feedback-complete
  private async handleMarkFeedbackComplete(userId: string, feedbackFormId: string): Promise<Response> {
    let data = await this.getUserData(userId);

    // Throw error if feedback form has already been marked as complete
    if (data.feedbackSubmitted[feedbackFormId]) {
      return new Response('Feedback form already marked as complete', { status: 400 });
    }

    // Mark the feedback form as completed
    data.feedbackSubmitted[feedbackFormId] = true;

    // Update the storage with the new feedback status
    await this.saveUserData(userId, data);

    // Return the updated quota data
    return new Response(
      JSON.stringify({
        dailyQuotaRemaining: DAILY_LIMIT - data.dailyQuota,
        bonusQuotaRemaining: data.bonusQuota,
        feedbackSubmitted: data.feedbackSubmitted,
      }),
      { status: 200 },
    );
  }
}

export default APIQuota;
