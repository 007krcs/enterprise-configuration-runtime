'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { JSONValue, ExecutionContext } from '@platform/schema';
import { RenderPage } from '@platform/react-renderer';
import { createProviderFromBundles, EXAMPLE_TENANT_BUNDLES, PLATFORM_BUNDLES } from '@platform/i18n';
import type { ConfigBundle } from '@/lib/demo/types';
import { normalizeUiPages } from '@/lib/demo/ui-pages';
import { exampleCatalog, loadExampleBundle, applyBundleToBuilder } from '@/lib/examples';
import type { ExampleDefinition } from '@/lib/examples';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import styles from './examples.module.css';

type PreviewState = {
  example: ExampleDefinition;
  bundle: ConfigBundle;
};

type ExampleAction = 'preview' | 'builder' | 'download';

const previewContext: ExecutionContext & {
  onboarding: { nextEnabled: boolean; preferencesValid: boolean };
} = {
  tenantId: 'tenant-1',
  userId: 'preview',
  role: 'admin',
  roles: ['admin'],
  country: 'US',
  locale: 'en-US',
  timezone: 'America/New_York',
  device: 'desktop',
  permissions: ['read'],
  featureFlags: { demo: true },
  onboarding: {
    nextEnabled: true,
    preferencesValid: true,
  },
};

const previewData: Record<string, JSONValue> = {
  acceptedTerms: true,
  formValid: true,
  readyToSubmit: true,
  orderTotal: 1420,
  loanAmount: 250000,
  riskLevel: 'Medium',
  restricted: false,
  orders: [
    { orderId: 'store-101', customer: 'Acme Corp', total: 780 },
    { orderId: 'store-102', customer: 'Blue Sky Ltd', total: 640 },
  ],
  revenueSeries: [
    { month: 'Jan', value: 42000 },
    { month: 'Feb', value: 52000 },
    { month: 'Mar', value: 61000 },
  ],
  customViz: [
    { label: 'Retention', value: 89 },
    { label: 'CSAT', value: 92 },
  ],
  categories: [
    { name: 'Electronics', items: 48, description: 'Connected devices & peripherals' },
    { name: 'Workspace', items: 32, description: 'Desks, chairs, and accessories' },
    { name: 'Analytics', items: 21, description: 'Dashboards & integrations' },
  ],
  products: [
    { name: 'Wireless Headset', category: 'Electronics', price: '$85', stock: 120 },
    { name: 'Executive Keyboard', category: 'Workspace', price: '$130', stock: 45 },
    { name: 'Revenue Dashboard Suite', category: 'Analytics', price: '$480', stock: 8 },
  ],
  cart: {
    items: [
      { name: 'Wireless Headset', quantity: 2, price: 85 },
      { name: 'Executive Keyboard', quantity: 1, price: 130 },
    ],
    total: 300,
    discount: 0,
    finalTotal: 300,
  },
  order: {
    shipping: {
      address: '980 Market Street',
      city: 'San Francisco',
      postalCode: '94103',
      country: 'US',
    },
    summary: [
      { label: 'Order ID', value: 'ORD-4218' },
      { label: 'Status', value: 'Processing' },
      { label: 'Payment', value: 'Corporate Card' },
    ],
    reference: 'ORD-4218',
  },
  metrics: {
    revenueSeries: [
      { name: 'North America', data: [42000, 52000, 61000] },
      { name: 'EMEA', data: [18000, 21000, 25000] },
    ],
    byRegion: [
      { region: 'North America', revenue: '$152k' },
      { region: 'EMEA', revenue: '$78k' },
      { region: 'APAC', revenue: '$64k' },
    ],
  },
  reports: [
    { name: 'Adoption Trends', status: 'Ready', owner: 'BI Team' },
    { name: 'Retention by Cohort', status: 'Processing', owner: 'Analytics' },
  ],
  user: {
    token: 'token-123',
    roles: ['user', 'admin'],
    name: 'Sarah Lead',
  },
  hostEvent: '',
  onboarding: {
    accountName: 'Jordan Sales',
    accountEmail: 'jordan.sales@enterprise.com',
    preferenceTier: 'enterprise',
    preferenceRegion: 'EMEA',
  },
};

