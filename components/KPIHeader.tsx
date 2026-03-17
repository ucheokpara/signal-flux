import React from 'react';
import { LogEntry, CollectionConfig } from '../types';
import { Activity, Users, TrendingUp, Monitor, Target, Loader2, Globe, ShieldCheck, Magnet } from 'lucide-react';

interface KPIHeaderProps {
  latestEntry: LogEntry | null;
  config: CollectionConfig;
  activeSource?: string | null;
}

const KPIHeader: React.FC<KPIHeaderProps> = ({ latestEntry, config, activeSource }) => {
  if (!latestEntry) return (
    <div className="h-32 flex items-center justify-center glass rounded-[2rem] animate-pulse glow-cyan">
      <div className="flex items-center gap-3 text-cyan-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <p className="font-bold uppercase tracking-widest text-xs">Waiting for telemetry stream...</p>
      </div>
    </div>
  );

  const isDemo = latestEntry.is_simulation;
  const isProxyActive = config.source === 'Streams Charts' && config.streamsChartsUseProxy;

  // Format the title: convert to uppercase and fix the CAN'T typo
  const formatTitle = (title: string) => {
    return title.toUpperCase().replace(/\bCANT\b/g, "CAN'T");
  };

  const fullTitle = formatTitle(latestEntry.top_channel_title);
  // Dynamic font scaling for very long titles
  const titleSizeClass = fullTitle.length > 60 ? 'text-xs md:text-sm' : 'text-sm md:text-base';

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="shrink-0">
          <h1 className="text-5xl font-black text-white tracking-tighter text-glow-cyan leading-none">{config.game}</h1>
          <p className="text-slate-500 text-xs mt-3 font-bold uppercase tracking-[0.2em]">
            External Signal: <span className="text-cyan-400">{activeSource || config.source}</span> <span className="mx-2 text-slate-800">|</span> Internal Signal: <span className="text-slate-700">Null (Offline)</span>
          </p>
        </div>
        <div className={`flex items-center gap-4 px-5 py-3 bg-slate-900 border ${isDemo ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]'} rounded-[1.5rem] glass-shine transition-all duration-500 max-w-full overflow-hidden`}>
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-2.5 h-2.5 rounded-full ${isDemo ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'} animate-pulse`} />
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${isDemo ? 'text-amber-500' : 'text-slate-300'}`}>
              {isDemo ? 'Demo Pulse' : 'Live Pulse'}
            </span>
          </div>

          {/* Proxy Indicator */}
          {isProxyActive && !isDemo && (
            <div className="flex items-center gap-2 px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span className="text-[8px] font-black uppercase tracking-wider text-indigo-300">Proxy Relay</span>
            </div>
          )}

          <span className={`font-bold border-l border-white/10 pl-4 leading-relaxed break-words min-w-0 flex-1 text-slate-400 ${titleSizeClass}`}>
            {fullTitle}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 xl:gap-6">
        <KPICard 
          label="Demand Score (D)" 
          subLabel="SSDF Output"
          value={latestEntry.D.toFixed(3)} 
          icon={<Target className="w-4 h-4 xl:w-5 xl:h-5 text-rose-400" />}
          colorClass="text-rose-400"
          isGlowing
        />
        <KPICard 
          label="Metrics (Ct)" 
          subLabel="Concurrent Users"
          value={latestEntry.total_metrics.toLocaleString()} 
          icon={<Users className="w-4 h-4 xl:w-5 xl:h-5 text-cyan-400" />}
          colorClass="text-cyan-400"
        />
        <KPICard 
          label="Capture Score (CS)" 
          subLabel="Conversion Intensity"
          value={`${latestEntry.CS.toFixed(1)}%`} 
          icon={<Activity className="w-4 h-4 xl:w-5 xl:h-5 text-emerald-400" />}
          colorClass="text-emerald-400"
        />
        <KPICard 
          label="Stickiness (S)" 
          subLabel="Peak / Total Ratio"
          value={latestEntry.S.toFixed(3)} 
          icon={<Magnet className="w-4 h-4 xl:w-5 xl:h-5 text-fuchsia-400" />}
          colorClass="text-fuchsia-400"
        />
        <KPICard 
          label="Attention Score (AS)" 
          subLabel="Retention Depth"
          value={`${latestEntry.AS.toFixed(1)}%`} 
          icon={<Monitor className="w-4 h-4 xl:w-5 xl:h-5 text-amber-400" />}
          colorClass="text-amber-400"
        />
        <KPICard 
          label="Sentiment (SSM)" 
          subLabel="Social Polarity"
          value={latestEntry.SSM.toFixed(4)} 
          icon={<TrendingUp className="w-4 h-4 xl:w-5 xl:h-5 text-indigo-400" />}
          colorClass="text-indigo-400"
        />
      </div>
    </div>
  );
};

const KPICard = ({ label, subLabel, value, icon, colorClass, isGlowing }: { label: string, subLabel: string, value: string, icon: React.ReactNode, colorClass: string, isGlowing?: boolean }) => (
  <div className={`glass p-4 xl:p-6 rounded-[1.5rem] xl:rounded-[2rem] border-slate-800/50 hover:bg-slate-800/70 transition-all duration-500 cursor-default glass-shine group ${isGlowing ? 'border-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 'hover:border-cyan-500/20'}`}>
    <div className="flex items-center justify-between mb-3 xl:mb-5">
      <div className="space-y-0.5 xl:space-y-1 pr-2">
        <p className="text-[8px] xl:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">{label}</p>
        <p className="text-[6px] xl:text-[7px] font-bold text-slate-600 uppercase tracking-widest">{subLabel}</p>
      </div>
      <div className="p-1.5 xl:p-2 bg-slate-900/50 rounded-lg xl:rounded-xl shrink-0">{icon}</div>
    </div>
    <h3 className={`text-xl xl:text-2xl font-black tracking-tighter ${colorClass} ${isGlowing ? 'text-shadow-rose' : ''}`}>{value}</h3>
  </div>
);

export default KPIHeader;