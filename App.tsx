/// <reference types="vite/client" />
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CollectionConfig, LogEntry, Insight, GamingCompany, DataSource, AppView, AuthenticatedUser } from './types';
import Sidebar from './components/Sidebar';
import SystemCoreView from './components/SystemCoreView';
import DashboardLiveView from './components/DashboardLiveView';
import TelemetryLiveView from './components/TelemetryLiveView';
import AnalysisModuleView from './components/AnalysisModuleView';
import QueryEditorView from './components/QueryEditorView';
import DataScopeView from './components/DataScopeView';
import DashboardHistView from './components/DashboardHistView';
import TelemetryHistView from './components/TelemetryHistView';
import { AuthView } from './components/AuthView';
import { getDashboardInsights } from './services/geminiService';
import { fetchDiscordGuildStats } from './services/discordService';
import { fetchTwitchFortniteStats, getTwitchAccessToken } from './services/twitchService';
import { fetchYouTubeGamingStats } from './services/youtubeService';
import { uploadLogsToGCS } from './services/gcsService';
import ErrorBoundary from './components/ErrorBoundary';
import { auth, db } from './services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const STORAGE_KEY = 'signal_flux_config_v2';

interface EnvCredentials {
  discordTokens: string[];
  discordServerIds: string[];
  twitchClientIds: string[];
  twitchClientSecrets: string[];
  youtubeApiKeys: string[];
  streamsChartsClientIds: string[];
  streamsChartsTokens: string[];
}

const parseCustomEnv = (text: string): EnvCredentials => {
  const creds: EnvCredentials = {
    discordTokens: [], discordServerIds: [],
    twitchClientIds: [], twitchClientSecrets: [],
    youtubeApiKeys: [],
    streamsChartsClientIds: [], streamsChartsTokens: [],
  };
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('twitch_client_id =')) creds.twitchClientIds.push(line.split('=')[1].trim());
    else if (line.startsWith('twitch_client_secret =')) creds.twitchClientSecrets.push(line.split('=')[1].trim());
    else if (line.startsWith('discord_token =')) creds.discordTokens.push(line.split('=')[1].trim());
    else if (line.startsWith('discord_server_') && line.includes('_id =')) creds.discordServerIds.push(line.split('=')[1].trim());
    else if (line.startsWith('youtube_api_key =')) {
      let j = i + 1;
      while (j < lines.length && !lines[j].includes('=')) {
         if (lines[j]) creds.youtubeApiKeys.push(lines[j]);
         j++;
      }
      i = j - 1;
    }
    else if (line === 'StreamsCharts') {
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('twitch_') && !lines[j].startsWith('discord_')) {
        if (lines[j].startsWith('client_id =')) creds.streamsChartsClientIds.push(lines[j].split('=')[1].trim());
        if (lines[j].startsWith('token =')) creds.streamsChartsTokens.push(lines[j].split('=')[1].trim());
        j++;
      }
      i = j - 1;
    }
  }
  return creds;
};

const COMPANY_GAMES: Record<GamingCompany, string[]> = {
  'Epic Games': ['Fortnite', 'Gears of War'],
  'Ubisoft': ["Assassin's Creed", 'Rainbow Six'],
  'EA': ['Apex Legends', 'FC 25'],
  'Activision': ['Call of Duty', 'Overwatch 2']
};

const ALPHA = 1.2; 
const BETA = 0.8;  
const GAMMA = 1.5; 

