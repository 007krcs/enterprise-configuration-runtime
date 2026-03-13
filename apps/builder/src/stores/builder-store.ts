'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import React from 'react';
import type { ComponentContract } from '@platform/component-contract';
import {
  serializeApplicationBundle,
  stateMachineToFlowGraph,
  type ApplicationBundle,
  type UISchema,
} from '@platform/schema';
import type { BuilderWorkspaceSummary } from '../lib/builder-modules';
import { assembleBundle } from '../lib/application-bundle';
import { validateApplicationBundle } from '../lib/bundle-validator';
import { createInitialBuilderFlowState, type BuilderFlowState } from '../lib/flow-engine';
import { createInitialBuilderSchema } from '../lib/layout-engine';
import { createConfigPackage, loadConfigStore, type ConfigStoreState } from '../lib/config-governance';
import { setPaletteDragItem, type DropTarget, type PaletteDragItem, type PaletteItemKind } from '../utils/DragDropManager';

import { useUIStore, type BuilderMode, type PreviewBreakpoint, type PreviewDataMode } from './ui-store';
import { createFlowStore, type FlowStore } from './flow-store';
import { useLayoutStore } from './layout-store';
import { createConfigStore, type ConfigStore } from './config-store';

/* ── Re-export types ── */
export type { BuilderMode, PreviewBreakpoint, PreviewDataMode } from './ui-store';

const DEFAULT_CONFIG_ID = 'ruleflow-builder-config';
const DEFAULT_TENANT_ID = 'tenant-default';
const DEFAULT_THEME = {
  id: 'builder-default',
  name: 'Builder Default Theme',
  tokens: {
    'color.surface': '#ffffff',
    'color.text.primary': '#10243f',
    'radius.md': '12px',
  },
};

export interface BuilderPaletteEntry {
  id: string;
  kind: PaletteItemKind;
  type: string;
  displayName: string;
  category: string;
  description?: string;
}

/* ── Store context for flow and config stores (created per provider instance) ── */

interface StoreContext {
  flowStore: FlowStore;
  configStoreHook: ConfigStore;
}

const BuilderStoreContext = createContext<StoreContext | null>(null);

function useStoreContext(): StoreContext {
  const ctx = useContext(BuilderStoreContext);
  if (!ctx) throw new Error('useStoreContext must be used inside <BuilderStoreProvider>');
  return ctx;
}

export function useFlowStore<T>(selector: (state: ReturnType<FlowStore['getState']>) => T): T {
  const { flowStore } = useStoreContext();
  return flowStore(selector);
}

export function useConfigStoreHook<T>(selector: (state: ReturnType<ConfigStore['getState']>) => T): T {
  const { configStoreHook } = useStoreContext();
  return configStoreHook(selector);
}

/* ── Legacy-compatible context value ── */

export interface BuilderContextValue {
  paletteOpen: boolean;
  setPaletteOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  inspectorOpen: boolean;
  setInspectorOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  editMode: boolean;
  setEditMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  builderMode: BuilderMode;
  setBuilderMode: (value: BuilderMode | ((prev: BuilderMode) => BuilderMode)) => void;
  previewBreakpoint: PreviewBreakpoint;
  setPreviewBreakpoint: (value: PreviewBreakpoint | ((prev: PreviewBreakpoint) => PreviewBreakpoint)) => void;
  previewDataMode: PreviewDataMode;
  setPreviewDataMode: (value: PreviewDataMode | ((prev: PreviewDataMode) => PreviewDataMode)) => void;
  skipValidationInDev: boolean;
  setSkipValidationInDev: (value: boolean | ((prev: boolean) => boolean)) => void;

