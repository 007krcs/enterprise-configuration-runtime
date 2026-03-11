'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import type { ComponentContract } from '@platform/component-contract';
import {
  serializeApplicationBundle,
  stateMachineToFlowGraph,
  type ApplicationBundle,
  type ApplicationBundleStatus,
  type FlowTransitionEdge,
  type LayoutTreeNode,
  type JSONValue,
  type UIComponent,
  type UISchema,
} from '@platform/schema';
import type { BuilderWorkspaceSummary } from '../lib/builder-modules';
import { assembleBundle } from '../lib/application-bundle';
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
import {
  applyPaletteDrop,
  createInitialBuilderSchema,
  getComponentById,
  getLayoutNode,
  updateComponentProps,
  updateLayoutNodeProperties,
} from '../lib/layout-engine';
import { validateApplicationBundle } from '../lib/bundle-validator';
import { checkFileSize, validateBundleStructure } from '../lib/bundle-import-guard';
import {
  createConfigPackage,
  createDraftVersion,
  getActivePackage,
  getActiveVersion,
  getLatestVersion,
  loadConfigStore,
  persistConfigStore,
  type PersistResult,
  recordAuditEntry,
  saveDraftVersion,
  setActiveVersion as setActiveVersionInStore,
  updateVersionStatus,
  type AuditLogEntry,
  type ConfigStoreState,
} from '../lib/config-governance';
import {
  setPaletteDragItem,
  type DropTarget,
  type PaletteDragItem,
  type PaletteItemKind,
} from '../utils/DragDropManager';

/* ── Types ── */

export type BuilderMode = 'layout' | 'flow';
export type PreviewBreakpoint = 'desktop' | 'tablet' | 'mobile';
export type PreviewDataMode = 'mock' | 'real';

const DEFAULT_CONFIG_ID = 'ruleflow-builder-config';
const DEFAULT_TENANT_ID = 'tenant-default';
const DEFAULT_ACTOR = 'builder@local';
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

/* ── Context value shape ── */

export interface BuilderContextValue {
  /* UI state */
  paletteOpen: boolean;
  setPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  inspectorOpen: boolean;
  setInspectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  editMode: boolean;
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  builderMode: BuilderMode;
  setBuilderMode: React.Dispatch<React.SetStateAction<BuilderMode>>;
  previewBreakpoint: PreviewBreakpoint;
  setPreviewBreakpoint: React.Dispatch<React.SetStateAction<PreviewBreakpoint>>;
  previewDataMode: PreviewDataMode;
  setPreviewDataMode: React.Dispatch<React.SetStateAction<PreviewDataMode>>;
  skipValidationInDev: boolean;
  setSkipValidationInDev: React.Dispatch<React.SetStateAction<boolean>>;

  /* Flow */
  flowGraph: BuilderFlowState['flow'];
  activeScreenId: string;
  setActiveScreenId: React.Dispatch<React.SetStateAction<string>>;
  activeScreen: BuilderFlowState['flow']['screens'][number] | null;
  selectedFlowScreenId: string | null;
  setSelectedFlowScreenId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedFlowScreen: BuilderFlowState['flow']['screens'][number] | null;
  selectedTransitionId: string | null;
  setSelectedTransitionId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTransition: FlowTransitionEdge | null;
  newScreenTitle: string;
  setNewScreenTitle: React.Dispatch<React.SetStateAction<string>>;
  transitionDraft: { from: string; to: string; onEvent: string; condition: string };
  setTransitionDraft: React.Dispatch<
    React.SetStateAction<{ from: string; to: string; onEvent: string; condition: string }>
  >;

  /* Layout */
  schemasByScreenId: Record<string, UISchema>;
  activeSchema: UISchema;
  selectedLayoutNodeId: string | null;
  selectedLayoutNode: LayoutTreeNode | undefined;
  selectedComponent: UIComponent | null;
  selectedComponentContract: ComponentContract | null;

  /* Config */
  configStore: ConfigStoreState;
  bundleConfigId: string;
  bundleTenantId: string;
  bundleStatus: ApplicationBundleStatus;
  bundleVersion: number;
  bundleCreatedAt: string;
  bundleUpdatedAt: string;
  configMessage: string | null;
  setConfigMessage: React.Dispatch<React.SetStateAction<string | null>>;
  importMessage: string | null;
  setImportMessage: React.Dispatch<React.SetStateAction<string | null>>;
  newConfigId: string;
  setNewConfigId: React.Dispatch<React.SetStateAction<string>>;
  newConfigName: string;
  setNewConfigName: React.Dispatch<React.SetStateAction<string>>;
  newConfigTenantId: string;
  setNewConfigTenantId: React.Dispatch<React.SetStateAction<string>>;
  activePackage: ReturnType<typeof getActivePackage>;
  activeVersion: ReturnType<typeof getActiveVersion>;

