'use client';

import React from 'react';
import { Button, Input, Select } from '@platform/component-system';
import { useBuilder } from '../../../components/BuilderContext';
import ws from '../workspace.module.css';

export default function DataWorkspacePage() {
  const b = useBuilder();

  return (
    <div>
      {/* Page header */}
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Data &amp; Configuration</h1>
        <p className={ws.pageSubtitle}>
          Manage configuration packages, draft versions, and lifecycle workflows. Import and export application bundles.
        </p>
      </div>

      <div className={ws.splitLayout}>
        {/* Main content */}
        <div className={ws.sidebar}>
          {/* Config package selector */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Active Configuration</h2>
            </div>
            <div className={ws.cardBody}>
              <div className={ws.fieldGroup}>
                <div className={ws.field}>
                  <Select
                    id="config-package"
                    label="Config Package"
                    value={b.activePackage?.id ?? ''}
                    onChange={b.handlePackageSelect}
                    size="sm"
                    options={b.packageOptions}
                  />
                </div>
                <div className={ws.field}>
                  <Select
                    id="config-version"
                    label="Version"
                    value={b.activeVersion?.id ?? ''}
                    onChange={b.handleVersionSelect}
                    size="sm"
                    options={b.versionOptions}
                  />
                </div>
              </div>

              {/* Lifecycle actions */}
              <div className={ws.buttonRow}>
                <Button type="button" variant="primary" size="sm" onClick={b.handleSaveDraft} disabled={!b.canSaveDraft}>
                  Save Draft
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={b.handlePromote} disabled={!b.canPromote}>
                  Submit
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={b.handleApprove} disabled={!b.canApprove}>
                  Approve
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={b.handleReject} disabled={!b.canReject}>
                  Reject
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={b.handlePublish} disabled={!b.canPublish}>
                  Publish
                </Button>
              </div>

              <div className={ws.buttonRow}>
                <Button type="button" variant="secondary" size="sm" onClick={b.handleCreateDraft} disabled={!b.canCreateDraft}>
                  New Draft
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={b.handleExportBundle}>
                  Export JSON
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={b.handleImportClick}>
                  Import JSON
                </Button>
              </div>
              <input
                ref={b.importInputRef}
                type="file"
                accept="application/json"
                onChange={b.handleImportBundle}
                className={ws.hidden}
              />
              {b.configMessage && <p className={ws.notice}>{b.configMessage}</p>}
              {b.importMessage && <p className={ws.notice}>{b.importMessage}</p>}
            </div>
          </div>

          {/* Create new config */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Create New Config</h2>
            </div>
            <div className={ws.cardBody}>
              <div className={ws.fieldGroup}>
                <div className={ws.field}>
                  <Input label="Config ID" value={b.newConfigId} onChange={(e) => b.setNewConfigId(e.target.value)} placeholder="customer-onboarding" size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Config Name" value={b.newConfigName} onChange={(e) => b.setNewConfigName(e.target.value)} placeholder="Customer Onboarding" size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Tenant ID" value={b.newConfigTenantId} onChange={(e) => b.setNewConfigTenantId(e.target.value)} placeholder="tenant-001" size="sm" />
                </div>
              </div>
              <Button type="button" variant="primary" size="sm" onClick={b.handleCreateConfig}>
                Create Config
              </Button>
            </div>
          </div>

          {/* Audit log */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Audit Log</h2>
            </div>
            <div className={ws.cardBody}>
              {b.recentAuditEntries.length === 0 ? (
                <p className={ws.emptyState}>No audit events yet.</p>
              ) : (
                b.recentAuditEntries.map((entry) => (
                  <div key={entry.id} className={ws.auditItem}>
                    <div className={ws.auditHeader}>
                      <span className={ws.auditAction}>{entry.action}</span>
                      <span className={ws.auditTimestamp}>
                        {(() => { try { return new Date(entry.timestamp).toLocaleString(); } catch { return entry.timestamp; } })()}
                      </span>
                    </div>
                    <p className={ws.auditSummary}>{entry.summary}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar: Bundle metadata */}
        <aside className={ws.sidebar}>
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Bundle Metadata</h2>
            </div>
            <div className={ws.cardBody}>
              <div className={ws.fieldGroup}>
                <div className={ws.field}>
                  <Input label="Config ID" value={b.bundleConfigId} readOnly size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Tenant ID" value={b.bundleTenantId} readOnly size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Version" value={b.bundleVersion} readOnly size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Status" value={b.bundleStatus} readOnly size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Created At" value={b.bundleCreatedAt} readOnly size="sm" />
                </div>
                <div className={ws.field}>
                  <Input label="Updated At" value={b.bundleUpdatedAt} readOnly size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Summary</h2>
            </div>
            <div className={ws.cardBody}>
              <div className={ws.statsRow}>
                <div className={ws.statItem}>
                  <span className={ws.statValue}>{b.screensCount}</span>
                  <span className={ws.statLabel}>Screens</span>
                </div>
                <div className={ws.statItem}>
                  <span className={ws.statValue}>{b.transitionsCount}</span>
                  <span className={ws.statLabel}>Transitions</span>
                </div>
                <div className={ws.statItem}>
                  <span className={ws.statValue}>{b.componentsCount}</span>
                  <span className={ws.statLabel}>Components</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
