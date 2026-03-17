import React, { useState } from 'react';
import { Database, Play, AlertCircle, Loader2 } from 'lucide-react';

const QueryEditorView: React.FC = () => {
  const [query, setQuery] = useState('SELECT * FROM historical_data LIMIT 50;');
  const [results, setResults] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceSelected, setSourceSelected] = useState('twitch');

  React.useEffect(() => {
    if (sourceSelected === 'twitch') {
      setQuery('SELECT * FROM historical_data LIMIT 50;');
    } else if (sourceSelected === 'internal') {
      setQuery('SELECT * FROM internal_historical LIMIT 50;');
    } else if (sourceSelected === 'both') {
      setQuery(`SELECT e.timestamp, e.viewer_count, i.packages, i.source_queue
FROM historical_data e
JOIN internal_db.internal_historical i ON e.timestamp = i.timestamp
LIMIT 50;`);
    }
  }, [sourceSelected]);

  const executeQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const response = await fetch('/api/query-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, source: sourceSelected }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute query');
      }
      
      if (data.results && data.results.length > 0) {
        setColumns(Object.keys(data.results[0]));
        setResults(data.results);
      } else {
        setResults([]);
        setColumns([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-cyan-400" />
            HISTORICAL DATA VIEWER
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Directly query the synthesized SSDF historical lake. By default, this connects to the Twitch external simulation database adhering strictly to Section 4.1 Schema definitions.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3 bg-slate-900/80 border border-slate-700 p-2 pl-4 rounded-xl">
          <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Data Source</span>
          <select 
            value={sourceSelected}
            onChange={(e) => setSourceSelected(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-cyan-400 text-xs font-bold rounded-lg p-2 outline-none">
            <option value="twitch">Twitch Historical (.db)</option>
            <option value="internal">Epic Games Internal (.db)</option>
            <option value="both">All Historical Joined (.db)</option>
            <option value="youtube" disabled>YouTube Gaming (Not Configured)</option>
          </select>
        </div>
      </div>

      {/* Query Editor */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden glass-shine relative shadow-2xl">
        <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">SQLite Query Executor</h3>
          <button 
            onClick={executeQuery}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 hover:-translate-y-0.5 transition-all text-xs font-bold border border-cyan-500/30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            RUN QUERY
          </button>
        </div>
        <div className="p-1">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-32 bg-transparent text-emerald-400 p-4 font-mono text-sm outline-none resize-none custom-scrollbar"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Results Table */}
      <div className="flex-1 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-auto glass-shine relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
             <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        )}
        
        {results && results.length === 0 && !loading && (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-10 text-center">
             <Database className="w-12 h-12 text-slate-700 mb-4 opacity-50" />
             <p className="text-sm font-bold uppercase tracking-widest">0 Rows Returned</p>
           </div>
        )}

        {results && results.length > 0 && (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#0f172a] shadow-md z-1">
              <tr>
                {columns.map(col => (
                  <th key={col} className="p-4 font-black uppercase tracking-wider text-slate-400 border-b border-white/5 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {results.map((row, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  {columns.map(col => (
                    <td key={col} className="p-4 text-slate-300 font-medium whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                      {row[col] === null ? <span className="text-slate-600 italic">null</span> : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default QueryEditorView;
