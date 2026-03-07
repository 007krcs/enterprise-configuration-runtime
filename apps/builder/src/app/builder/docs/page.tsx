import React from 'react';
import ws from '../workspace.module.css';

export default function DocsWorkspacePage() {
  return (
    <div>
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Documentation</h1>
        <p className={ws.pageSubtitle}>
          Browse project documentation, API references, and component guides.
        </p>
      </div>
      <div className={ws.card}>
        <div className={ws.cardBody}>
          <div className={ws.emptyState}>
            Documentation workspace is coming soon. Check the repository for guides and references.
          </div>
        </div>
      </div>
    </div>
  );
}
