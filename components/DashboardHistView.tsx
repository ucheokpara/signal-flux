import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar } from 'recharts';
import { Clock, Play, AlertTriangle, Activity, Users, Flame, Percent, Eye, TrendingUp, Package, MapPin, Pause, FastForward, Rewind, RotateCcw, Settings } from 'lucide-react';

interface DashboardHistProps {
  config: {
    startDate: Date | null;
    endDate: Date | null;
    channels: string[];
    tags: string[];
    queues: string[];
    source?: string;
  };
  onDisplayedDataChange?: (data: any[]) => void;
}

const SPEED_MAP: Record<number, { label: string, virtualMinsPerSec: number }> = {
  1: { label: "1 Min/s", virtualMinsPerSec: 1 },
  2: { label: "1 Hr/s", virtualMinsPerSec: 60 },
  3: { label: "1 Day/s", virtualMinsPerSec: 1440 },
  4: { label: "1 Wk/s", virtualMinsPerSec: 10080 },
  5: { label: "1 Mo/s", virtualMinsPerSec: 43200 },
  6: { label: "1 Qtr/s", virtualMinsPerSec: 129600 },
  7: { label: "1 Yr/s", virtualMinsPerSec: 525600 }
};

const WINDOW_MAP: Record<string, { winSizePoints: number, minsPerPoint: number }> = {
  "Hour": { winSizePoints: 60, minsPerPoint: 1 },
  "Day": { winSizePoints: 144, minsPerPoint: 10 },
  "Week": { winSizePoints: 168, minsPerPoint: 60 },
  "Month": { winSizePoints: 120, minsPerPoint: 360 },
  "Quarter": { winSizePoints: 90, minsPerPoint: 1440 },
  "Year": { winSizePoints: 365, minsPerPoint: 1440 }
};

const getMaxSpeed = (winLen: string) => {
   if (winLen === "Hour") return 1;
   if (winLen === "Day") return 2;
   if (winLen === "Week") return 3;
   if (winLen === "Month") return 4;
   if (winLen === "Quarter") return 5;
   return 6;
};

