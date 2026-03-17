import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Settings2, X, AlertTriangle, Save, Globe, Database } from 'lucide-react';

interface DataScopeProps {
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
  setConfig: React.Dispatch<React.SetStateAction<any>>;
}

const COMPANY_GAMES: Record<string, string[]> = {
  'Epic Games': ['Fortnite', 'Gears of War'],
  'Ubisoft': ["Assassin's Creed", 'Rainbow Six'],
  'EA': ['Apex Legends', 'FC 25'],
  'Activision': ['Call of Duty', 'Overwatch 2']
};


const ALL_CHANNELS = ["Ninja", "SypherPK", "Clix", "losgerardos", "tarik", "shroud", "kai_cenat", "xQc", "ibai", "tyler1", "jynxzi", "asmongold", "timthetatman", "auronplay", "nickmercs", "summit1g", "iiTzTimmy", "Pfpss", "LIRIK", "Rubius"];
const TOP_TAGS = ["English", "Esports", "Ranked", "Multiplayer", "FPS", "Shooter", "Action", "PlayingWithViewers", "PvP", "VTuber", "Competitive", "NoBackseatGaming", "Coop", "Gaming", "Controller", "Anime", "Console", "PC", "Chatting", "FamilyFriendly"];
const EXTERNAL_SOURCES = ["Twitch", "Discord", "YouTube Gaming", "Streams Charts"];

const MIN_DATA_DATE = new Date('2025-01-01T00:00:00-06:00');
const MAX_DATA_DATE = new Date('2026-02-28T23:59:59-06:00');

