import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

if (!openai) {
  console.warn('OPENAI_API_KEY is not set. OpenAI service will not be available.');
}

export async function analyzeTranscript(transcript: string, assistantId: string): Promise<string> {
  if (!openai) {
    return 'OpenAI API key not configured.';
  }

  try {
    const thread = await openai.beta.threads.create();
    
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: transcript,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId,
    });

    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== 'completed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(m => m.role === 'assistant');

    if (lastMessage && lastMessage.content[0].type === 'text') {
        return lastMessage.content[0].text.value;
    }

    return 'No response from assistant.';
  } catch (error) {
    console.error('Error analyzing transcript with OpenAI:', error);
    throw new Error('Failed to get analysis from OpenAI.');
  }
}
