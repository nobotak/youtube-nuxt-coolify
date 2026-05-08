import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MAX_WAIT_MS = 180_000; // 3 min

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

if (!openai) {
  console.warn('OPENAI_API_KEY is not set. OpenAI service will not be available.');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function analyzeTranscript(transcript: string, assistantId: string): Promise<string> {
  if (!openai) {
    return 'OpenAI API key not configured.';
  }

  try {
    const maxWaitMsRaw = Number(process.env.OPENAI_ANALYZE_TIMEOUT_MS || DEFAULT_MAX_WAIT_MS);
    const maxWaitMs = Number.isFinite(maxWaitMsRaw) && maxWaitMsRaw > 0 ? maxWaitMsRaw : DEFAULT_MAX_WAIT_MS;
    const deadline = Date.now() + maxWaitMs;

    const thread = await openai.beta.threads.create();
    
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: transcript,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempt = 0;
    while (runStatus.status !== 'completed') {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired' || runStatus.status === 'incomplete') {
        throw new Error(`OpenAI run ended with status: ${runStatus.status}`);
      }
      if (runStatus.status === 'requires_action') {
        throw new Error('OpenAI run requires action and cannot continue automatically.');
      }
      if (Date.now() >= deadline) {
        try {
          await openai.beta.threads.runs.cancel(thread.id, run.id);
        } catch {
          // Best-effort cancel only.
        }
        throw new Error(`OpenAI analysis timeout after ${Math.floor(maxWaitMs / 1000)}s.`);
      }

      // Progressive backoff: 1s -> ... -> max 5s.
      const waitMs = Math.min(1000 + attempt * 500, 5000);
      await sleep(waitMs);
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempt += 1;
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find((m) => m.role === 'assistant');
    const textPart = lastMessage?.content?.find((item) => item.type === 'text');
    if (textPart && textPart.type === 'text') {
      return textPart.text.value;
    }

    return 'No response from assistant.';
  } catch (error) {
    console.error('Error analyzing transcript with OpenAI:', error);
    throw new Error('Failed to get analysis from OpenAI.');
  }
}
