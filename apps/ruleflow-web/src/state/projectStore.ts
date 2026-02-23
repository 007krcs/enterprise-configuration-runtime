"use client";

import { create } from 'zustand';
import { produce } from 'immer';
import type { FlowSchema, Rule, UISchema } from '@platform/schema';
import { createUISchema } from '@platform/schema';
import { normalizeUiPages, rebindFlowSchemaToAvailablePages } from '@/lib/demo/ui-pages';
import type { ConfigBundle } from '@/lib/demo/types';
import type { BuilderState, FlowEdge, FlowNode } from '@/app/builder/_domain/types';

type LoadVersionResponse =
  | { ok: true; version: { bundle: ConfigBundle } }
  | { ok: false; error: string };

type QueryParamReader = {
  get: (name: string) => string | null;
};

const PREVIEW_DRAFT_PREFIX = 'ruleflow:preview:draft:';

type ProjectActions = {
  addScreen: (id?: string, schema?: UISchema) => void;
  removeScreen: (id: string) => void;
  updateScreen: (id: string, schema: UISchema) => void;
  setActiveScreen: (id: string | null) => void;
  updateFlow: (updater: (flow: BuilderState['flow']) => BuilderState['flow']) => void;
  addRule: (rule: Rule) => void;
  updateRule: (ruleId: string, patch: Partial<Rule>) => void;
  setRules: (rules: Record<string, Rule>) => void;
  setFlowSchema: (schema: FlowSchema) => void;
  loadBundleFromUrl: (versionId: string) => Promise<void>;
  loadBundleFromUrlParams: (params: QueryParamReader) => Promise<void>;
  loadBundleJson: (bundle: ConfigBundle) => void;
  setSelectedScreen: (screenId: string | null) => void;
  setPreviewMode: (enabled: boolean) => void;
  resetProject: () => void;
};

type ProjectStoreState = BuilderState & {
  previewMode: boolean;
  loadedVersionId: string | null;
  bundleJson: ConfigBundle | null;
};

export type ProjectStore = ProjectStoreState & ProjectActions;

const initialState: ProjectStoreState = {
  screens: {},
  activeScreenId: null,
  flow: {
    startNodeId: null,
    nodes: [],
    edges: [],
    schema: { version: '1.0.0', flowId: 'flow', initialState: '', states: {} },
  },
  rules: {},
  metadata: {
    version: '1.0.0',
    status: 'draft',
    updatedAt: Date.now(),
  },
  previewMode: false,
  loadedVersionId: null,
  bundleJson: null,
};

