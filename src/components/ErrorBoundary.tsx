import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  public props!: Props;
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an operational exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl border border-rose-950/40 bg-rose-950/10 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-950/30 flex items-center justify-center border border-rose-500/20 text-rose-400">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold tracking-tight text-slate-200">
              {this.props.fallbackTitle || "Component Telemetry Halted"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              AegisAI caught an internal rendering error. Active guardrails prevented a full system crash.
            </p>
            {this.state.error && (
              <pre className="text-[10px] font-mono text-rose-300 bg-rose-950/30 p-2 rounded-lg max-w-full overflow-x-auto select-all max-h-24 mt-2">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono transition-all border border-rose-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Telemetry</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
