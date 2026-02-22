import React from 'react';
import { WorkspaceHeader } from '../../../components/WorkspaceHeader';
import styles from './page.module.css';

export default function ScreensWorkspacePage() {
  return (
    <div>
      <div className={styles.infoBanner}>NEW BUILDER SHELL ✓</div>
      <WorkspaceHeader title="Screens" subtitle="Manage screens, layouts, and responsive structure." />
      <p>Placeholder for screens management UI.</p>
    </div>
  );
}
