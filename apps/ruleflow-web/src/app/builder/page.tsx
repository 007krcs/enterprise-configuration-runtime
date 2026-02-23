'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUISchema } from '@platform/schema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useBuilderStore } from './_domain/builderStore';
import styles from './builder.module.css';

export default function BuilderHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const versionId = searchParams.get('versionId')?.trim() ?? '';
  const exampleId = searchParams.get('example')?.trim() ?? '';
  const { toast } = useToast();

  const bundle = useBuilderStore((state) => state.bundle);
  const hasHydratedFromStorage = useBuilderStore((state) => state.hasHydratedFromStorage);
  const screens = useBuilderStore((state) => state.screens);
  const addScreenToStore = useBuilderStore((state) => state.addScreen);
  const loadExample = useBuilderStore((state) => state.loadExample);
  const loadBundleFromUrl = useBuilderStore((state) => state.loadBundleFromUrl);
  const lastLoadedVersionRef = useRef<string | null>(null);
  const lastLoadedExampleRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (versionId) return;
    if (!exampleId) return;
    if (lastLoadedExampleRef.current === exampleId) return;
    let cancelled = false;
    lastLoadedExampleRef.current = exampleId;
    setBundleLoading(true);
    setBundleError(null);
    void loadExample(exampleId).catch((error) => {
      if (cancelled) return;
      const message = error instanceof Error ? error.message : String(error);
      setBundleError(message);
      toast({
        variant: 'error',
        title: 'Failed to load example bundle',
        description: message,
      });
    }).finally(() => {
      if (cancelled) return;
      setBundleLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [exampleId, loadExample, toast, versionId]);

  const addScreen = () => {
    const id = newScreenId.trim() || `screen-${screenEntries.length + 1}`;
    if (screens[id]) return;
    addScreenToStore(id, createUISchema({ pageId: id }));
    setNewScreenId('');
  };

  const retryLoad = () => {
    if (!versionId && !exampleId) return;
    setBundleError(null);
    setBundleLoading(true);
    const loader = versionId ? loadBundleFromUrl(versionId) : loadExample(exampleId);
    if (versionId) {
      lastLoadedVersionRef.current = versionId;
    } else {
      lastLoadedExampleRef.current = exampleId;
    }
    void loader.catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      setBundleError(message);
      toast({
        variant: 'error',
        title: versionId ? 'Failed to load config version' : 'Failed to load example bundle',
        description: message,
      });
    }).finally(() => {
      setBundleLoading(false);
    });
  };

  if (!hasHydratedFromStorage && !bundle) {
    return (
      <div className={styles.builderHome}>
        <Card>
          <CardHeader>
            <CardTitle>Loading builder project...</CardTitle>
          </CardHeader>
          <CardContent>Hydrating your last project from local storage.</CardContent>
        </Card>
      </div>
    );
  }

  if (!bundleLoading && !bundleError && !bundle) {
    return (
      <div className={styles.builderHome}>
        <Card>
          <CardHeader>
            <CardTitle>No project loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.empty}>Start from a curated sample to open UI, flow, and rules in Builder.</p>
            <Button size="sm" onClick={() => router.push('/examples')}>
              Go to Examples
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
