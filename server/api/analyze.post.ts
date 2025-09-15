import { analyzeTranscript } from '~/server/utils/openai';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { transcript, assistantId } = body;

  if (!transcript || !assistantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'transcript and assistantId are required',
    });
  }

  try {
    const analysis = await analyzeTranscript(transcript, assistantId);
    return { analysis };
  } catch (err: any) {
    throw createError({
      statusCode: 500,
      statusMessage: err.message,
    });
  }
});
