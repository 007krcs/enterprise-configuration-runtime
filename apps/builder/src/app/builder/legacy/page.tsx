/* Legacy builder experience mounted under /builder/legacy */
'use client';

import React, { useMemo } from 'react';
import { BuilderShell } from '../../../components/BuilderShell';
import { getBuilderComponentCatalog, loadBuilderPlugins } from '../../../lib/plugin-host';
import { summarizeBuilderWorkspace } from '../../../lib/builder-modules';
import { createInitialBuilderFlowState } from '../../../lib/flow-engine';
import type { BuilderPaletteEntry } from '../../../components/BuilderShell';
import ws from '../workspace.module.css';

export default function LegacyBuilderPage() {
  const initialFlowState = useMemo(() => createInitialBuilderFlowState(), []);
  const [componentContracts, setComponentContracts] = React.useState(() => getBuilderComponentCatalog());

  React.useEffect(() => {
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
    <div>
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Legacy Builder</h1>
        <p className={ws.pageSubtitle}>
          The original canvas workspace with full palette, inspector, flow editor, and validation panels.
          This view provides direct access to all builder capabilities in a single integrated workspace.
        </p>
      </div>
      <p style={{
        fontSize: 'var(--ecr-font-size-xs, 0.75rem)',
        color: 'var(--ecr-color-text-muted, #64748b)',
        marginBottom: 'var(--ecr-spacing-4, 16px)',
        padding: '8px 12px',
        background: 'var(--ecr-color-info-soft, #f0f9ff)',
        borderRadius: 'var(--ecr-radius-md, 8px)',
        borderLeft: '3px solid var(--ecr-color-info, #0284c7)',
      }}>
        Canvas Workspace (Legacy) — Use the new workspace tabs above for the redesigned experience.
      </p>
      <BuilderShell
        summary={summary}
        paletteEntries={paletteEntries}
        componentContracts={componentContracts}
        initialFlowState={initialFlowState}
      />
    </div>
  );
}
