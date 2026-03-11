'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? 'Something went wrong';
      return (
        <div
          role="alert"
          style={{
            padding: 'var(--ecr-spacing-6, 24px)',
            maxWidth: 560,
            margin: '48px auto',
            fontFamily: 'var(--ecr-font-sans, system-ui, sans-serif)',
          }}
        >
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 'var(--ecr-font-size-lg, 1.125rem)',
              fontWeight: 600,
              color: 'var(--ecr-color-text-strong, #020617)',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: 'var(--ecr-font-size-sm, 0.875rem)',
              color: 'var(--ecr-color-text-secondary, #334155)',
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred in this workspace. You can try resetting the view or reloading
            the page. Your configuration data is preserved in browser storage.
          </p>
          {this.state.error && (
            <pre
              style={{
                margin: '0 0 16px',
                padding: '12px 16px',
                fontSize: 'var(--ecr-font-size-xs, 0.75rem)',
                fontFamily: 'var(--ecr-font-mono, monospace)',
                background: 'var(--ecr-color-surface-inset, #f1f5f9)',
                borderRadius: 'var(--ecr-radius-md, 8px)',
                color: 'var(--ecr-color-danger, #dc2626)',
                overflow: 'auto',
                maxHeight: 160,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={this.handleReset}
              style={{
                padding: '8px 16px',
                fontSize: 'var(--ecr-font-size-sm, 0.875rem)',
                fontWeight: 500,
                color: '#fff',
                background: 'var(--ecr-color-primary, #2563eb)',
                border: 'none',
                borderRadius: 'var(--ecr-radius-md, 8px)',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                fontSize: 'var(--ecr-font-size-sm, 0.875rem)',
                fontWeight: 500,
                color: 'var(--ecr-color-text-secondary, #334155)',
                background: 'var(--ecr-color-surface-raised, #fff)',
                border: '1px solid var(--ecr-color-border, #e2e8f0)',
                borderRadius: 'var(--ecr-radius-md, 8px)',
                cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
