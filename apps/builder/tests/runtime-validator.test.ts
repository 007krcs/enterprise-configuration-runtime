import { describe, expect, it } from 'vitest';
import {
  validateBundleRuntime,
  validateFlowTransitionTargets,
  validateLayoutNodeUniqueness,
  detectLayoutCircularReference,
} from '../src/lib/runtime-validator';
import { buildLayoutIndex, MAX_LAYOUT_DEPTH, applyPaletteDrop, createInitialBuilderSchema } from '../src/lib/layout-engine';
import type { SectionNode, UISchema } from '@platform/schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeValidBundle() {
  return {
    metadata: {
      configId: 'cfg-1',
      tenantId: 'tenant-1',
      version: 1,
      status: 'DRAFT',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    flowSchema: {
      version: '1.0.0',
      flowId: 'flow-1',
      initialState: 'screen-1',
      states: {
        'screen-1': { uiPageId: 'page-1', on: {} },
      },
    },
    uiSchemas: {
      'screen-1': {
        version: '1.0.0',
        pageId: 'page-1',
        layout: { id: 'root', type: 'stack', direction: 'vertical' },
        components: [],
        sections: [],
      },
    },
    rules: { version: '1.0.0', rules: [] },
    apiMappings: [],
  };
}

function makeSectionTree(depth: number, idPrefix = 'sec'): SectionNode {
  if (depth <= 1) {
    return {
      id: `${idPrefix}-${depth}`,
      kind: 'section',
      rows: [
        {
          id: `row-${idPrefix}-${depth}`,
          kind: 'row',
          columns: [
            {
              id: `col-${idPrefix}-${depth}`,
              kind: 'column',
              span: 12,
              children: [],
            },
          ],
        },
      ],
    };
  }

  const child = makeSectionTree(depth - 1, idPrefix);
  return {
    id: `${idPrefix}-${depth}`,
    kind: 'section',
    rows: [
      {
        id: `row-${idPrefix}-${depth}`,
        kind: 'row',
        columns: [
          {
            id: `col-${idPrefix}-${depth}`,
            kind: 'column',
            span: 12,
            children: [child],
          },
        ],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('validateBundleRuntime', () => {
  it('accepts a valid bundle', () => {
    const result = validateBundleRuntime(makeValidBundle());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects null input', () => {
    const result = validateBundleRuntime(null);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('reports missing metadata', () => {
    const bundle = makeValidBundle();
    delete (bundle as Record<string, unknown>).metadata;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'metadata')).toBe(true);
  });

  it('reports missing metadata.configId', () => {
    const bundle = makeValidBundle();
    delete (bundle.metadata as Record<string, unknown>).configId;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'metadata.configId')).toBe(true);
  });

  it('reports missing metadata.tenantId', () => {
    const bundle = makeValidBundle();
    delete (bundle.metadata as Record<string, unknown>).tenantId;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'metadata.tenantId')).toBe(true);
  });

  it('reports invalid metadata.version', () => {
    const bundle = makeValidBundle();
    (bundle.metadata as Record<string, unknown>).version = 0;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'metadata.version')).toBe(true);
  });

  it('reports missing flowSchema.states', () => {
    const bundle = makeValidBundle();
    delete (bundle.flowSchema as Record<string, unknown>).states;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'flowSchema.states')).toBe(true);
  });

  it('reports missing uiSchemas', () => {
    const bundle = makeValidBundle();
    delete (bundle as Record<string, unknown>).uiSchemas;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'uiSchemas')).toBe(true);
  });

  it('reports missing rules', () => {
    const bundle = makeValidBundle();
    delete (bundle as Record<string, unknown>).rules;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'rules')).toBe(true);
  });

  it('reports missing apiMappings', () => {
    const bundle = makeValidBundle();
    delete (bundle as Record<string, unknown>).apiMappings;
    const result = validateBundleRuntime(bundle);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === 'apiMappings')).toBe(true);
  });
});