  flowGraph: ReturnType<FlowStore['getState']>['flowGraph'];
  activeScreenId: string;
  setActiveScreenId: (value: string | ((prev: string) => string)) => void;
  activeScreen: ReturnType<FlowStore['getState']>['flowGraph']['screens'][number] | null;
  selectedFlowScreenId: string | null;
  setSelectedFlowScreenId: (value: string | null | ((prev: string | null) => string | null)) => void;
  selectedFlowScreen: ReturnType<FlowStore['getState']>['flowGraph']['screens'][number] | null;
  selectedTransitionId: string | null;
  setSelectedTransitionId: (value: string | null | ((prev: string | null) => string | null)) => void;
  selectedTransition: import('@platform/schema').FlowTransitionEdge | null;
  newScreenTitle: string;
  setNewScreenTitle: (value: string | ((prev: string) => string)) => void;
  transitionDraft: { from: string; to: string; onEvent: string; condition: string };
  setTransitionDraft: (value: { from: string; to: string; onEvent: string; condition: string } | ((prev: { from: string; to: string; onEvent: string; condition: string }) => { from: string; to: string; onEvent: string; condition: string })) => void;

  schemasByScreenId: Record<string, UISchema>;
  activeSchema: UISchema;
  selectedLayoutNodeId: string | null;
  selectedLayoutNode: import('@platform/schema').LayoutTreeNode | undefined;
  selectedComponent: import('@platform/schema').UIComponent | null;
  selectedComponentContract: ComponentContract | null;

  configStore: ConfigStoreState;
  bundleConfigId: string;
  bundleTenantId: string;
  bundleStatus: import('@platform/schema').ApplicationBundleStatus;
  bundleVersion: number;
  bundleCreatedAt: string;
  bundleUpdatedAt: string;
  configMessage: string | null;
  setConfigMessage: (value: string | null) => void;
  importMessage: string | null;
  setImportMessage: (value: string | null) => void;
  newConfigId: string;
  setNewConfigId: (value: string) => void;
  newConfigName: string;
  setNewConfigName: (value: string) => void;
  newConfigTenantId: string;
  setNewConfigTenantId: (value: string) => void;
  activePackage: ReturnType<typeof import('../lib/config-governance').getActivePackage>;
  activeVersion: ReturnType<typeof import('../lib/config-governance').getActiveVersion>;

  applicationBundle: ApplicationBundle;
  validationResult: ReturnType<typeof validateApplicationBundle>;
  validationErrors: { severity: string; path: string; message: string }[];
  validationWarnings: { severity: string; path: string; message: string }[];
  legacyFlowStateMachine: ApplicationBundle['flowSchema'];
  developmentMode: boolean;

  sortedPalette: BuilderPaletteEntry[];
  paletteEntries: BuilderPaletteEntry[];
  componentContracts: ComponentContract[];
  summary: BuilderWorkspaceSummary;

  recentAuditEntries: import('../lib/config-governance').AuditLogEntry[];

  screensCount: number;
  transitionsCount: number;
  sectionsCount: number;
  rowsCount: number;
  columnsCount: number;
  componentsCount: number;

  canSaveDraft: boolean;
  canPromote: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canCreateDraft: boolean;

  packageOptions: { value: string; label: string }[];
  versionOptions: { value: string; label: string }[];

