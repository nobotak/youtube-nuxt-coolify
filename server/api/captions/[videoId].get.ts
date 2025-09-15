import { getCaptions } from '~/server/utils/captions';

export default defineEventHandler(async (event) => {
    const videoId = event.context.params?.videoId;

    if (!videoId) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Video ID is required',
        });
    }
  
    try {
        const captions = await getCaptions(videoId);
        if (!captions) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Captions not found',
            });
        }
        return captions;
    } catch (err: any) {
        throw createError({
            statusCode: 500,
            statusMessage: err.message,
        });
    }
});
