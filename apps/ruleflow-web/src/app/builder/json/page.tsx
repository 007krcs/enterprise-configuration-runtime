'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuilderStore } from '../_domain/builderStore';
import styles from '../builder.module.css';

const DOWNLOAD_FILENAME = 'ruleflow-bundle.json';

function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function BuilderJsonPage() {
  const bundle = useBuilderStore((state) => state.bundle ?? state.bundleJson);
  const hasHydratedFromStorage = useBuilderStore((state) => state.hasHydratedFromStorage);
  const [copied, setCopied] = useState(false);
  const jsonText = useMemo(() => (bundle ? JSON.stringify(bundle, null, 2) : ''), [bundle]);

  const copyJson = async () => {
    if (!jsonText) return;
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (!hasHydratedFromStorage && !bundle) {
    return (
      <div className={styles.builderHome}>
        <Card>
          <CardHeader>
            <CardTitle>Loading JSON export...</CardTitle>
          </CardHeader>
          <CardContent>Hydrating your current builder project.</CardContent>
        </Card>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className={styles.builderHome}>
        <Card>
          <CardHeader>
            <CardTitle>No project loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.empty}>Load an example or open a version in Builder to export JSON.</p>
            <div className={styles.navLinks}>
              <Link href="/examples">Go to Examples</Link>
              <Link href="/builder">Back to Builder</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.builderHome}>
      <header className={styles.homeHeader}>
        <div>
          <p className={styles.kicker}>Builder Console</p>
          <h1 className={styles.title}>JSON Export</h1>
          <p className={styles.subtitle}>Download or copy the active project bundle.</p>
        </div>
        <div className={styles.navLinks}>
          <Link href="/builder">Back to Builder</Link>
          <Link href="/examples">Examples</Link>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Bundle JSON</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.actions}>
            <Button size="sm" onClick={() => void copyJson()}>
              {copied ? 'Copied' : 'Copy JSON'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadTextFile(DOWNLOAD_FILENAME, jsonText)}>
              Download JSON
            </Button>
          </div>
          <pre
            style={{
              marginTop: 12,
              maxHeight: '70vh',
              overflow: 'auto',
              border: '1px solid var(--rf-border)',
              borderRadius: 'var(--rf-radius-md)',
              background: 'var(--rf-surface-2)',
              padding: '12px',
              fontSize: '12px',
            }}
          >
            {jsonText}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
