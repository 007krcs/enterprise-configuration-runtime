import { create } from 'zustand';
import type { ComponentContract } from '@platform/component-contract';
import type { LayoutTreeNode, UIComponent, UISchema, JSONValue } from '@platform/schema';
import {
  applyPaletteDrop,
  createInitialBuilderSchema,
  getComponentById,
  getLayoutNode,
  updateComponentProps,
  updateLayoutNodeProperties,
} from '../lib/layout-engine';
import type { DropTarget, PaletteDragItem } from '../utils/DragDropManager';

export interface LayoutStoreState {
  contractByType: Map<string, ComponentContract>;
}

export interface LayoutStoreActions {
  setContractByType: (contracts: ComponentContract[]) => void;

  getActiveSchema: (schemasByScreenId: Record<string, UISchema>, activeScreenId: string) => UISchema;
  getSelectedLayoutNodeId: (
    activeSchema: UISchema,
    activeScreenId: string,
    selectedLayoutNodeByScreen: Record<string, string | null>,
  ) => string | null;
  getSelectedLayoutNode: (activeSchema: UISchema, selectedLayoutNodeId: string | null) => LayoutTreeNode | undefined;
  getSelectedComponent: (activeSchema: UISchema, selectedLayoutNode: LayoutTreeNode | undefined) => UIComponent | null;
  getSelectedComponentContract: (selectedComponent: UIComponent | null) => ComponentContract | null;

  applyDrop: (
    currentSchema: UISchema,
    item: PaletteDragItem,
    target: DropTarget,
    selectedNodeId: string | null,
  ) => { schema: UISchema; changed: boolean; selectedNodeId: string | null };

  applyLayoutNodeUpdate: (
    currentSchema: UISchema,
    selectedLayoutNodeId: string,
    patch: { title?: string; label?: string; className?: string; span?: number; componentSpan?: number; props?: Record<string, JSONValue> },
  ) => UISchema;

  applyComponentPropUpdate: (
    currentSchema: UISchema,
    componentId: string,
    propKey: string,
    value: JSONValue | undefined,
  ) => UISchema;
}

export const useLayoutStore = create<LayoutStoreState & LayoutStoreActions>()((set, get) => ({
  contractByType: new Map(),

  setContractByType: (contracts) =>
    set({ contractByType: new Map(contracts.map((c) => [c.type, c])) }),

  getActiveSchema: (schemasByScreenId, activeScreenId) => {
    return schemasByScreenId[activeScreenId] ?? createInitialBuilderSchema('screen-page');
  },

  getSelectedLayoutNodeId: (activeSchema, activeScreenId, selectedLayoutNodeByScreen) => {
    return selectedLayoutNodeByScreen[activeScreenId] ?? activeSchema.sections?.[0]?.id ?? null;
  },

  getSelectedLayoutNode: (activeSchema, selectedLayoutNodeId) => {
    return getLayoutNode(activeSchema, selectedLayoutNodeId);
  },

  getSelectedComponent: (activeSchema, selectedLayoutNode) => {
    if (!selectedLayoutNode || selectedLayoutNode.kind !== 'component') return null;
    return getComponentById(activeSchema, selectedLayoutNode.componentId) ?? null;
  },

  getSelectedComponentContract: (selectedComponent) => {
    if (!selectedComponent) return null;
    return get().contractByType.get(selectedComponent.type) ?? null;
  },

  applyDrop: (currentSchema, item, target, selectedNodeId) => {
    const { contractByType } = get();
    return applyPaletteDrop(currentSchema, item, target, selectedNodeId, {
      getComponentContract: (type) => contractByType.get(type),
    });
  },

  applyLayoutNodeUpdate: (currentSchema, selectedLayoutNodeId, patch) => {
    return updateLayoutNodeProperties(currentSchema, selectedLayoutNodeId, patch);
  },

  applyComponentPropUpdate: (currentSchema, componentId, propKey, value) => {
    return updateComponentProps(currentSchema, componentId, { [propKey]: value });
  },
}));
