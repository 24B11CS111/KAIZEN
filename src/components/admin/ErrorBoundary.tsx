"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary caught an error in ${this.props.name || "a component"}:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center border border-blood-500/30 bg-blood-500/10 rounded-2xl">
          <AlertTriangle className="h-8 w-8 text-blood-500 mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">{this.props.name || "Component"} Failed</h3>
          <p className="text-white/50 text-xs max-w-sm mb-4">
            A rendering error occurred in this module.
          </p>
          <div className="text-[10px] text-red-400 font-mono text-left bg-black/50 p-3 rounded-lg overflow-auto w-full max-h-32">
            {this.state.error?.message}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
          >
            Retry Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
