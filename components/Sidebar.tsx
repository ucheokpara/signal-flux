import React from "react";
import { CollectionConfig, GamingCompany, AppView, AuthenticatedUser } from "../types";
import {
  Zap,
  Building2,
  Play,
  Square,
  LayoutDashboard,
  Database,
  Settings,
  ShieldCheck,
  AlertCircle,
  Activity,
  Signal,
  FolderArchive,
  BarChart4,
  LayoutGrid,
  MapPin,
  Clock,
  LineChart,
  TrendingDown,
  LogOut
} from "lucide-react";

interface SidebarProps {
  config: CollectionConfig;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onConfigChange: (updates: Partial<CollectionConfig>) => void;
  companyGames: Record<GamingCompany, string[]>;
  isExtSimulating?: boolean;
  authUser: AuthenticatedUser;
  onLogout: () => void;
}

interface NavItemProps {
  view: AppView;
  icon: any;
  label: string;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const NavItem: React.FC<NavItemProps> = ({
  view,
  icon: Icon,
  label,
  currentView,
  onViewChange,
}) => (
  <button
    onClick={() => onViewChange(view)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden border ${
      currentView === view
        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
        : "border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/5"
    }`}
  >
    <div
      className={`absolute inset-0 bg-cyan-400/5 translate-x-[-100%] transition-transform duration-500 pointer-events-none ${currentView === view ? "translate-x-0" : "group-hover:translate-x-0"}`}
    />
    <Icon
      className={`w-5 h-5 relative z-10 transition-transform duration-300 ${currentView === view ? "scale-110" : "group-hover:scale-110"}`}
    />
    <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
      {label}
    </span>
    {currentView === view && (
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-l-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
    )}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({
  config,
  currentView,
  onViewChange,
  onConfigChange,
  companyGames,
  isExtSimulating,
  authUser,
  onLogout,
}) => {
  const companies: GamingCompany[] = [
    "Epic Games",
    "Ubisoft",
    "EA",
    "Activision",
  ];

  const isExtConnected = Object.values(config.sourceAuthStatus || {}).some(status => status === 'Connected');

  return (
    <div className="w-72 h-full flex flex-col bg-[#0f172a] border-r border-white/5 p-6 overflow-y-auto custom-scrollbar relative z-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10 pl-2">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] glass-shine">
          <Zap className="text-cyan-400 w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none">
            SIGNAL FLUX
          </h1>
          <p className="text-[9px] text-cyan-500/60 font-black uppercase tracking-[0.3em] mt-1">
            SSDF Engine
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2 mb-10 flex-1">
        <h2 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 pl-4">
          Real-Time
        </h2>
        <NavItem
          view="dashboard"
          icon={LayoutDashboard}
          label="Dashboard (Live)"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="telemetry"
          icon={Database}
          label="Telemetry (Live)"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="settings"
          icon={Settings}
          label="System Core"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <h2 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 pl-4 pt-4 border-t border-white/5">
          Archived
        </h2>
        <NavItem
          view="historical-selection"
          icon={MapPin}
          label="Data Scope"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="archived-telemetry"
          icon={LayoutDashboard}
          label="Dashboard (Hist)"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="batch-telemetry"
          icon={Database}
          label="Telemetry (Hist)"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="ingestion"
          icon={Database}
          label="Query Editor"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <h2 className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 pl-4 pt-4 border-t border-white/5">
          Use Cases
        </h2>
        <NavItem
          view="analysis-lag"
          icon={Clock}
          label="Lag Correlation"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="analysis-toxicity"
          icon={TrendingDown}
          label="Toxicity Profile"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="analysis-anomaly"
          icon={Activity}
          label="Anomalies"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="analysis-decay"
          icon={LineChart}
          label="Decay Profiling"
          currentView={currentView}
          onViewChange={onViewChange}
        />
        <NavItem
          view="analysis-redline"
          icon={ShieldCheck}
          label="System Redline"
          currentView={currentView}
          onViewChange={onViewChange}
        />
      </nav>

      {/* Footer Controls - Signal Monitor */}
      <div className="space-y-4 mt-auto pt-6 border-t border-white/5">
        <div className="grid grid-cols-2 gap-2">
          {/* External Signal Status */}
          <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-colors bg-slate-900/50 border-slate-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Signal className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                EXT
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Live */}
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isExtConnected ? (isExtSimulating ? "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)] animate-pulse" : "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] animate-pulse") : "bg-rose-500"}`} />
                <span className={`text-[8px] font-bold uppercase tracking-wider ${isExtConnected ? (isExtSimulating ? "text-amber-500" : "text-emerald-400") : "text-rose-500"}`}>
                  {isExtSimulating ? "DEMO" : "LIVE"}
                </span>
              </div>
              {/* Arch */}
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                  ARCH
                </span>
              </div>
            </div>
          </div>

          {/* Internal Signal Status */}
          <div className="flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition-colors bg-slate-900/50 border-slate-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">
                INT
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Live */}
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-rose-500">
                  LIVE
                </span>
              </div>
              {/* Arch */}
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                  ARCH
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-white/5 group hover:border-white/10 transition-colors mt-2">
          <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-inner text-xs">
            {authUser.firstName[0]}{authUser.lastName[0]}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-white text-sm font-semibold truncate leading-tight">
              {authUser.title} {authUser.firstName} {authUser.lastName}
            </span>
            <span className="text-cyan-400 text-[10px] font-mono truncate mt-0.5">
              {authUser.position}
            </span>
          </div>
          <div className="w-px h-6 bg-white/10 mx-1 shrink-0"></div>
          <button 
            onClick={onLogout}
            className="w-8 h-8 shrink-0 rounded-full bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-slate-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
