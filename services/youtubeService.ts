
/**
 * YouTube Data API Service
 * Fetches real-time concurrent viewer counts for live gaming streams.
 */

export async function fetchYouTubeGamingStats(apiKey: string, gameName: string) {
  if (!apiKey || !gameName) return null;

  try {
    const searchParams = new URLSearchParams({
      part: 'snippet',
      eventType: 'live',
      q: `${gameName} gaming`,
      type: 'video',
      maxResults: '25',
      key: apiKey
    });

    const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      const reason = errorData.error?.errors?.[0]?.reason || "Unknown Error";
      const message = errorData.error?.message || "Check API Key and Permissions";
      
      if (reason === 'quotaExceeded') throw new Error("Quota Exceeded (100 units/call)");
      if (reason === 'keyInvalid') throw new Error("Invalid API Key");
      if (reason === 'accessNotConfigured') throw new Error("API Not Enabled in Cloud Console");
      
      throw new Error(message);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

    if (!videoIds) return { total_viewers: 0, top_title: "No live streams found", sample_size: 0 };

    const videoParams = new URLSearchParams({
      part: 'liveStreamingDetails,snippet',
      id: videoIds,
      key: apiKey
    });

    const videoResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`);
    
    if (!videoResponse.ok) throw new Error("Failed to fetch stream details");

    const videoData = await videoResponse.json();
    
    let totalViewers = 0;
    let topTitle = "YouTube Gaming Node";
    let maxViewers = -1;

    videoData.items?.forEach((item: any) => {
      const viewers = parseInt(item.liveStreamingDetails?.concurrentViewers || "0", 10);
      totalViewers += viewers;
      if (viewers > maxViewers) {
        maxViewers = viewers;
        topTitle = item.snippet?.title || topTitle;
      }
    });

    return {
      total_viewers: totalViewers,
      top_title: topTitle,
      peak_viewers: maxViewers,
      sample_size: videoData.items?.length || 0
    };
  } catch (error: any) {
    console.error("YouTube Fetch Error:", error);
    throw error; // Rethrow to handle in App.tsx
  }
}
