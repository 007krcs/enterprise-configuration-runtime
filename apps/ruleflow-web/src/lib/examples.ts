import type { ConfigBundle } from '@/lib/demo/types';
import { useProjectStore } from '@/state/projectStore';

export type ExampleId =
  | 'e-commerce-store-demo'
  | 'saas-dashboard'
  | 'user-onboarding-flow-demo'
  | 'onboarding';

export type ExampleDefinition = {
  id: ExampleId;
  title: string;
  description: string;
  highlights: string[];
  tag: string;
  stats: string[];
};

export const exampleCatalog: ExampleDefinition[] = [
  {
    id: 'e-commerce-store-demo',
    title: 'E-Commerce Store Demo',
    description: 'Power a product catalog with responsive filters, dashboards, and checkout validation powered by flow + rules.',
    highlights: ['Multi-step checkout & review flow', 'Rule-driven discounts & approvals', 'Charts + tables wired to runtime data'],
    tag: 'Retail',
    stats: ['15+ screens', '3 backend APIs', 'Localized content'],
  },
  {
    id: 'saas-dashboard',
    title: 'SaaS Dashboard Demo',
    description: 'Compose KPI tiles, usage graphs, and reports with role-based access guards.',
    highlights: ['KPI snapshot table', 'Revenue trend chart + admin reports', 'Inactivity logout guard'],
    tag: 'Analytics',
    stats: ['3 screens', '2 rules', 'Role-aware flow'],
  },
  {
    id: 'onboarding',
    title: 'Onboarding Journey',
    description: 'Guide users through welcome/account/preferences/finish steps with rule-driven Next buttons.',
    highlights: ['Linear welcome -> finish flow', 'Account + preference validation rules', 'Context-disabled Next buttons'],
    tag: 'Onboarding',
    stats: ['4 screens', '3 rules', 'Context flags'],
  },
  {
    id: 'user-onboarding-flow-demo',
    title: 'User Onboarding Flow Demo',
    description: 'Guide new users through a profile/approval flow with contextual rules and API-backed verification.',
    highlights: ['Guided state machine driven flow', 'Rules gating next steps', 'API callouts for verification'],
    tag: 'Onboarding',
    stats: ['5 prompts', '2 approval paths', 'Guarded transitions'],
  },
];

const bundleCache = new Map<ExampleId, ConfigBundle>();

export async function loadExampleBundle(exampleId: ExampleId): Promise<ConfigBundle> {
  if (bundleCache.has(exampleId)) {
    return bundleCache.get(exampleId)!;
  }
  const response = await fetch(`/examples/bundles/${exampleId}.json`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unable to load example bundle (${response.status})`);
  }
  const bundle = (await response.json()) as ConfigBundle;
  bundleCache.set(exampleId, bundle);
  return bundle;
}

export function applyBundleToBuilder(bundle: ConfigBundle): void {
  useProjectStore.getState().loadBundleJson(bundle);
}
