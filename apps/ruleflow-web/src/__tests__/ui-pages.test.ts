import { describe, expect, it } from 'vitest';
import type { FlowSchema, UISchema } from '@platform/schema';
import {
  createSinglePageBundle,
  normalizeUiPages,
  rebindFlowSchemaToAvailablePages,
} from '@/lib/demo/ui-pages';

/* ---------- test helpers ---------- */

function makeSchema(pageId: string): UISchema {
  return {
    version: '1.0.0',
    pageId,
    layout: { id: 'root', type: 'grid', componentIds: [] },
    components: [],
  };
}

function makeFlow(statePages: Record<string, string>, initialState?: string): FlowSchema {
  const states = Object.fromEntries(
    Object.entries(statePages).map(([stateId, pageId]) => [stateId, { uiPageId: pageId, on: {} }]),
  );
  return {
    version: '1.0.0',
    flowId: 'flow',
    initialState: initialState ?? Object.keys(statePages)[0] ?? '',
    states,
  };
}

/* ---------- normalizeUiPages ---------- */

describe('normalizeUiPages', () => {
  it('normalizes a single uiSchema into uiSchemasById', () => {
    const ui = makeSchema('orders');
    const result = normalizeUiPages({ uiSchema: ui });

    expect(Object.keys(result.uiSchemasById)).toEqual(['orders']);
    expect(result.uiSchemasById['orders']?.pageId).toBe('orders');
    expect(result.activeUiPageId).toBe('orders');
  });

  it('normalizes multiple uiSchemasById', () => {
    const schemas: Record<string, UISchema> = {
      checkout: makeSchema('checkout'),
      review: makeSchema('review'),
      confirm: makeSchema('confirm'),
    };
    const result = normalizeUiPages({ uiSchemasById: schemas, activeUiPageId: 'review' });

    expect(Object.keys(result.uiSchemasById)).toEqual(['checkout', 'review', 'confirm']);
    expect(result.activeUiPageId).toBe('review');
    expect(result.uiSchemasById['review']?.pageId).toBe('review');
  });

  it('falls back to first page when activeUiPageId is missing from the map', () => {
    const schemas: Record<string, UISchema> = {
      dashboard: makeSchema('dashboard'),
      settings: makeSchema('settings'),
    };
    const result = normalizeUiPages({
      uiSchemasById: schemas,
      activeUiPageId: 'nonexistent-page',
    });

    // Should pick the first available page since 'nonexistent-page' does not exist
    expect(result.activeUiPageId).toBe('dashboard');
  });

  it('uses flowSchema initialState page as active when activeUiPageId is missing', () => {
    const schemas: Record<string, UISchema> = {
      welcome: makeSchema('welcome'),
      finish: makeSchema('finish'),
    };
    const flow = makeFlow({ start: 'finish' }, 'start');

    const result = normalizeUiPages({
      uiSchemasById: schemas,
      flowSchema: flow,
    });

    // Flow's initial state 'start' points to uiPageId 'finish', which exists in the map
    expect(result.activeUiPageId).toBe('finish');
  });

  it('prefers uiSchemasById over single uiSchema when both are provided', () => {
    const single = makeSchema('single');
    const multi: Record<string, UISchema> = {
      alpha: makeSchema('alpha'),
      beta: makeSchema('beta'),
    };

    const result = normalizeUiPages({
      uiSchema: single,
      uiSchemasById: multi,
      activeUiPageId: 'beta',
    });

    expect(Object.keys(result.uiSchemasById)).toEqual(['alpha', 'beta']);
    expect(result.uiSchemasById['single']).toBeUndefined();
    expect(result.activeUiPageId).toBe('beta');
  });

  it('uses fallback page id when uiSchema has empty pageId', () => {
    const ui = makeSchema('');
    const result = normalizeUiPages({ uiSchema: ui });

    // Empty pageId should be replaced with the FALLBACK_PAGE_ID constant
    expect(result.activeUiPageId).toBe('builder-preview');
    expect(result.uiSchemasById['builder-preview']).toBeDefined();
  });
});

/* ---------- rebindFlowSchemaToAvailablePages ---------- */

