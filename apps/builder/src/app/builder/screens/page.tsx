'use client';

import React, { type ChangeEvent } from 'react';
import { Button, Checkbox, Input, Select } from '@platform/component-system';
import type { ComponentContract, ComponentPropDefinition } from '@platform/component-contract';
import type { LayoutTreeNode, UIComponent, JSONValue } from '@platform/schema';
import { useBuilder } from '../../../components/BuilderContext';
import { Canvas } from '../../../components/Canvas';
import ws from '../workspace.module.css';

export default function ScreensWorkspacePage() {
  const b = useBuilder();

  return (
    <div>
      {/* Page header */}
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Screens</h1>
        <p className={ws.pageSubtitle}>
          Design and edit screen layouts with a drag-and-drop canvas. Select a screen, add components from the palette, and configure properties.
        </p>
      </div>

      {/* Toolbar */}
      <div className={ws.toolbar}>
        <div className={ws.toolbarGroup}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => b.setEditMode((c) => !c)}
            aria-pressed={!b.editMode}
          >
            {b.editMode ? 'Preview' : 'Edit'}
          </Button>
          {!b.editMode && (
            <Select
              id="bp"
              label=""
              value={b.previewBreakpoint}
              size="sm"
              onChange={(e) => b.setPreviewBreakpoint(e.target.value as 'desktop' | 'tablet' | 'mobile')}
              options={[
                { value: 'desktop', label: 'Desktop' },
                { value: 'tablet', label: 'Tablet' },
                { value: 'mobile', label: 'Mobile' },
              ]}
            />
          )}
        </div>
        <div className={ws.toolbarSpacer} />
        <div className={ws.toolbarGroup}>
          <Button type="button" variant="primary" size="sm" onClick={b.handleExportBundle}>
            Export Bundle
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className={ws.statsRow} style={{ marginBottom: 'var(--ecr-spacing-4)' }}>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.screensCount}</span>
          <span className={ws.statLabel}>Screens</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.sectionsCount}</span>
          <span className={ws.statLabel}>Sections</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.rowsCount}</span>
          <span className={ws.statLabel}>Rows</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.columnsCount}</span>
          <span className={ws.statLabel}>Columns</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.componentsCount}</span>
          <span className={ws.statLabel}>Components</span>
        </div>
      </div>

      {/* Three-column layout: Palette | Canvas | Inspector */}
      <div className={ws.threeColLayout}>
        {/* Left sidebar: Screens + Palette */}
        <aside className={ws.leftSidebar}>
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Screens</h2>
            </div>
            <div className={ws.cardBody}>
              {b.flowGraph.screens.map((screen) => (
                <button
                  key={screen.id}
                  type="button"
                  className={`${ws.listItem} ${screen.id === b.activeScreen?.id ? ws.listItemActive : ''}`}
                  onClick={() => b.handleSelectScreen(screen.id)}
                >
                  <div>
                    <div className={ws.listItemTitle}>{screen.title}</div>
                    <div className={ws.listItemMeta}>{screen.id}</div>
                  </div>
                </button>
              ))}
              <div className={ws.addRow}>
                <Input
                  value={b.newScreenTitle}
                  onChange={(e) => b.setNewScreenTitle(e.target.value)}
                  placeholder="New screen title"
                  aria-label="New screen title"
                  size="sm"
                />
                <Button type="button" variant="primary" size="sm" onClick={b.handleAddScreen}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Palette</h2>
            </div>
            <div className={ws.cardBody}>
              <p style={{ margin: 0, fontSize: 'var(--ecr-font-size-xs)', color: 'var(--ecr-color-text-muted)' }}>
                Drag items onto the canvas or click Insert.
              </p>
              {b.sortedPalette.map((entry) => (
                <div key={entry.id} className={ws.paletteItem} draggable onDragStart={b.handlePaletteItemDragStart(entry)}>
                  <div>
                    <div className={ws.paletteItemName}>{entry.displayName}</div>
                    <div className={ws.paletteItemCategory}>{entry.category}</div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => b.handlePaletteItemInsert(entry)}>
                    Insert
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center: Canvas */}
        <div>
          <Canvas
            schema={b.activeSchema}
            editMode={b.editMode}
            previewBreakpoint={b.previewBreakpoint}
            dataMode={b.previewDataMode}
            selectedNodeId={b.selectedLayoutNodeId}
            onSelectNode={b.handleSelectLayoutNode}
            onDropPaletteItem={b.handlePaletteDrop}
          />
        </div>

        {/* Right sidebar: Properties */}
        <aside className={ws.rightSidebar}>
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Properties</h2>
            </div>
            <div className={ws.cardBody}>
              {b.selectedLayoutNode ? (
                <LayoutPropertyFields
                  node={b.selectedLayoutNode}
                  onTextFieldChange={b.handleLayoutTextFieldChange}
                  onNumberFieldChange={b.handleLayoutNumberFieldChange}
                  onPropsChange={b.handleLayoutPropsChange}
                />
              ) : (
                <p className={ws.emptyState}>
                  Select a section, row, column, or component to edit its properties.
                </p>
              )}
            </div>
          </div>

          {b.selectedLayoutNode?.kind === 'component' && b.selectedComponent && b.selectedComponentContract && (
            <div className={ws.card}>
              <div className={ws.cardHeader}>
                <h2 className={ws.cardTitle}>Component Props</h2>
              </div>
              <div className={ws.cardBody}>
                <ComponentPropFields
                  component={b.selectedComponent}
                  contract={b.selectedComponentContract}
                  onPropChange={b.updateSelectedComponentProp}
                />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* ── Layout Property Fields ── */

function LayoutPropertyFields({
  node,
  onTextFieldChange,
  onNumberFieldChange,
  onPropsChange,
}: {
  node: LayoutTreeNode;
  onTextFieldChange: (field: 'title' | 'label' | 'className') => (event: ChangeEvent<HTMLInputElement>) => void;
  onNumberFieldChange: (field: 'span' | 'componentSpan') => (event: ChangeEvent<HTMLInputElement>) => void;
  onPropsChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <div className={ws.fieldGroup}>
      <div className={ws.field}>
        <Input label="Node Type" value={node.kind} readOnly size="sm" />
      </div>
      <div className={ws.field}>
        <Input label="Label" value={node.label ?? ''} onChange={onTextFieldChange('label')} size="sm" />
      </div>
      <div className={ws.field}>
        <Input label="Class Name" value={node.className ?? ''} onChange={onTextFieldChange('className')} size="sm" />
      </div>
      {node.kind === 'section' && (
        <div className={ws.field}>
          <Input label="Section Title" value={node.title ?? ''} onChange={onTextFieldChange('title')} size="sm" />
        </div>
      )}
      {node.kind === 'column' && (
        <div className={ws.field}>
          <Input label="Column Span (1-12)" type="number" min={1} max={12} value={node.span ?? ''} onChange={onNumberFieldChange('span')} size="sm" />
        </div>
      )}
      {node.kind === 'component' && (
        <div className={ws.field}>
          <Input label="Component Span (1-12)" type="number" min={1} max={12} value={node.componentSpan ?? ''} onChange={onNumberFieldChange('componentSpan')} size="sm" />
        </div>
      )}
      <div className={ws.field}>
        <label className={ws.fieldLabel} htmlFor={`layout-props-${node.id}`}>Props JSON</label>
        <textarea id={`layout-props-${node.id}`} className={ws.jsonField} defaultValue={JSON.stringify(node.props ?? {}, null, 2)} onBlur={onPropsChange} placeholder='{"columnsTablet": 6}' />
      </div>
    </div>
  );
}

/* ── Component Prop Fields ── */

function ComponentPropFields({
  component,
  contract,
  onPropChange,
}: {
  component: UIComponent;
  contract: ComponentContract;
  onPropChange: (propKey: string, value: JSONValue | undefined) => void;
}) {
  const entries = Object.entries(contract.props ?? {});
  if (entries.length === 0) {
    return <p className={ws.emptyState}>No configurable properties.</p>;
  }
  const sorted = entries
    .filter((entry): entry is [string, ComponentPropDefinition] => entry[1] !== undefined)
    .sort((a, b) => (a[1].label ?? a[0]).localeCompare(b[1].label ?? b[0]));

  return (
    <div className={ws.fieldGroup}>
      {sorted.map(([propKey, definition]) => (
        <ComponentPropField key={propKey} propKey={propKey} definition={definition} component={component} onPropChange={onPropChange} />
      ))}
    </div>
  );
}

function ComponentPropField({
  propKey,
  definition,
  component,
  onPropChange,
}: {
  propKey: string;
  definition: ComponentPropDefinition;
  component: UIComponent;
  onPropChange: (propKey: string, value: JSONValue | undefined) => void;
}) {
  const rawValue = component.props?.[propKey] ?? definition.defaultValue;
  const editable = definition.editable !== false;

  if (definition.kind === 'boolean') {
    return (
      <div className={ws.field}>
        <Checkbox label={definition.label ?? propKey} checked={rawValue === true} disabled={!editable} onChange={(e) => onPropChange(propKey, e.target.checked)} />
      </div>
    );
  }
  if (definition.kind === 'enum' && definition.options) {
    return (
      <div className={ws.field}>
        <Select
          label={definition.label ?? propKey}
          value={typeof rawValue === 'string' ? rawValue : ''}
          size="sm"
          disabled={!editable}
          onChange={(e) => onPropChange(propKey, e.target.value || undefined)}
          options={[{ value: '', label: '(default)' }, ...definition.options.map((opt) => ({ value: typeof opt === 'string' ? opt : opt.value, label: typeof opt === 'string' ? opt : opt.label }))]}
        />
      </div>
    );
  }
  if (definition.kind === 'number') {
    return (
      <div className={ws.field}>
        <Input label={definition.label ?? propKey} type="number" value={typeof rawValue === 'number' ? rawValue : ''} size="sm" readOnly={!editable} onChange={(e) => { const v = Number.parseFloat(e.target.value); onPropChange(propKey, Number.isFinite(v) ? v : undefined); }} />
      </div>
    );
  }
  if (definition.kind === 'json') {
    return (
      <div className={ws.field}>
        <label className={ws.fieldLabel} htmlFor={`prop-${propKey}`}>{definition.label ?? propKey} (JSON)</label>
        <textarea id={`prop-${propKey}`} className={ws.jsonField} defaultValue={rawValue !== undefined ? JSON.stringify(rawValue, null, 2) : ''} readOnly={!editable} onBlur={(e) => { const raw = e.target.value.trim(); if (!raw) { onPropChange(propKey, undefined); return; } try { onPropChange(propKey, JSON.parse(raw) as JSONValue); } catch { /* ignore */ } }} />
      </div>
    );
  }

  return (
    <div className={ws.field}>
      <Input label={definition.label ?? propKey} value={typeof rawValue === 'string' ? rawValue : rawValue !== undefined ? String(rawValue) : ''} size="sm" readOnly={!editable} onChange={(e) => onPropChange(propKey, e.target.value || undefined)} />
    </div>
  );
}