  /* Bundle & Validation */
  applicationBundle: ApplicationBundle;
  validationResult: ReturnType<typeof validateApplicationBundle>;
  validationErrors: { severity: string; path: string; message: string }[];
  validationWarnings: { severity: string; path: string; message: string }[];
  legacyFlowStateMachine: ApplicationBundle['flowSchema'];
  developmentMode: boolean;

  /* Palette & catalog */
  sortedPalette: BuilderPaletteEntry[];
  paletteEntries: BuilderPaletteEntry[];
  componentContracts: ComponentContract[];
  summary: BuilderWorkspaceSummary;

  /* Audit */
  recentAuditEntries: AuditLogEntry[];

  /* Stats */
  screensCount: number;
  transitionsCount: number;
  sectionsCount: number;
  rowsCount: number;
  columnsCount: number;
  componentsCount: number;

  /* Status flags */
  canSaveDraft: boolean;
  canPromote: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canCreateDraft: boolean;

  /* Options */
  packageOptions: { value: string; label: string }[];
  versionOptions: { value: string; label: string }[];

  /* Handlers */
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
    props?: Record<string, JSONValue>;
  }) => void;
  updateSelectedComponentProp: (propKey: string, value: JSONValue | undefined) => void;
  handleLayoutTextFieldChange: (field: 'title' | 'label' | 'className') => (event: ChangeEvent<HTMLInputElement>) => void;
  handleLayoutNumberFieldChange: (field: 'span' | 'componentSpan') => (event: ChangeEvent<HTMLInputElement>) => void;
  handleLayoutPropsChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleFlowConnectionCreate: (input: { from: string; to: string }) => void;
  handleFlowScreenMove: (input: { screenId: string; position: { x: number; y: number } }) => void;
  handleAddTransitionFromForm: () => void;
  handleTransitionPatch: (
    transitionId: string,
    patch: Partial<Pick<FlowTransitionEdge, 'from' | 'to' | 'onEvent' | 'condition'>>,
  ) => void;
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

/* ── Helpers ── */

let auditIdCounter = 0;
function createAuditId(): string {
  return `audit-${Date.now()}-${++auditIdCounter}`;
}

function countRows(sections: UISchema['sections']): number {
  return (sections ?? []).reduce((total, section) => total + section.rows.length, 0);
}

function countColumns(sections: UISchema['sections']): number {
  return (sections ?? []).reduce(
    (total, section) => total + section.rows.reduce((rowTotal, row) => rowTotal + row.columns.length, 0),
    0,
  );
}

