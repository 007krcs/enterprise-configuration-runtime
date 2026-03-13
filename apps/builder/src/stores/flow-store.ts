import { create } from 'zustand';
import type { FlowTransitionEdge } from '@platform/schema';
import {
  addBuilderScreen,
  addBuilderTransition,
  createInitialBuilderFlowState,
  deleteBuilderTransition,
  removeBuilderScreen,
  updateBuilderScreenPosition,
  updateBuilderTransition,
  type BuilderFlowState,
} from '../lib/flow-engine';
import { createInitialBuilderSchema } from '../lib/layout-engine';
import type { UISchema } from '@platform/schema';

export interface TransitionDraft {
  from: string;
  to: string;
  onEvent: string;
  condition: string;
}

export interface FlowStoreState {
  flowGraph: BuilderFlowState['flow'];
  activeScreenId: string;
  selectedFlowScreenId: string | null;
  selectedTransitionId: string | null;
  newScreenTitle: string;
  transitionDraft: TransitionDraft;
  schemasByScreenId: Record<string, UISchema>;
  selectedLayoutNodeByScreen: Record<string, string | null>;
}

export interface FlowStoreActions {
  setActiveScreenId: (value: string | ((prev: string) => string)) => void;
  setSelectedFlowScreenId: (value: string | null | ((prev: string | null) => string | null)) => void;
  setSelectedTransitionId: (value: string | null | ((prev: string | null) => string | null)) => void;
  setNewScreenTitle: (value: string | ((prev: string) => string)) => void;
  setTransitionDraft: (value: TransitionDraft | ((prev: TransitionDraft) => TransitionDraft)) => void;

  handleSelectScreen: (screenId: string) => void;
  handleAddScreen: () => string;
  handleRemoveSelectedScreen: () => void;
  handleFlowConnectionCreate: (input: { from: string; to: string }) => string;
  handleFlowScreenMove: (input: { screenId: string; position: { x: number; y: number } }) => void;
  handleAddTransitionFromForm: () => string | null;
  handleTransitionPatch: (transitionId: string, patch: Partial<Pick<FlowTransitionEdge, 'from' | 'to' | 'onEvent' | 'condition'>>) => void;
  handleRemoveTransition: (transitionId: string) => void;

  setFlowGraph: (flow: BuilderFlowState['flow']) => void;
  setSchemasByScreenId: (value: Record<string, UISchema> | ((prev: Record<string, UISchema>) => Record<string, UISchema>)) => void;
  setSelectedLayoutNodeByScreen: (value: Record<string, string | null> | ((prev: Record<string, string | null>) => Record<string, string | null>)) => void;

  loadFromBundle: (flowGraph: BuilderFlowState['flow'], schemas: Record<string, UISchema>) => void;
  syncTransitionDraftScreens: () => void;
  ensureActiveScreenValid: () => void;
}

function resolve<T>(value: T | ((prev: T) => T), prev: T): T {
  return typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
}

