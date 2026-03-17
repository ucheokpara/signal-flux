import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen w-full bg-[#020617] text-white p-6 font-mono">
          <div className="bg-rose-950/20 border border-rose-500/30 p-8 rounded-2xl max-w-3xl w-full shadow-[0_0_50px_rgba(225,29,72,0.1)]">
            <div className="flex flex-col items-center mb-6 border-b border-rose-500/20 pb-6">
              <div className="p-4 bg-rose-500/10 rounded-full mb-4">
                <AlertTriangle className="w-12 h-12 text-rose-500" />
              </div>
              <h1 className="text-2xl font-black uppercase tracking-widest text-rose-500 text-center">Fatal Module Exception</h1>
              <p className="text-slate-400 mt-2 text-sm text-center">The React component tree encountered a fatal rendering unmount. State preserved.</p>
            </div>
            
            <div className="mb-6 space-y-4">
              <div className="bg-[#0b1120] p-4 rounded-xl border border-white/5 overflow-x-auto text-[11px] text-rose-300 whitespace-pre-wrap font-bold">
                {this.state.error && this.state.error.toString()}
              </div>
              <details className="bg-[#0b1120] p-4 rounded-xl border border-white/5 text-[10px] text-slate-500 whitespace-pre-wrap cursor-pointer group">
                  <summary className="font-bold uppercase tracking-widest mb-2 text-slate-400 group-hover:text-cyan-400 transition-colors">View Component Stack Trace</summary>
                  <div className="mt-4 pt-4 border-t border-white/5 opacity-80 leading-relaxed">
                    {this.state.errorInfo?.componentStack}
                  </div>
              </details>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all"
            >
              <RefreshCcw className="w-4 h-4" /> Hard Reset Environment
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
