import { atom } from 'nanostores';

export type Provider = { model: string, apiKey: string };

const LOCAL_STORAGE_KEY = 'provider';

const loadProviderFromLocalStorage = (): Provider => {
  const storedProvider = globalThis.localStorage?.getItem(LOCAL_STORAGE_KEY);
  return storedProvider ? JSON.parse(storedProvider) : { model: 'nousresearch/hermes-3-llama-3.1-405b:free', apiKey: '' };
};

export const providerStore = atom<Provider>(loadProviderFromLocalStorage());

export function setProvider(provider: Provider) {
  providerStore.set(provider);
  globalThis.localStorage?.setItem(LOCAL_STORAGE_KEY, JSON.stringify(provider));
}