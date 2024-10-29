import { map } from 'nanostores';

export const popupStore = map({
  login: false,
  feedback: false,
  deployment: false,
});
