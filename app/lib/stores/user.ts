import { atom } from 'nanostores';

export type UserWithAccountId = {
  firstName: string;
  email: string;
  pictureUrl?: string;
  accountId?: string;
};

export const userStore = atom<undefined | null | UserWithAccountId>(null); // null is used to indicate that the user is not loaded yet.
