import { getPushVapidPublicKey } from '~/server/utils/push';

export default defineEventHandler(() => {
  return {
    publicKey: getPushVapidPublicKey(),
  };
});
