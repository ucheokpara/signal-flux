import React, { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { Database, Activity, ExternalLink, Server, Globe2, AlertTriangle, Network, Search, Crosshair, Play, X, MapPin } from 'lucide-react';

const USE_CASES = [
  {
    title: "Post-Incident Forensic Analysis",
    desc: "Investigate past internal traffic anomalies by correlating them against historical social signals. Isolate game infrastructure faults from external platform virality events.",
    example: "On Nov 12th, authentication services stalled. Using Batch Analysis, you confirm a prominent streamer unexpectedly broadcasted the game to 100k+ viewers precisely 15 minutes before the internal spike, ruling out a bad deployment.",
    icon: Search,
    color: "text-blue-500"
  },
  {
    title: "Baseline Anomaly Review",
    desc: "Review historical baseline metrics. Confirm if recorded dips in internal game telemetry were directly tied to documented external platform (Twitch/YouTube) outages.",
    example: "Internal Concurrent Users (CCU) dropped by 15% on Aug 3rd. Batch Analysis shows Twitch experienced a global outage for those exact 2 hours, confirming the drop was a macro-event and not an internal game crash.",
    icon: AlertTriangle,
    color: "text-amber-500"
  },
  {
    title: "Capacity Planning Validation",
    desc: "Validate past resource allocation models against historical social signal surges. Measure how accurately server scaling protocols handled actual retrospective viewer momentum.",
    example: "Forensically pairing last year's Season Launch Twitch viewership curve (External) against the actual CDN Egress limits hit (Internal) to calibrate auto-scaling constraints (like pre-warming load balancers) for the upcoming season launch.",
    icon: Server,
    color: "text-emerald-500"
  },
  {
    title: "Marketing Campaign Retrospective",
    desc: "Analyze the exact backward-looking delay between a past sponsored streamer going live and the corresponding internal lift in concurrent active users (CAU).",
    example: "Filtering the archive for the '#sponsored' tag and specific channels. The plot proves that while the broadcast went live at 2:00 PM, the actual surge in internal matchmaking queue loads didn't register until 2:45 PM, establishing a 45-minute ROI latency.",
    icon: Crosshair,
    color: "text-purple-500"
  },
  {
    title: "Predictive Correlation Modeling",
    desc: "Examine the statistical relationship between an increase in external social heat (chatter/demand) and the subsequent lagged surge in internal reports, support tickets, or resource utilization, forming a model where recent external signals predict near-future internal demand.",
    example: "By running correlations over 6 months of historical data, a forensic model is built proving that every 10,000 external viewer shift correlates to a 5% increase in player support tickets exactly 3 hours later, allowing for predictive staff scheduling today.",
    icon: Network,
    color: "text-indigo-500"
  }
];

interface AnalysisViewProps {
  config: {
    startDate: Date | null;
    endDate: Date | null;
    channels: string[];
    tags: string[];
    queues: string[];
  };
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ config }) => {
  const [hasRun, setHasRun] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [internalModel, setInternalModel] = useState("both");
  
  const MIN_DATA_DATE = new Date('2025-01-01T00:00:00-06:00');
  const MAX_DATA_DATE = new Date('2026-02-28T23:59:59-06:00');

  const ALL_CHANNELS = ["Ninja", "SypherPK", "Clix", "losgerardos", "tarik", "shroud", "kai_cenat", "xQc", "ibai", "tyler1", "jynxzi", "asmongold", "timthetatman", "auronplay", "nickmercs", "summit1g", "iiTzTimmy", "Pfpss", "LIRIK", "Rubius"];
  const ALL_QUEUES = ["Fortnite Player Support", "Rocket League Support", "Fall Guys Support", "Epic Games Store Support", "Fab Ops - Appeals Product Category", "Fab Ops - Payments/Payout Product Category", "Unreal Engine Support", "Account Security", "Billing Operations", "Community Moderation"];

  const executeAnalysis = async () => {
    setIsAnalyzing(true);
    setHasRun(true);
    setError(null);
    try {
      const res = await fetch('/api/batch-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          externalStartDate: config.startDate,
          externalEndDate: config.endDate,
          channels: config.channels,
          tags: config.tags,
          queues: config.queues
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch analysis data');
      }
      const data = await res.json();
      setChartData(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setChartData([]);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const externalPeak = chartData.reduce((max, d) => Math.max(max, d.external || 0), 0);
  const internalPeak = chartData.reduce((max, d) => Math.max(max, d.internal || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-7xl mx-auto h-full overflow-y-auto pr-4 custom-scrollbar">
      <style>{`
        .react-datepicker-wrapper { width: 100%; }
        .react-datepicker {
          background-color: #0f172a !important;
          border-color: #1e293b !important;
          color: #cbd5e1 !important;
          font-family: inherit !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25) !important;
          border-radius: 1rem !important;
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: #020617 !important;
          border-bottom-color: #1e293b !important;
          padding-top: 1rem;
        }
        .react-datepicker__current-month, 
        .react-datepicker-time__header, 
        .react-datepicker-year-header,
        .react-datepicker__day-name {
          color: #f8fafc !important;
        }
        .react-datepicker__day {
          color: #cbd5e1 !important;
        }
        .react-datepicker__day:hover {
          background-color: #334155 !important;
          border-radius: 0.5rem !important;
        }
        .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected, .react-datepicker__day--in-range {
          background-color: #4f46e5 !important;
          color: #ffffff !important;
          border-radius: 0.5rem !important;
        }
        .react-datepicker__day--in-selecting-range {
          background-color: #6366f1 !important;
          color: #ffffff !important;
        }
      `}</style>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <Database className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Analysis</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Forensic Correlation Engine • Offline Archive</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            Global Scope Bound
          </h3>
          <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
            Data execution is bound to the parameters configured in the Data Scope view. 
            Currently scoping {config.startDate?.toLocaleDateString()} to {config.endDate?.toLocaleDateString()} 
            with {config.channels.length === 0 ? "ALL" : config.channels.length} channel(s) and {config.queues.length === 0 ? "ALL" : config.queues.length} internal queue(s).
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
            onClick={executeAnalysis}
            disabled={isAnalyzing}
            className={`px-10 py-4 ${isAnalyzing ? 'bg-indigo-800 cursor-not-allowed opacity-70' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_4px_30px_rgba(79,70,229,0.5)] flex items-center gap-3`}>
              {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"/> : <Play className="w-5 h-5" />} 
              {isAnalyzing ? "Aggregating Telemetry..." : "Execute Retrospective Analysis"}
          </button>
        </div>
      </div>

      {hasRun && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 fade-in pt-4">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Chart 1: External */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2xl] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-cyan-400" />
                    External Signals
                  </h4>
                  <p className="text-slate-500 text-xs mt-1">Aggregated Viewer Count (Twitch - Fortnite)</p>
                </div>
                <div className="px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs font-bold border border-cyan-500/20">
                  Peak: {(externalPeak / 1000).toFixed(1)}k
                </div>
              </div>
              <div className="h-64 w-full">
                {chartData.length === 0 && !isAnalyzing ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-600 text-sm font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-xl">No Data Found for Selection</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} minTickGap={30} />
                    <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#22d3ee' }}
                      formatter={(val: number) => [val.toLocaleString(), 'Peak Hr Concurrent']}
                    />
                    <Area type="monotone" dataKey="external" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorExt)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Internal */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-[2xl] p-6 space-y-4">
               <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    Internal Telemetry
                  </h4>
                  <p className="text-slate-500 text-xs mt-1">Auth Server Demand (Concurrent Sessions)</p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                  Peak: {(internalPeak / 1000).toFixed(1)}k
                </div>
              </div>
              <div className="h-64 w-full">
                {chartData.length === 0 && !isAnalyzing ? (
                  <div className="h-full w-full flex items-center justify-center text-slate-600 text-sm font-bold uppercase tracking-widest border border-dashed border-slate-800 rounded-xl">No Data Found for Selection</div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" stroke="#475569" fontSize={10} tickMargin={10} minTickGap={30} />
                    <YAxis stroke="#475569" fontSize={10} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#10b981' }}
                      formatter={(val: number) => [val.toLocaleString(), 'Est. Auth Load']}
                    />
                    <Area type="monotone" dataKey="internal" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInt)" />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">Forensic Use Cases</h3>
            <p className="text-slate-400 text-sm mb-8">Backward-looking investigative methods used to validate infrastructure loads against archived external datasets.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {USE_CASES.map((uc, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 rounded-2xl bg-slate-900/50 hover:bg-slate-800/50 border border-white/5 transition-colors group">
                  <div className="flex gap-4">
                    <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 h-fit ${uc.color} group-hover:scale-110 transition-transform`}>
                      <uc.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-slate-200 font-bold mb-1 group-hover:text-white transition-colors">{uc.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{uc.desc}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/80 p-4 rounded-xl border border-slate-800/50 italic leading-relaxed">
                    <span className="font-bold text-slate-300 not-italic uppercase tracking-widest block mb-2">Example</span>
                    {uc.example}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AnalysisView;
