'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { BuilderProvider, type BuilderPaletteEntry } from './BuilderContext';
import { BuilderWorkspaceLayout } from './BuilderWorkspaceLayout';
import { getBuilderComponentCatalog, loadBuilderPlugins } from '../lib/plugin-host';
import { summarizeBuilderWorkspace } from '../lib/builder-modules';
import { createInitialBuilderFlowState } from '../lib/flow-engine';

export function BuilderLayoutClient({ children }: { children: ReactNode }) {
  const initialFlowState = useMemo(() => createInitialBuilderFlowState(), []);
  const [componentContracts, setComponentContracts] = useState(() => getBuilderComponentCatalog());

  useEffect(() => {
    let active = true;
    void loadBuilderPlugins().then(() => {
      if (!active) return;
      setComponentContracts(getBuilderComponentCatalog());
    });
    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(
    () =>
      summarizeBuilderWorkspace(
        {
          states: Object.fromEntries(
            initialFlowState.flow.screens.map((screen) => [screen.id, { uiPageId: screen.uiPageId }]),
          ),
        },
        componentContracts,
      ),
    [componentContracts, initialFlowState.flow.screens],
  );

  const paletteEntries: BuilderPaletteEntry[] = useMemo(
    () =>
      componentContracts.map((contract) => ({
        id: contract.type,
        kind: 'component',
        type: contract.type,
        displayName: contract.displayName ?? contract.type,
        category: contract.category ?? 'Components',
        description: contract.description,
      })),
    [componentContracts],
  );

  return (
    <BuilderProvider
      summary={summary}
      paletteEntries={paletteEntries}
      componentContracts={componentContracts}
      initialFlowState={initialFlowState}
    >
      <BuilderWorkspaceLayout>{children}</BuilderWorkspaceLayout>
    </BuilderProvider>
  );
}
