
/**
 * Twitch API Service
 * Handles OAuth2 Client Credentials flow and stream data fetching.
 */

export async function getTwitchAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (!clientId || !clientSecret) throw new Error("Missing Twitch Credentials");

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials'
  });

  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: 'POST'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to authenticate with Twitch");
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Placeholder for the actual Twitch Data Fetch logic 
 * that would be used by your bash process or a proxy.
 */
export async function fetchTwitchFortniteStats(token: string, clientId: string) {
  // Example endpoint call for Fortnite (Game ID 33214)
  // This logic is typically handled by your background 'bash' system,
  // but can be called here for real-time validation.
  const response = await fetch('https://api.twitch.tv/helix/streams?game_id=33214&first=100', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Client-Id': clientId
    }
  });
  
  if (!response.ok) throw new Error("Twitch API Data Request Failed");
  return await response.json();
}
