import React from 'react';
import { RefreshCw, AlertOctagon } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
    // In production, you would report this to Sentry using:
    // Sentry.captureException(error, { extra: errorInfo });
    this.setState({ errorInfo });
  }

  handleReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-surface-container p-6 text-on-surface">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-white p-8 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Application Render Error</h2>
                <p className="text-sm text-on-surface-variant">A client-side runtime exception has occurred.</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-surface-container p-4 font-mono text-xs text-red-600 overflow-auto max-h-40 border border-outline-variant/50">
              <p className="font-bold">{this.state.error?.toString()}</p>
              {this.state.errorInfo?.componentStack && (
                <pre className="mt-2 text-[10px] text-on-surface-variant">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-on-surface hover:bg-red-400 focus:outline-none"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="rounded-lg border border-outline px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high focus:outline-none"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
