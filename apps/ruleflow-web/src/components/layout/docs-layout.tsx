'use client';

import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import styles from './docs-layout.module.scss';

export function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.docsShell}>
      <div className={styles.docsHeader}>
        <Breadcrumbs />
      </div>
      <main className={styles.docsMain}>{children}</main>
    </div>
  );
}