const DashboardHistView: React.FC<DashboardHistProps> = ({ config, onDisplayedDataChange }) => {
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [fullChartData, setFullChartData] = useState<any[]>([]);
  const [displayedData, setDisplayedData] = useState<any[]>([]);
  
  const [isFetching, setIsFetching] = useState(false);
  
  // Streaming state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedLevel, setSpeedLevel] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Window logic
  const [windowLength, setWindowLength] = useState("Day");
  const [windowType, setWindowType] = useState<"moving" | "anchored">("moving");

  const executePipeline = async (overrideWinLen?: string) => {
    const fetchWinLen = overrideWinLen || windowLength;
    if (!config.startDate || !config.endDate) {
       setError("Error: Invalid Historical Bounds.");
       return;
    }
    setError(null);
    setIsFetching(true);
    setHasRun(true);
    setIsPlaying(false);
    setCurrentIndex(0);
    setDisplayedData([]);
    
    try {
      const res = await fetch('/api/historical-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: config.startDate,
          endDate: config.endDate,
          channels: config.channels,
          tags: config.tags,
          queues: config.queues,
          windowLength: fetchWinLen,
          source: config.source
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setFullChartData(data || []);
      setCurrentIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && fullChartData.length > 0) {
      const TICK_MS = 100; // 10 updates per second
      interval = setInterval(() => {
        setCurrentIndex(prev => {
          const maxAllowed = getMaxSpeed(windowLength);
          const safeSpeed = Math.min(speedLevel, maxAllowed);
          
          const virtualMinsPerSec = SPEED_MAP[safeSpeed].virtualMinsPerSec;
          const minsPerPoint = WINDOW_MAP[windowLength].minsPerPoint;
          
          const pointsPerSec = virtualMinsPerSec / minsPerPoint;
          const pointsToAdd = (pointsPerSec * TICK_MS) / 1000;
          
          const next = prev + pointsToAdd;
          if (next >= fullChartData.length) {
            setIsPlaying(false);
            return fullChartData.length;
          }
          return next;
        });
      }, TICK_MS);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speedLevel, fullChartData.length, windowLength]);

  const processedData = React.useMemo(() => {
    if (fullChartData.length === 0) return [];
    const currentInt = Math.floor(currentIndex);
    const winSize = WINDOW_MAP[windowLength].winSizePoints;
    
    let startIndex = 0;
    let endIndex = Math.min(currentInt + 1, fullChartData.length);
    let viewEndIndex = endIndex;

    if (windowType === "moving") {
      startIndex = Math.max(0, endIndex - winSize);
      viewEndIndex = Math.max(endIndex, Math.min(winSize, fullChartData.length));
    } else {
      // Anchored: Window starts at a hard bound (0, winSize, winSize*2...)
      // The chart slowly fills up until it hits the next winSize bound, then restarts empty.
      startIndex = Math.floor(currentInt / winSize) * winSize;
      viewEndIndex = Math.min(startIndex + winSize, fullChartData.length);
    }

    const rawSlice = [];
    for (let i = startIndex; i < viewEndIndex; i++) {
      if (i < endIndex) {
         const item = fullChartData[i];
         const productivity = item.ResourceDemand > 0 ? (item.IncidentDemand / item.ResourceDemand) : 0;
         rawSlice.push({...item, ProductivityRate: productivity});
      } else {
         rawSlice.push({
            ...fullChartData[i],
            Ct: null, S: null, CS: null, AS: null, SSM: null, D: null,
            IncidentDemand: null, ResourceDemand: null, ProductivityRate: null
         });
      }
    }
    
    // Performance Guard: Downsample the array mathematically so we never feed Recharts more than 200 SVG nodes per chart.
    if (rawSlice.length > 200) {
      const step = Math.ceil(rawSlice.length / 200);
      const sampled = [];
      for (let i = 0; i < rawSlice.length; i += step) {
        sampled.push(rawSlice[i]);
      }
      return sampled;
    }
    return rawSlice;
  }, [currentIndex, windowLength, windowType, fullChartData]);

  useEffect(() => {
    setDisplayedData(processedData);
    if (onDisplayedDataChange) {
      onDisplayedDataChange(processedData);
    }
  }, [processedData, onDisplayedDataChange]);

  const handlePausePlay = () => setIsPlaying(!isPlaying);
  
  const restartStream = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const renderExternalChart = (title: string, dataKey: string, color: string, Icon: any, subtitle: string, fillType: "area" | "line" = "area") => (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col relative overflow-hidden group">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <Icon className={`w-3 h-3 ${color.replace('bg-', 'text-').replace('500', '400')}`} />
            {title}
          </h4>
          <p className="text-slate-500 text-[10px] mt-1">{subtitle}</p>
        </div>
      </div>
      <div className="h-40 w-full mt-auto z-10 relative">
        {displayedData.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-slate-700 text-xs font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-xl">No Stream</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {fillType === "area" ? (
              <AreaChart data={displayedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={8} tickMargin={5} minTickGap={30} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} />
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#grad-${dataKey})`} isAnimationActive={false} />
              </AreaChart>
            ) : (
              <LineChart data={displayedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={8} tickMargin={5} minTickGap={30} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} />
                <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      {/* Dynamic scan line effect */}
      {isPlaying && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent w-full h-[20%] animate-[scan_3s_linear_infinite]" />}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto h-full overflow-y-auto pr-4 custom-scrollbar">
      <div className="flex items-center gap-4 shrink-0">
        <div className="p-3 bg-pink-500/10 rounded-2xl border border-pink-500/20">
          <Clock className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Historical Stream</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Simulated Historical Stream • Cross-Plot Concurrency</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-pink-400" />
            Global Scope Bound
          </h3>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Data execution is bound to the parameters configured in the Data Scope view. 
            Currently scoping {config.startDate?.toLocaleDateString()} to {config.endDate?.toLocaleDateString()} 
            with {config.channels.length === 0 ? "ALL" : config.channels.length} channel(s) and {config.queues.length === 0 ? "ALL" : config.queues.length} queue(s).
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-3 shrink-0">
          {error && (
            <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button 
            onClick={() => executePipeline()}
            disabled={isFetching}
            className={`px-10 py-4 ${isFetching ? 'bg-pink-800 cursor-not-allowed opacity-70' : 'bg-pink-600 hover:bg-pink-500'} text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(219,39,119,0.3)] hover:shadow-[0_4px_30px_rgba(219,39,119,0.5)] flex items-center gap-3`}>
              {isFetching ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"/> : <Play className="w-5 h-5 fill-white" />} 
              {isFetching ? "Mounting Stream..." : "Launch Replay Sequence"}
          </button>
        </div>
      </div>

      {hasRun && !isFetching && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in pt-4">

          {/* Player Controls */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4 sticky top-0 z-50">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                     <button onClick={restartStream} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                       <RotateCcw className="w-5 h-5" />
                     </button>
                     <button onClick={handlePausePlay} className={`p-3 rounded-xl transition-all ${isPlaying ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-white'}`}>
                       {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                     </button>
                  </div>
                  <div className="flex flex-col gap-1 w-32 md:w-48">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <span>Speed</span>
                      <span className="text-pink-400 font-mono">{SPEED_MAP[Math.min(speedLevel, getMaxSpeed(windowLength))].label}</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max={getMaxSpeed(windowLength)} 
                      value={Math.min(speedLevel, getMaxSpeed(windowLength))} 
                      onChange={(e) => setSpeedLevel(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
                    />
                  </div>
               </div>
               
               <div className="flex items-center gap-4 bg-slate-900 rounded-xl border border-slate-800 p-2">
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] text-slate-500 font-bold uppercase px-1">Window Length</span>
                   <select 
                     value={windowLength} 
                     onChange={(e) => {
                       setIsPlaying(false);
                       const newWin = e.target.value;
                       setWindowLength(newWin);
                       if (hasRun) {
                         executePipeline(newWin);
                       }
                     }}
                     className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer px-1">
                     {Object.keys(WINDOW_MAP).map(w => <option key={w} value={w} className="bg-slate-900">{w}</option>)}
                   </select>
                 </div>
                 <div className="w-px h-6 bg-slate-800"></div>
                 <div className="flex flex-col gap-1">
                   <span className="text-[9px] text-slate-500 font-bold uppercase px-1">Window Type</span>
                   <select 
                     value={windowType} 
                     onChange={(e) => {
                       setIsPlaying(false);
                       setWindowType(e.target.value as any);
                     }}
                     className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none cursor-pointer px-1">
                     <option value="moving" className="bg-slate-900">Moving</option>
                     <option value="anchored" className="bg-slate-900">Anchored</option>
                   </select>
                 </div>
               </div>

               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stream Progress</span>
                  <span className="text-sm font-black text-pink-400 font-mono">
                    {fullChartData.length > 0 ? (fullChartData[Math.min(Math.floor(currentIndex), fullChartData.length - 1)]?.time || "--:--") : "--:--"}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    Marker {Math.floor(currentIndex)} of {fullChartData.length}
                  </span>
               </div>
             </div>
             
             {/* Timeline Scrubber */}
             <div className="w-full flex items-center gap-4">
               <span className="text-[10px] text-slate-500 font-bold uppercase">Timeline</span>
               <input 
                 type="range" 
                 min="0" 
                 max={fullChartData.length} 
                 value={currentIndex} 
                 onChange={(e) => {
                   setIsPlaying(false);
                   const idx = Number(e.target.value);
                   setCurrentIndex(idx);
                 }}
                 className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500"
               />
             </div>
          </div>
          
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">External Core Variables (Section 2.1)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderExternalChart("Concurrent Volume (C)", "Ct", "#3b82f6", Users, "Total base viewer volume", "area")}
            {renderExternalChart("Stickiness Ratio (S)", "S", "#8b5cf6", Percent, "Peak / Total Volatility", "line")}
            {renderExternalChart("Capture Score (CS)", "CS", "#f59e0b", Activity, "Target Demo Efficiency", "line")}
            {renderExternalChart("Attention Score (AS)", "AS", "#ec4899", Eye, "Viewer retention intensity", "line")}
            {renderExternalChart("Sentiment Vel. (SSM)", "SSM", "#10b981", TrendingUp, "Chatter positivity momentum", "line")}
            {renderExternalChart("Aggregate Demand (D)", "D", "#ef4444", Flame, "Overall synthesized social pressure", "area")}
          </div>

          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 pt-6">Internal Demand Variables (Source Queue Loads)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col relative overflow-hidden">
              <div className="z-10 relative">
                <h4 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Package className="w-3 h-3 text-emerald-400" />
                  Incident Demand Signal
                </h4>
                <p className="text-slate-500 text-[10px] mt-1">Total Packages (Tickets/Contacts) logged</p>
              </div>
              <div className="h-48 w-full mt-auto z-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={8} tickMargin={5} minTickGap={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} />
                    <Bar dataKey="IncidentDemand" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {isPlaying && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent w-full h-[20%] animate-[scan_3s_linear_infinite]" />}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col relative overflow-hidden">
              <div className="z-10 relative">
                <h4 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Resource Demand Signal
                </h4>
                <p className="text-slate-500 text-[10px] mt-1">Weighted Work Minutes (Incident * Average Handling Time)</p>
              </div>
              <div className="h-48 w-full mt-auto z-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-res" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={8} tickMargin={5} minTickGap={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="ResourceDemand" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#grad-res)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {isPlaying && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent w-full h-[20%] animate-[scan_3s_linear_infinite]" />}
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col relative overflow-hidden">
              <div className="z-10 relative">
                <h4 className="text-white font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                  <Activity className="w-3 h-3 text-purple-400" />
                  Productivity Rate
                </h4>
                <p className="text-slate-500 text-[10px] mt-1">Incidence (packages) per Resource Time</p>
              </div>
              <div className="h-48 w-full mt-auto z-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayedData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-prod" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={8} tickMargin={5} minTickGap={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="ProductivityRate" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#grad-prod)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {isPlaying && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent w-full h-[20%] animate-[scan_3s_linear_infinite]" />}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardHistView;
