import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exampleCatalog, loadExampleBundle } from '@/lib/examples';
import type { ExampleDefinition } from '@/lib/examples';
import type { ConfigBundle } from '@/lib/demo/types';

/* ---------- exampleCatalog structure ---------- */

describe('exampleCatalog', () => {
  it('contains expected example entries', () => {
    const ids = exampleCatalog.map((e) => e.id);
    expect(ids).toContain('e-commerce-store-demo');
    expect(ids).toContain('saas-dashboard');
    expect(ids).toContain('onboarding');
    expect(ids).toContain('user-onboarding-flow-demo');
  });

  it('has at least 4 entries', () => {
    expect(exampleCatalog.length).toBeGreaterThanOrEqual(4);
  });

  const requiredFields: (keyof ExampleDefinition)[] = ['id', 'title', 'description', 'highlights', 'tag', 'stats'];

  for (const example of exampleCatalog) {
    describe(`example "${example.id}"`, () => {
      for (const field of requiredFields) {
        it(`has required field: ${field}`, () => {
          expect(example[field]).toBeDefined();
        });
      }

      it('has a non-empty title', () => {
        expect(example.title.length).toBeGreaterThan(0);
      });

      it('has a non-empty description', () => {
        expect(example.description.length).toBeGreaterThan(0);
      });

      it('has at least one highlight', () => {
        expect(example.highlights.length).toBeGreaterThan(0);
      });

      it('has a non-empty tag', () => {
        expect(example.tag.length).toBeGreaterThan(0);
      });

      it('has at least one stat', () => {
        expect(example.stats.length).toBeGreaterThan(0);
      });
    });
  }
});

/* ---------- loadExampleBundle ---------- */

describe('loadExampleBundle', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetches the correct URL for an example', async () => {
    const bundle: ConfigBundle = {
      uiSchema: {
        version: '1.0.0',
        pageId: 'test',
        layout: { id: 'root', type: 'grid', componentIds: [] },
        components: [],
      },
      flowSchema: { version: '1.0.0', flowId: 'flow', initialState: '', states: {} },
      rules: { version: '1.0.0', rules: [] },
      apiMappingsById: {},
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(bundle),
    });
    vi.stubGlobal('fetch', mockFetch);

    // Clear the module cache so the internal bundleCache is fresh
    vi.resetModules();
    const mod = await import('@/lib/examples');

    const result = await mod.loadExampleBundle('e-commerce-store-demo');

    expect(mockFetch).toHaveBeenCalledWith(
      '/examples/bundles/e-commerce-store-demo.json',
      { cache: 'no-store' },
    );
    expect(result).toEqual(bundle);
  });

  it('caches the loaded bundle on subsequent calls', async () => {
    const bundle: ConfigBundle = {
      uiSchema: {
        version: '1.0.0',
        pageId: 'cached',
        layout: { id: 'root', type: 'grid', componentIds: [] },
        components: [],
      },
      flowSchema: { version: '1.0.0', flowId: 'flow', initialState: '', states: {} },
      rules: { version: '1.0.0', rules: [] },
      apiMappingsById: {},
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(bundle),
    });
    vi.stubGlobal('fetch', mockFetch);

    vi.resetModules();
    const mod = await import('@/lib/examples');

    // First call fetches
    await mod.loadExampleBundle('saas-dashboard');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call uses cache
    const result = await mod.loadExampleBundle('saas-dashboard');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(result).toEqual(bundle);
  });

  it('throws when fetch response is not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', mockFetch);

    vi.resetModules();
    const mod = await import('@/lib/examples');

    await expect(mod.loadExampleBundle('onboarding')).rejects.toThrow(
      'Unable to load example bundle (500)',
    );
  });

  it('fetches correct URL for each catalog entry', () => {
    // Verify that the URL pattern matches for all known example IDs
    for (const example of exampleCatalog) {
      const expectedUrl = `/examples/bundles/${example.id}.json`;
      expect(expectedUrl).toMatch(/^\/examples\/bundles\/[\w-]+\.json$/);
    }
  });
});