const DataScopeView: React.FC<DataScopeProps> = ({ config, setConfig }) => {
  const [localConfig, setLocalConfig] = React.useState(config);
  const [tagInput, setTagInput] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState("");
  const [channelInput, setChannelInput] = React.useState("");
  const [queueInput, setQueueInput] = React.useState("");
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [allQueues, setAllQueues] = React.useState<string[]>([]);

  React.useEffect(() => {
    fetch('/api/queues')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllQueues(data.sort());
        }
      })
      .catch(err => console.error("Error fetching queues:", err));
  }, []);

  const saveConfig = () => {
    const minT = MIN_DATA_DATE.getTime();
    const maxT = MAX_DATA_DATE.getTime();
    const badDate = (localConfig.startDate && (localConfig.startDate.getTime() < minT || localConfig.startDate.getTime() > maxT)) || 
                    (localConfig.endDate && (localConfig.endDate.getTime() > maxT));
    if (badDate) {
       setDateError("Error: Invalid Historical Bounds. Must be between Jan 2025 and Feb 2026.");
       return;
    }
    setDateError(null);
    setConfig(localConfig);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 max-w-4xl mx-auto h-full overflow-y-auto pr-4 custom-scrollbar">
      <div className="flex items-center gap-4 shrink-0">
        <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
          <Settings2 className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Data Scope</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Configure Global Parameters for Analysis & Archival Streams</p>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4 col-span-1 lg:col-span-2 border-b border-slate-800/50 pb-8">
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Time Viewport</label>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                      <DatePicker 
                        selected={localConfig.startDate} 
                        onChange={(date) => setLocalConfig({...localConfig, startDate: date})} 
                        selectsStart 
                        startDate={localConfig.startDate} 
                        endDate={localConfig.endDate} 
                        minDate={MIN_DATA_DATE}
                        maxDate={MAX_DATA_DATE}
                        showMonthDropdown showYearDropdown dropdownMode="select"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                    <span className="text-slate-500 font-bold text-xs uppercase">to</span>
                    <div className="flex-1 w-full">
                      <DatePicker 
                        selected={localConfig.endDate} 
                        onChange={(date) => setLocalConfig({...localConfig, endDate: date})} 
                        selectsEnd 
                        startDate={localConfig.startDate} 
                        endDate={localConfig.endDate} 
                        minDate={localConfig.startDate || MIN_DATA_DATE}
                        maxDate={MAX_DATA_DATE}
                        showMonthDropdown showYearDropdown dropdownMode="select"
                        className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Entity (Company)</label>
                    <select
                      value={localConfig.company}
                      onChange={(e) => {
                        const newCompany = e.target.value;
                        const defaultGame = COMPANY_GAMES[newCompany][0];
                        setLocalConfig({ ...localConfig, company: newCompany, game: defaultGame });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors font-bold appearance-none"
                    >
                      {Object.keys(COMPANY_GAMES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Asset (Game)</label>
                    <select
                      value={localConfig.game}
                      onChange={(e) => setLocalConfig({ ...localConfig, game: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors font-bold appearance-none"
                    >
                      {COMPANY_GAMES[localConfig.company].map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </div>

            {/* Left Column: External */}
            <div className="space-y-6 lg:pr-6">
              <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4" /> External Signal Constraints
              </h3>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">External Data Source</label>
                <select
                  value={localConfig.source || "Twitch"}
                  onChange={(e) => setLocalConfig({...localConfig, source: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors font-bold appearance-none"
                >
                  {EXTERNAL_SOURCES.map(source => (
                     <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">External Channels</label>
                {localConfig.channels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {localConfig.channels.map(ch => (
                      <span key={ch} className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/20">
                        {ch}
                        <button onClick={() => setLocalConfig({...localConfig, channels: localConfig.channels.filter(c => c !== ch)})} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <select 
                  value={channelInput} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !localConfig.channels.includes(val)) {
                      setLocalConfig({...localConfig, channels: [...localConfig.channels, val]});
                    }
                    setChannelInput("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                >
                  <option value="">Select Channel to track...</option>
                  {ALL_CHANNELS.map(ch => (
                    <option key={ch} value={ch} disabled={localConfig.channels.includes(ch)}>{ch}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">External Tags</label>
                {localConfig.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {localConfig.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30">
                        {tag}
                        <button onClick={() => setLocalConfig({...localConfig, tags: localConfig.tags.filter(t => t !== tag)})} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <select 
                    value={selectedTag} 
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !localConfig.tags.includes(val)) {
                        setLocalConfig({...localConfig, tags: [...localConfig.tags, val]});
                      }
                      setSelectedTag("");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                  >
                    <option value="">Select Popular Tag...</option>
                    {TOP_TAGS.map(tag => (
                      <option key={tag} value={tag} disabled={localConfig.tags.includes(tag)}>{tag}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="Or type custom tag & press Enter..." 
                    className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        if (!localConfig.tags.includes(tagInput.trim())) {
                          setLocalConfig({...localConfig, tags: [...localConfig.tags, tagInput.trim()]});
                        }
                        setTagInput("");
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Internal */}
            <div className="space-y-6 lg:pl-6 lg:border-l lg:border-slate-800">
               <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2 mb-4">
                <Database className="w-4 h-4" /> Internal Signal Constraints
               </h3>
               
               <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Internal Source Queues</label>
                {localConfig.queues.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {localConfig.queues.map(q => (
                      <span key={q} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                        {q}
                        <button onClick={() => setLocalConfig({...localConfig, queues: localConfig.queues.filter(x => x !== q)})} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}
                <select 
                  value={queueInput} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !localConfig.queues.includes(val)) {
                      setLocalConfig({...localConfig, queues: [...localConfig.queues, val]});
                    }
                    setQueueInput("");
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                >
                  <option value="">Select Internal Queues to track (Empty = ALL)...</option>
                  {allQueues.map((q, i) => (
                    <option key={q} value={q} disabled={localConfig.queues.includes(q)}>{i + 1}. {q}</option>
                  ))}
                </select>
              </div>
            </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center pt-4 space-y-4">
        {dateError && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {dateError}</div>}
        <button 
          onClick={saveConfig}
          className="px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_4px_30px_rgba(139,92,246,0.5)] flex items-center gap-3">
             <Save className="w-5 h-5" /> Apply Global Selection
        </button>
      </div>

    </div>
  );
};

export default DataScopeView;
