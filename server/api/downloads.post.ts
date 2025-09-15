import { downloadAudio } from '~/server/utils/downloader';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { videoId } = body;

  if (!videoId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'videoId is required',
    });
  }

  try {
    const outputPath = await downloadAudio(videoId);
    return {
      message: 'Audio downloaded successfully',
      path: outputPath,
    };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
