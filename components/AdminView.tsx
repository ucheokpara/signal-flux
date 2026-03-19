import React, { useState, useEffect } from 'react';
import { AuthenticatedUser } from '../types';
import { collection, query, orderBy, limit, getDocs, onSnapshot, addDoc, updateDoc, doc, where, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { ShieldCheck, Database, FileText, Search, Activity, Bot, Send, Users, UserPlus, Sparkles } from 'lucide-react';
import { agentFluxChat } from '../services/geminiService';

interface AdminViewProps {
  authUser: AuthenticatedUser;
}

const AdminView: React.FC<AdminViewProps> = ({ authUser }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [elevateEmail, setElevateEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isAgentThinking]);

  useEffect(() => {
    if (!db || authUser.role !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(150));
    
    // Subscribe to live updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(liveLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authUser.role]);

  if (authUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-rose-500 font-black tracking-widest uppercase">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4" />
          Insufficient Clearance
        </div>
      </div>
    );
  }

  const handleElevateUser = async () => {
    if (!elevateEmail.trim()) return;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', elevateEmail.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("User not found via Email in database.");
        return;
      }
      const userDoc = snap.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), { role: 'admin' });
      alert(`Successfully elevated ${elevateEmail} to Admin!`);
      setElevateEmail('');
    } catch (e) {
      console.error(e);
      alert("Failed to elevate. Ensure Firebase rules allow updates.");
    }
  };

  const generateSyntheticData = async () => {
    setIsGenerating(true);
    const syntheticUsers = [
      { email: 'sarah.connors@apexsystems.com', action: 'REPORT_GENERATED', details: 'Generated Anomaly Report for EA' },
      { email: 'm.kusanagi@section9.gov', action: 'LOGIN', details: 'Authenticated successfully' },
      { email: 'j.wick@continental.com', action: 'DATA_SCOPE_CHANGED', details: 'Shifted query focus to Ubisoft' },
      { email: 's.samurai@nightcity.io', action: 'TELEMETRY_EXECUTED', details: 'Executed Live Ext-Node telemetry' },
      { email: 'sarah.connors@apexsystems.com', action: 'USE_CASE_VIEWED', details: 'Navigated to analysis-toxicity' },
      { email: 'j.wick@continental.com', action: 'LOGOUT', details: 'Session terminated' },
      { email: 'a.jensen@sarif.com', action: 'SIMULATION_EXECUTED', details: 'Ran Redline Sandbox profile' },
      { email: 'v.silverhand@samurai.rock', action: 'REPORT_DOWNLOADED', details: 'Downloaded PDF summary' },
      { email: 'admin.root@sys.net', action: 'LOGIN', details: 'Authenticated successfully' },
      { email: 'm.kusanagi@section9.gov', action: 'USE_CASE_VIEWED', details: 'Navigated to settings core' },
    ];

    try {
      const auditRef = collection(db, 'audit_logs');
      const now = Date.now();
      
      for (let i = 0; i < 75; i++) {
        // Distribute over the last 15 days
        const randomDaysAgo = Math.random() * 15;
        const pastTimestamp = now - (randomDaysAgo * 24 * 60 * 60 * 1000);
        const randUser = syntheticUsers[Math.floor(Math.random() * syntheticUsers.length)];
        
        await addDoc(auditRef, {
          userId: `synthetic_${Math.floor(Math.random()*1000)}`,
          email: randUser.email,
          firstName: randUser.email.split('@')[0],
          lastName: 'Synthetic',
          role: 'user',
          action: randUser.action,
          details: randUser.details,
          timestamp: Timestamp.fromMillis(pastTimestamp)
        });
      }
    } catch (e) {
      console.error("Synthetic generation failed:", e);
    }
    setIsGenerating(false);
  };

  const handleSendPrompt = async () => {
    if (!inputText.trim() || isAgentThinking || !authUser) return;
    
    const userMsg = { role: 'user', content: inputText.trim() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputText('');
    setIsAgentThinking(true);
    
    // Compress context to avoid token bloat
    const contextLogs = logs.slice(0, 75).map(l => ({ 
        action: l.action, 
        email: l.email, 
        time: l.timestamp?.toDate ? new Date(l.timestamp.toDate()).toLocaleTimeString() : 'now', 
        details: l.details || '' 
    }));
    
    const sysInstruction = `You are Agent Flux, an elite administrative AI embedded securely in the Signal Flux Telemetry Engine. 
You are tasked with analyzing the following real-time audit log stream for security anomalies, adoption trends, and operational health: 

[RECENT AUDIT LOGS]:
${JSON.stringify(contextLogs)}

Respond directly to the Administrator concisely and strictly in character. If the logs lack information to answer the precise query, deduce the likelihoods or explain what is tracked currently. Format with pristine markdown headers, lists, and spacing where necessary.`;
    
    const reply = await agentFluxChat(chatHistory, sysInstruction, userMsg.content);
    
    setChatHistory(prev => [...prev, { role: 'flux', content: reply }]);
    setIsAgentThinking(false);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tighter text-white">ADMINISTRATIVE CORE</h2>
          <p className="text-cyan-400 text-xs font-black tracking-[0.2em] uppercase mt-1">
            Global Audit Surveillance & Agent Flux
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-white/5 p-1 rounded-xl">
            <input 
              type="email" 
              placeholder="Target User Email..."
              value={elevateEmail}
              onChange={e => setElevateEmail(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] text-white px-3 py-1.5 w-40 placeholder:text-slate-600"
            />
            <button 
              onClick={handleElevateUser}
              className="flex items-center gap-1.5 bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <UserPlus className="w-3 h-3" />
              Elevate
            </button>
          </div>
          
          <button 
            onClick={generateSyntheticData}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Synthesizing...' : 'Generate Sandbox Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl p-6 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Event Matrix</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="text-center text-slate-500 py-10 animate-pulse">Establishing Audit Connection...</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold tracking-wider uppercase">
                    <th className="pb-3 font-medium px-4">Timestamp</th>
                    <th className="pb-3 font-medium px-4">User</th>
                    <th className="pb-3 font-medium px-4">Action</th>
                    <th className="pb-3 font-medium px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                         {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-cyan-400">
                         {log.email}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold tracking-wider">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 truncate max-w-[200px]" title={log.details}>
                         {log.details || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.05)] rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-black text-white tracking-widest uppercase">Agent Flux (LLM)</h3>
          </div>
          <div className="flex-1 border border-white/5 rounded-xl bg-black/20 p-4 overflow-y-auto mb-4 custom-scrollbar flex flex-col gap-4">
             {chatHistory.length === 0 ? (
               <div className="text-center text-slate-500 italic text-xs mt-auto">Agent Flux is online. Awaiting directive.</div>
             ) : (
               chatHistory.map((msg, i) => (
                 <div key={i} className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1 px-1">
                     {msg.role === 'user' ? 'Admin' : 'Agent Flux'}
                   </span>
                   <div className={`text-sm px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-tr-sm' : 'bg-slate-800/80 text-slate-300 border border-white/10 rounded-tl-sm'}`}>
                     {msg.content}
                   </div>
                 </div>
               ))
             )}
             {isAgentThinking && (
               <div className="self-start text-[10px] text-cyan-500/60 font-bold uppercase tracking-[0.2em] animate-pulse my-2">
                 Analyzing Telemetry...
               </div>
             )}
             <div ref={chatEndRef} />
          </div>
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
              placeholder="Ask Agent Flux about user activity..."
              className="w-full bg-slate-800 border border-white/5 rounded-lg pl-4 pr-12 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              disabled={isAgentThinking}
            />
            <button 
              onClick={handleSendPrompt}
              disabled={isAgentThinking || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
