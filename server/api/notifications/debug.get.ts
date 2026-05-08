import { getPushDiagnostics } from '~/server/utils/push';

export default defineEventHandler(() => {
  return {
    ok: true,
    diagnostics: getPushDiagnostics(),
  };
});
