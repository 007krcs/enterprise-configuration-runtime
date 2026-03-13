import { describe, expect, it } from 'vitest';
import {
  createFlowGraph,
  createFlowScreen,
  createFlowTransition,
} from '@platform/schema';
import { exportToCsv } from '@platform/data-grid';
import { addBuilderTransition, detectFlowCycles } from '../src/lib/flow-engine';

describe('CSV formula injection prevention', () => {
  it('prefixes cells starting with = to prevent formula injection', () => {
    const rows = [{ name: '=SUM(A:A)', value: 'safe' }];
    const columns = [
      { key: 'name', title: 'Name' },
      { key: 'value', title: 'Value' },
    ];
    const csv = exportToCsv(rows, columns);
    const dataLine = csv.split('\n')[1]!;
    expect(dataLine).toContain("'=SUM(A:A)");
    expect(dataLine).not.toMatch(/(?<!')==SUM/);
  });
});

describe('flow cycle detection', () => {
  function makeFlow(
    screenIds: string[],
    transitions: Array<{ from: string; to: string }>,
  ) {
    return createFlowGraph({
      flowId: 'test-flow',
      screens: screenIds.map((id) =>
        createFlowScreen({ id, title: id, uiPageId: `${id}-page` }),
      ),
      transitions: transitions.map((t) =>
        createFlowTransition({ from: t.from, to: t.to, onEvent: 'next' }),
      ),
      initialScreenId: screenIds[0],
    });
  }

  it('detects a simple A -> B -> A cycle', () => {
    const flow = makeFlow(['A', 'B'], [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'A' },
    ]);
    const cycles = detectFlowCycles(flow);
    expect(cycles.length).toBeGreaterThan(0);
    const flat = cycles.flat();
    expect(flat).toContain('A');
    expect(flat).toContain('B');
  });

  it('detects a longer A -> B -> C -> A cycle', () => {
    const flow = makeFlow(['A', 'B', 'C'], [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
      { from: 'C', to: 'A' },
    ]);
    const cycles = detectFlowCycles(flow);
    expect(cycles.length).toBeGreaterThan(0);
    // The cycle should contain all three nodes
    const cyclePath = cycles[0]!;
    expect(cyclePath).toContain('A');
    expect(cyclePath).toContain('B');
    expect(cyclePath).toContain('C');
  });

  it('returns no cycles for an acyclic graph', () => {
    const flow = makeFlow(['A', 'B', 'C'], [
      { from: 'A', to: 'B' },
      { from: 'B', to: 'C' },
    ]);
    const cycles = detectFlowCycles(flow);
    expect(cycles).toEqual([]);
  });

  it('detects a self-loop (A -> A)', () => {
    const flow = makeFlow(['A'], [{ from: 'A', to: 'A' }]);
    const cycles = detectFlowCycles(flow);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain('A');
  });

  it('addBuilderTransition includes a cycle warning when creating a cycle', () => {
    const flow = makeFlow(['A', 'B'], [{ from: 'A', to: 'B' }]);
    const result = addBuilderTransition(flow, { from: 'B', to: 'A' });
    expect(result.flow.transitions).toHaveLength(2);
    expect(result.cycleWarning).toBeDefined();
    expect(result.cycleWarning).toContain('cycle');
  });
});