describe('validateFlowTransitionTargets', () => {
  it('passes when all transitions reference valid screens', () => {
    const result = validateFlowTransitionTargets({
      screens: [{ id: 'a' }, { id: 'b' }],
      transitions: [{ id: 't1', from: 'a', to: 'b' }],
    });
    expect(result.valid).toBe(true);
  });

  it('detects invalid "from" screen', () => {
    const result = validateFlowTransitionTargets({
      screens: [{ id: 'a' }, { id: 'b' }],
      transitions: [{ id: 't1', from: 'missing', to: 'b' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes('from'))).toBe(true);
  });

  it('detects invalid "to" screen', () => {
    const result = validateFlowTransitionTargets({
      screens: [{ id: 'a' }, { id: 'b' }],
      transitions: [{ id: 't1', from: 'a', to: 'nowhere' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes('to'))).toBe(true);
  });
});

describe('validateLayoutNodeUniqueness', () => {
  it('passes when all node IDs are unique', () => {
    const schema = createInitialBuilderSchema('test-page');
    const result = validateLayoutNodeUniqueness(schema);
    expect(result.valid).toBe(true);
  });

  it('detects duplicate layout node IDs', () => {
    const duplicateId = 'dup-node';
    const schema: UISchema = {
      version: '1.0.0',
      pageId: 'test',
      layout: { id: 'root', type: 'stack', direction: 'vertical' },
      components: [],
      sections: [
        {
          id: duplicateId,
          kind: 'section',
          rows: [
            {
              id: 'row-1',
              kind: 'row',
              columns: [
                {
                  id: 'col-1',
                  kind: 'column',
                  span: 12,
                  children: [
                    {
                      id: duplicateId,
                      kind: 'section',
                      rows: [
                        {
                          id: 'row-inner',
                          kind: 'row',
                          columns: [{ id: 'col-inner', kind: 'column', span: 12, children: [] }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = validateLayoutNodeUniqueness(schema);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes(duplicateId))).toBe(true);
  });
});

describe('detectLayoutCircularReference', () => {
  it('passes for non-circular sections', () => {
    const sections: SectionNode[] = [makeSectionTree(3)];
    const result = detectLayoutCircularReference(sections);
    expect(result.valid).toBe(true);
  });

  it('detects a section nested within itself', () => {
    // Manually construct a circular-reference-by-id scenario:
    // A top-level section "A" contains a nested section also named "A"
    const sections: SectionNode[] = [
      {
        id: 'section-A',
        kind: 'section',
        rows: [
          {
            id: 'row-1',
            kind: 'row',
            columns: [
              {
                id: 'col-1',
                kind: 'column',
                span: 12,
                children: [
                  {
                    id: 'section-A', // same id as parent — circular
                    kind: 'section',
                    rows: [
                      {
                        id: 'row-inner',
                        kind: 'row',
                        columns: [{ id: 'col-inner', kind: 'column', span: 12, children: [] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    const result = detectLayoutCircularReference(sections);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('section-A'))).toBe(true);
  });
});

describe('MAX_LAYOUT_DEPTH enforcement', () => {
  it('exports MAX_LAYOUT_DEPTH as 10', () => {
    expect(MAX_LAYOUT_DEPTH).toBe(10);
  });

  it('buildLayoutIndex throws when depth exceeds MAX_LAYOUT_DEPTH', () => {
    const deepTree = makeSectionTree(MAX_LAYOUT_DEPTH + 1);
    expect(() => buildLayoutIndex([deepTree])).toThrow(/depth/i);
  });

  it('buildLayoutIndex accepts a tree exactly at MAX_LAYOUT_DEPTH', () => {
    const tree = makeSectionTree(MAX_LAYOUT_DEPTH);
    expect(() => buildLayoutIndex([tree])).not.toThrow();
  });

  it('applyPaletteDrop rejects nested section drop that would exceed depth', () => {
    // Build a schema with sections nested to MAX_LAYOUT_DEPTH
    const deepSection = makeSectionTree(MAX_LAYOUT_DEPTH);
    const schema: UISchema = {
      version: '1.0.0',
      pageId: 'test-page',
      layout: { id: 'root', type: 'stack', direction: 'vertical' },
      components: [],
      sections: [deepSection],
    };

    // Find the deepest column id
    let current: SectionNode = deepSection;
    while (current.rows[0]?.columns[0]?.children[0]?.kind === 'section') {
      current = current.rows[0].columns[0].children[0] as SectionNode;
    }
    const deepestColumnId = current.rows[0]?.columns[0]?.id;
    expect(deepestColumnId).toBeTruthy();

    // Try to drop a section into the deepest column — should be rejected
    const result = applyPaletteDrop(
      schema,
      { kind: 'section', type: 'layout.section', displayName: 'Too Deep' },
      { kind: 'column', columnId: deepestColumnId! },
      null,
    );

    expect(result.changed).toBe(false);
  });
});
