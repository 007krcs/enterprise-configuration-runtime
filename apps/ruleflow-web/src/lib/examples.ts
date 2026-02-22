import type { FlowSchema } from '@platform/schema';
import { normalizeUiPages, rebindFlowSchemaToAvailablePages } from '@/lib/demo/ui-pages';
import type { ConfigBundle } from '@/lib/demo/types';
import { useBuilderStore } from '@/app/builder/_domain/builderStore';
import type { FlowEdge, FlowNode } from '@/app/builder/_domain/types';

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
  const normalized = normalizeUiPages({
    uiSchema: bundle.uiSchema,
    uiSchemasById: bundle.uiSchemasById,
    activeUiPageId: bundle.activeUiPageId,
    flowSchema: bundle.flowSchema,
  });

  const flowSchema =
    rebindFlowSchemaToAvailablePages(bundle.flowSchema, normalized.uiSchemasById, normalized.activeUiPageId) ??
    bundle.flowSchema ??
    createEmptyFlowSchema();

  const startNode = flowSchema.initialState ?? Object.keys(flowSchema.states ?? {})[0] ?? null;
  const nodes = buildFlowNodes(flowSchema);
  const edges = buildFlowEdges(flowSchema);
  const rules = bundle.rules?.rules ?? [];
  const rulesById = Object.fromEntries(rules.map((rule) => [rule.ruleId, rule]));

  useBuilderStore.setState((state) => ({
    ...state,
    screens: normalized.uiSchemasById,
    activeScreenId: normalized.activeUiPageId,
    flow: {
      ...state.flow,
      startNodeId: startNode,
      nodes,
      edges,
      schema: flowSchema,
    },
    rules: rulesById,
    metadata: {
      ...state.metadata,
      version: String(bundle.rules?.version ?? state.metadata.version ?? '1.0.0'),
      status: 'draft',
      updatedAt: Date.now(),
    },
  }));
}

function buildFlowNodes(flowSchema: FlowSchema): FlowNode[] {
  const stateIds = Object.keys(flowSchema.states ?? {});
  const columns = Math.max(1, Math.ceil(Math.sqrt(stateIds.length)));
  return stateIds.map((id, index) => ({
    id,
    label: id,
    position: {
      x: 80 + ((index % columns) * 220),
      y: 80 + Math.floor(index / columns) * 180,
    },
  }));
}

function buildFlowEdges(flowSchema: FlowSchema): FlowEdge[] {
  const edges: FlowEdge[] = [];
  for (const [stateId, state] of Object.entries(flowSchema.states ?? {})) {
    for (const [event, transition] of Object.entries(state.on ?? {})) {
      if (!transition || !transition.target) continue;
      edges.push({
        id: `${stateId}-${event}-${transition.target}`,
        from: stateId,
        to: transition.target,
        onEvent: event,
        guardRuleId: typeof transition.guard === 'string' ? transition.guard : undefined,
      });
    }
  }
  return edges;
}

function createEmptyFlowSchema(): FlowSchema {
  return {
    version: '1.0.0',
    flowId: 'flow',
    initialState: '',
    states: {},
  };
}
