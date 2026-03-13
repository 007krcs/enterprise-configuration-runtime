import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import '@testing-library/jest-dom';

function ThrowingComponent({ error }: { error: Error }): React.ReactElement {
  throw error;
}

function GoodComponent(): React.ReactElement {
  return <div>Working content</div>;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Working content')).toBeInTheDocument();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error('Test crash')} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test crash')).toBeInTheDocument();
  });

  it('uses custom fallbackTitle when provided', () => {
    render(
      <ErrorBoundary fallbackTitle="Builder failed to load">
        <ThrowingComponent error={new Error('fatal')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Builder failed to load')).toBeInTheDocument();
  });

  it('recovers when Try Again is clicked', () => {
    let shouldThrow = true;

    function ConditionalThrow() {
      if (shouldThrow) throw new Error('boom');
      return <div>Recovered</div>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('shows a Reload Page button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent error={new Error('crash')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });
});
