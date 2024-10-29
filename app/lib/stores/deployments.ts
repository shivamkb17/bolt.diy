import { atom } from 'nanostores';

export interface Deployment {
  name: string;
  status: string;
  service_url: string;
}

export const deploymentStore = atom<Deployment[]>([]);
