import React from 'react';
import { LogEntry, DataSource } from '../types';
import { Database, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface DataTableProps {
  data: LogEntry[];
  source: DataSource;
}

const DataTable: React.FC<DataTableProps> = ({ data, source }) => {
  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = [
      "Timestamp", 
      "Asset_Name", 
      "Entity_Name", 
      "External_Source", 
      "Demand_D_SSDF", 
      "Concurrent_Metrics_Ct", 
      "V_Peak", 
      "V_Total", 
      "Stickiness_S", 
      "Capture_Score_CS", 
      "Attention_Score_AS", 
      "Sentiment_Metric_SSM",
      "Is_Simulation"
    ];

    const rows = data.map(entry => [
      entry.timestamp,
      `"${entry.game_name}"`,
      `"${entry.company}"`,
      `"${entry.source}"`,
      entry.D.toFixed(4),
      entry.total_metrics,
      entry.peak_metric_count,
      entry.v_total,
      entry.S.toFixed(4),
      entry.CS.toFixed(2),
      entry.AS.toFixed(2),
      entry.SSM.toFixed(4),
      entry.is_simulation
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
    link.setAttribute("download", `signal_flux_${ts}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass rounded-[2rem] border-slate-800/50 overflow-hidden flex flex-col h-[650px] shadow-2xl glass-shine">
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
        <div className="flex items-center gap-4">
          <Database className="text-cyan-400 w-5 h-5" />
          <h3 className="font-black text-slate-200 uppercase tracking-[0.2em] text-xs">Telemetry Flux Logs</h3>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={data.length === 0}
          className="text-[10px] font-black text-slate-400 flex items-center gap-2 hover:text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all tracking-[0.2em] uppercase bg-white/5 px-4 py-2 rounded-xl border border-white/5"
        >
          <Download className="w-3.5 h-3.5" /> Data Export
        </button>
      </div>
      
      <div className="overflow-auto custom-scrollbar flex-1">
        <table className="w-full text-left text-xs font-medium">
          <thead className="sticky top-0 bg-[#0f172a] text-slate-500 uppercase tracking-[0.2em] z-10 border-b border-white/5">
            <tr>
              <th className="px-8 py-5 font-black">Matrix TS</th>
              <th className="px-8 py-5 font-black">External Source</th>
              <th className="px-8 py-5 font-black text-rose-500/80">Demand (D)</th>
              <th className="px-8 py-5 font-black">Metrics (Ct)</th>
              <th className="px-8 py-5 font-black text-emerald-500/80">Stickiness (S)</th>
              <th className="px-8 py-5 font-black">Capture (CS)</th>
              <th className="px-8 py-5 font-black text-amber-500/80">Attention (AS)</th>
              <th className="px-8 py-5 font-black text-indigo-500/80">Sentiment (SSM)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono">
            {data.slice().reverse().map((entry, idx) => {
              const d = new Date(entry.timestamp);
              const formattedTime = isNaN(d.getTime()) ? entry.timestamp : d.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
              
              return (
                <tr key={idx} className="hover:bg-cyan-500/5 transition-colors group">
                  <td className="px-8 py-4 text-slate-500 whitespace-nowrap">
                    {formattedTime}
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${entry.is_simulation ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                        {entry.is_simulation ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      </span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{entry.source}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-rose-500 font-black">
                    {entry.D.toFixed(3)}
                  </td>
                  <td className="px-8 py-4 text-slate-200">
                    {entry.total_metrics.toLocaleString()}
                  </td>
                  <td className="px-8 py-4 text-emerald-400 font-bold">
                    {entry.S.toFixed(3)}
                  </td>
                  <td className={`px-8 py-4 font-black ${entry.CS > 0 ? 'text-cyan-400' : 'text-slate-800'}`}>
                    {entry.CS.toFixed(1)}%
                  </td>
                  <td className={`px-8 py-4 font-black ${entry.AS > 0 ? 'text-amber-400' : 'text-slate-800'}`}>
                    {entry.AS.toFixed(2)}
                  </td>
                  <td className={`px-8 py-4 font-black ${entry.SSM !== 0 ? 'text-indigo-400' : 'text-slate-800'}`}>
                    {entry.SSM.toFixed(4)}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-8 py-20 text-center text-slate-700 font-black uppercase tracking-[0.5em] text-xs">
                  Awaiting Telemetry Feed Node...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;