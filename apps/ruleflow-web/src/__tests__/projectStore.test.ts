import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowSchema, UISchema } from '@platform/schema';
import type { ConfigBundle } from '@/lib/demo/types';
import type { useProjectStore as UseProjectStoreFn } from '@/state/projectStore';

/* ---------- helpers for building test fixtures ---------- */

function makeUiSchema(pageId: string): UISchema {
  return {
    version: '1.0.0',
    pageId,
    layout: { id: 'root', type: 'grid', componentIds: [] },
    components: [],
  };
}

function makeFlowSchema(states: Record<string, string>): FlowSchema {
  const stateEntries = Object.fromEntries(
    Object.entries(states).map(([stateId, pageId]) => [stateId, { uiPageId: pageId, on: {} }]),
  );
  const initialState = Object.keys(states)[0] ?? '';
  return { version: '1.0.0', flowId: 'flow', initialState, states: stateEntries };
}

function makeBundle(overrides: Partial<ConfigBundle> = {}): ConfigBundle {
  const pageId = 'page-1';
  return {
    uiSchema: makeUiSchema(pageId),
    uiSchemasById: { [pageId]: makeUiSchema(pageId) },
    activeUiPageId: pageId,
    flowSchema: makeFlowSchema({ start: pageId }),
    rules: { version: '1.0.0', rules: [] },
    apiMappingsById: {},
    ...overrides,
  };
}

/* ---------- mock localStorage ---------- */

const storage = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => { storage.set(key, value); },
  removeItem: (key: string) => { storage.delete(key); },
  clear: () => { storage.clear(); },
  get length() { return storage.size; },
  key: (_index: number) => null,
};

/* ---------- test suite ---------- */

