import {
  addFlowScreen,
  createFlowGraph,
  createFlowScreen,
  createFlowTransition,
  removeFlowScreen,
  removeFlowTransition,
  resetLayoutIdCounter,
  stateMachineToFlowGraph,
  upsertFlowTransition,
  updateFlowScreen,
  type FlowGraphSchema,
  type FlowTransitionEdge,
} from '@platform/schema';
import type { UISchema } from '@platform/schema';
import { createInitialBuilderSchema } from './layout-engine';

export interface BuilderFlowState {
  flow: FlowGraphSchema;
  schemasByScreenId: Record<string, UISchema>;
  activeScreenId: string;
}

export interface AddScreenResult {
  flow: FlowGraphSchema;
  schemasByScreenId: Record<string, UISchema>;
  newScreenId: string;
}

export function createInitialBuilderFlowState(): BuilderFlowState {
  // Reset the layout ID counter so that SSR and CSR produce identical node IDs.
  // Without this, the global counter drifts between server and client rendering,
  // causing React hydration mismatches on column/section/row IDs.
  resetLayoutIdCounter();

  const firstScreenId = 'screen-1';
  const firstScreen = createFlowScreen({
    id: firstScreenId,
    title: 'Screen 1',
    uiPageId: `${firstScreenId}-page`,
    position: nextScreenPosition(0),
  });

  return {
    flow: createFlowGraph({
      flowId: 'builder-flow',
      screens: [firstScreen],
      initialScreenId: firstScreenId,
      transitions: [],
    }),
    schemasByScreenId: {
      [firstScreenId]: createInitialBuilderSchema(firstScreen.uiPageId),
    },
    activeScreenId: firstScreenId,
  };
}

export function createBuilderFlowStateFromLegacy(
  flowStateMachine: Parameters<typeof stateMachineToFlowGraph>[0],
): BuilderFlowState {
  const graph = stateMachineToFlowGraph(flowStateMachine);
  const schemasByScreenId = Object.fromEntries(
    graph.screens.map((screen) => [screen.id, createInitialBuilderSchema(screen.uiPageId)]),
  );

  const fallbackScreenId = graph.screens[0]?.id ?? createInitialBuilderFlowState().activeScreenId;

  return {
    flow: graph,
    schemasByScreenId,
    activeScreenId: graph.initialScreenId || fallbackScreenId,
  };
}

export function addBuilderScreen(
  flow: FlowGraphSchema,
  schemasByScreenId: Record<string, UISchema>,
  title?: string,
): AddScreenResult {
  const screenId = createUniqueScreenId(flow, title ?? 'screen');
  const screenTitle = normalizeScreenTitle(title, flow.screens.length + 1);
  const uiPageId = `${screenId}-page`;

  const nextFlow = addFlowScreen(
    flow,
    createFlowScreen({
      id: screenId,
      title: screenTitle,
      uiPageId,
      position: nextScreenPosition(flow.screens.length),
    }),
  );

  return {
    flow: nextFlow,
    schemasByScreenId: {
      ...schemasByScreenId,
      [screenId]: createInitialBuilderSchema(uiPageId),
    },
    newScreenId: screenId,
  };
}

export function removeBuilderScreen(
  flow: FlowGraphSchema,
  schemasByScreenId: Record<string, UISchema>,
  screenId: string,
): AddScreenResult {
  if (flow.screens.length <= 1) {
    return {
      flow,
      schemasByScreenId,
      newScreenId: flow.initialScreenId,
    };
  }

  const nextFlow = removeFlowScreen(flow, screenId);
  const nextSchemas = { ...schemasByScreenId };
  delete nextSchemas[screenId];
  const fallbackScreenId = nextFlow.initialScreenId || nextFlow.screens[0]?.id || '';

  return {
    flow: nextFlow,
    schemasByScreenId: nextSchemas,
    newScreenId: fallbackScreenId,
  };
}

export function renameBuilderScreen(flow: FlowGraphSchema, screenId: string, title: string): FlowGraphSchema {
  return updateFlowScreen(flow, screenId, {
    title: title.trim() || 'Untitled Screen',
  });
}

export function rebindBuilderScreenPage(
  flow: FlowGraphSchema,
  schemasByScreenId: Record<string, UISchema>,
  screenId: string,
  uiPageId: string,
): { flow: FlowGraphSchema; schemasByScreenId: Record<string, UISchema> } {
  const normalizedPageId = uiPageId.trim() || `${screenId}-page`;
  const nextFlow = updateFlowScreen(flow, screenId, {
    uiPageId: normalizedPageId,
  });

  const existingSchema = schemasByScreenId[screenId] ?? createInitialBuilderSchema(normalizedPageId);
  const nextSchema: UISchema = {
    ...existingSchema,
    pageId: normalizedPageId,
  };

  return {
    flow: nextFlow,
    schemasByScreenId: {
      ...schemasByScreenId,
      [screenId]: nextSchema,
    },
  };
}

