import React, { useState, useEffect } from 'react';
import { CollectionConfig, DataSource, GamingCompany } from '../types';
import { 
  Settings, 
  Globe, 
  Cpu, 
  Monitor, 
  TestTube, 
  Radio, 
  Key, 
  Lock, 
  RefreshCw, 
  ShieldCheck, 
  Cloud, 
  Info, 
  Terminal, 
  Loader2, 
  Check, 
  X, 
  Clock, 
  Timer, 
  Activity, 
  Database,
  ExternalLink,
  Youtube,
  Hash,
  LineChart
} from 'lucide-react';

interface SettingsViewProps {
  config: CollectionConfig;
  onConfigChange: (updates: Partial<CollectionConfig>) => void;
  onValidateAuth: (sourceStr?: string) => void;
  onManualUpload: () => void;
  uploadStatus: 'idle' | 'success' | 'error';
  isUploading: boolean;
}

const SystemCoreView: React.FC<SettingsViewProps> = ({
  config,
  onConfigChange,
  onValidateAuth,
  onManualUpload,
  uploadStatus,
  isUploading
}) => {
  const triedToStart = false; // dummy since it was barely used except styling
  const sources: DataSource[] = ['Twitch', 'Discord', 'YouTube Gaming', 'Kick', 'Facebook Gaming', 'TikTok Live'];

  const isFieldSatisfied = (value: string) => value && value.trim().length > 0;

  const getInputClass = (value: string) => {
    const satisfied = isFieldSatisfied(value);
    if (satisfied) return "border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] bg-slate-950/80";
    if (triedToStart && !satisfied) return "border-rose-500/50 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.2)] bg-rose-950/20";
    return "border-slate-800 text-slate-400 bg-slate-950";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
        <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
          <Settings className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">System Core</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Global Configuration Matrix</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Context & Signal Source */}
        <div className="space-y-8">
          
          <section className="glass p-8 rounded-[2rem] border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" /> Target Context
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="group relative">
                <label className="block text-[8px] text-slate-500 font-black uppercase mb-1.5 tracking-widest ml-1">
                  Entity
                </label>
                <select
                  value={config.company}
                  onChange={(e) => {
                    const newCompany = e.target.value as GamingCompany;
                    const defaultGames: Record<GamingCompany, string[]> = {
                      'Epic Games': ['Fortnite', 'Gears of War'],
                      'Ubisoft': ["Assassin's Creed", 'Rainbow Six'],
                      'EA': ['Apex Legends', 'FC 25'],
                      'Activision': ['Call of Duty', 'Overwatch 2']
                    };
                    onConfigChange({ company: newCompany, game: defaultGames[newCompany][0] });
                  }}
                  className="w-full bg-slate-900/50 border border-slate-800 text-slate-300 rounded-xl p-3 text-[10px] outline-none focus:border-cyan-500/30 transition-all font-bold appearance-none hover:bg-slate-900"
                >
                  {["Epic Games", "Ubisoft", "EA", "Activision"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="group relative">
                <label className="block text-[8px] text-slate-500 font-black uppercase mb-1.5 tracking-widest ml-1">
                  Asset
                </label>
                <select
                  value={config.game}
                  onChange={(e) => onConfigChange({ game: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-800 text-slate-300 rounded-xl p-3 text-[10px] outline-none focus:border-cyan-500/30 transition-all font-bold appearance-none hover:bg-slate-900"
                >
                  {({
                    'Epic Games': ['Fortnite', 'Gears of War'],
                    'Ubisoft': ["Assassin's Creed", 'Rainbow Six'],
                    'EA': ['Apex Legends', 'FC 25'],
                    'Activision': ['Call of Duty', 'Overwatch 2']
                  }[config.company as GamingCompany] || []).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="glass p-8 rounded-[2rem] border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-500" /> Active Matrix Nodes
            </h3>

            <div className="space-y-4">
              {sources.map(s => {
                const isActive = config.activeSources[s];
                const authStatus = config.sourceAuthStatus[s] || 'Disconnected';
                const authErrorMessage = config.sourceAuthErrorMessage[s];
                
                return (
                  <div key={s} className={`bg-slate-900/50 rounded-2xl p-4 border transition-all duration-300 ${isActive ? 'border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : authStatus === 'Error' ? 'bg-rose-500' : 'bg-slate-600'}`}></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{s} Node</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <button 
                            onClick={() => onConfigChange({ activeSources: { ...config.activeSources, [s]: false }, sourceAuthStatus: { ...config.sourceAuthStatus, [s]: 'Disconnected' }, sourceAuthErrorMessage: { ...config.sourceAuthErrorMessage, [s]: undefined } })}
                            className="text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                          >
                            Terminate
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              onConfigChange({ activeSources: { ...config.activeSources, [s]: true }, sourceAuthStatus: { ...config.sourceAuthStatus, [s]: 'Cycling' } });
                              onValidateAuth(s);
                            }}
                            className="text-[9px] font-bold uppercase px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                          >
                            {authStatus === 'Cycling' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />} Run Link
                          </button>
                        )}
                      </div>
                    </div>

                    {authStatus === 'Cycling' && (
                      <div className="text-[9px] font-bold uppercase text-cyan-400 mt-2 px-2 py-1.5 bg-cyan-950/30 rounded-lg flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Cycling Connections...
                      </div>
                    )}
                    {authStatus === 'Connected' && (
                      <div className="text-[9px] font-bold uppercase text-emerald-400 mt-2 px-2 py-1.5 bg-emerald-950/30 rounded-lg flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Connection Successful
                      </div>
                    )}
                    {authStatus === 'Error' && (
                      <div className="text-[9px] font-bold uppercase text-rose-400 mt-2 px-2 py-1.5 bg-rose-950/30 rounded-lg flex items-center gap-2 truncate">
                        <X className="w-3 h-3 flex-shrink-0" /> Failed: {authErrorMessage || 'Invalid Init'}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="glass p-8 rounded-[2rem] border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-500" /> SSDF Logic
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <Timer className="w-3 h-3" /> Rolling Window
                  </label>
                  <span className="text-[10px] font-mono font-bold text-rose-400">{config.rollingWindowMinutes}m</span>
                </div>
                <input 
                  type="range" min="1" max="60" step="1"
                  value={config.rollingWindowMinutes}
                  onChange={(e) => onConfigChange({ rollingWindowMinutes: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Pulse Interval
                  </label>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">{config.frequencySeconds}s</span>
                </div>
                <input 
                  type="range" min="60" max="600" step="10"
                  value={config.frequencySeconds}
                  onChange={(e) => onConfigChange({ frequencySeconds: Number(e.target.value) })}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] text-slate-600 font-black uppercase tracking-widest ml-1">Window Open</label>
                  <input type="time" value={config.scheduledStart} onChange={(e) => onConfigChange({ scheduledStart: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-white outline-none font-mono focus:border-cyan-500/40" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] text-slate-600 font-black uppercase tracking-widest ml-1">Window Close</label>
                  <input type="time" value={config.scheduledEnd} onChange={(e) => onConfigChange({ scheduledEnd: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10px] text-white outline-none font-mono focus:border-cyan-500/40" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Cloud & Sampling */}
        <div className="space-y-8">
          <section className="glass p-8 rounded-[2rem] border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
            <div className="flex items-center gap-2 mb-6">
              <Cloud className="w-4 h-4 text-cyan-500" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Cloud Persistence</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1.5 ml-1">Bucket Name</label>
                <input
                  name="gcsBucketName"
                  type="password"
                  placeholder="signal_flux_data"
                  value={config.gcsBucketName}
                  onChange={(e) => onConfigChange({ gcsBucketName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 font-mono outline-none focus:border-cyan-500/50"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1.5 ml-1">Folder Path</label>
                  <input
                    name="gcsFolderPath"
                    type="password"
                    placeholder="ssdf/"
                    value={config.gcsFolderPath}
                    onChange={(e) => onConfigChange({ gcsFolderPath: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 font-mono outline-none focus:border-cyan-500/50"
                  />
                </div>
                <div>
                   <label className="block text-[8px] text-slate-500 font-bold uppercase mb-1.5 ml-1 flex justify-between">
                     Auth Token
                     <a href="https://developers.google.com/oauthplayground" target="_blank" className="text-cyan-500 hover:text-cyan-400 flex items-center gap-1"><ExternalLink className="w-2 h-2" /></a>
                   </label>
                   <input
                    name="gcsAuthToken"
                    type="password"
                    placeholder="OAuth Bearer..."
                    value={config.gcsAuthToken}
                    onChange={(e) => onConfigChange({ gcsAuthToken: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] text-slate-300 font-mono outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1 py-2 bg-slate-900/30 rounded-lg">
                <input 
                  type="checkbox" 
                  checked={config.gcsAutoArchive}
                  onChange={(e) => onConfigChange({ gcsAutoArchive: e.target.checked })}
                  className="w-4 h-4 rounded-md bg-slate-800 border-slate-700 accent-cyan-500 cursor-pointer ml-2"
                />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Auto-Archive (5m Interval)</span>
              </div>

              <button
                onClick={onManualUpload}
                disabled={isUploading || !config.gcsAuthToken}
                className={`w-full py-4 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !config.gcsAuthToken ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed' :
                  uploadStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-900/20' :
                  uploadStatus === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-900/20' :
                  'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5'
                }`}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                 !config.gcsAuthToken ? <Lock className="w-4 h-4" /> :
                 uploadStatus === 'success' ? <Check className="w-4 h-4" /> :
                 uploadStatus === 'error' ? <X className="w-4 h-4" /> :
                 <Cloud className="w-4 h-4" />}
                
                {isUploading ? 'Archiving...' : 
                 !config.gcsAuthToken ? 'Auth Token Required' :
                 uploadStatus === 'success' ? 'Archived Successfully' : 
                 uploadStatus === 'error' ? 'Upload Failed' : 'Sync to Cloud Now'}
              </button>
            </div>
          </section>

          <section className="glass p-8 rounded-[2rem] border-cyan-500/10 hover:border-cyan-500/20 transition-all duration-300">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" /> Matrix Sampling
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center mb-1">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Nodes</label>
                <span className="text-[10px] font-mono font-bold text-cyan-400">{config.sampleSize}</span>
              </div>
              <input 
                type="range" min="25" max="500" step="25"
                value={config.sampleSize}
                onChange={(e) => onConfigChange({ sampleSize: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <p className="text-[8px] text-slate-600 font-bold uppercase tracking-wide">Adjust signal resolution density</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SystemCoreView;
