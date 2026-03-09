import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BuilderWorkspaceLayout } from '../src/components/BuilderWorkspaceLayout';

vi.mock('next/navigation', () => ({
  usePathname: () => '/builder/screens',
}));

describe('BuilderWorkspaceLayout', () => {
  it('renders navigation rail and workspace content', () => {
    render(
      <BuilderWorkspaceLayout>
        <div>Workspace body</div>
      </BuilderWorkspaceLayout>,
    );

    expect(screen.getByTestId('builder-shell')).toBeInTheDocument();
    expect(screen.getByLabelText('Builder workspaces')).toBeInTheDocument();
    expect(screen.getByText('Workspace body')).toBeInTheDocument();
  });

  it('highlights the active nav item based on pathname', () => {
    render(
      <BuilderWorkspaceLayout>
        <div>Content</div>
      </BuilderWorkspaceLayout>,
    );

    const screensLink = screen.getByTitle('Layout editor');
    expect(screensLink).toHaveAttribute('aria-current', 'page');
  });
});
