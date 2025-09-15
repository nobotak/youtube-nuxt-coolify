import { google } from 'googleapis';

const youtube = google.youtube('v3');

// Resolve API key from env; do not ship a hardcoded default.
const GLOBAL_API_KEY = process.env.YOUTUBE_API_KEY;

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