  handleSelectScreen: (screenId: string) => void;
  handleAddScreen: () => void;
  handleRemoveSelectedScreen: () => void;
  handleSelectLayoutNode: (nodeId: string) => void;
  handlePaletteDrop: (target: DropTarget, item: PaletteDragItem) => void;
  handlePaletteItemDragStart: (entry: BuilderPaletteEntry) => (event: DragEvent<HTMLElement>) => void;
  handlePaletteItemInsert: (entry: BuilderPaletteEntry) => void;
  updateSelectedLayoutNode: (patch: {
    title?: string;
    label?: string;
    className?: string;
    span?: number;
    componentSpan?: number;
    props?: Record<string, import('@platform/schema').JSONValue>;
  }) => void;
  updateSelectedComponentProp: (propKey: string, value: import('@platform/schema').JSONValue | undefined) => void;
  handleLayoutTextFieldChange: (field: 'title' | 'label' | 'className') => (event: ChangeEvent<HTMLInputElement>) => void;
  handleLayoutNumberFieldChange: (field: 'span' | 'componentSpan') => (event: ChangeEvent<HTMLInputElement>) => void;
  handleLayoutPropsChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleFlowConnectionCreate: (input: { from: string; to: string }) => void;
  handleFlowScreenMove: (input: { screenId: string; position: { x: number; y: number } }) => void;
  handleAddTransitionFromForm: () => void;
  handleTransitionPatch: (transitionId: string, patch: Partial<Pick<import('@platform/schema').FlowTransitionEdge, 'from' | 'to' | 'onEvent' | 'condition'>>) => void;
  handleRemoveTransition: (transitionId: string) => void;
  handleCreateConfig: () => void;
  handlePackageSelect: (event: ChangeEvent<HTMLSelectElement>) => void;
  handleVersionSelect: (event: ChangeEvent<HTMLSelectElement>) => void;
  handleSaveDraft: () => void;
  handleCreateDraft: () => void;
  handlePromote: () => void;
  handleApprove: () => void;
  handleReject: () => void;
  handlePublish: () => void;
  handleExportBundle: () => void;
  handleImportClick: () => void;
  handleImportBundle: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  importInputRef: RefObject<HTMLInputElement | null>;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error('useBuilder must be used inside <BuilderProvider>');
  return ctx;
}

/* ── Provider ── */

export interface BuilderProviderProps {
  summary: BuilderWorkspaceSummary;
  paletteEntries: BuilderPaletteEntry[];
  componentContracts: ComponentContract[];
  initialFlowState?: BuilderFlowState;
  children: ReactNode;
}

