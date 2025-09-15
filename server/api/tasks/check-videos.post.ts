import { checkAllActiveChannels } from "~/server/utils/checker";

export default defineEventHandler(async (event) => {
  try {
    // Running this in the background without awaiting
    checkAllActiveChannels();
    
    return {
      message: 'Video check process started in the background.',
    };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
