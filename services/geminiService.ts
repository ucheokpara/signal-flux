
import { GoogleGenAI, Type } from "@google/genai";
import { LogEntry, Insight } from "../types";

// Always use process.env.API_KEY directly as a named parameter in the constructor
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getDashboardInsights(data: LogEntry[]): Promise<Insight> {
  if (data.length === 0) {
    return {
      summary: "No data available for analysis.",
      sentiment: "Neutral",
      recommendation: "Start the data collection process to receive insights."
    };
  }

  const recentData = data.slice(-5);
  const gameName = recentData[recentData.length - 1]?.game_name || "the selected game";
  const source = recentData[recentData.length - 1]?.source || "streaming platforms";

  const prompt = `Analyze the following ${source} data for ${gameName} and provide a concise market analysis.
  Data: ${JSON.stringify(recentData)}
  
  Focus on trends in CS (Capture Score), AS (Attention Score), and SSM (Sentiment Metric).
  Return a summary of the current audience health, the overall sentiment, and a quick recommendation.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            sentiment: { 
              type: Type.STRING,
              description: "The market sentiment: Bullish, Bearish, or Neutral"
            },
            recommendation: { type: Type.STRING }
          },
          propertyOrdering: ["summary", "sentiment", "recommendation"]
        }
      }
    });

    // Access .text as a property, not a method, and trim the response
    const jsonStr = (response.text || '{}').trim();
    return JSON.parse(jsonStr) as Insight;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return {
      summary: "Error generating AI insights. Check API configuration.",
      sentiment: "Neutral",
      recommendation: "Review logs for connection issues."
    };
  }
}


// Custom Agent Flux Conversation Model
const fluxAi = new GoogleGenAI({ apiKey: process.env.AGENT_API_KEY || process.env.API_KEY || '' });

export async function agentFluxChat(
  chatHistory: { role: string; content: string }[],
  systemInstruction: string,
  userMessage: string
): Promise<string> {
  const model = "gemini-2.5-flash"; 
  
  // Combine and condense chat history to strictly alternating roles to prevent Gemini 400 Bad Request crashes
  const rawHistory = [...chatHistory, { role: 'user', content: userMessage }];
  const contents: { role: string; parts: { text: string }[] }[] = [];
  
  for (const msg of rawHistory) {
    const rawRole = msg.role === 'flux' || msg.role === 'model' ? 'model' : 'user';
    const text = msg.content || '';
    
    if (contents.length > 0 && contents[contents.length - 1].role === rawRole) {
      // Concatenate to the last message if the role matches to maintain strictly alternating sequence
      contents[contents.length - 1].parts[0].text += '\n\n' + text;
    } else {
      // Create a new message block
      contents.push({
        role: rawRole,
        parts: [{ text: text }]
      });
    }
  }

  try {
    const response = await fluxAi.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return (response.text || "").trim();
  } catch (error) {
    console.error("Agent Flux LLM Error:", error);
    return "I am currently experiencing a cognitive firewall block (API Connection Error). Please bear with me as connectivity is restored.";
  }
}
