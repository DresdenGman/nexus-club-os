import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';

      return (
        <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans text-[#141414]">
          <div className="max-w-xl w-full border-4 border-[#141414] bg-white p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h1 className="font-serif italic text-3xl mb-4 text-[#FF4400]">System Error</h1>
            <div className="font-mono text-sm mb-6 p-4 bg-[#141414] text-[#E4E3E0] overflow-auto">
              <p>{errorMessage}</p>
            </div>
            <button
              className="bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase font-bold px-6 py-3 hover:bg-[#FF4400] transition-colors"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Reload & Continue
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
