'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createUISchema } from '@platform/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useBuilderStore } from './_domain/builderStore';
import styles from './builder.module.css';

export default function BuilderHomePage() {
  const searchParams = useSearchParams();
  const versionId = searchParams.get('versionId')?.trim() ?? '';
  const { toast } = useToast();

  const screens = useBuilderStore((state) => state.screens);
  const addScreenToStore = useBuilderStore((state) => state.addScreen);
  const loadBundleFromUrl = useBuilderStore((state) => state.loadBundleFromUrl);
  const lastLoadedVersionRef = useRef<string | null>(null);

  const [newScreenId, setNewScreenId] = useState('');
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const screenEntries = useMemo(() => Object.entries(screens), [screens]);

  useEffect(() => {
    if (!versionId) return;
    if (lastLoadedVersionRef.current === versionId) return;
    let cancelled = false;
    lastLoadedVersionRef.current = versionId;
    setBundleLoading(true);
    setBundleError(null);
    void loadBundleFromUrl(versionId).catch((error) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : String(error);
      setBundleError(message);
      toast({
        variant: 'error',
        title: 'Failed to load config version',
        description: message,
      });
    }).finally(() => {
      if (cancelled) return;
      setBundleLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [loadBundleFromUrl, toast, versionId]);

  const addScreen = () => {
    const id = newScreenId.trim() || `screen-${screenEntries.length + 1}`;
    if (screens[id]) return;
    addScreenToStore(id, createUISchema({ pageId: id }));
    setNewScreenId('');
  };

  const retryLoad = () => {
    if (!versionId) return;
    lastLoadedVersionRef.current = versionId;
    setBundleError(null);
    setBundleLoading(true);
    void loadBundleFromUrl(versionId).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      setBundleError(message);
      toast({
        variant: 'error',
        title: 'Failed to load config version',
        description: message,
      });
    }).finally(() => {
      setBundleLoading(false);
    });
  };

  return (
    <div className={styles.builderHome}>
      {bundleLoading && screenEntries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading builder project...</CardTitle>
          </CardHeader>
          <CardContent>Please wait while we hydrate screens, flow, and rules.</CardContent>
        </Card>
      ) : null}

      {bundleError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load builder data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.empty}>{bundleError}</p>
            <Button onClick={retryLoad} size="sm" data-testid="builder-home-retry-load">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <header className={styles.homeHeader}>
        <div>
          <p className={styles.kicker}>Builder Console</p>
          <h1 className={styles.title}>Project Overview</h1>
          <p className={styles.subtitle}>Screens, flow, and rules now share one centralized state.</p>
        </div>
        <div className={styles.navLinks}>
          <Link href="/builder/screens">Open Screens</Link>
          <Link href="/builder/flow">Open Flow</Link>
          <Link href="/builder/rules">Open Rules</Link>
        </div>
      </header>

      <div className={styles.grid}>
        <Card>
          <CardHeader>
            <CardTitle>Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.addRow}>
              <Input
                placeholder="screen-id"
                value={newScreenId}
                onChange={(e) => setNewScreenId(e.target.value)}
                data-testid="builder-home-new-screen"
              />
              <Button onClick={addScreen} size="sm" data-testid="builder-home-add-screen">
                Add
              </Button>
            </div>
            <ul className={styles.list}>
              {screenEntries.length === 0 ? <li className={styles.empty}>No screens yet</li> : null}
              {screenEntries.map(([id]) => (
                <li key={id} className={styles.listItem}>
                  <span className={styles.screenId}>{id}</span>
                  <Link href={`/builder/screens?screenId=${encodeURIComponent(id)}`} className={styles.link}>
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className={styles.shortcuts}>
            <Link href="/builder/json">JSON Export</Link>
            <Link href="/builder/api-mappings">API Mappings</Link>
            <Link href="/builder/legacy">Legacy Builder</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
