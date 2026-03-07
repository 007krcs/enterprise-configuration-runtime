'use client';

import React from 'react';
import { Checkbox } from '@platform/component-system';
import { useBuilder } from '../../../components/BuilderContext';
import ws from '../workspace.module.css';

export default function RulesWorkspacePage() {
  const b = useBuilder();

  return (
    <div>
      {/* Page header */}
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Rules &amp; Validation</h1>
        <p className={ws.pageSubtitle}>
          Review validation results for the current application bundle. Fix errors before publishing.
        </p>
      </div>

      {/* Stats */}
      <div className={ws.statsRow} style={{ marginBottom: 'var(--ecr-spacing-4)' }}>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.validationErrors.length}</span>
          <span className={ws.statLabel}>Errors</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.validationWarnings.length}</span>
          <span className={ws.statLabel}>Warnings</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.validationResult.issues.length === 0 ? 'Pass' : 'Fail'}</span>
          <span className={ws.statLabel}>Status</span>
        </div>
      </div>

      {/* Dev mode toggle */}
      {b.developmentMode && (
        <div className={ws.card} style={{ marginBottom: 'var(--ecr-spacing-4)' }}>
          <div className={ws.cardBody}>
            <Checkbox
              label="Dev Mode: Skip A11y/i18n validation"
              checked={b.skipValidationInDev}
              onChange={(e) => b.setSkipValidationInDev(e.target.checked)}
            />
            {b.skipValidationInDev && (
              <p className={ws.notice}>
                Development mode is downgrading accessibility/i18n errors to warnings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Validation results */}
      <div className={ws.card}>
        <div className={ws.cardHeader}>
          <h2 className={ws.cardTitle}>Validation Results</h2>
          <span className={`${ws.badge} ${b.validationErrors.length > 0 ? ws.badgeError : ws.badgeSuccess}`}>
            {b.validationErrors.length > 0 ? `${b.validationErrors.length} errors` : 'All clear'}
          </span>
        </div>
        <div className={ws.cardBody}>
          {b.validationResult.issues.length === 0 ? (
            <p className={ws.emptyState}>
              No validation issues found. Your application bundle is ready.
            </p>
          ) : (
            b.validationResult.issues.map((issue, i) => (
              <div
                key={`${issue.path}-${i}`}
                className={`${ws.validationItem} ${
                  issue.severity === 'error' ? ws.validationItemError : ws.validationItemWarning
                }`}
              >
                <span className={`${ws.badge} ${issue.severity === 'error' ? ws.badgeError : ws.badgeWarning}`}>
                  {issue.severity.toUpperCase()}
                </span>
                <span style={{ color: 'var(--ecr-color-text)' }}>
                  <strong>{issue.path || 'root'}</strong>: {issue.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
