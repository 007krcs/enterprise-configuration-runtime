import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  persistConfigStore,
  loadConfigStore,
  createEmptyConfigStore,
  type ConfigStoreState,
} from '../src/lib/config-governance';

describe('persistConfigStore', () => {
  let setItemSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setItemSpy = vi.fn();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: setItemSpy,
        removeItem: vi.fn(),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('succeeds for normal-sized state', () => {
    const state = createEmptyConfigStore();
    const result = persistConfigStore(state);
    expect(result.ok).toBe(true);
    expect(setItemSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects state exceeding 4 MB limit', () => {
    const largeState: ConfigStoreState = {
      ...createEmptyConfigStore(),
      packages: [
        {
          id: 'big',
          name: 'big',
          tenantId: 'tenant',
          createdAt: '',
          updatedAt: '',
          versions: [
            {
              id: 'v1',
              version: 1,
              status: 'DRAFT',
              createdAt: '',
              updatedAt: '',
              bundle: {
                metadata: {
                  configId: 'big',
                  tenantId: 'tenant',
                  version: 1,
                  status: 'DRAFT',
                  createdAt: '',
                  updatedAt: '',
                },
                uiSchemas: { screen: { sections: [] } },
                flowSchema: { screens: [], transitions: [] },
                rules: { version: '1', rules: [] },
                apiMappings: [],
                extensions: {
                  payload: 'x'.repeat(5 * 1024 * 1024),
                },
              },
            },
          ],
        },
      ],
    };
    const result = persistConfigStore(largeState);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('storage limit');
  });

  it('handles QuotaExceededError from localStorage', () => {
    setItemSpy.mockImplementation(() => {
      const err = new DOMException('quota exceeded', 'QuotaExceededError');
      throw err;
    });
    const state = createEmptyConfigStore();
    const result = persistConfigStore(state);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('quota exceeded');
  });

  it('handles generic storage errors', () => {
    setItemSpy.mockImplementation(() => {
      throw new Error('disk full');
    });
    const state = createEmptyConfigStore();
    const result = persistConfigStore(state);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('Failed to save');
  });
});
