import { map } from 'nanostores';

export const chatStore = map<{
  started: boolean;
  aborted: boolean;
  showChat: boolean;
  dailyQuotaRemaining: number | undefined;
  bonusQuotaRemaining: number | undefined;
}>({
  started: false,
  aborted: false,
  showChat: true,
  dailyQuotaRemaining: undefined,
  bonusQuotaRemaining: undefined,
});