function countLayoutComponents(sections: UISchema['sections']): number {
  let count = 0;
  for (const section of sections ?? []) {
    for (const row of section.rows) {
      for (const column of row.columns) {
        for (const child of column.children) {
          if (child.kind === 'component') count++;
        }
      }
    }
  }
  return count;
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
  /* ── UI state ── */
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [builderMode, setBuilderMode] = useState<BuilderMode>('layout');
  const [previewBreakpoint, setPreviewBreakpoint] = useState<PreviewBreakpoint>('desktop');
  const [previewDataMode, setPreviewDataMode] = useState<PreviewDataMode>('mock');
  const [skipValidationInDev, setSkipValidationInDev] = useState(false);

  /* ── Flow state ── */
  const [flowGraph, setFlowGraph] = useState(initialFlowState.flow);
  const [schemasByScreenId, setSchemasByScreenId] = useState<Record<string, UISchema>>(
    initialFlowState.schemasByScreenId,
  );
  const [activeScreenId, setActiveScreenId] = useState(initialFlowState.activeScreenId);
  const [selectedLayoutNodeByScreen, setSelectedLayoutNodeByScreen] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(
      Object.entries(initialFlowState.schemasByScreenId).map(([screenId, schema]) => [
        screenId,
        schema.sections?.[0]?.id ?? null,
      ]),
    ),
  );
  const [selectedFlowScreenId, setSelectedFlowScreenId] = useState<string | null>(initialFlowState.activeScreenId);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const [newScreenTitle, setNewScreenTitle] = useState('');
  const [transitionDraft, setTransitionDraft] = useState({
    from: initialFlowState.activeScreenId,
    to: initialFlowState.activeScreenId,
    onEvent: 'next',
    condition: '',
  });

  /* ── Config state ── */
  const [bundleConfigId, setBundleConfigId] = useState(DEFAULT_CONFIG_ID);
  const [bundleTenantId, setBundleTenantId] = useState(DEFAULT_TENANT_ID);
  const [bundleStatus, setBundleStatus] = useState<ApplicationBundleStatus>('DRAFT');
  const [bundleVersion, setBundleVersion] = useState(1);
  const [bundleCreatedAt, setBundleCreatedAt] = useState(() => new Date().toISOString());
  const [bundleUpdatedAt, setBundleUpdatedAt] = useState(() => new Date().toISOString());
  const [suppressUpdatedAt, setSuppressUpdatedAt] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [newConfigId, setNewConfigId] = useState('');
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigTenantId, setNewConfigTenantId] = useState(DEFAULT_TENANT_ID);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const activeVersionRef = useRef<string | null>(null);
  const [configStore, setConfigStore] = useState<ConfigStoreState>(() => {
    const stored = loadConfigStore();
    if (stored.packages.length > 0) return stored;
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
      actor: DEFAULT_ACTOR,
    });
    return result.ok ? result.state : stored;
  });

  const commitConfigStore = (nextState: ConfigStoreState) => {
    setConfigStore(nextState);
    const result = persistConfigStore(nextState);
    if (!result.ok) {
      setConfigMessage(result.error ?? 'Failed to save config store.');
    }
  };

  const updateConfigStore = (updater: (state: ConfigStoreState) => ConfigStoreState) => {
    setConfigStore((current) => {
      const nextState = updater(current);
      const result = persistConfigStore(nextState);
      if (!result.ok) {
        setConfigMessage(result.error ?? 'Failed to save config store.');
      }
      return nextState;
    });
  };

  const loadBundleIntoBuilder = useCallback((bundle: ApplicationBundle) => {
    const nextFlowGraph = bundle.flowGraph ?? stateMachineToFlowGraph(bundle.flowSchema);
    const nextSchemas: Record<string, UISchema> = {};
    for (const screen of nextFlowGraph.screens) {
      const existing = bundle.uiSchemas?.[screen.id];
      nextSchemas[screen.id] = existing ?? createInitialBuilderSchema(screen.uiPageId);
    }
    setSuppressUpdatedAt(true);
    setFlowGraph(nextFlowGraph);
    setSchemasByScreenId(nextSchemas);
    const nextActive = nextFlowGraph.initialScreenId || nextFlowGraph.screens[0]?.id;
    if (nextActive) {
      setActiveScreenId(nextActive);
      setSelectedFlowScreenId(nextActive);
    }
    setSelectedTransitionId(null);
    setSelectedLayoutNodeByScreen(
      Object.fromEntries(
        Object.entries(nextSchemas).map(([sid, schema]) => [sid, schema.sections?.[0]?.id ?? null]),
      ),
    );
  }, []);

  /* ── Effects ── */

  useEffect(() => {
    if (flowGraph.screens.some((s) => s.id === activeScreenId)) return;
    const fallback = flowGraph.screens[0]?.id;
    if (!fallback) return;
    setActiveScreenId(fallback);
    setSelectedFlowScreenId(fallback);
  }, [flowGraph.screens, activeScreenId]);

  useEffect(() => {
    const fallback = flowGraph.screens[0]?.id;
    if (!fallback) return;
    setTransitionDraft((current) => ({
      ...current,
      from: flowGraph.screens.some((s) => s.id === current.from) ? current.from : fallback,
      to: flowGraph.screens.some((s) => s.id === current.to) ? current.to : fallback,
    }));
  }, [flowGraph.screens]);

  useEffect(() => {
    if (suppressUpdatedAt) {
      setSuppressUpdatedAt(false);
      return;
    }
    setBundleUpdatedAt(new Date().toISOString());
  }, [flowGraph, schemasByScreenId, suppressUpdatedAt]);

  useEffect(() => {
    const pkg = getActivePackage(configStore);
    const version = getActiveVersion(configStore);
    if (!pkg || !version) return;
    if (activeVersionRef.current === version.id) return;
    activeVersionRef.current = version.id;
    setBundleConfigId(pkg.id);
    setBundleTenantId(pkg.tenantId);
    setBundleStatus(version.status);
    setBundleVersion(version.version);
    setBundleCreatedAt(version.createdAt);
    setBundleUpdatedAt(version.updatedAt);
    setNewConfigTenantId(pkg.tenantId);
    loadBundleIntoBuilder(version.bundle);
  }, [configStore, loadBundleIntoBuilder]);

  /* ── Computed ── */

  const activePackage = useMemo(() => getActivePackage(configStore), [configStore]);
  const activeVersion = useMemo(() => getActiveVersion(configStore), [configStore]);
  const activeVersions = useMemo(
    () => (activePackage ? [...activePackage.versions].sort((a, b) => b.version - a.version) : []),
    [activePackage],
  );

  const activeScreen = useMemo(
    () => flowGraph.screens.find((s) => s.id === activeScreenId) ?? flowGraph.screens[0] ?? null,
    [flowGraph.screens, activeScreenId],
  );

  const activeSchema = useMemo(() => {
    if (!activeScreen) return createInitialBuilderSchema('screen-page');
    return schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
  }, [activeScreen, schemasByScreenId]);

  const selectedLayoutNodeId = useMemo(() => {
    if (!activeScreen) return null;
    return selectedLayoutNodeByScreen[activeScreen.id] ?? activeSchema.sections?.[0]?.id ?? null;
  }, [activeSchema, activeScreen, selectedLayoutNodeByScreen]);

  const selectedLayoutNode = useMemo(
    () => getLayoutNode(activeSchema, selectedLayoutNodeId),
    [activeSchema, selectedLayoutNodeId],
  );

  const contractByType = useMemo(
    () => new Map(componentContracts.map((c) => [c.type, c])),
    [componentContracts],
  );

  const selectedComponent = useMemo(() => {
    if (!selectedLayoutNode || selectedLayoutNode.kind !== 'component') return null;
    return getComponentById(activeSchema, selectedLayoutNode.componentId) ?? null;
  }, [activeSchema, selectedLayoutNode]);

  const selectedComponentContract = useMemo(() => {
    if (!selectedComponent) return null;
    return contractByType.get(selectedComponent.type) ?? null;
  }, [contractByType, selectedComponent]);

  const selectedFlowScreen = useMemo(() => {
    const lookupId = selectedFlowScreenId ?? activeScreen?.id ?? null;
    if (!lookupId) return null;
    return flowGraph.screens.find((s) => s.id === lookupId) ?? null;
  }, [activeScreen?.id, flowGraph.screens, selectedFlowScreenId]);

  const selectedTransition = useMemo(
    () => flowGraph.transitions.find((t) => t.id === selectedTransitionId) ?? null,
    [flowGraph.transitions, selectedTransitionId],
  );

  const applicationBundle = useMemo(
    () =>
      assembleBundle({
        flowGraph,
        uiSchemasByScreenId: schemasByScreenId,
        configId: bundleConfigId,
        tenantId: bundleTenantId,
        version: bundleVersion,
        status: bundleStatus,
        createdAt: bundleCreatedAt,
        updatedAt: bundleUpdatedAt,
        rules: { version: '1.0.0', rules: [] },
        apiMappings: [],
        themes: DEFAULT_THEME,
      }),
    [flowGraph, schemasByScreenId, bundleConfigId, bundleTenantId, bundleVersion, bundleStatus, bundleCreatedAt, bundleUpdatedAt],
  );

  const developmentMode = process.env.NODE_ENV !== 'production';
  const validationResult = useMemo(
    () =>
      validateApplicationBundle(applicationBundle, componentContracts, {
        developmentMode,
        skipA11yI18nInDev: skipValidationInDev,
      }),
    [applicationBundle, componentContracts, developmentMode, skipValidationInDev],
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

  const packageOptions = useMemo(
    () => configStore.packages.map((pkg) => ({ value: pkg.id, label: `${pkg.name} (${pkg.id})` })),
    [configStore.packages],
  );

  const versionOptions = useMemo(
    () => activeVersions.map((v) => ({ value: v.id, label: `v${v.version} · ${v.status}` })),
    [activeVersions],
  );

  const recentAuditEntries = useMemo(() => {
    const entries = activePackage
      ? configStore.audit.filter((e) => e.packageId === activePackage.id)
      : configStore.audit;
    return entries.slice(-8).reverse();
  }, [configStore.audit, activePackage]);

  const canSaveDraft = activeVersion?.status === 'DRAFT' || activeVersion?.status === 'REJECTED';
  const canPromote = activeVersion?.status === 'DRAFT' || activeVersion?.status === 'REJECTED';
  const canApprove = activeVersion?.status === 'SUBMITTED';
  const canReject = activeVersion?.status === 'SUBMITTED';
  const canPublish = activeVersion?.status === 'APPROVED';
  const canCreateDraft =
    activeVersion?.status === 'APPROVED' ||
    activeVersion?.status === 'PUBLISHED' ||
    activeVersion?.status === 'ARCHIVED';

  const screensCount = flowGraph.screens.length;
  const transitionsCount = flowGraph.transitions.length;
  const sectionsCount = activeSchema.sections?.length ?? 0;
  const rowsCount = countRows(activeSchema.sections ?? []);
  const columnsCount = countColumns(activeSchema.sections ?? []);
  const componentsCount = countLayoutComponents(activeSchema.sections ?? []);

  /* ── Audit helpers ── */

  const buildAuditEntry = (
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'packageId' | 'versionId'> &
      Partial<Pick<AuditLogEntry, 'packageId' | 'versionId'>>,
  ): AuditLogEntry => ({
    id: createAuditId(),
    packageId: entry.packageId ?? activePackage?.id ?? bundleConfigId,
    versionId: entry.versionId ?? activeVersion?.id ?? 'unknown',
    timestamp: new Date().toISOString(),
    actor: entry.actor ?? DEFAULT_ACTOR,
    action: entry.action,
    summary: entry.summary,
    metadata: entry.metadata,
  });

  const pushAuditEntry = (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'packageId' | 'versionId'>) => {
    if (!activePackage || !activeVersion) return;
    updateConfigStore((state) => recordAuditEntry(state, buildAuditEntry(entry)));
  };

  const ensureValidForAction = (actionLabel: string) => {
    if (validationErrors.length === 0) return true;
    setConfigMessage(`Fix ${validationErrors.length} validation errors before ${actionLabel.toLowerCase()}.`);
    return false;
  };

  /* ── Handlers ── */

  const handleSelectScreen = (screenId: string) => {
    setActiveScreenId(screenId);
    setSelectedFlowScreenId(screenId);
    setTransitionDraft((c) => ({ ...c, from: screenId, to: c.to || screenId }));
  };

  const handlePaletteDrop = (target: DropTarget, item: PaletteDragItem) => {
    if (!activeScreen) return;
    const currentSchema = schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
    const selectedNodeId = selectedLayoutNodeByScreen[activeScreen.id] ?? currentSchema.sections?.[0]?.id ?? null;
    const result = applyPaletteDrop(currentSchema, item, target, selectedNodeId, {
      getComponentContract: (type) => contractByType.get(type),
    });
    setSchemasByScreenId((c) => ({ ...c, [activeScreen.id]: result.schema }));
    if (result.changed) {
      setSelectedLayoutNodeByScreen((c) => ({ ...c, [activeScreen.id]: result.selectedNodeId }));
      pushAuditEntry({
        action: 'layout.insert',
        summary: `Inserted ${item.displayName} into ${activeScreen.title}`,
        metadata: { screenId: activeScreen.id, kind: item.kind, type: item.type },
      });
    }
  };

  const handlePaletteItemDragStart = (entry: BuilderPaletteEntry) => (event: DragEvent<HTMLElement>) => {
    setPaletteDragItem(event.dataTransfer, {
      kind: entry.kind,
      type: entry.type,
      displayName: entry.displayName,
    });
  };

  const handlePaletteItemInsert = (entry: BuilderPaletteEntry) => {
    handlePaletteDrop({ kind: 'canvas' }, { kind: entry.kind, type: entry.type, displayName: entry.displayName });
  };

  const handleAddScreen = () => {
    const result = addBuilderScreen(flowGraph, schemasByScreenId, newScreenTitle);
    setFlowGraph(result.flow);
    setSchemasByScreenId(result.schemasByScreenId);
    setActiveScreenId(result.newScreenId);
    setSelectedFlowScreenId(result.newScreenId);
    setSelectedLayoutNodeByScreen((c) => ({
      ...c,
      [result.newScreenId]: result.schemasByScreenId[result.newScreenId]?.sections?.[0]?.id ?? null,
    }));
    setTransitionDraft({ from: result.newScreenId, to: result.newScreenId, onEvent: 'next', condition: '' });
    setNewScreenTitle('');
    pushAuditEntry({
      action: 'screen.add',
      summary: `Added screen ${result.newScreenId}`,
      metadata: { screenId: result.newScreenId },
    });
  };

  const handleRemoveSelectedScreen = () => {
    const targetScreenId = selectedFlowScreen?.id ?? activeScreen?.id;
    if (!targetScreenId) return;
    const result = removeBuilderScreen(flowGraph, schemasByScreenId, targetScreenId);
    setFlowGraph(result.flow);
    setSchemasByScreenId(result.schemasByScreenId);
    setActiveScreenId(result.newScreenId);
    setSelectedFlowScreenId(result.newScreenId);
    setSelectedTransitionId(null);
    setSelectedLayoutNodeByScreen((c) => {
      const next = { ...c };
      delete next[targetScreenId];
      return next;
    });
    pushAuditEntry({
      action: 'screen.remove',
      summary: `Removed screen ${targetScreenId}`,
      metadata: { screenId: targetScreenId },
    });
  };

  const handleSelectLayoutNode = (nodeId: string) => {
    if (!activeScreen) return;
    setSelectedLayoutNodeByScreen((c) => ({ ...c, [activeScreen.id]: nodeId }));
  };

  const updateSelectedLayoutNode = (patch: {
    title?: string;
    label?: string;
    className?: string;
    span?: number;
    componentSpan?: number;
    props?: Record<string, JSONValue>;
  }) => {
    if (!activeScreen || !selectedLayoutNodeId) return;
    const currentSchema = schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
    const nextSchema = updateLayoutNodeProperties(currentSchema, selectedLayoutNodeId, patch);
    setSchemasByScreenId((c) => ({ ...c, [activeScreen.id]: nextSchema }));
    pushAuditEntry({
      action: 'layout.update',
      summary: `Updated layout node ${selectedLayoutNodeId}`,
      metadata: patch,
    });
  };

  const updateSelectedComponentProp = (propKey: string, value: JSONValue | undefined) => {
    if (!activeScreen || !selectedComponent) return;
    const currentSchema = schemasByScreenId[activeScreen.id] ?? createInitialBuilderSchema(activeScreen.uiPageId);
    const nextSchema = updateComponentProps(currentSchema, selectedComponent.id, { [propKey]: value });
    setSchemasByScreenId((c) => ({ ...c, [activeScreen.id]: nextSchema }));
    pushAuditEntry({
      action: 'component.prop.update',
      summary: `Updated ${selectedComponent.type} ${propKey}`,
      metadata:
        value === undefined
          ? { componentId: selectedComponent.id, propKey }
          : { componentId: selectedComponent.id, propKey, value },
    });
  };

  const handleLayoutTextFieldChange =
    (field: 'title' | 'label' | 'className') => (event: ChangeEvent<HTMLInputElement>) => {
      updateSelectedLayoutNode({ [field]: event.target.value });
    };

  const handleLayoutNumberFieldChange =
    (field: 'span' | 'componentSpan') => (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = Number.parseInt(event.target.value, 10);
      updateSelectedLayoutNode({ [field]: Number.isFinite(rawValue) ? rawValue : undefined });
    };

  const handleLayoutPropsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const raw = event.target.value.trim();
    if (raw.length === 0) {
      updateSelectedLayoutNode({ props: undefined });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        updateSelectedLayoutNode({ props: parsed as Record<string, JSONValue> });
      }
    } catch {
      /* ignore invalid JSON while typing */
    }
  };

  const handleFlowConnectionCreate = (input: { from: string; to: string }) => {
    const result = addBuilderTransition(flowGraph, { from: input.from, to: input.to, onEvent: 'next' });
    setFlowGraph(result.flow);
    setSelectedTransitionId(result.transitionId);
    setSelectedFlowScreenId(input.to);
    pushAuditEntry({
      action: 'flow.transition.add',
      summary: `Added transition ${input.from} -> ${input.to}`,
      metadata: { from: input.from, to: input.to },
    });
  };

  const handleFlowScreenMove = (input: { screenId: string; position: { x: number; y: number } }) => {
    setFlowGraph((c) => updateBuilderScreenPosition(c, input.screenId, input.position));
  };

  const handleAddTransitionFromForm = () => {
    if (!transitionDraft.from || !transitionDraft.to) return;
    const result = addBuilderTransition(flowGraph, {
      from: transitionDraft.from,
      to: transitionDraft.to,
      onEvent: transitionDraft.onEvent,
      condition: transitionDraft.condition,
    });
    setFlowGraph(result.flow);
    setSelectedTransitionId(result.transitionId);
    pushAuditEntry({
      action: 'flow.transition.add',
      summary: `Added transition ${transitionDraft.from} -> ${transitionDraft.to}`,
      metadata: { ...transitionDraft },
    });
  };

  const handleTransitionPatch = (
    transitionId: string,
    patch: Partial<Pick<FlowTransitionEdge, 'from' | 'to' | 'onEvent' | 'condition'>>,
  ) => {
    setFlowGraph((c) => updateBuilderTransition(c, transitionId, patch));
    pushAuditEntry({
      action: 'flow.transition.update',
      summary: `Updated transition ${transitionId}`,
      metadata: { transitionId, patchKeys: Object.keys(patch) },
    });
  };

  const handleRemoveTransition = (transitionId: string) => {
    setFlowGraph((c) => deleteBuilderTransition(c, transitionId));
    setSelectedTransitionId(null);
    pushAuditEntry({
      action: 'flow.transition.remove',
      summary: `Removed transition ${transitionId}`,
      metadata: { transitionId },
    });
  };

  const handleCreateConfig = () => {
    setConfigMessage(null);
    const trimmedId = newConfigId.trim();
    if (!trimmedId) {
      setConfigMessage('Config ID is required.');
      return;
    }
    if (!ensureValidForAction('creating a config')) return;
    const trimmedTenant = newConfigTenantId.trim() || DEFAULT_TENANT_ID;
    const result = createConfigPackage(configStore, {
      id: trimmedId,
      name: newConfigName.trim() || trimmedId,
      tenantId: trimmedTenant,
      bundle: applicationBundle,
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: trimmedId,
      versionId: result.value.version.id,
      action: 'config.create',
      summary: `Created config ${trimmedId} (v${result.value.version.version})`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setNewConfigId('');
    setNewConfigName('');
    setNewConfigTenantId(trimmedTenant);
  };

  const handlePackageSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const packageId = event.target.value;
    const pkg = configStore.packages.find((p) => p.id === packageId);
    if (!pkg) return;
    const latest = getLatestVersion(pkg) ?? pkg.versions[0];
    if (!latest) return;
    commitConfigStore(setActiveVersionInStore(configStore, pkg.id, latest.id));
  };

  const handleVersionSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    if (!activePackage) return;
    const versionId = event.target.value;
    commitConfigStore(setActiveVersionInStore(configStore, activePackage.id, versionId));
  };

  const handleSaveDraft = () => {
    setConfigMessage(null);
    if (!activePackage || !activeVersion) return;
    if (!canSaveDraft) {
      setConfigMessage('Only draft or rejected versions can be saved.');
      return;
    }
    if (!ensureValidForAction('saving')) return;
    const result = saveDraftVersion(configStore, {
      packageId: activePackage.id,
      versionId: activeVersion.id,
      bundle: applicationBundle,
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: activePackage.id,
      versionId: result.value.id,
      action: 'version.save',
      summary: `Saved draft v${result.value.version}`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setBundleUpdatedAt(result.value.updatedAt);
    setBundleStatus(result.value.status);
  };

  const handleCreateDraft = () => {
    setConfigMessage(null);
    if (!activePackage) return;
    if (!ensureValidForAction('creating a draft')) return;
    const result = createDraftVersion(configStore, {
      packageId: activePackage.id,
      bundle: applicationBundle,
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: activePackage.id,
      versionId: result.value.id,
      action: 'version.create',
      summary: `Created draft v${result.value.version}`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setBundleVersion(result.value.version);
    setBundleStatus(result.value.status);
    setBundleCreatedAt(result.value.createdAt);
    setBundleUpdatedAt(result.value.updatedAt);
  };

  const handlePromote = () => {
    setConfigMessage(null);
    if (!activePackage || !activeVersion) return;
    if (!canPromote) {
      setConfigMessage('Only drafts can be submitted.');
      return;
    }
    if (!ensureValidForAction('promoting')) return;
    const result = updateVersionStatus(configStore, {
      packageId: activePackage.id,
      versionId: activeVersion.id,
      status: 'SUBMITTED',
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: activePackage.id,
      versionId: result.value.id,
      action: 'version.promote',
      summary: `Submitted v${result.value.version}`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setBundleStatus(result.value.status);
    setBundleUpdatedAt(result.value.updatedAt);
  };

  const handleApprove = () => {
    setConfigMessage(null);
    if (!activePackage || !activeVersion) return;
    if (!canApprove) {
      setConfigMessage('Only submitted versions can be approved.');
      return;
    }
    if (!ensureValidForAction('approving')) return;
    const result = updateVersionStatus(configStore, {
      packageId: activePackage.id,
      versionId: activeVersion.id,
      status: 'APPROVED',
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: activePackage.id,
      versionId: result.value.id,
      action: 'version.approve',
      summary: `Approved v${result.value.version}`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setBundleStatus(result.value.status);
    setBundleUpdatedAt(result.value.updatedAt);
  };

  const handleReject = () => {
    setConfigMessage(null);
    if (!activePackage || !activeVersion) return;
    if (!canReject) {
      setConfigMessage('Only submitted versions can be rejected.');
      return;
    }
    const result = updateVersionStatus(configStore, {
      packageId: activePackage.id,
      versionId: activeVersion.id,
      status: 'REJECTED',
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: activePackage.id,
      versionId: result.value.id,
      action: 'version.reject',
      summary: `Rejected v${result.value.version}`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setBundleStatus(result.value.status);
    setBundleUpdatedAt(result.value.updatedAt);
  };

  const handlePublish = () => {
    setConfigMessage(null);
    if (!activePackage || !activeVersion) return;
    if (!canPublish) {
      setConfigMessage('Only approved versions can be published.');
      return;
    }
    if (!ensureValidForAction('publishing')) return;
    const result = updateVersionStatus(configStore, {
      packageId: activePackage.id,
      versionId: activeVersion.id,
      status: 'PUBLISHED',
      actor: DEFAULT_ACTOR,
    });
    if (!result.ok) {
      setConfigMessage(result.error);
      return;
    }
    const ae = buildAuditEntry({
      packageId: activePackage.id,
      versionId: result.value.id,
      action: 'version.publish',
      summary: `Published v${result.value.version}`,
    });
    commitConfigStore(recordAuditEntry(result.state, ae));
    setBundleStatus(result.value.status);
    setBundleUpdatedAt(result.value.updatedAt);
  };

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
    pushAuditEntry({ action: 'bundle.export', summary: `Exported bundle ${filename}` });
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportBundle = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setImportMessage(null);
    setConfigMessage(null);
    try {
      const sizeError = checkFileSize(file);
      if (sizeError) {
        setImportMessage(sizeError);
        return;
      }
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setImportMessage('File does not contain valid JSON.');
        return;
      }
      const guard = validateBundleStructure(parsed);
      if (!guard.ok) {
        setImportMessage(guard.error);
        return;
      }
      const bundle = guard.bundle;
      const validation = validateApplicationBundle(bundle, componentContracts, {
        developmentMode,
        skipA11yI18nInDev: skipValidationInDev,
      });
      if (validation.issues.some((i) => i.severity === 'error')) {
        setImportMessage(
          `Import rejected: ${validation.issues.filter((i) => i.severity === 'error').length} errors found.`,
        );
        return;
      }
      const existing = configStore.packages.find((pkg) => pkg.id === bundle.metadata.configId);
      if (!existing) {
        const result = createConfigPackage(configStore, {
          id: bundle.metadata.configId,
          name: bundle.metadata.configId,
          tenantId: bundle.metadata.tenantId,
          bundle,
          actor: DEFAULT_ACTOR,
        });
        if (!result.ok) {
          setImportMessage(result.error);
          return;
        }
        const ae = buildAuditEntry({
          packageId: bundle.metadata.configId,
          versionId: result.value.version.id,
          action: 'bundle.import',
          summary: `Imported new config ${bundle.metadata.configId}`,
        });
        commitConfigStore(recordAuditEntry(result.state, ae));
        setImportMessage(`Imported ${bundle.metadata.configId} as a new config.`);
        return;
      }
      const draftResult = createDraftVersion(configStore, {
        packageId: existing.id,
        bundle,
        actor: DEFAULT_ACTOR,
      });
      if (!draftResult.ok) {
        setImportMessage(draftResult.error);
        return;
      }
      const ae = buildAuditEntry({
        packageId: existing.id,
        versionId: draftResult.value.id,
        action: 'bundle.import',
        summary: `Imported bundle as v${draftResult.value.version}`,
      });
      commitConfigStore(recordAuditEntry(draftResult.state, ae));
      setImportMessage(`Imported bundle as draft v${draftResult.value.version}.`);
    } catch (err) {
      setImportMessage(err instanceof Error ? `Import failed: ${err.message}` : 'Import failed unexpectedly.');
    }
  };

  /* ── Context value ── */

  const value: BuilderContextValue = {
    paletteOpen, setPaletteOpen,
    inspectorOpen, setInspectorOpen,
    editMode, setEditMode,
    builderMode, setBuilderMode,
    previewBreakpoint, setPreviewBreakpoint,
    previewDataMode, setPreviewDataMode,
    skipValidationInDev, setSkipValidationInDev,
    flowGraph, activeScreenId, setActiveScreenId, activeScreen,
    selectedFlowScreenId, setSelectedFlowScreenId, selectedFlowScreen,
    selectedTransitionId, setSelectedTransitionId, selectedTransition,
    newScreenTitle, setNewScreenTitle,
    transitionDraft, setTransitionDraft,
    schemasByScreenId, activeSchema,
    selectedLayoutNodeId, selectedLayoutNode,
    selectedComponent, selectedComponentContract,
    configStore, bundleConfigId, bundleTenantId, bundleStatus,
    bundleVersion, bundleCreatedAt, bundleUpdatedAt,
    configMessage, setConfigMessage, importMessage, setImportMessage,
    newConfigId, setNewConfigId, newConfigName, setNewConfigName,
    newConfigTenantId, setNewConfigTenantId,
    activePackage, activeVersion,
    applicationBundle, validationResult, validationErrors, validationWarnings,
    legacyFlowStateMachine, developmentMode,
    sortedPalette, paletteEntries, componentContracts, summary,
    recentAuditEntries,
    screensCount, transitionsCount, sectionsCount, rowsCount, columnsCount, componentsCount,
    canSaveDraft, canPromote, canApprove, canReject, canPublish, canCreateDraft,
    packageOptions, versionOptions,
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

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}