function cloneInitialState(): ProjectStoreState {
  return {
    ...initialState,
    flow: {
      ...initialState.flow,
      nodes: [...initialState.flow.nodes],
      edges: [...initialState.flow.edges],
      schema: initialState.flow.schema ? { ...initialState.flow.schema, states: { ...initialState.flow.schema.states } } : undefined,
    },
    metadata: { ...initialState.metadata, updatedAt: Date.now() },
    rules: {},
    screens: {},
  };
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...cloneInitialState(),

  addScreen: (id, schema) =>
    applyDraft(set, (draft) => {
      const nextId = id?.trim() || `screen-${Object.keys(draft.screens).length + 1}`;
      if (draft.screens[nextId]) return;
      const uiSchema = schema ?? createUISchema({ pageId: nextId });
      draft.screens[nextId] = uiSchema;
      draft.activeScreenId = draft.activeScreenId ?? nextId;
      draft.flow.nodes.push({ id: nextId, position: { x: 100, y: 100 }, label: nextId });
      draft.flow.schema = upsertFlowState(draft.flow.schema, nextId);
      if (!draft.flow.startNodeId) draft.flow.startNodeId = nextId;
    }),

  removeScreen: (id) =>
    applyDraft(set, (draft) => {
      delete draft.screens[id];
      draft.flow.nodes = draft.flow.nodes.filter((n) => n.id !== id);
      draft.flow.edges = draft.flow.edges.filter((e) => e.from !== id && e.to !== id);
      if (draft.flow.schema) {
        const rest = { ...draft.flow.schema.states };
        delete rest[id];
        draft.flow.schema.states = rest;
        if (draft.flow.schema.initialState === id) {
          draft.flow.schema.initialState = Object.keys(rest)[0] ?? '';
        }
      }
      if (draft.activeScreenId === id) {
        draft.activeScreenId = Object.keys(draft.screens)[0] ?? null;
      }
      draft.metadata.updatedAt = Date.now();
    }),

  updateScreen: (id, schema) =>
    applyDraft(set, (draft) => {
      draft.screens[id] = schema;
      draft.metadata.updatedAt = Date.now();
    }),

  setActiveScreen: (id) =>
    applyDraft(set, (draft) => {
      draft.activeScreenId = id;
    }),

  updateFlow: (updater) =>
    applyDraft(set, (draft) => {
      draft.flow = updater(draft.flow);
      draft.metadata.updatedAt = Date.now();
    }),

  setFlowSchema: (schema: FlowSchema) =>
    applyDraft(set, (draft) => {
      draft.flow.schema = schema;
      draft.flow.startNodeId = schema.initialState || draft.flow.startNodeId;
      syncNodesFromSchema(draft.flow, schema);
      draft.metadata.updatedAt = Date.now();
    }),

  addRule: (rule) =>
    applyDraft(set, (draft) => {
      draft.rules[rule.ruleId] = rule;
      draft.metadata.updatedAt = Date.now();
    }),

  updateRule: (ruleId, patch) =>
    applyDraft(set, (draft) => {
      const current = draft.rules[ruleId];
      if (!current) return;
      draft.rules[ruleId] = { ...current, ...patch };
      draft.metadata.updatedAt = Date.now();
    }),

  setRules: (rules) =>
    applyDraft(set, (draft) => {
      draft.rules = rules;
      draft.metadata.updatedAt = Date.now();
    }),

  loadBundleFromUrl: async (versionId) => {
    const targetVersionId = versionId.trim();
    if (!targetVersionId) {
      get().resetProject();
      return;
    }

    const response = await fetch(`/api/config-versions/${encodeURIComponent(targetVersionId)}`, {
      method: 'GET',
      headers: { 'cache-control': 'no-store' },
    });
    if (!response.ok) {
      throw new Error(`Failed to load config version (${response.status})`);
    }

    const payload = (await response.json()) as LoadVersionResponse;
    if (!payload.ok) {
      throw new Error(payload.error);
    }

    get().loadBundleJson(payload.version.bundle);
    applyDraft(set, (draft) => {
      draft.loadedVersionId = targetVersionId;
    });
  },

  loadBundleFromUrlParams: async (params) => {
    const versionId = normalizeParam(params.get('versionId'));
    const exampleId = normalizeParam(params.get('example'));
    const draftId = normalizeParam(params.get('draftId'));
    const screenId = normalizeParam(params.get('screen'));
    const previewFlag = normalizeParam(params.get('preview'));

    if (draftId) {
      const draftBundle = readPreviewDraftBundle(draftId);
      if (!draftBundle) {
        throw new Error('Preview draft was not found. Re-apply preview from the editor.');
      }
      get().loadBundleJson(draftBundle);
      applyDraft(set, (draft) => {
        draft.loadedVersionId = null;
      });
    } else if (exampleId) {
      const response = await fetch(`/examples/bundles/${encodeURIComponent(exampleId)}.json`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Unable to load example bundle (${response.status})`);
      }

      const bundle = (await response.json()) as ConfigBundle;
      get().loadBundleJson(bundle);
      applyDraft(set, (draft) => {
        draft.loadedVersionId = null;
      });
    } else if (versionId) {
      await get().loadBundleFromUrl(versionId);
    }

    const current = get();
    if (screenId && current.screens[screenId]) {
      current.setSelectedScreen(screenId);
    } else if (!current.activeScreenId) {
      current.setSelectedScreen(Object.keys(current.screens)[0] ?? null);
    }

    if (previewFlag === '1') {
      current.setPreviewMode(true);
    }
  },

  loadBundleJson: (bundle) =>
    applyDraft(set, (draft) => {
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

      draft.screens = normalized.uiSchemasById;
      draft.activeScreenId = normalized.activeUiPageId;
      draft.flow = {
        ...draft.flow,
        startNodeId: flowSchema.initialState ?? Object.keys(flowSchema.states ?? {})[0] ?? null,
        nodes: buildFlowNodes(flowSchema),
        edges: buildFlowEdges(flowSchema),
        schema: flowSchema,
      };
      draft.rules = toRulesRecord(bundle.rules?.rules ?? []);
      draft.metadata.version = String(bundle.rules?.version ?? draft.metadata.version ?? '1.0.0');
      draft.metadata.status = 'draft';
      draft.metadata.updatedAt = Date.now();
      draft.previewMode = false;
      draft.loadedVersionId = null;
      draft.bundleJson = {
        ...bundle,
        uiSchema: normalized.uiSchemasById[normalized.activeUiPageId] ?? bundle.uiSchema,
        uiSchemasById: normalized.uiSchemasById,
        activeUiPageId: normalized.activeUiPageId,
        flowSchema,
      };
    }),

  setSelectedScreen: (screenId) =>
    applyDraft(set, (draft) => {
      draft.activeScreenId = screenId;
    }),

  setPreviewMode: (enabled) =>
    applyDraft(set, (draft) => {
      draft.previewMode = enabled;
    }),

  resetProject: () => {
    set({ ...cloneInitialState() });
  },
}));

function applyDraft(
  set: (
    fn: (state: ProjectStore) => ProjectStore,
  ) => void,
  recipe: (draft: ProjectStoreState) => void,
): void {
  set((state) => produce(state, (draft) => recipe(draft as unknown as ProjectStoreState)));
}

function upsertFlowState(schema: FlowSchema | undefined, id: string): FlowSchema {
  const base: FlowSchema =
    schema ?? {
      version: '1.0.0',
      flowId: 'flow',
      initialState: id,
      states: {},
    };
  if (!base.states[id]) {
    base.states[id] = { uiPageId: id, on: {} };
  }
  if (!base.initialState) base.initialState = id;
  return base;
}

function syncNodesFromSchema(flow: BuilderState['flow'], schema: FlowSchema) {
  const ids = Object.keys(schema.states);
  flow.nodes = ids.map((id, idx) => ({
    id,
    position: { x: 80 + (idx % 4) * 240, y: 80 + Math.floor(idx / 4) * 180 },
    label: id,
  }));
  flow.edges = buildFlowEdges(schema);
}

function createEmptyFlowSchema(): FlowSchema {
  return {
    version: '1.0.0',
    flowId: 'flow',
    initialState: '',
    states: {},
  };
}

function toRulesRecord(rules: Rule[]): Record<string, Rule> {
  return Object.fromEntries(rules.map((rule) => [rule.ruleId, rule]));
}

function buildFlowNodes(flowSchema: FlowSchema): FlowNode[] {
  const stateIds = Object.keys(flowSchema.states ?? {});
  const columns = Math.max(1, Math.ceil(Math.sqrt(stateIds.length || 1)));
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

function normalizeParam(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readPreviewDraftBundle(draftId: string): ConfigBundle | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(`${PREVIEW_DRAFT_PREFIX}${draftId}`);
    if (!raw) return null;
    return JSON.parse(raw) as ConfigBundle;
  } catch {
    return null;
  }
}