describe('projectStore', () => {
  let useProjectStore: typeof UseProjectStoreFn;

  beforeEach(async () => {
    vi.resetModules();

    storage.clear();

    // Provide window.localStorage for the store's persistence helpers
    (globalThis as Record<string, unknown>).window = { localStorage: localStorageMock };

    // Mock fetch globally
    globalThis.fetch = vi.fn();

    const mod = await import('@/state/projectStore');
    useProjectStore = mod.useProjectStore;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>).window;
  });

  /* ---- cloneInitialState defaults ---- */
  describe('initial state defaults', () => {
    it('returns proper default values', () => {
      const state = useProjectStore.getState();

      expect(state.screens).toEqual({});
      expect(state.activeScreenId).toBeNull();
      expect(state.flow.startNodeId).toBeNull();
      expect(state.flow.nodes).toEqual([]);
      expect(state.flow.edges).toEqual([]);
      expect(state.flow.schema).toBeDefined();
      expect(state.flow.schema?.version).toBe('1.0.0');
      expect(state.flow.schema?.states).toEqual({});
      expect(state.rules).toEqual({});
      expect(state.currentProjectId).toBe('');
      expect(state.bundle).toBeNull();
      expect(state.source).toBe('blank');
      expect(state.hasHydratedFromStorage).toBe(false);
      expect(state.previewMode).toBe(false);
      expect(state.loadedVersionId).toBeNull();
      expect(state.bundleJson).toBeNull();
    });
  });

  /* ---- loadExample ---- */
  describe('loadExample', () => {
    it('fetches and applies bundle correctly', async () => {
      const bundle = makeBundle();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(bundle),
      });
      globalThis.fetch = mockFetch;

      await useProjectStore.getState().loadExample('saas-dashboard');

      expect(mockFetch).toHaveBeenCalledWith(
        '/examples/bundles/saas-dashboard.json',
        { cache: 'no-store' },
      );

      const state = useProjectStore.getState();
      expect(state.source).toBe('example');
      expect(state.currentProjectId).toBe('example:saas-dashboard');
      expect(state.bundle).toBeTruthy();
      expect(Object.keys(state.screens).length).toBeGreaterThan(0);
    });

    it('clears bundle when given empty exampleId', async () => {
      // First set some state
      useProjectStore.getState().addScreen('s1');
      expect(Object.keys(useProjectStore.getState().screens).length).toBe(1);

      await useProjectStore.getState().loadExample('  ');

      const state = useProjectStore.getState();
      expect(state.screens).toEqual({});
      expect(state.source).toBe('blank');
    });

    it('throws when fetch fails', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      await expect(useProjectStore.getState().loadExample('nonexistent')).rejects.toThrow(
        'Unable to load example bundle (404)',
      );
    });
  });

  /* ---- addScreen ---- */
  describe('addScreen', () => {
    it('creates a new screen and adds a flow node', () => {
      useProjectStore.getState().addScreen('checkout');

      const state = useProjectStore.getState();
      expect(state.screens['checkout']).toBeDefined();
      expect(state.screens['checkout'].pageId).toBe('checkout');
      expect(state.flow.nodes).toHaveLength(1);
      expect(state.flow.nodes[0]?.id).toBe('checkout');
      expect(state.flow.startNodeId).toBe('checkout');
      expect(state.flow.schema?.states['checkout']).toBeDefined();
    });

    it('auto-generates id when none provided', () => {
      useProjectStore.getState().addScreen();
      const state = useProjectStore.getState();
      const screenIds = Object.keys(state.screens);
      expect(screenIds).toHaveLength(1);
      expect(screenIds[0]).toMatch(/^screen-/);
    });

    it('does not overwrite an existing screen', () => {
      useProjectStore.getState().addScreen('checkout');
      const original = useProjectStore.getState().screens['checkout'];

      useProjectStore.getState().addScreen('checkout');
      expect(useProjectStore.getState().screens['checkout']).toEqual(original);
      expect(useProjectStore.getState().flow.nodes).toHaveLength(1);
    });

    it('sets activeScreenId if none is active', () => {
      expect(useProjectStore.getState().activeScreenId).toBeNull();
      useProjectStore.getState().addScreen('first');
      expect(useProjectStore.getState().activeScreenId).toBe('first');
    });
  });

  /* ---- removeScreen ---- */
  describe('removeScreen', () => {
    it('cleans up flow nodes and edges', () => {
      const { addScreen, removeScreen, updateFlow } = useProjectStore.getState();
      addScreen('page-a');
      addScreen('page-b');

      // Add an edge between the two nodes
      updateFlow((flow) => ({
        ...flow,
        edges: [
          ...flow.edges,
          { id: 'e1', from: 'page-a', to: 'page-b', onEvent: 'next' },
        ],
      }));

      expect(useProjectStore.getState().flow.nodes).toHaveLength(2);
      expect(useProjectStore.getState().flow.edges).toHaveLength(1);

      removeScreen('page-a');

      const state = useProjectStore.getState();
      expect(state.screens['page-a']).toBeUndefined();
      expect(state.flow.nodes).toHaveLength(1);
      expect(state.flow.nodes[0]?.id).toBe('page-b');
      expect(state.flow.edges).toHaveLength(0);
      expect(state.flow.schema?.states['page-a']).toBeUndefined();
    });

    it('updates activeScreenId when removing the active screen', () => {
      const { addScreen } = useProjectStore.getState();
      addScreen('s1');
      addScreen('s2');
      useProjectStore.getState().setActiveScreen('s1');

      useProjectStore.getState().removeScreen('s1');
      expect(useProjectStore.getState().activeScreenId).toBe('s2');
    });

    it('updates flow initialState when removing the initial state', () => {
      const { addScreen } = useProjectStore.getState();
      addScreen('first');
      addScreen('second');

      expect(useProjectStore.getState().flow.schema?.initialState).toBe('first');
      useProjectStore.getState().removeScreen('first');
      expect(useProjectStore.getState().flow.schema?.initialState).toBe('second');
    });
  });

  /* ---- setFlowSchema ---- */
  describe('setFlowSchema', () => {
    it('updates flow and syncs nodes from schema states', () => {
      const schema: FlowSchema = {
        version: '1.0.0',
        flowId: 'flow',
        initialState: 'welcome',
        states: {
          welcome: { uiPageId: 'welcome', on: { next: { target: 'finish' } } },
          finish: { uiPageId: 'finish', on: {} },
        },
      };

      useProjectStore.getState().setFlowSchema(schema);

      const state = useProjectStore.getState();
      expect(state.flow.schema).toEqual(schema);
      expect(state.flow.startNodeId).toBe('welcome');
      expect(state.flow.nodes).toHaveLength(2);
      expect(state.flow.nodes.map((n) => n.id).sort()).toEqual(['finish', 'welcome']);
      expect(state.flow.edges).toHaveLength(1);
      expect(state.flow.edges[0]?.from).toBe('welcome');
      expect(state.flow.edges[0]?.to).toBe('finish');
    });
  });

  /* ---- hydrateFromStorage ---- */
  describe('hydrateFromStorage', () => {
    it('restores state from localStorage', async () => {
      const bundle = makeBundle();
      const snapshot = {
        currentProjectId: 'example:test',
        source: 'example',
        lastLoadedAt: 1000,
        bundle,
      };
      storage.set('ecr.currentBundle.v1', JSON.stringify(snapshot));

      // Re-import to get a fresh store
      vi.resetModules();
      const mod = await import('@/state/projectStore');
      useProjectStore = mod.useProjectStore;

      expect(useProjectStore.getState().hasHydratedFromStorage).toBe(false);

      useProjectStore.getState().hydrateFromStorage();

      const state = useProjectStore.getState();
      expect(state.hasHydratedFromStorage).toBe(true);
      expect(state.currentProjectId).toBe('example:test');
      expect(state.source).toBe('example');
      expect(Object.keys(state.screens).length).toBeGreaterThan(0);
    });

    it('only runs once (idempotent)', async () => {
      vi.resetModules();
      const mod = await import('@/state/projectStore');
      useProjectStore = mod.useProjectStore;

      useProjectStore.getState().hydrateFromStorage();
      useProjectStore.getState().addScreen('extra');

      // second call should be a no-op
      useProjectStore.getState().hydrateFromStorage();
      expect(useProjectStore.getState().screens['extra']).toBeDefined();
    });

    it('sets hydrated flag even when no snapshot exists', async () => {
      vi.resetModules();
      const mod = await import('@/state/projectStore');
      useProjectStore = mod.useProjectStore;

      useProjectStore.getState().hydrateFromStorage();
      expect(useProjectStore.getState().hasHydratedFromStorage).toBe(true);
      expect(useProjectStore.getState().bundle).toBeNull();
    });
  });

  /* ---- clearBundle ---- */
  describe('clearBundle', () => {
    it('resets state back to defaults', () => {
      // First put something in the store
      useProjectStore.getState().addScreen('checkout');
      expect(Object.keys(useProjectStore.getState().screens).length).toBe(1);

      useProjectStore.getState().clearBundle();

      const state = useProjectStore.getState();
      expect(state.screens).toEqual({});
      expect(state.activeScreenId).toBeNull();
      expect(state.flow.nodes).toEqual([]);
      expect(state.flow.edges).toEqual([]);
      expect(state.rules).toEqual({});
      expect(state.bundle).toBeNull();
      expect(state.source).toBe('blank');
      expect(state.currentProjectId).toBe('');
      expect(state.hasHydratedFromStorage).toBe(true);
    });

    it('removes persisted snapshot from localStorage', () => {
      storage.set('ecr.currentBundle.v1', '{}');
      useProjectStore.getState().clearBundle();
      expect(storage.has('ecr.currentBundle.v1')).toBe(false);
    });
  });
});
