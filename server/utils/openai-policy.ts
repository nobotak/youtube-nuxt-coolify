const DEFAULT_MAX_TRANSCRIPT_CHARS = 120_000;

function parseAllowedAssistantIds(): string[] {
  const raw = String(process.env.OPENAI_ALLOWED_ASSISTANT_IDS || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

export function assertAssistantAllowed(assistantId: string): void {
  const allowed = parseAllowedAssistantIds();
  if (allowed.length === 0) return;
  if (!allowed.includes(assistantId)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'assistantId is not allowed',
    });
  }
}

export function sanitizeTranscriptForAnalysis(raw: unknown): string {
  const transcript = String(raw || '').trim();
  if (!transcript) {
    throw createError({
      statusCode: 400,
      statusMessage: 'transcript is required',
    });
  }

  const maxCharsRaw = Number(process.env.OPENAI_MAX_TRANSCRIPT_CHARS || DEFAULT_MAX_TRANSCRIPT_CHARS);
  const maxChars = Number.isFinite(maxCharsRaw) && maxCharsRaw > 0 ? maxCharsRaw : DEFAULT_MAX_TRANSCRIPT_CHARS;
  if (transcript.length > maxChars) {
    throw createError({
      statusCode: 413,
      statusMessage: `transcript is too long (max ${maxChars} characters)`,
    });
  }

  return transcript;
}
