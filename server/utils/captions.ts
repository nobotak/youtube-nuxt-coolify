import { getSubtitles } from 'youtube-captions-scraper';

export async function getCaptions(videoId: string) {
  try {
    const captions = await getSubtitles({
      videoID: videoId,
      lang: 'pl',
    });
    return captions;
  } catch (error) {
    console.error(`Error getting captions for video ${videoId}:`, error);
    return null;
  }
}
