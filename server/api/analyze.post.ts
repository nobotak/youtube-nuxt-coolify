import { analyzeTranscript } from '~/server/utils/openai';
import { assertAssistantAllowed, sanitizeTranscriptForAnalysis } from '~/server/utils/openai-policy';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const assistantId = String(body?.assistantId || '').trim();
  const transcript = sanitizeTranscriptForAnalysis(body?.transcript);

  if (!assistantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'assistantId is required',
    });
  }
  assertAssistantAllowed(assistantId);

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
