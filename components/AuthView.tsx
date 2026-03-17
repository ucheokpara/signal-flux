import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Mail, User, Briefcase, Lock } from 'lucide-react';
import { AuthenticatedUser } from '../types';

interface AuthViewProps {
  onLogin: (user: AuthenticatedUser) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  const [title, setTitle] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    
    const usersRaw = localStorage.getItem('flux_users_db');
    const db = usersRaw ? JSON.parse(usersRaw) : [];

    if (isLoginMode) {
      // Login Flow
      const user = db.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        setError('Invalid email or password. Please try again or create a profile.');
        return;
      }
      
      const { password: _, ...userContext } = user;
      localStorage.setItem('flux_auth_user', JSON.stringify(userContext));
      onLogin(userContext);

    } else {
      // Create Profile Flow
      if (!firstName || !lastName || !position) {
        setError('All identity fields are required to create a profile.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (db.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
        setError('This email is already registered. Please sign in.');
        return;
      }
      
      const newUser = {
         title,
         firstName,
         lastName,
         position,
         email,
         password
      };
      
      db.push(newUser);
      localStorage.setItem('flux_users_db', JSON.stringify(db));
      
      const { password: _, ...userContext } = newUser;
      localStorage.setItem('flux_auth_user', JSON.stringify(userContext));
      onLogin(userContext as AuthenticatedUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 bg-grid opacity-50"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] pointer-events-none z-0"></div>
      
      <div className="max-w-md w-full bg-[#0f172a] border border-white/5 shadow-2xl rounded-2xl p-8 relative overflow-hidden z-10">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">
           {isLoginMode ? 'Access Signal Flux' : 'Initialize Profile'}
        </h2>
        <p className="text-slate-400 text-center text-sm mb-8">
           {isLoginMode ? 'Sign in to access the SSDF Telemetry Engine.' : 'Create a secure identity to initialize Agent Flux.'}
        </p>
        
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm px-4 py-3 rounded-xl flex items-center gap-3">
             <ShieldAlert className="w-5 h-5 shrink-0" />
             <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
           {/* Profile Generation Fields (Hidden during Login) */}
           {!isLoginMode && (
              <>
                 <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => {
                        setTitle('Mr.');
                        setFirstName('John');
                        setLastName('Doe');
                        setPosition('Data Scientist');
                        setEmail('johndoe@email.com');
                        setPassword('password123456');
                    }} className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                       <User className="w-3 h-3" /> Load Default Profile
                    </button>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-1/3">
                       <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Title</label>
                       <select value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 appearance-none">
                          <option value="" disabled>Select</option>
                          <option value="Mr.">Mr.</option>
                          <option value="Mrs.">Mrs.</option>
                          <option value="Ms.">Ms.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Prof.">Prof.</option>
                       </select>
                    </div>
                    <div className="w-2/3">
                       <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">First Name</label>
                       <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-slate-600" placeholder="e.g. Uche" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Last Name</label>
                    <div className="relative">
                       <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-slate-600" placeholder="e.g. Okpara" />
                       <User className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Position</label>
                    <div className="relative">
                       <input type="text" value={position} onChange={e=>setPosition(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-slate-600" placeholder="e.g. Chief AI Officer" />
                       <Briefcase className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                    </div>
                 </div>
              </>
           )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                 <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-slate-600" placeholder="e.g. uche@domain.com" />
                 <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              </div>
           </div>

           <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                 <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-slate-600" placeholder="••••••••" />
                 <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              </div>
           </div>

           <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-4">
              <ShieldCheck className="w-4 h-4" />
              {isLoginMode ? 'Authenticate' : 'Create Profile & Connect'}
           </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <button 
               type="button" 
               onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} 
               className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
               {isLoginMode ? "First time? Initialize a new profile" : "Already have a profile? Sign in here"}
            </button>
        </div>
      </div>
    </div>
  );
};
