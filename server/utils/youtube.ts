import { google } from 'googleapis';

const youtube = google.youtube('v3');

// Resolve API key from env; do not ship a hardcoded default.
const GLOBAL_API_KEY = process.env.YOUTUBE_API_KEY;

function extractChannelIdFromUrl(input: string): string | null {
  try {
    if (!input.includes('youtube.com')) return null;
    // /channel/UCxxxx
    const m1 = input.match(/youtube\.com\/channel\/([^\/?#]+)/i);
    if (m1 && m1[1]) return m1[1];
    // handle @name
    const m2 = input.match(/youtube\.com\/@([^\/?#]+)/i);
    if (m2 && m2[1]) return '@' + m2[1];
    // custom url /c/name -> treat as handle-like search
    const m3 = input.match(/youtube\.com\/c\/([^\/?#]+)/i);
    if (m3 && m3[1]) return '@' + m3[1];
  } catch {}
  return null;
}

export async function resolveChannelId(input: string, apiKey: string = GLOBAL_API_KEY || ''): Promise<string> {
  const effectiveKey = apiKey || GLOBAL_API_KEY;
  if (!effectiveKey) throw new Error('Missing YOUTUBE_API_KEY to resolve channel id');

  const trimmed = (input || '').trim();
  if (!trimmed) throw new Error('Empty channel identifier');

  // Already a channel ID
  if (/^UC[0-9A-Za-z_-]{22}$/.test(trimmed)) return trimmed;
  // URL forms
  const extracted = extractChannelIdFromUrl(trimmed);
  if (extracted) {
    if (/^UC[0-9A-Za-z_-]{22}$/.test(extracted)) return extracted;
    // falls through to handle search when starts with @
    if (extracted.startsWith('@')) {
      const handle = extracted.substring(1);
      const resp = await youtube.search.list({
        key: effectiveKey,
        part: ['snippet'],
        type: ['channel'],
        q: handle,
        maxResults: 5,
      });
      const item = resp.data.items?.find(i => i.snippet?.channelTitle?.toLowerCase().includes(handle.toLowerCase())) || resp.data.items?.[0];
      const foundId = item?.id?.channelId;
      if (!foundId) throw new Error('Could not resolve channel handle to ID');
      return foundId;
    }
  }
  // @handle
  if (trimmed.startsWith('@')) {
    const handle = trimmed.substring(1);
    const resp = await youtube.search.list({
      key: effectiveKey,
      part: ['snippet'],
      type: ['channel'],
      q: handle,
      maxResults: 5,
    });
    const item = resp.data.items?.find(i => i.snippet?.channelTitle?.toLowerCase().includes(handle.toLowerCase())) || resp.data.items?.[0];
    const foundId = item?.id?.channelId;
    if (!foundId) throw new Error('Could not resolve channel handle to ID');
    return foundId;
  }
  // Raw text: attempt search
  const resp = await youtube.search.list({
    key: effectiveKey,
    part: ['snippet'],
    type: ['channel'],
    q: trimmed,
    maxResults: 1,
  });
  const foundId = resp.data.items?.[0]?.id?.channelId;
  if (!foundId) throw new Error('Could not resolve channel to ID');
  return foundId;
}

export async function getChannelInfo(channelId: string, apiKey: string = GLOBAL_API_KEY || '') {
  try {
    console.log(`Fetching info for channel: ${channelId}`);
    
    const effectiveKey = apiKey || GLOBAL_API_KEY;
    if (!effectiveKey) {
      throw new Error('Missing YOUTUBE_API_KEY. Provide per-channel api_key or set env.');
    }

    const response = await youtube.channels.list({
      key: effectiveKey,
      part: ['snippet', 'statistics'],
      id: [channelId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = response.data.items[0];
    console.log(`Successfully fetched info for channel: ${channel.snippet?.title}`);

    return {
      id: channel.id,
      title: channel.snippet?.title,
      description: channel.snippet?.description,
      thumbnail: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount,
      viewCount: channel.statistics?.viewCount,
      publishedAt: channel.snippet?.publishedAt,
    };
  } catch (error: any) {
    if (error.message && error.message.includes('quota')) {
        console.error(`API quota exceeded for channel ${channelId}. Please try again later or use a different API key.`);
        throw new Error('API quota exceeded. Please try again later.');
    }
    
    console.error(`Error fetching channel info for ${channelId}: ${error.message}`);
    throw error;
  }
}

export async function getLatestVideos(channelId: string, apiKey: string = GLOBAL_API_KEY || '') {
  try {
    const effectiveKey = apiKey || GLOBAL_API_KEY;
    if (!effectiveKey) {
      throw new Error('Missing YOUTUBE_API_KEY. Provide per-channel api_key or set env.');
    }
    const response = await youtube.search.list({
      key: effectiveKey,
      channelId: channelId,
      part: ['snippet'],
      order: 'date',
      maxResults: 10,
      type: ['video']
    });

    if (!response.data.items) {
      return [];
    }

    const videoIds = response.data.items.map(item => item.id?.videoId).filter((id): id is string => !!id);

    const videoDetailsResponse = await youtube.videos.list({
        key: effectiveKey,
        part: ['contentDetails', 'snippet'],
        id: videoIds,
    });
    
    return videoDetailsResponse.data.items || [];

  } catch (error: any) {
    console.error(`Error fetching latest videos for channel ${channelId}: ${error.message}`);
    throw error;
  }
}
