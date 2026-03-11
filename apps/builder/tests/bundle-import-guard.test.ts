import { describe, it, expect } from 'vitest';
import { checkFileSize, validateBundleStructure } from '../src/lib/bundle-import-guard';

describe('checkFileSize', () => {
  it('returns null for files under the 5 MB limit', () => {
    const file = new File(['x'.repeat(100)], 'bundle.json', { type: 'application/json' });
    expect(checkFileSize(file)).toBeNull();
  });

  it('returns an error message for files over 5 MB', () => {
    const content = 'x'.repeat(6 * 1024 * 1024);
    const file = new File([content], 'huge.json', { type: 'application/json' });
    const result = checkFileSize(file);
    expect(result).toContain('File too large');
    expect(result).toContain('5 MB');
  });
});

describe('validateBundleStructure', () => {
  const validBundle = {
    metadata: {
      configId: 'cfg-1',
      tenantId: 'tenant-1',
      version: 1,
      status: 'DRAFT',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    uiSchemas: {},
    flowSchema: { screens: [], transitions: [] },
    rules: { version: '1.0.0', rules: [] },
    apiMappings: [],
  };

  it('accepts a well-formed bundle', () => {
    const result = validateBundleStructure(validBundle);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bundle).toBe(validBundle);
    }
  });

  it('rejects null', () => {
    const result = validateBundleStructure(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('JSON object');
  });

  it('rejects arrays', () => {
    const result = validateBundleStructure([1, 2, 3]);
    expect(result.ok).toBe(false);
  });

  it('rejects missing metadata', () => {
    const { metadata, ...rest } = validBundle;
    const result = validateBundleStructure(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('metadata');
  });

  it('rejects missing metadata.configId', () => {
    const result = validateBundleStructure({
      ...validBundle,
      metadata: { ...validBundle.metadata, configId: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('configId');
  });

  it('rejects missing metadata.tenantId', () => {
    const result = validateBundleStructure({
      ...validBundle,
      metadata: { ...validBundle.metadata, tenantId: '' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('tenantId');
  });

  it('rejects invalid metadata.version', () => {
    const result = validateBundleStructure({
      ...validBundle,
      metadata: { ...validBundle.metadata, version: 0 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('version');
  });

  it('rejects invalid metadata.status', () => {
    const result = validateBundleStructure({
      ...validBundle,
      metadata: { ...validBundle.metadata, status: 'INVALID' },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('status');
  });

  it('rejects missing flowSchema', () => {
    const { flowSchema, ...rest } = validBundle;
    const result = validateBundleStructure(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('flowSchema');
  });

  it('rejects flowSchema without screens array', () => {
    const result = validateBundleStructure({
      ...validBundle,
      flowSchema: { transitions: [] },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('screens');
  });

  it('rejects missing uiSchemas', () => {
    const { uiSchemas, ...rest } = validBundle;
    const result = validateBundleStructure(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('uiSchemas');
  });

  it('rejects missing rules', () => {
    const { rules, ...rest } = validBundle;
    const result = validateBundleStructure(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('rules');
  });

  it('rejects missing apiMappings', () => {
    const { apiMappings, ...rest } = validBundle;
    const result = validateBundleStructure(rest);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('apiMappings');
  });
});