describe('rebindFlowSchemaToAvailablePages', () => {
  it('binds missing pages to the fallback page', () => {
    const flow = makeFlow({ start: 'missing-page', review: 'also-missing' }, 'start');
    const available = { orders: makeSchema('orders') };

    const result = rebindFlowSchemaToAvailablePages(flow, available, 'orders');

    expect(result).not.toBeNull();
    expect(result!.states.start.uiPageId).toBe('orders');
    expect(result!.states.review.uiPageId).toBe('orders');
  });

  it('keeps pages that already exist in the available set', () => {
    const flow = makeFlow({ step1: 'dashboard', step2: 'settings' }, 'step1');
    const available = {
      dashboard: makeSchema('dashboard'),
      settings: makeSchema('settings'),
    };

    const result = rebindFlowSchemaToAvailablePages(flow, available, 'dashboard');

    expect(result!.states.step1.uiPageId).toBe('dashboard');
    expect(result!.states.step2.uiPageId).toBe('settings');
  });

  it('returns null when flowSchema is null', () => {
    const result = rebindFlowSchemaToAvailablePages(null, { p: makeSchema('p') }, 'p');
    expect(result).toBeNull();
  });

  it('returns deep clone when no available pages', () => {
    const flow = makeFlow({ s1: 'page-x' });
    const result = rebindFlowSchemaToAvailablePages(flow, {}, 'fallback');

    expect(result).toEqual(flow);
    // Should be a distinct object (deep clone)
    expect(result).not.toBe(flow);
  });

  it('falls back to first available page when fallbackPageId is not in available set', () => {
    const flow = makeFlow({ s1: 'unknown' });
    const available = { actual: makeSchema('actual') };

    const result = rebindFlowSchemaToAvailablePages(flow, available, 'does-not-exist');

    expect(result!.states.s1.uiPageId).toBe('actual');
  });
});

/* ---------- createSinglePageBundle ---------- */

describe('createSinglePageBundle', () => {
  it('creates a proper bundle with a single page', () => {
    const ui = makeSchema('my-page');
    const flow = makeFlow({ state1: 'my-page' });
    const rules = { version: '1.0.0', rules: [] };
    const apiMappingsById = {};

    const bundle = createSinglePageBundle({
      uiSchema: ui,
      flowSchema: flow,
      rules,
      apiMappingsById,
    });

    expect(bundle.activeUiPageId).toBe('my-page');
    expect(Object.keys(bundle.uiSchemasById ?? {})).toEqual(['my-page']);
    expect(bundle.uiSchema?.pageId).toBe('my-page');
    expect(bundle.flowSchema.states.state1.uiPageId).toBe('my-page');
    expect(bundle.rules).toBe(rules);
    expect(bundle.apiMappingsById).toBe(apiMappingsById);
  });

  it('normalizes pageId to fallback when empty', () => {
    const ui = makeSchema('');
    const flow = makeFlow({ s1: '' });

    const bundle = createSinglePageBundle({
      uiSchema: ui,
      flowSchema: flow,
      rules: { version: '1.0.0', rules: [] },
      apiMappingsById: {},
    });

    expect(bundle.activeUiPageId).toBe('builder-preview');
    expect(bundle.uiSchema?.pageId).toBe('builder-preview');
    expect(Object.keys(bundle.uiSchemasById ?? {})).toEqual(['builder-preview']);
  });

  it('rebinds flow states to the single page', () => {
    const ui = makeSchema('only-page');
    const flow: FlowSchema = {
      version: '1.0.0',
      flowId: 'flow',
      initialState: 's1',
      states: {
        s1: { uiPageId: 'wrong-ref', on: {} },
        s2: { uiPageId: 'another-wrong', on: {} },
      },
    };

    const bundle = createSinglePageBundle({
      uiSchema: ui,
      flowSchema: flow,
      rules: { version: '1.0.0', rules: [] },
      apiMappingsById: {},
    });

    expect(bundle.flowSchema.states.s1.uiPageId).toBe('only-page');
    expect(bundle.flowSchema.states.s2.uiPageId).toBe('only-page');
  });
});
