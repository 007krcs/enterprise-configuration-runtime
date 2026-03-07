'use client';

import React, { useState } from 'react';
import { Button } from '@platform/component-system';
import { serializeApplicationBundle } from '@platform/schema';
import { useBuilder } from '../../../components/BuilderContext';
import ws from '../workspace.module.css';

type JsonTab = 'bundle' | 'uiSchema' | 'flowGraph' | 'flowMachine';

export default function JsonWorkspacePage() {
  const b = useBuilder();
  const [activeTab, setActiveTab] = useState<JsonTab>('bundle');

  const tabs: { id: JsonTab; label: string }[] = [
    { id: 'bundle', label: 'Application Bundle' },
    { id: 'uiSchema', label: 'Active UISchema' },
    { id: 'flowGraph', label: 'Flow Graph' },
    { id: 'flowMachine', label: 'State Machine' },
  ];

  const getContent = (): string => {
    switch (activeTab) {
      case 'bundle':
        return serializeApplicationBundle(b.applicationBundle, 2);
      case 'uiSchema':
        return JSON.stringify(b.activeSchema, null, 2);
      case 'flowGraph':
        return JSON.stringify(b.flowGraph, null, 2);
      case 'flowMachine':
        return JSON.stringify(b.legacyFlowStateMachine, null, 2);
      default:
        return '';
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>JSON Preview</h1>
        <p className={ws.pageSubtitle}>
          Inspect and export the serialized application bundle and its constituent schemas.
        </p>
      </div>

      {/* Toolbar */}
      <div className={ws.toolbar}>
        <div className={ws.toolbarGroup}>
          <Button type="button" variant="primary" size="sm" onClick={b.handleExportBundle}>
            Export Bundle JSON
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={b.handleImportClick}>
            Import JSON
          </Button>
          <input
            ref={b.importInputRef}
            type="file"
            accept="application/json"
            onChange={b.handleImportBundle}
            className={ws.hidden}
          />
        </div>
        <div className={ws.toolbarSpacer} />
        <span style={{ fontSize: 'var(--ecr-font-size-xs)', color: 'var(--ecr-color-text-muted)' }}>
          Config: {b.bundleConfigId} &middot; v{b.bundleVersion} &middot; {b.bundleStatus}
        </span>
      </div>

      {/* Tabs */}
      <div className={ws.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${ws.tab} ${activeTab === tab.id ? ws.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <pre className={ws.codeBlock}>{getContent()}</pre>

      {b.importMessage && <p className={ws.notice} style={{ marginTop: 'var(--ecr-spacing-3)' }}>{b.importMessage}</p>}
    </div>
  );
}
