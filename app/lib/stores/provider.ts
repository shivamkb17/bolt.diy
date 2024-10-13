import { atom } from 'nanostores';

export type Provider = { model: string, apiKey: string };

export const providerStore = atom<Provider>({ model: 'nousresearch/hermes-3-llama-3.1-405b:free', apiKey: '' });

export function setProvider(provider: Provider) {
  providerStore.set(provider);
}