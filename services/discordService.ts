
/**
 * Discord API Service
 * Fetches real-time guild presence data via Widget JSON.
 */

export async function fetchDiscordGuildStats(guildId: string) {
  if (!guildId) return null;

  try {
    const response = await fetch(`https://discord.com/api/guilds/${guildId}/widget.json`);
    
    if (!response.ok) {
      if (response.status === 404) throw new Error("Invalid Guild ID");
      if (response.status === 403) throw new Error("Widget Disabled in Server Settings");
      throw new Error("Discord API Unreachable");
    }

    const data = await response.json();
    return {
      name: data.name,
      presence_count: data.presence_count,
      total_members: data.members?.length || data.presence_count * 4
    };
  } catch (error: any) {
    console.error("Discord Fetch Error:", error);
    throw error;
  }
}
