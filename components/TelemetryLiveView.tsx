import React, { useState, useEffect } from 'react';
import DataTable from './DataTable';
import { LogEntry, DataSource } from '../types';
import { Database, Activity } from 'lucide-react';

interface TelemetryViewProps {
  logs: LogEntry[];
  activeSources: Record<string, boolean>;
}

const TelemetryLiveView: React.FC<TelemetryViewProps> = ({ logs, activeSources }) => {
  const activeKeys = Object.keys(activeSources).filter(k => activeSources[k]) as DataSource[];
  const [selectedTab, setSelectedTab] = useState<DataSource | null>(activeKeys[0] || null);

  useEffect(() => {
    if (activeKeys.length > 0 && (!selectedTab || !activeKeys.includes(selectedTab))) {
      setSelectedTab(activeKeys[0]);
    } else if (activeKeys.length === 0) {
      setSelectedTab(null);
    }
  }, [activeSources]);

  const filteredLogs = selectedTab 
    ? logs.filter(l => l.source === selectedTab)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col pb-20">
      <div className="flex items-center gap-3 px-4 shrink-0">
        <Database className="w-4 h-4 text-cyan-500" />
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Real-time Telemetry Matrix</h2>
      </div>

      <div className="flex items-center gap-2 px-4 overflow-x-auto custom-scrollbar pb-2">
        {activeKeys.length === 0 && (
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest px-3 py-1.5 border border-slate-800 rounded-lg bg-slate-900/50">
            No Active Streams
          </div>
        )}
        {activeKeys.map(source => (
          <button
            key={source}
            onClick={() => setSelectedTab(source)}
            className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-all ${
              selectedTab === source
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                : 'bg-slate-900/50 text-slate-500 border border-slate-800 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            <Activity className="w-3 h-3" /> {source}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <DataTable data={filteredLogs} source={selectedTab || ('Twitch' as DataSource)} />
      </div>
    </div>
  );
};

export default TelemetryLiveView;