export default function ExamplesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [busyAction, setBusyAction] = useState<{ exampleId: string; action: ExampleAction } | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);

  const baseLocale = previewContext.locale.split('-')[0] ?? previewContext.locale;

  const previewPages = useMemo(() => {
    if (!previewState) return null;
    return normalizeUiPages({
      uiSchema: previewState.bundle.uiSchema,
      uiSchemasById: previewState.bundle.uiSchemasById,
      activeUiPageId: previewState.bundle.activeUiPageId,
      flowSchema: previewState.bundle.flowSchema,
    });
  }, [previewState]);

  const currentUiSchema = previewPages?.uiSchemasById[previewPages.activeUiPageId];

  const previewI18n = useMemo(() => {
    if (!previewState) return null;
    return createProviderFromBundles({
      locale: baseLocale,
      fallbackLocale: 'en',
      bundles: [...PLATFORM_BUNDLES, ...EXAMPLE_TENANT_BUNDLES],
      mode: 'dev',
    });
  }, [baseLocale, previewState]);

  const isBusy = (exampleId: string, action: ExampleAction) =>
    busyAction?.exampleId === exampleId && busyAction?.action === action;

  const handlePreview = async (example: ExampleDefinition) => {
    setBusyAction({ exampleId: example.id, action: 'preview' });
    try {
      const bundle = await loadExampleBundle(example.id);
      setPreviewState({ example, bundle });
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'Unable to load example.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenBuilder = async (example: ExampleDefinition) => {
    setBusyAction({ exampleId: example.id, action: 'builder' });
    try {
      const bundle = await loadExampleBundle(example.id);
      applyBundleToBuilder(bundle);
      router.push('/builder');
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Builder load failed',
        description: error instanceof Error ? error.message : 'Unable to load builder data.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownload = async (example: ExampleDefinition) => {
    setBusyAction({ exampleId: example.id, action: 'download' });
    try {
      const bundle = await loadExampleBundle(example.id);
      const payload = JSON.stringify(bundle, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${example.id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Unable to download bundle.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <Badge variant="default">Curated Examples</Badge>
          <h1 className={styles.heroTitle}>Jump straight into the runtime</h1>
          <p className={styles.heroText}>
            Load a complete demo bundle and immediately inspect the UI, flow, and rules. Open the builder to edit, or preview the runtime
            experience without wiring a config from scratch.
          </p>
        </div>
      </section>

      <section>
        <div className={styles.grid}>
          {exampleCatalog.map((example) => (
            <Card key={example.id}>
              <CardHeader>
                <div className={styles.cardHeading}>
                  <CardTitle>{example.title}</CardTitle>
                  <Badge variant="muted">{example.tag}</Badge>
                </div>
                <p className={styles.cardDescription}>{example.description}</p>
              </CardHeader>
              <CardContent>
                <ul className={styles.highlightList}>
                  {example.highlights.map((highlight) => (
                    <li key={highlight} className={styles.highlightItem}>
                      {highlight}
                    </li>
                  ))}
                </ul>
                <div className={styles.statRow}>
                  {example.stats.map((stat) => (
                    <span key={stat} className={styles.stat}>
                      {stat}
                    </span>
                  ))}
                </div>
                <div className={styles.actions}>
                  <Button size="sm" onClick={() => void handlePreview(example)} disabled={isBusy(example.id, 'preview')}>
                    {isBusy(example.id, 'preview') ? 'Preparing preview…' : 'Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleOpenBuilder(example)}
                    disabled={isBusy(example.id, 'builder')}
                  >
                    {isBusy(example.id, 'builder') ? 'Preparing builder…' : 'Open in Builder'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void handleDownload(example)} disabled={isBusy(example.id, 'download')}>
                    {isBusy(example.id, 'download') ? 'Downloading…' : 'Download JSON'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {previewState && (
        <div className={styles.previewPanel} role="dialog" aria-label={`Preview for ${previewState.example.title}`}>
          <div className={styles.previewHeader}>
            <div>
              <p className={styles.previewTag}>{previewState.example.tag} demo</p>
              <h3 className={styles.previewTitle}>{previewState.example.title}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPreviewState(null)} className={styles.previewClose}>
              Close
            </Button>
          </div>
          <div className={styles.previewBody}>
            {currentUiSchema && previewI18n ? (
              <div className={styles.previewFrame}>
                <RenderPage
                  uiSchema={currentUiSchema}
                  data={previewData}
                  context={previewContext}
                  i18n={previewI18n}
                  mode="controlled"
                />
              </div>
            ) : (
              <p className="rfHelperText">Preview bundle is missing a schema.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