export function BuilderProvider({
  summary,
  paletteEntries,
  componentContracts,
  initialFlowState = createInitialBuilderFlowState(),
  children,
}: BuilderProviderProps) {
  /* Create per-instance stores */
  const flowStoreRef = useRef<FlowStore | null>(null);
  if (!flowStoreRef.current) {
    flowStoreRef.current = createFlowStore(initialFlowState);
  }
  const flowStore = flowStoreRef.current;

  const configStoreRef = useRef<ConfigStore | null>(null);
  if (!configStoreRef.current) {
    const stored = loadConfigStore();
    let initial: ConfigStoreState;
    if (stored.packages.length > 0) {
      initial = stored;
    } else {
      const now = new Date().toISOString();
      const seedBundle = assembleBundle({
        flowGraph: initialFlowState.flow,
        uiSchemasByScreenId: initialFlowState.schemasByScreenId,
        configId: DEFAULT_CONFIG_ID,
        tenantId: DEFAULT_TENANT_ID,
        version: 1,
        status: 'DRAFT',
        createdAt: now,
        updatedAt: now,
        rules: { version: '1.0.0', rules: [] },
        apiMappings: [],
        themes: DEFAULT_THEME,
      });
      const result = createConfigPackage(stored, {
        id: DEFAULT_CONFIG_ID,
        name: 'Default Config',
        tenantId: DEFAULT_TENANT_ID,
        bundle: seedBundle,
        actor: 'builder@local',
      });
      initial = result.ok ? result.state : stored;
    }
    configStoreRef.current = createConfigStore(initial);
  }
  const configStoreHook = configStoreRef.current;

  /* Initialize layout store with contracts */
  useEffect(() => {
    useLayoutStore.getState().setContractByType(componentContracts);
  }, [componentContracts]);

  /* UI store bindings */
  const ui = useUIStore();

  /* Flow store bindings */
  const flow = flowStore((s) => s);

  /* Config store bindings */
  const config = configStoreHook((s) => s);

  /* Sync effects */
  const activeVersionRef = useRef<string | null>(null);
  useEffect(() => {
    const version = config.getActiveVersion();
    if (!version) return;
    if (activeVersionRef.current === version.id) return;
    activeVersionRef.current = version.id;
    const result = config.syncFromActiveVersion();
    if (result) {
      const bundle = result.bundle;
      const nextFlowGraph = bundle.flowGraph ?? stateMachineToFlowGraph(bundle.flowSchema);
      const nextSchemas: Record<string, UISchema> = {};
      for (const screen of nextFlowGraph.screens) {
        nextSchemas[screen.id] = bundle.uiSchemas?.[screen.id] ?? createInitialBuilderSchema(screen.uiPageId);
      }
      flow.loadFromBundle(nextFlowGraph, nextSchemas);
    }
  }, [config, flow]);

  useEffect(() => { flow.ensureActiveScreenValid(); }, [flow.flowGraph.screens, flow]);
  useEffect(() => { flow.syncTransitionDraftScreens(); }, [flow.flowGraph.screens, flow]);

  /* Computed values */
  const layout = useLayoutStore();
  const activeScreen = useMemo(
    () => flow.flowGraph.screens.find((s) => s.id === flow.activeScreenId) ?? flow.flowGraph.screens[0] ?? null,
    [flow.flowGraph.screens, flow.activeScreenId],
  );

  const activeSchema = useMemo(
    () => layout.getActiveSchema(flow.schemasByScreenId, activeScreen?.id ?? ''),
    [layout, flow.schemasByScreenId, activeScreen],
  );

  const selectedLayoutNodeId = useMemo(
    () => layout.getSelectedLayoutNodeId(activeSchema, activeScreen?.id ?? '', flow.selectedLayoutNodeByScreen),
    [layout, activeSchema, activeScreen, flow.selectedLayoutNodeByScreen],
  );

  const selectedLayoutNode = useMemo(
    () => layout.getSelectedLayoutNode(activeSchema, selectedLayoutNodeId),
    [layout, activeSchema, selectedLayoutNodeId],
  );

  const selectedComponent = useMemo(
    () => layout.getSelectedComponent(activeSchema, selectedLayoutNode),
    [layout, activeSchema, selectedLayoutNode],
  );

  const selectedComponentContract = useMemo(
    () => layout.getSelectedComponentContract(selectedComponent),
    [layout, selectedComponent],
  );

  const selectedFlowScreen = useMemo(() => {
    const lookupId = flow.selectedFlowScreenId ?? activeScreen?.id ?? null;
    if (!lookupId) return null;
    return flow.flowGraph.screens.find((s) => s.id === lookupId) ?? null;
  }, [activeScreen?.id, flow.flowGraph.screens, flow.selectedFlowScreenId]);

  const selectedTransition = useMemo(
    () => flow.flowGraph.transitions.find((t) => t.id === flow.selectedTransitionId) ?? null,
    [flow.flowGraph.transitions, flow.selectedTransitionId],
  );

  const applicationBundle = useMemo(
    () =>
      assembleBundle({
        flowGraph: flow.flowGraph,
        uiSchemasByScreenId: flow.schemasByScreenId,
        configId: config.bundleConfigId,
        tenantId: config.bundleTenantId,
        version: config.bundleVersion,
        status: config.bundleStatus,
        createdAt: config.bundleCreatedAt,
        updatedAt: config.bundleUpdatedAt,
        rules: { version: '1.0.0', rules: [] },
        apiMappings: [],
        themes: DEFAULT_THEME,
      }),
    [flow.flowGraph, flow.schemasByScreenId, config.bundleConfigId, config.bundleTenantId, config.bundleVersion, config.bundleStatus, config.bundleCreatedAt, config.bundleUpdatedAt],
  );

  const developmentMode = process.env.NODE_ENV !== 'production';
  const validationResult = useMemo(
    () =>
      validateApplicationBundle(applicationBundle, componentContracts, {
        developmentMode,
        skipA11yI18nInDev: ui.skipValidationInDev,
      }),
    [applicationBundle, componentContracts, developmentMode, ui.skipValidationInDev],
  );
  const validationErrors = validationResult.issues.filter((i) => i.severity === 'error');
  const validationWarnings = validationResult.issues.filter((i) => i.severity === 'warning');
  const legacyFlowStateMachine = applicationBundle.flowSchema;

  const sortedPalette = useMemo(
    () =>
      [...paletteEntries].sort(
        (a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName),
      ),
    [paletteEntries],
  );

  /* Stats */
  const screensCount = flow.flowGraph.screens.length;
  const transitionsCount = flow.flowGraph.transitions.length;
  const sectionsCount = activeSchema.sections?.length ?? 0;
  const rowsCount = (activeSchema.sections ?? []).reduce((t, s) => t + s.rows.length, 0);
  const columnsCount = (activeSchema.sections ?? []).reduce(
    (t, s) => t + s.rows.reduce((rt, r) => rt + r.columns.length, 0), 0,
  );
  let componentsCount = 0;
  for (const section of activeSchema.sections ?? [])
    for (const row of section.rows)
      for (const column of row.columns)
        for (const child of column.children)
          if (child.kind === 'component') componentsCount++;

  const importInputRef = useRef<HTMLInputElement | null>(null);

  /* Build handlers that bridge stores */
  const handleSelectScreen = flow.handleSelectScreen;
  const handleAddScreen = () => {
    const screenId = flow.handleAddScreen();
    config.pushAuditEntry({ action: 'screen.add', summary: `Added screen ${screenId}`, metadata: { screenId } });
  };
  const handleRemoveSelectedScreen = () => {
    const targetId = flow.selectedFlowScreenId ?? flow.activeScreenId;
    flow.handleRemoveSelectedScreen();
    config.pushAuditEntry({ action: 'screen.remove', summary: `Removed screen ${targetId}`, metadata: { screenId: targetId } });
  };

  const handleSelectLayoutNode = (nodeId: string) => {
    if (!activeScreen) return;
    flow.setSelectedLayoutNodeByScreen((c) => ({ ...c, [activeScreen.id]: nodeId }));
  };

  const handlePaletteDrop = (target: DropTarget, item: PaletteDragItem) => {
    if (!activeScreen) return;
    const currentSchema = flow.schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
    const selectedNodeId = flow.selectedLayoutNodeByScreen[activeScreen.id] ?? currentSchema.sections?.[0]?.id ?? null;
    const result = layout.applyDrop(currentSchema, item, target, selectedNodeId);
    flow.setSchemasByScreenId((c) => ({ ...c, [activeScreen.id]: result.schema }));
    if (result.changed) {
      flow.setSelectedLayoutNodeByScreen((c) => ({ ...c, [activeScreen.id]: result.selectedNodeId }));
      config.pushAuditEntry({
        action: 'layout.insert',
        summary: `Inserted ${item.displayName} into ${activeScreen.title}`,
        metadata: { screenId: activeScreen.id, kind: item.kind, type: item.type },
      });
    }
  };

  const handlePaletteItemDragStart = (entry: BuilderPaletteEntry) => (event: DragEvent<HTMLElement>) => {
    setPaletteDragItem(event.dataTransfer, { kind: entry.kind, type: entry.type, displayName: entry.displayName });
  };

  const handlePaletteItemInsert = (entry: BuilderPaletteEntry) => {
    handlePaletteDrop({ kind: 'canvas' }, { kind: entry.kind, type: entry.type, displayName: entry.displayName });
  };

  const updateSelectedLayoutNode = (patch: {
    title?: string; label?: string; className?: string; span?: number; componentSpan?: number;
    props?: Record<string, import('@platform/schema').JSONValue>;
  }) => {
    if (!activeScreen || !selectedLayoutNodeId) return;
    const currentSchema = flow.schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
    const nextSchema = layout.applyLayoutNodeUpdate(currentSchema, selectedLayoutNodeId, patch);
    flow.setSchemasByScreenId((c) => ({ ...c, [activeScreen.id]: nextSchema }));
    config.pushAuditEntry({ action: 'layout.update', summary: `Updated layout node ${selectedLayoutNodeId}`, metadata: patch });
  };

  const updateSelectedComponentProp = (propKey: string, value: import('@platform/schema').JSONValue | undefined) => {
    if (!activeScreen || !selectedComponent) return;
    const currentSchema = flow.schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
    const nextSchema = layout.applyComponentPropUpdate(currentSchema, selectedComponent.id, propKey, value);
    flow.setSchemasByScreenId((c) => ({ ...c, [activeScreen.id]: nextSchema }));
    config.pushAuditEntry({
      action: 'component.prop.update',
      summary: `Updated ${selectedComponent.type} ${propKey}`,
      metadata: value === undefined
        ? { componentId: selectedComponent.id, propKey }
        : { componentId: selectedComponent.id, propKey, value },
    });
  };

  const handleLayoutTextFieldChange = (field: 'title' | 'label' | 'className') => (event: ChangeEvent<HTMLInputElement>) => {
    updateSelectedLayoutNode({ [field]: event.target.value });
  };
  const handleLayoutNumberFieldChange = (field: 'span' | 'componentSpan') => (event: ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number.parseInt(event.target.value, 10);
    updateSelectedLayoutNode({ [field]: Number.isFinite(rawValue) ? rawValue : undefined });
  };
  const handleLayoutPropsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const raw = event.target.value.trim();
    if (raw.length === 0) { updateSelectedLayoutNode({ props: undefined }); return; }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        updateSelectedLayoutNode({ props: parsed as Record<string, import('@platform/schema').JSONValue> });
      }
    } catch { /* ignore invalid JSON while typing */ }
  };

  const handleFlowConnectionCreate = (input: { from: string; to: string }) => {
    const tid = flow.handleFlowConnectionCreate(input);
    config.pushAuditEntry({ action: 'flow.transition.add', summary: `Added transition ${input.from} -> ${input.to}`, metadata: { from: input.from, to: input.to } });
  };

  const handleFlowScreenMove = flow.handleFlowScreenMove;

  const handleAddTransitionFromForm = () => {
    const tid = flow.handleAddTransitionFromForm();
    if (tid) {
      config.pushAuditEntry({
        action: 'flow.transition.add',
        summary: `Added transition ${flow.transitionDraft.from} -> ${flow.transitionDraft.to}`,
        metadata: { ...flow.transitionDraft },
      });
    }
  };

  const handleTransitionPatch = (transitionId: string, patch: Partial<Pick<import('@platform/schema').FlowTransitionEdge, 'from' | 'to' | 'onEvent' | 'condition'>>) => {
    flow.handleTransitionPatch(transitionId, patch);
    config.pushAuditEntry({ action: 'flow.transition.update', summary: `Updated transition ${transitionId}`, metadata: { transitionId, patchKeys: Object.keys(patch) } });
  };

  const handleRemoveTransition = (transitionId: string) => {
    flow.handleRemoveTransition(transitionId);
    config.pushAuditEntry({ action: 'flow.transition.remove', summary: `Removed transition ${transitionId}`, metadata: { transitionId } });
  };

  const handleCreateConfig = () => config.handleCreateConfig(applicationBundle, validationErrors);
  const handlePackageSelect = (event: ChangeEvent<HTMLSelectElement>) => config.handlePackageSelect(event.target.value);
  const handleVersionSelect = (event: ChangeEvent<HTMLSelectElement>) => config.handleVersionSelect(event.target.value);
  const handleSaveDraft = () => config.handleSaveDraft(applicationBundle, validationErrors);
  const handleCreateDraft = () => config.handleCreateDraft(applicationBundle, validationErrors);
  const handlePromote = () => config.handlePromote(validationErrors);
  const handleApprove = () => config.handleApprove(validationErrors);
  const handleReject = () => config.handleReject();
  const handlePublish = () => config.handlePublish(validationErrors);

  const handleExportBundle = () => {
    const filename = `${applicationBundle.metadata.configId}.json`;
    const json = serializeApplicationBundle(applicationBundle, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    config.pushAuditEntry({ action: 'bundle.export', summary: `Exported bundle ${filename}` });
  };

  const handleImportClick = () => { importInputRef.current?.click(); };

  const handleImportBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    await config.handleImportBundle(file, componentContracts, developmentMode, ui.skipValidationInDev);
  };

  const value: BuilderContextValue = {
    paletteOpen: ui.paletteOpen, setPaletteOpen: ui.setPaletteOpen,
    inspectorOpen: ui.inspectorOpen, setInspectorOpen: ui.setInspectorOpen,
    editMode: ui.editMode, setEditMode: ui.setEditMode,
    builderMode: ui.builderMode, setBuilderMode: ui.setBuilderMode,
    previewBreakpoint: ui.previewBreakpoint, setPreviewBreakpoint: ui.setPreviewBreakpoint,
    previewDataMode: ui.previewDataMode, setPreviewDataMode: ui.setPreviewDataMode,
    skipValidationInDev: ui.skipValidationInDev, setSkipValidationInDev: ui.setSkipValidationInDev,

    flowGraph: flow.flowGraph, activeScreenId: flow.activeScreenId, setActiveScreenId: flow.setActiveScreenId, activeScreen,
    selectedFlowScreenId: flow.selectedFlowScreenId, setSelectedFlowScreenId: flow.setSelectedFlowScreenId, selectedFlowScreen,
    selectedTransitionId: flow.selectedTransitionId, setSelectedTransitionId: flow.setSelectedTransitionId, selectedTransition,
    newScreenTitle: flow.newScreenTitle, setNewScreenTitle: flow.setNewScreenTitle,
    transitionDraft: flow.transitionDraft, setTransitionDraft: flow.setTransitionDraft,

    schemasByScreenId: flow.schemasByScreenId, activeSchema,
    selectedLayoutNodeId, selectedLayoutNode,
    selectedComponent, selectedComponentContract,

    configStore: config.configStore,
    bundleConfigId: config.bundleConfigId, bundleTenantId: config.bundleTenantId,
    bundleStatus: config.bundleStatus, bundleVersion: config.bundleVersion,
    bundleCreatedAt: config.bundleCreatedAt, bundleUpdatedAt: config.bundleUpdatedAt,
    configMessage: config.configMessage, setConfigMessage: config.setConfigMessage,
    importMessage: config.importMessage, setImportMessage: config.setImportMessage,
    newConfigId: config.newConfigId, setNewConfigId: config.setNewConfigId,
    newConfigName: config.newConfigName, setNewConfigName: config.setNewConfigName,
    newConfigTenantId: config.newConfigTenantId, setNewConfigTenantId: config.setNewConfigTenantId,
    activePackage: config.getActivePackage(),
    activeVersion: config.getActiveVersion(),

    applicationBundle, validationResult, validationErrors, validationWarnings,
    legacyFlowStateMachine, developmentMode,

    sortedPalette, paletteEntries, componentContracts, summary,

    recentAuditEntries: config.getRecentAuditEntries(),

    screensCount, transitionsCount, sectionsCount, rowsCount, columnsCount, componentsCount,

    canSaveDraft: config.canSaveDraft(),
    canPromote: config.canPromote(),
    canApprove: config.canApprove(),
    canReject: config.canReject(),
    canPublish: config.canPublish(),
    canCreateDraft: config.canCreateDraft(),

    packageOptions: config.getPackageOptions(),
    versionOptions: config.getVersionOptions(),

    handleSelectScreen, handleAddScreen, handleRemoveSelectedScreen,
    handleSelectLayoutNode, handlePaletteDrop,
    handlePaletteItemDragStart, handlePaletteItemInsert,
    updateSelectedLayoutNode, updateSelectedComponentProp,
    handleLayoutTextFieldChange, handleLayoutNumberFieldChange, handleLayoutPropsChange,
    handleFlowConnectionCreate, handleFlowScreenMove,
    handleAddTransitionFromForm, handleTransitionPatch, handleRemoveTransition,
    handleCreateConfig, handlePackageSelect, handleVersionSelect,
    handleSaveDraft, handleCreateDraft,
    handlePromote, handleApprove, handleReject, handlePublish,
    handleExportBundle, handleImportClick, handleImportBundle,
    importInputRef,
  };

  const storeContext = useMemo(() => ({ flowStore, configStoreHook }), [flowStore, configStoreHook]);

  return React.createElement(
    BuilderStoreContext.Provider,
    { value: storeContext },
    React.createElement(BuilderContext.Provider, { value }, children),
  );
}
