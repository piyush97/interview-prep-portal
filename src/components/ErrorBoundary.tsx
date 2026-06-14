import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console for debugging — production deployments can swap this for Sentry/etc.
    console.error("Uncaught error:", error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-red-200 p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-1">The portal hit an unexpected error.</p>
            <p className="text-xs text-slate-500 mb-4 font-mono bg-slate-50 p-2 rounded break-words">
              {this.state.error?.message || "Unknown error"}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