export function addBuilderTransition(
  flow: FlowGraphSchema,
  input: {
    from: string;
    to: string;
    onEvent?: string;
    condition?: string;
  },
): { flow: FlowGraphSchema; transitionId: string; cycleWarning?: string } {
  const transition = createFlowTransition({
    from: input.from,
    to: input.to,
    onEvent: input.onEvent ?? 'next',
    condition: normalizeOptionalText(input.condition),
  });

  const nextFlow = upsertFlowTransition(flow, transition);
  const cycles = detectFlowCycles(nextFlow);
  const cycleWarning =
    cycles.length > 0
      ? `Adding this transition creates a cycle: ${cycles.map((c) => c.join(' -> ')).join('; ')}`
      : undefined;

  return {
    flow: nextFlow,
    transitionId: transition.id,
    cycleWarning,
  };
}

export function updateBuilderTransition(
  flow: FlowGraphSchema,
  transitionId: string,
  patch: Partial<Pick<FlowTransitionEdge, 'from' | 'to' | 'onEvent' | 'condition'>>,
): FlowGraphSchema {
  const existing = flow.transitions.find((transition) => transition.id === transitionId);
  if (!existing) {
    return flow;
  }

  return upsertFlowTransition(flow, {
    ...existing,
    ...patch,
    onEvent: patch.onEvent?.trim() || existing.onEvent,
    condition:
      typeof patch.condition === 'string'
        ? normalizeOptionalText(patch.condition)
        : patch.condition ?? existing.condition,
  });
}

export function deleteBuilderTransition(flow: FlowGraphSchema, transitionId: string): FlowGraphSchema {
  return removeFlowTransition(flow, transitionId);
}

export function updateBuilderScreenPosition(
  flow: FlowGraphSchema,
  screenId: string,
  position: { x: number; y: number },
): FlowGraphSchema {
  return updateFlowScreen(flow, screenId, {
    position: {
      x: Math.max(0, Math.round(position.x)),
      y: Math.max(0, Math.round(position.y)),
    },
  });
}

/**
 * Detect cycles in a flow graph using DFS.
 * Returns an array of cycle paths (each path is an array of screen IDs forming the cycle).
 * Returns an empty array if the graph is acyclic.
 */
export function detectFlowCycles(flow: FlowGraphSchema): string[][] {
  const adjacency = new Map<string, string[]>();
  for (const screen of flow.screens) {
    adjacency.set(screen.id, []);
  }
  for (const transition of flow.transitions) {
    const neighbors = adjacency.get(transition.from);
    if (neighbors) {
      neighbors.push(transition.to);
    }
  }

  const WHITE = 0; // unvisited
  const GRAY = 1; // in current DFS path
  const BLACK = 2; // fully processed
  const color = new Map<string, number>();
  for (const screen of flow.screens) {
    color.set(screen.id, WHITE);
  }

  const cycles: string[][] = [];
  const path: string[] = [];

  function dfs(node: string): void {
    color.set(node, GRAY);
    path.push(node);

    for (const neighbor of adjacency.get(node) ?? []) {
      const neighborColor = color.get(neighbor);
      if (neighborColor === GRAY) {
        // Found a cycle - extract it from the path
        const cycleStart = path.indexOf(neighbor);
        const cyclePath = [...path.slice(cycleStart), neighbor];
        cycles.push(cyclePath);
      } else if (neighborColor === WHITE) {
        dfs(neighbor);
      }
    }

    path.pop();
    color.set(node, BLACK);
  }

  for (const screen of flow.screens) {
    if (color.get(screen.id) === WHITE) {
      dfs(screen.id);
    }
  }

  return cycles;
}

function createUniqueScreenId(flow: FlowGraphSchema, rawTitle: string): string {
  const normalized = rawTitle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const base = normalized.length > 0 ? normalized : 'screen';
  const existing = new Set(flow.screens.map((screen) => screen.id));

  if (!existing.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existing.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

function normalizeScreenTitle(title: string | undefined, fallbackIndex: number): string {
  const normalized = title?.trim();
  if (!normalized) {
    return `Screen ${fallbackIndex}`;
  }
  return normalized;
}

const SCREEN_GRID_COLUMNS = 3;
const SCREEN_GRID_OFFSET_X = 80;
const SCREEN_GRID_OFFSET_Y = 100;
const SCREEN_GRID_SPACING_X = 280;
const SCREEN_GRID_SPACING_Y = 200;

function nextScreenPosition(index: number): { x: number; y: number } {
  const column = index % SCREEN_GRID_COLUMNS;
  const row = Math.floor(index / SCREEN_GRID_COLUMNS);
  return {
    x: SCREEN_GRID_OFFSET_X + column * SCREEN_GRID_SPACING_X,
    y: SCREEN_GRID_OFFSET_Y + row * SCREEN_GRID_SPACING_Y,
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
