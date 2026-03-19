export interface AuthenticatedUser {
  uid: string;
  title: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  role: 'admin' | 'user';
}

export interface LogEntry {
  timestamp: string;      
  game_name: string;      // The Asset
  company: string;        // The Entity
  source: string;
  sample_size: number;    
  total_metrics: number;  // Concurrent Metrics C(t)
  peak_metric_count: number; // V_peak
  v_total: number;        // Cumulative Unique Viewers (V_total)
  top_channel_title: string;
  S: number;              // Stickiness Ratio (V_peak / V_total)
  CS: number;             // Capture Score (Conversion Intensity)
  AS: number;             // Attention Score (Depth of Interest)
  SSM: number;            // Social Sentiment Metric (-1 to +1)
  D: number;              // Social Signal Demand Forecasting (SSDF Output)
  is_simulation: boolean; // Tracking if data is real or simulated
  // Internal cycle metrics for rolling window math
  cycle_signals: number;
  cycle_viewer_minutes: number;
}

export type GamingCompany = 'Epic Games' | 'Ubisoft' | 'EA' | 'Activision';
export type DataSource = 'Twitch' | 'Discord' | 'YouTube Gaming' | 'Kick' | 'Facebook Gaming' | 'TikTok Live' | 'Streams Charts';
export type AppView = 'dashboard' | 'telemetry' | 'settings' | 'ingestion' | 'historical-selection' | 'archived-telemetry' | 'batch-telemetry' | 'analysis-lag' | 'analysis-toxicity' | 'analysis-anomaly' | 'analysis-decay' | 'analysis-redline' | 'admin';

export type AuthStatus = 'Disconnected' | 'Authorizing' | 'Cycling' | 'Connected' | 'Error';

export interface CollectionConfig {
  isActive: boolean; // Global master switch
  activeSources: Record<string, boolean>; // Per-source run/terminate states
  sourceAuthStatus: Record<string, AuthStatus>;
  sourceAuthErrorMessage: Record<string, string | undefined>;
  
  frequencySeconds: number;
  rollingWindowMinutes: number; 
  sampleSize: number;
  company: GamingCompany;
  game: string;
  source: DataSource; // Currently selected in settings UI
  discordServerId: string;
  youtubeApiKey: string;
  streamsChartsUseProxy?: boolean;
  
  // Cloud Persistence
  gcsBucketName: string;
  gcsFolderPath: string;
  gcsAuthToken: string;
  gcsAutoArchive: boolean;

  scheduledStart: string; // HH:mm
  scheduledEnd: string;   // HH:mm
  twitchClientId: string;
  twitchClientSecret: string;
  authStatus: AuthStatus;
  authErrorMessage?: string;
}

export interface Insight {
  summary: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  recommendation: string;
}