function App() {
  const [authUser, setAuthUser] = useState<AuthenticatedUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
       // Firebase is disabled/missing API key, so inject a local bypass user immediately
       setAuthUser({ uid: 'offline_mode', email: 'local@device.com', firstName: 'Local', lastName: 'Analyst', title: '', position: 'Offline' } as AuthenticatedUser);
       setAuthLoading(false);
       return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setAuthUser({ ...userDoc.data(), uid: user.uid } as AuthenticatedUser);
          } else {
            setAuthUser({ uid: user.uid, email: user.email || '', firstName: 'Authorized', lastName: 'User', title: '', position: 'Analyst' } as AuthenticatedUser);
          }
        } catch (err) {
          console.error("Firestore Identity check fault:", err);
          setAuthUser({ uid: user.uid, email: user.email || '', firstName: 'Emergency', lastName: 'Fallback', title: '', position: 'Analyst' } as AuthenticatedUser);
        }
      } else {
        setAuthUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const vTotalRef = useRef<Record<string, number>>({});
  const prevConcurrentRef = useRef<Record<string, number>>({}); 
  
  const lastUploadTimeRef = useRef<number>(Date.now());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [envData, setEnvData] = useState<EnvCredentials | null>(null);

  const [historicalConfig, setHistoricalConfig] = useState({
    startDate: new Date('2025-01-01T00:00:00-06:00'),
    endDate: new Date('2025-06-30T00:00:00-06:00'),
    channels: [] as string[],
    tags: [] as string[],
    queues: [] as string[],
    company: 'Epic Games' as GamingCompany,
    game: 'Fortnite'
  });

  const [archivedDisplayedData, setArchivedDisplayedData] = useState<any[]>([]);

  // Background Data Runner for live stream
  useEffect(() => {
    fetch('/api/env')
      .then(res => res.json())
      .then(data => {
        if (data.text) setEnvData(parseCustomEnv(data.text));
      })
      .catch(err => console.error("Failed to fetch .env", err));
  }, []);

  const [config, setConfig] = useState<CollectionConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const base: CollectionConfig = {
      isActive: false,
      frequencySeconds: 60,
      rollingWindowMinutes: 10,
      sampleSize: 100,
      company: 'Epic Games' as GamingCompany,
      game: 'Fortnite',
      source: 'Twitch' as DataSource,
      discordServerId: import.meta.env.VITE_DISCORD_SERVER_ID || "",
      youtubeApiKey: import.meta.env.VITE_YOUTUBE_API_KEY || "",
      
      // GCS Defaults
      gcsBucketName: import.meta.env.VITE_GCS_BUCKET_NAME || "signal_flux_data",
      gcsFolderPath: import.meta.env.VITE_GCS_FOLDER_PATH || "ssdf/",
      gcsAuthToken: import.meta.env.VITE_GCS_AUTH_TOKEN || "",
      gcsAutoArchive: true,

      scheduledStart: "00:00",
      scheduledEnd: "23:59",
      twitchClientId: import.meta.env.VITE_TWITCH_CLIENT_ID || "",
      twitchClientSecret: import.meta.env.VITE_TWITCH_CLIENT_SECRET || "",
      authStatus: 'Disconnected' as const,
      authErrorMessage: undefined,
      activeSources: {},
      sourceAuthStatus: {},
      sourceAuthErrorMessage: {}
    };
    
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.frequencySeconds < 60) {
        parsed.frequencySeconds = 60;
      }
      return { 
        ...base, 
        ...parsed, 
        isActive: false, 
        authStatus: 'Disconnected' as const,
        authErrorMessage: undefined,
        gcsBucketName: parsed.gcsBucketName || "signal_flux_data",
        gcsFolderPath: parsed.gcsFolderPath || "ssdf/",
        activeSources: parsed.activeSources || {},
        sourceAuthStatus: Object.keys(parsed.sourceAuthStatus || {}).reduce((acc, key) => ({ ...acc, [key]: 'Disconnected' }), {}),
        sourceAuthErrorMessage: {}
      };
    }
    return base;
  });

  const [insight, setInsight] = useState<Insight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [twitchToken, setTwitchToken] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const { isActive, ...persistable } = config;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  }, [config]);

  const handleCloudUpload = useCallback(async () => {
    if (!config.gcsBucketName || !config.gcsAuthToken || logs.length === 0) return;
    
    setIsUploading(true);
    setUploadStatus('idle');
    try {
      await uploadLogsToGCS(config.gcsBucketName, config.gcsFolderPath, config.gcsAuthToken, logs);
      setUploadStatus('success');
      lastUploadTimeRef.current = Date.now();
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  }, [config.gcsBucketName, config.gcsFolderPath, config.gcsAuthToken, logs]);

  const runUpdate = useCallback(async () => {
    const activeStreams = Object.keys(config.activeSources).filter(s => config.activeSources[s]);
    if (activeStreams.length === 0) return;

    const windowMs = config.rollingWindowMinutes * 60 * 1000;
    const nowTs = Date.now();
    const newEntries: LogEntry[] = [];

    for (const source of activeStreams) {
      if (typeof vTotalRef.current[source] === 'undefined') vTotalRef.current[source] = 0;
      if (typeof prevConcurrentRef.current[source] === 'undefined') prevConcurrentRef.current[source] = 0;

      let currentConcurrent = 0; 
      let currentPeak = 0;       
      let contextTitle = `${config.game} | ${source} Node`;
      let connectionError = false;
      let errorMessage = "";
      let isSimulation = false;
      
      const markConnected = () => setConfig(p => (p.sourceAuthStatus[source] === 'Connected' && !p.sourceAuthErrorMessage[source]) ? p : { ...p, sourceAuthStatus: { ...p.sourceAuthStatus, [source]: 'Connected' }, sourceAuthErrorMessage: { ...p.sourceAuthErrorMessage, [source]: undefined } });

      try {
        if (source === 'Discord' && config.discordServerId) {
          const discordData = await fetchDiscordGuildStats(config.discordServerId);
          if (discordData) {
            currentConcurrent = discordData.presence_count;
            currentPeak = discordData.presence_count;
            vTotalRef.current[source] = Math.max(vTotalRef.current[source], discordData.total_members);
            contextTitle = `Server: ${discordData.name}`;
            markConnected();
          }
        } else if (source === 'Twitch' && twitchToken) {
          const twitchData = await fetchTwitchFortniteStats(twitchToken, config.twitchClientId);
          if (twitchData?.data) {
            currentConcurrent = twitchData.data.reduce((acc: number, s: any) => acc + s.viewer_count, 0);
            currentPeak = Math.max(...twitchData.data.map((s: any) => s.viewer_count));
            contextTitle = twitchData.data[0]?.title || contextTitle;
            markConnected();
            fetch('/api/save-raw', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'Twitch', game_name: config.game, timestamp: new Date().toISOString(), data: twitchData }) }).catch(e=>e);
          }
        } else if (source === 'YouTube Gaming' && config.youtubeApiKey) {
          const ytData = await fetchYouTubeGamingStats(config.youtubeApiKey, config.game);
          if (ytData) {
            currentConcurrent = ytData.total_viewers;
            currentPeak = ytData.peak_viewers;
            contextTitle = ytData.top_title;
            markConnected();
          }
        } else {
           isSimulation = true;
        }
      } catch (err: any) {
        connectionError = true;
        errorMessage = err.message || "Connection Fault";
      }

      if (connectionError) {
        setConfig(p => (p.sourceAuthStatus[source] === 'Error' && p.sourceAuthErrorMessage[source] === errorMessage) ? p : { ...p, sourceAuthStatus: { ...p.sourceAuthStatus, [source]: 'Error' }, sourceAuthErrorMessage: { ...p.sourceAuthErrorMessage, [source]: errorMessage } });
      }

      if (currentConcurrent === 0) {
        isSimulation = true;
        const baseMap: Record<string, number> = { 'Fortnite': 350000, 'Call of Duty': 120000, 'Apex Legends': 85000 };
        const base = baseMap[config.game] || 50000;
        const sourceMult = source === 'Kick' ? 0.3 : source === 'TikTok Live' ? 1.5 : source === 'Facebook Gaming' ? 0.1 : 1.0;
        currentConcurrent = Math.floor(base * sourceMult + (Math.random() * base * 0.2 * sourceMult));
        currentPeak = Math.floor(currentConcurrent * (0.8 + Math.random() * 0.4));
        contextTitle = `Simulation: ${config.game} ${source} Link`;
        markConnected();
      }

      const churnRate = 0.01 + (Math.random() * 0.03); 
      if (vTotalRef.current[source] === 0) vTotalRef.current[source] = currentConcurrent * 1.5;
      vTotalRef.current[source] += (currentConcurrent * churnRate);

      const prevCt = prevConcurrentRef.current[source] || 0;
      const delta = currentConcurrent - prevCt;
      const velocity = prevCt > 0 ? delta / prevCt : 0; 
      
      const estimatedSignals = currentConcurrent * 0.15;
      const rawCS = (estimatedSignals / config.sampleSize) * 10;
      const CS = Math.min(100, Math.max(0, rawCS));

      const volatilityPenalty = Math.abs(velocity) * 100;
      const AS = Math.max(10, Math.min(99, 85 - volatilityPenalty));

      const SSM = Math.max(-1, Math.min(1, velocity * 5));

      const S = currentPeak / (vTotalRef.current[source] || 1);

      const reachFactor = ALPHA * Math.log(currentPeak || 1);
      const actionFactor = BETA * CS;
      const desireFactor = GAMMA * (1 + Math.abs(SSM)); 
      const D = Math.max(0, reachFactor * actionFactor * desireFactor);
      
      prevConcurrentRef.current[source] = currentConcurrent;

      let finalIsSimulation = isSimulation;

      const nextEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        game_name: config.game,
        company: config.company,
        source: source,
        sample_size: config.sampleSize,
        total_metrics: currentConcurrent,
        peak_metric_count: currentPeak,
        v_total: Math.floor(vTotalRef.current[source]),
        top_channel_title: contextTitle,
        S, CS, AS, SSM,
        D: parseFloat(D.toFixed(4)),
        is_simulation: finalIsSimulation,
        cycle_signals: estimatedSignals,
        cycle_viewer_minutes: 0
      };

      fetch('/api/save-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextEntry)
      }).catch(err => console.error('Failed to save CSV record locally:', err));

      newEntries.push(nextEntry);
    }

    setLogs(prev => {
      const windowEntries = prev.filter(e => {
        const entryTs = new Date(e.timestamp).getTime();
        return (nowTs - entryTs) <= windowMs;
      });
      const updatedLogs = [...prev.slice(-199), ...newEntries].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (config.gcsAutoArchive && config.gcsAuthToken && config.gcsBucketName) {
        const timeSinceUpload = Date.now() - lastUploadTimeRef.current;
        if (timeSinceUpload > 300000 && updatedLogs.length > 0) { 
          uploadLogsToGCS(config.gcsBucketName, config.gcsFolderPath, config.gcsAuthToken, updatedLogs)
            .then(() => {
              lastUploadTimeRef.current = Date.now();
              setUploadStatus('success');
              setTimeout(() => setUploadStatus('idle'), 3000);
            })
            .catch(() => setUploadStatus('error'));
        }
      }

      return updatedLogs;
    });
  }, [config, twitchToken]);

  const handleValidateAuth = useCallback(async (targetSourceStr?: string) => {
    if (!envData) return;
    const sourcesToValidate: string[] = targetSourceStr ? [targetSourceStr] : Object.keys(config.activeSources).filter(s => config.activeSources[s]);

    for (const source of sourcesToValidate) {
      setConfig(prev => ({ ...prev, sourceAuthStatus: { ...prev.sourceAuthStatus, [source]: 'Cycling' } }));
      let success = false;
      let errorMessage = "All connection attempts failed.";

      if (source === 'Discord') {
        const ids = envData.discordServerIds.length > 0 ? envData.discordServerIds : [config.discordServerId];
        for (const id of ids) {
          if (!id) continue;
          try {
            setConfig(prev => ({ ...prev, discordServerId: id, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: `Trying ${id}...` } }));
            const discordData = await fetchDiscordGuildStats(id);
            if (discordData) {
              setConfig(prev => ({ ...prev, sourceAuthStatus: { ...prev.sourceAuthStatus, [source]: 'Connected' }, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: undefined }, discordServerId: id }));
              success = true;
              break;
            }
          } catch (e: any) { errorMessage = e.message; }
        }
      } 
      else if (source === 'Twitch') {
         const ids = envData.twitchClientIds.length > 0 ? envData.twitchClientIds : [config.twitchClientId];
         const secrets = envData.twitchClientSecrets.length > 0 ? envData.twitchClientSecrets : [config.twitchClientSecret];
         for(let i = 0; i < Math.max(ids.length, secrets.length); i++) {
           const tid = ids[i % ids.length];
           const tsec = secrets[i % secrets.length] || secrets[0];
           if (!tid || !tsec) continue;
           try {
             setConfig(prev => ({ ...prev, twitchClientId: tid, twitchClientSecret: tsec, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: 'Trying token...' } }));
             const token = await getTwitchAccessToken(tid, tsec);
             setTwitchToken(token);
             setConfig(prev => ({ ...prev, sourceAuthStatus: { ...prev.sourceAuthStatus, [source]: 'Connected' }, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: undefined }, twitchClientId: tid, twitchClientSecret: tsec }));
             success = true;
             break;
           } catch (e: any) { errorMessage = e.message; }
         }
      }
      else if (source === 'YouTube Gaming') {
        const keys = envData.youtubeApiKeys.length > 0 ? envData.youtubeApiKeys : [config.youtubeApiKey];
        for (const k of keys) {
          if (!k) continue;
          try {
            setConfig(prev => ({ ...prev, youtubeApiKey: k, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: 'Trying API key...' } }));
            const ytData = await fetchYouTubeGamingStats(k, config.game);
            if (ytData) {
               setConfig(prev => ({ ...prev, sourceAuthStatus: { ...prev.sourceAuthStatus, [source]: 'Connected' }, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: undefined }, youtubeApiKey: k }));
               success = true;
               break;
            }
          } catch(e:any) { errorMessage = e.message; }
        }
      }
      else {
         setTimeout(() => setConfig(prev => ({ ...prev, sourceAuthStatus: { ...prev.sourceAuthStatus, [source]: 'Connected' }, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: undefined } })), 500);
         success = true;
      }

      if (!success) {
        setConfig(prev => ({ ...prev, sourceAuthStatus: { ...prev.sourceAuthStatus, [source]: 'Error' }, sourceAuthErrorMessage: { ...prev.sourceAuthErrorMessage, [source]: errorMessage } }));
      }
    }
  }, [config.activeSources, config.game, envData, config.discordServerId, config.twitchClientId, config.twitchClientSecret, config.youtubeApiKey]);

  // Automatically instantiate node at start and cycle when source/env changes
  useEffect(() => {
    if (envData) {
      handleValidateAuth();
    }
  }, [envData]);

  // Keep a stable ref to the latest runUpdate to avoid effect thrashing
  const runUpdateRef = useRef(runUpdate);
  useEffect(() => {
    runUpdateRef.current = runUpdate;
  }, [runUpdate]);

  useEffect(() => {
    const hasActiveSources = Object.values(config.activeSources).some(v => v);
    if (!hasActiveSources) return;

    // Use timeout to prevent React.StrictMode double-fire on mount
    const initialRun = setTimeout(() => {
      runUpdateRef.current();
    }, 50);

    const freqMs = config.frequencySeconds ? config.frequencySeconds * 1000 : 60000;
    const interval = setInterval(() => {
      const now = new Date();
      const currentHM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (currentHM >= config.scheduledStart && currentHM <= config.scheduledEnd) {
        runUpdateRef.current();
      }
    }, freqMs);

    return () => {
      clearTimeout(initialRun);
      clearInterval(interval);
    };
  }, [config.activeSources, config.frequencySeconds, config.scheduledStart, config.scheduledEnd]);

  useEffect(() => {
    const fetchInsights = async () => {
      if (logs.length < 5) return;
      setIsAnalyzing(true);
      const res = await getDashboardInsights(logs);
      setInsight(res);
      setIsAnalyzing(false);
    };
    const debounce = setTimeout(fetchInsights, 15000);
    return () => clearTimeout(debounce);
  }, [logs.length]);

  // All views are rendered persistently and toggled via CSS display to preserve state during navigation

  if (authLoading) {
     return (
       <div className="h-screen bg-[#020617] flex items-center justify-center relative">
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 bg-grid opacity-50"></div>
         <div className="text-cyan-400 font-black text-sm uppercase tracking-[0.3em] animate-pulse z-10 glass-shine px-6 py-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10">
           Verifying Identity Vault...
         </div>
       </div>
     );
  }

  if (!authUser) {
     return <AuthView onLogin={setAuthUser} />;
  }

  return (
    <ErrorBoundary>
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 bg-grid"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 blur-[120px] pointer-events-none z-0"></div>
      
      <Sidebar 
        config={config} 
        currentView={currentView}
        onViewChange={setCurrentView}
        onConfigChange={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
        companyGames={COMPANY_GAMES}
        isExtSimulating={logs.length > 0 ? Boolean(logs[logs.length - 1].is_simulation) : false}
        authUser={authUser}
        onLogout={async () => {
           if (auth) {
             await signOut(auth);
           }
           setAuthUser(null);
        }}
      />
      
      <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
        <div className={`mx-auto h-full relative transition-all duration-300 w-full ${currentView === 'batch-telemetry' || currentView === 'telemetry' || currentView.startsWith('analysis-') ? 'max-w-[100%]' : 'max-w-7xl'}`}>
          <div style={{ display: currentView === 'dashboard' ? 'block' : 'none', height: '100%' }}>
            <DashboardLiveView logs={logs} config={config} />
          </div>
          <div style={{ display: currentView === 'telemetry' ? 'block' : 'none', height: '100%' }}>
            <TelemetryLiveView logs={logs} activeSources={config.activeSources} />
          </div>
          <div style={{ display: currentView === 'settings' ? 'block' : 'none', height: '100%' }}>
            <SystemCoreView 
              config={config} 
              onConfigChange={(updates) => setConfig(prev => ({ ...prev, ...updates }))} 
              onValidateAuth={handleValidateAuth}
              onManualUpload={handleCloudUpload}
              uploadStatus={uploadStatus}
              isUploading={isUploading}
            />
          </div>
          <div style={{ display: currentView === 'historical-selection' ? 'block' : 'none', height: '100%' }}>
            <DataScopeView config={historicalConfig} setConfig={setHistoricalConfig} />
          </div>
          <div style={{ display: currentView === 'archived-telemetry' ? 'block' : 'none', height: '100%' }}>
            <DashboardHistView config={historicalConfig} onDisplayedDataChange={setArchivedDisplayedData} />
          </div>
          <div style={{ display: currentView === 'batch-telemetry' ? 'block' : 'none', height: '100%' }}>
            <TelemetryHistView config={historicalConfig} data={archivedDisplayedData} />
          </div>
          <div style={{ display: currentView === 'ingestion' ? 'block' : 'none', height: '100%' }}>
            <QueryEditorView />
          </div>
          <div style={{ display: currentView === 'analysis-lag' ? 'block' : 'none', height: '100%' }}>
            <AnalysisModuleView mode="analysis-lag" config={historicalConfig} authUser={authUser} />
          </div>
          <div style={{ display: currentView === 'analysis-toxicity' ? 'block' : 'none', height: '100%' }}>
            <AnalysisModuleView mode="analysis-toxicity" config={historicalConfig} authUser={authUser} />
          </div>
          <div style={{ display: currentView === 'analysis-anomaly' ? 'block' : 'none', height: '100%' }}>
            <AnalysisModuleView mode="analysis-anomaly" config={historicalConfig} authUser={authUser} />
          </div>
          <div style={{ display: currentView === 'analysis-decay' ? 'block' : 'none', height: '100%' }}>
            <AnalysisModuleView mode="analysis-decay" config={historicalConfig} authUser={authUser} />
          </div>
          <div style={{ display: currentView === 'analysis-redline' ? 'block' : 'none', height: '100%' }}>
            <AnalysisModuleView mode="analysis-redline" config={historicalConfig} authUser={authUser} />
          </div>
        </div>
      </main>

    </div>
    </ErrorBoundary>
  );
}

export default App;