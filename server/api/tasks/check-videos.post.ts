import { checkAllActiveChannels } from "~/server/utils/checker";

let isCheckInProgress = false;

export default defineEventHandler(async (event) => {
  if (isCheckInProgress) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Video check is already running.',
    });
  }

  try {
    isCheckInProgress = true;
    // Run in the background and release lock after completion/failure.
    void checkAllActiveChannels().finally(() => {
      isCheckInProgress = false;
    });

    return {
      message: 'Video check process started in the background.',
    };
  } catch (err: any) {
    isCheckInProgress = false;
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
