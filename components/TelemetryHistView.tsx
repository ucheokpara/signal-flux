import React from 'react';
import { Database, Download, Calendar, MapPin } from 'lucide-react';

interface TelemetryHistProps {
  config: {
    startDate: Date | null;
    endDate: Date | null;
    channels: string[];
    tags: string[];
    queues: string[];
    company: string;
    game: string;
    source?: string;
  };
  data: any[];
}

const TelemetryHistView: React.FC<TelemetryHistProps> = ({ config, data }) => {
  const validData = data.filter(e => e.Ct !== null);

  const exportToCSV = () => {
    if (validData.length === 0) return;

    const headers = [
      "Timestamp", 
      "External_Volume", 
      "Internal_Packages", 
      "Resource_Demand", 
      "Productivity_Rate",
      "Stickiness_S", 
      "Capture_Score_CS", 
      "Attention_Score_AS", 
      "Sentiment_Metric_SSM",
      "Demand_D_SSDF"
    ];

    const rows = validData.map(entry => [
      entry.time,
      entry.Ct,
      entry.IncidentDemand,
      entry.ResourceDemand,
      entry.ProductivityRate?.toFixed(4) || "0",
      entry.S?.toFixed(4) || "0",
      entry.CS?.toFixed(2) || "0",
      entry.AS?.toFixed(2) || "0",
      entry.SSM?.toFixed(4) || "0",
      entry.D?.toFixed(4) || "0"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const now = new Date();
    const ts = now.toISOString()
      .replace(/T/, '_')
      .replace(/:/g, '-')
      .split('.')[0];
    
    link.setAttribute("href", url);
    link.setAttribute("download", `archived_telemetry_batch_${ts}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 w-full mx-auto h-full overflow-y-auto pr-4 custom-scrollbar flex flex-col">
      <div className="flex items-center gap-4 shrink-0">
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
          <Database className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Telemetry (Hist)</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Archived Playback Matrix</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-8 shadow-xl flex flex-col items-start gap-3 shrink-0">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-indigo-400" />
          Global Scope Bound
        </h3>
        <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
          Data execution is bound to the parameters configured in the Data Scope view and rendered via the Dashboard playback engine. 
          Currently scoping {config.startDate?.toLocaleDateString()} to {config.endDate?.toLocaleDateString()} 
          with {config.channels.length === 0 ? "ALL" : config.channels.length} channel(s) and {config.queues.length === 0 ? "ALL" : config.queues.length} queue(s).
        </p>
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 glass rounded-[2rem] border-slate-800/50 overflow-hidden flex flex-col shadow-2xl glass-shine">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-4">
            <Calendar className="text-cyan-400 w-5 h-5" />
            <h3 className="font-black text-slate-200 uppercase tracking-[0.2em] text-xs">
              Archived Playback Metrics 
              <span className="text-slate-500 tracking-[0.2em] ml-2">// STREAM PROGRESS:</span>
              <span className="text-pink-400 ml-2 tracking-widest">{data.slice().reverse().find(e => e.Ct !== null)?.time || "--:--"}</span>
            </h3>
          </div>
          <button 
            onClick={exportToCSV}
            disabled={validData.length === 0}
            className="text-[10px] font-black text-slate-400 flex items-center gap-2 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all tracking-[0.2em] uppercase bg-white/5 px-4 py-2 rounded-xl border border-white/5"
          >
            <Download className="w-3.5 h-3.5" /> Data Export
          </button>
        </div>
        
        <div className="overflow-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-xs font-medium">
            <thead className="sticky top-0 bg-[#0f172a] text-slate-500 uppercase tracking-[0.2em] z-10 border-b border-white/5">
              <tr>
                <th className="px-8 py-2 border-b border-white/5"></th>
                <th colSpan={6} className="px-8 py-2 text-center text-[10px] font-black tracking-[0.3em] text-slate-400 border-b border-white/5 border-l border-white/5">EXTERNAL SIGNALS</th>
                <th colSpan={3} className="px-8 py-2 text-center text-[10px] font-black tracking-[0.3em] text-slate-400 border-b border-white/5 border-l border-white/10 bg-slate-900/40">INTERNAL SIGNALS</th>
              </tr>
              <tr>
                <th className="px-8 py-5 font-black shrink-0">Matrix TS</th>
                <th className="px-8 py-5 font-black text-rose-500/80 border-l border-white/5">Demand (D)</th>
                <th className="px-8 py-5 font-black text-blue-500/80">EXT Vol (Ct)</th>
                <th className="px-8 py-5 font-black text-violet-500/80">Stickiness (S)</th>
                <th className="px-8 py-5 font-black text-amber-500/80">Capture (CS)</th>
                <th className="px-8 py-5 font-black text-pink-500/80">Attention (AS)</th>
                <th className="px-8 py-5 font-black text-emerald-500/80">Sentiment (SSM)</th>
                <th className="px-8 py-5 font-black text-emerald-500/80 border-l border-white/10 bg-slate-900/40">INT Load (Pkgs)</th>
                <th className="px-8 py-5 font-black text-cyan-500/80 bg-slate-900/40">Resources (Minutes)</th>
                <th className="px-8 py-5 font-black text-purple-500/80 bg-slate-900/40">Productivity (Pkgs/Min)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {validData.map((entry, idx) => (
                <tr key={idx} className="hover:bg-cyan-500/5 transition-colors group">
                  <td className="px-8 py-4 text-slate-500 whitespace-nowrap">
                    {entry.time}
                  </td>
                  <td className="px-8 py-4 text-rose-500 font-black border-l border-white/5">
                    {entry.D?.toFixed(3) || "0.000"}
                  </td>
                  <td className="px-8 py-4 text-blue-400">
                    {entry.Ct?.toLocaleString() || "0"}
                  </td>
                  <td className="px-8 py-4 text-violet-400 font-bold">
                    {entry.S?.toFixed(3) || "0.000"}
                  </td>
                  <td className={`px-8 py-4 font-black ${entry.CS > 0 ? 'text-amber-400' : 'text-slate-800'}`}>
                    {entry.CS?.toFixed(1) || "0.0"}%
                  </td>
                  <td className={`px-8 py-4 font-black ${entry.AS > 0 ? 'text-pink-400' : 'text-slate-800'}`}>
                    {entry.AS?.toFixed(2) || "0.00"}
                  </td>
                  <td className={`px-8 py-4 font-black ${entry.SSM !== 0 ? 'text-emerald-400' : 'text-slate-800'}`}>
                    {entry.SSM?.toFixed(4) || "0.0000"}
                  </td>
                  <td className="px-8 py-4 text-emerald-400 border-l border-white/10 bg-slate-900/20">
                    {entry.IncidentDemand?.toLocaleString() || "0"}
                  </td>
                  <td className="px-8 py-4 text-cyan-400 bg-slate-900/20">
                    {entry.ResourceDemand?.toLocaleString() || "0"}
                  </td>
                  <td className="px-8 py-4 text-purple-400 font-black bg-slate-900/20">
                    {entry.ProductivityRate?.toFixed(3) || "0.000"}
                  </td>
                </tr>
              ))}
              {validData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-8 py-20 text-center text-slate-700 font-black uppercase tracking-[0.5em] text-xs">
                    Pending Dashboard Playback...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TelemetryHistView;