export function createFlowStore(initialFlowState: BuilderFlowState = createInitialBuilderFlowState()) {
  return create<FlowStoreState & FlowStoreActions>()((set, get) => ({
    flowGraph: initialFlowState.flow,
    activeScreenId: initialFlowState.activeScreenId,
    selectedFlowScreenId: initialFlowState.activeScreenId,
    selectedTransitionId: null,
    newScreenTitle: '',
    transitionDraft: {
      from: initialFlowState.activeScreenId,
      to: initialFlowState.activeScreenId,
      onEvent: 'next',
      condition: '',
    },
    schemasByScreenId: initialFlowState.schemasByScreenId,
    selectedLayoutNodeByScreen: Object.fromEntries(
      Object.entries(initialFlowState.schemasByScreenId).map(([screenId, schema]) => [
        screenId,
        schema.sections?.[0]?.id ?? null,
      ]),
    ),

    setActiveScreenId: (value) => set((s) => ({ activeScreenId: resolve(value, s.activeScreenId) })),
    setSelectedFlowScreenId: (value) => set((s) => ({ selectedFlowScreenId: resolve(value, s.selectedFlowScreenId) })),
    setSelectedTransitionId: (value) => set((s) => ({ selectedTransitionId: resolve(value, s.selectedTransitionId) })),
    setNewScreenTitle: (value) => set((s) => ({ newScreenTitle: resolve(value, s.newScreenTitle) })),
    setTransitionDraft: (value) => set((s) => ({ transitionDraft: resolve(value, s.transitionDraft) })),

    setFlowGraph: (flow) => set({ flowGraph: flow }),
    setSchemasByScreenId: (value) => set((s) => ({
      schemasByScreenId: resolve(value, s.schemasByScreenId),
    })),
    setSelectedLayoutNodeByScreen: (value) => set((s) => ({
      selectedLayoutNodeByScreen: resolve(value, s.selectedLayoutNodeByScreen),
    })),

    handleSelectScreen: (screenId) => set((s) => ({
      activeScreenId: screenId,
      selectedFlowScreenId: screenId,
      transitionDraft: { ...s.transitionDraft, from: screenId, to: s.transitionDraft.to || screenId },
    })),

    handleAddScreen: () => {
      const { flowGraph, schemasByScreenId, newScreenTitle } = get();
      const result = addBuilderScreen(flowGraph, schemasByScreenId, newScreenTitle);
      const newNodeId = result.schemasByScreenId[result.newScreenId]?.sections?.[0]?.id ?? null;
      set((s) => ({
        flowGraph: result.flow,
        schemasByScreenId: result.schemasByScreenId,
        activeScreenId: result.newScreenId,
        selectedFlowScreenId: result.newScreenId,
        selectedLayoutNodeByScreen: { ...s.selectedLayoutNodeByScreen, [result.newScreenId]: newNodeId },
        transitionDraft: { from: result.newScreenId, to: result.newScreenId, onEvent: 'next', condition: '' },
        newScreenTitle: '',
      }));
      return result.newScreenId;
    },

    handleRemoveSelectedScreen: () => {
      const { flowGraph, schemasByScreenId, selectedFlowScreenId, activeScreenId } = get();
      const targetScreenId = selectedFlowScreenId ?? activeScreenId;
      if (!targetScreenId) return;
      const result = removeBuilderScreen(flowGraph, schemasByScreenId, targetScreenId);
      set((s) => {
        const next = { ...s.selectedLayoutNodeByScreen };
        delete next[targetScreenId];
        return {
          flowGraph: result.flow,
          schemasByScreenId: result.schemasByScreenId,
          activeScreenId: result.newScreenId,
          selectedFlowScreenId: result.newScreenId,
          selectedTransitionId: null,
          selectedLayoutNodeByScreen: next,
        };
      });
    },

    handleFlowConnectionCreate: (input) => {
      const { flowGraph } = get();
      const result = addBuilderTransition(flowGraph, { from: input.from, to: input.to, onEvent: 'next' });
      set({
        flowGraph: result.flow,
        selectedTransitionId: result.transitionId,
        selectedFlowScreenId: input.to,
      });
      return result.transitionId;
    },

    handleFlowScreenMove: (input) => {
      set((s) => ({
        flowGraph: updateBuilderScreenPosition(s.flowGraph, input.screenId, input.position),
      }));
    },

    handleAddTransitionFromForm: () => {
      const { flowGraph, transitionDraft } = get();
      if (!transitionDraft.from || !transitionDraft.to) return null;
      const result = addBuilderTransition(flowGraph, {
        from: transitionDraft.from,
        to: transitionDraft.to,
        onEvent: transitionDraft.onEvent,
        condition: transitionDraft.condition,
      });
      set({
        flowGraph: result.flow,
        selectedTransitionId: result.transitionId,
      });
      return result.transitionId;
    },

    handleTransitionPatch: (transitionId, patch) => {
      set((s) => ({
        flowGraph: updateBuilderTransition(s.flowGraph, transitionId, patch),
      }));
    },

    handleRemoveTransition: (transitionId) => {
      set((s) => ({
        flowGraph: deleteBuilderTransition(s.flowGraph, transitionId),
        selectedTransitionId: null,
      }));
    },

    loadFromBundle: (flowGraph, schemas) => {
      const nextActive = flowGraph.initialScreenId || flowGraph.screens[0]?.id;
      set({
        flowGraph,
        schemasByScreenId: schemas,
        activeScreenId: nextActive || '',
        selectedFlowScreenId: nextActive || null,
        selectedTransitionId: null,
        selectedLayoutNodeByScreen: Object.fromEntries(
          Object.entries(schemas).map(([sid, schema]) => [sid, schema.sections?.[0]?.id ?? null]),
        ),
      });
    },

    syncTransitionDraftScreens: () => {
      const { flowGraph, transitionDraft } = get();
      const fallback = flowGraph.screens[0]?.id;
      if (!fallback) return;
      const from = flowGraph.screens.some((s) => s.id === transitionDraft.from) ? transitionDraft.from : fallback;
      const to = flowGraph.screens.some((s) => s.id === transitionDraft.to) ? transitionDraft.to : fallback;
      if (from !== transitionDraft.from || to !== transitionDraft.to) {
        set({ transitionDraft: { ...transitionDraft, from, to } });
      }
    },

    ensureActiveScreenValid: () => {
      const { flowGraph, activeScreenId } = get();
      if (flowGraph.screens.some((s) => s.id === activeScreenId)) return;
      const fallback = flowGraph.screens[0]?.id;
      if (!fallback) return;
      set({ activeScreenId: fallback, selectedFlowScreenId: fallback });
    },
  }));
}

export type FlowStore = ReturnType<typeof createFlowStore>;
