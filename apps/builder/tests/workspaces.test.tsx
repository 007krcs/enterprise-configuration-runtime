import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the BuilderContext so pages that call useBuilder() render without a provider
vi.mock('../src/components/BuilderContext', () => ({
  useBuilder: () => mockBuilderContext,
}));

// Mock @platform/component-system UI primitives used in pages
vi.mock('@platform/component-system', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Input: (props: any) => <input {...props} />,
  Select: ({ children, ...props }: any) => <select {...props}>{children}</select>,
  Checkbox: (props: any) => <input type="checkbox" {...props} />,
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock @platform/schema serializer used in json page
vi.mock('@platform/schema', async () => {
  const actual = await vi.importActual('@platform/schema');
  return {
    ...actual,
    serializeApplicationBundle: () => '{}',
  };
});

const noop = () => {};

const mockBuilderContext = {
  paletteOpen: true,
  setPaletteOpen: noop,
  inspectorOpen: true,
  setInspectorOpen: noop,
  editMode: true,
  setEditMode: noop,
  builderMode: 'screens',
  setBuilderMode: noop,
  previewBreakpoint: 'desktop',
  setPreviewBreakpoint: noop,
  previewDataMode: 'schema',
  setPreviewDataMode: noop,
  skipValidationInDev: false,
  setSkipValidationInDev: noop,

  flowGraph: { screens: [], transitions: [] },
  activeScreenId: 'screen-1',
  setActiveScreenId: noop,
  activeScreen: { id: 'screen-1', title: 'Welcome', position: { x: 0, y: 0 } },
  selectedFlowScreenId: null,
  setSelectedFlowScreenId: noop,
  selectedFlowScreen: null,
  selectedTransitionId: null,
  setSelectedTransitionId: noop,
  selectedTransition: null,
  newScreenTitle: '',
  setNewScreenTitle: noop,
  transitionDraft: { from: '', to: '', onEvent: '', condition: '' },
  setTransitionDraft: noop,

  schemasByScreenId: {},
  activeSchema: { sections: [] },
  selectedLayoutNodeId: null,
  selectedLayoutNode: undefined,
  selectedComponent: null,
  selectedComponentContract: null,

  configStore: { packages: [] },
  bundleConfigId: 'cfg-1',
  bundleTenantId: 'tenant-1',
  bundleStatus: 'draft',
  bundleVersion: 1,
  bundleCreatedAt: '2025-01-01T00:00:00Z',
  bundleUpdatedAt: '2025-01-01T00:00:00Z',
  configMessage: null,
  setConfigMessage: noop,
  importMessage: null,
  setImportMessage: noop,
  newConfigId: '',
  setNewConfigId: noop,
  newConfigName: '',
  setNewConfigName: noop,
  newConfigTenantId: '',
  setNewConfigTenantId: noop,
  activePackage: null,
  activeVersion: null,

  applicationBundle: {
    configId: 'cfg-1',
    tenantId: 'tenant-1',
    version: 1,
    status: 'draft',
    uiSchemas: {},
    flowSchema: { screens: [], transitions: [] },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  validationResult: { valid: true, issues: [] },
  validationErrors: [],
  validationWarnings: [],
  legacyFlowStateMachine: { screens: [], transitions: [] },
  developmentMode: false,

  sortedPalette: [],
  paletteEntries: [],
  componentContracts: [],
  summary: { totalScreens: 0, totalComponents: 0 },
  recentAuditEntries: [],

  screensCount: 0,
  transitionsCount: 0,
  sectionsCount: 0,
  rowsCount: 0,
  columnsCount: 0,
  componentsCount: 0,

  canSaveDraft: false,
  canPromote: false,
  canApprove: false,
  canReject: false,
  canPublish: false,
  canCreateDraft: false,

  packageOptions: [],
  versionOptions: [],

  handleSelectScreen: noop,
  handleAddScreen: noop,
  handleRemoveSelectedScreen: noop,
  handleSelectLayoutNode: noop,
  handlePaletteDrop: noop,
  handlePaletteItemDragStart: () => noop,
  handlePaletteItemInsert: noop,
  updateSelectedLayoutNode: noop,
  updateSelectedComponentProp: noop,
  handleLayoutTextFieldChange: () => noop,
  handleLayoutNumberFieldChange: () => noop,
  handleLayoutPropsChange: noop,
  handleFlowConnectionCreate: noop,
  handleFlowScreenMove: noop,
  handleAddTransitionFromForm: noop,
  handleTransitionPatch: noop,
  handleRemoveTransition: noop,
  handleCreateConfig: noop,
  handlePackageSelect: noop,
  handleVersionSelect: noop,
  handleSaveDraft: noop,
  handleCreateDraft: noop,
  handlePromote: noop,
  handleApprove: noop,
  handleReject: noop,
  handlePublish: noop,
  handleExportBundle: noop,
  handleImportClick: noop,
  handleImportBundle: async () => {},
  importInputRef: { current: null },
};

import ScreensWorkspacePage from '../src/app/builder/screens/page';
import FlowWorkspacePage from '../src/app/builder/flow/page';
import RulesWorkspacePage from '../src/app/builder/rules/page';
import DataWorkspacePage from '../src/app/builder/data/page';
import ComponentsWorkspacePage from '../src/app/builder/components/page';
import DocsWorkspacePage from '../src/app/builder/docs/page';
import RepoWorkspacePage from '../src/app/builder/repo/page';
import JsonWorkspacePage from '../src/app/builder/json/page';

describe('builder workspaces routing', () => {
  it('renders Screens workspace', () => {
    render(<ScreensWorkspacePage />);
    expect(screen.getByText('Screen Builder')).toBeInTheDocument();
  });

  it('renders Flow workspace', () => {
    render(<FlowWorkspacePage />);
    expect(screen.getByText('Flow')).toBeInTheDocument();
  });

  it('renders Rules workspace', () => {
    render(<RulesWorkspacePage />);
    expect(screen.getByText(/Rules/)).toBeInTheDocument();
  });

  it('renders Data workspace', () => {
    render(<DataWorkspacePage />);
    expect(screen.getByText(/Data/)).toBeInTheDocument();
  });

  it('renders Components workspace', () => {
    render(<ComponentsWorkspacePage />);
    expect(screen.getByText('Components')).toBeInTheDocument();
  });

  it('renders Docs workspace', () => {
    render(<DocsWorkspacePage />);
    // Page has both a title and sidebar heading with "Documentation"
    const docElements = screen.getAllByText('Documentation');
    expect(docElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders Repo workspace', () => {
    render(<RepoWorkspacePage />);
    expect(screen.getByText('Repo')).toBeInTheDocument();
  });

  it('renders JSON workspace', () => {
    render(<JsonWorkspacePage />);
    expect(screen.getByText('JSON Preview')).toBeInTheDocument();
  });
});
