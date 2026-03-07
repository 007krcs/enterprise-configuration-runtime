'use client';

import React from 'react';
import { Button, Input, Select } from '@platform/component-system';
import { useBuilder } from '../../../components/BuilderContext';
import { FlowEditor } from '../../../components/FlowEditor';
import ws from '../workspace.module.css';

export default function FlowWorkspacePage() {
  const b = useBuilder();

  return (
    <div>
      {/* Page header */}
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Flow</h1>
        <p className={ws.pageSubtitle}>
          Design state transitions between screens. Drag nodes to reposition, click handles to create connections.
        </p>
      </div>

      {/* Stats */}
      <div className={ws.statsRow} style={{ marginBottom: 'var(--ecr-spacing-4)' }}>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.screensCount}</span>
          <span className={ws.statLabel}>Screens</span>
        </div>
        <div className={ws.statItem}>
          <span className={ws.statValue}>{b.transitionsCount}</span>
          <span className={ws.statLabel}>Transitions</span>
        </div>
      </div>

      {/* Split: FlowEditor | Sidebar */}
      <div className={ws.splitLayout}>
        {/* Flow editor canvas */}
        <div className={ws.cardFlush} style={{ minHeight: 500 }}>
          <FlowEditor
            flow={b.flowGraph}
            activeScreenId={b.activeScreen?.id ?? ''}
            selectedScreenId={b.selectedFlowScreen?.id ?? null}
            selectedTransitionId={b.selectedTransitionId}
            onSelectScreen={(screenId) => {
              b.setSelectedFlowScreenId(screenId);
              b.setSelectedTransitionId(null);
            }}
            onSetActiveScreen={(screenId) => {
              b.setActiveScreenId(screenId);
              b.setSelectedFlowScreenId(screenId);
              b.setBuilderMode('layout');
            }}
            onSelectTransition={(transitionId) => {
              b.setSelectedTransitionId(transitionId);
              const t = b.flowGraph.transitions.find((tr) => tr.id === transitionId);
              if (t) b.setSelectedFlowScreenId(t.to);
            }}
            onCreateTransition={b.handleFlowConnectionCreate}
            onMoveScreen={b.handleFlowScreenMove}
          />
        </div>

        {/* Sidebar */}
        <aside className={ws.sidebar}>
          {/* Screen list */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Screens</h2>
            </div>
            <div className={ws.cardBody}>
              {b.flowGraph.screens.map((screen) => (
                <button
                  key={screen.id}
                  type="button"
                  className={`${ws.listItem} ${screen.id === b.selectedFlowScreen?.id ? ws.listItemActive : ''}`}
                  onClick={() => {
                    b.setSelectedFlowScreenId(screen.id);
                    b.setSelectedTransitionId(null);
                  }}
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

          {/* Screen properties */}
          {b.selectedFlowScreen && (
            <div className={ws.card}>
              <div className={ws.cardHeader}>
                <h2 className={ws.cardTitle}>Screen Properties</h2>
              </div>
              <div className={ws.cardBody}>
                <div className={ws.fieldGroup}>
                  <div className={ws.field}>
                    <Input label="Screen ID" value={b.selectedFlowScreen.id} readOnly size="sm" />
                  </div>
                  <div className={ws.field}>
                    <Input
                      key={`title-${b.selectedFlowScreen.id}`}
                      label="Title"
                      defaultValue={b.selectedFlowScreen.title}
                      size="sm"
                      onBlur={() => b.handleSelectScreen(b.selectedFlowScreen!.id)}
                    />
                  </div>
                </div>
                <div className={ws.buttonRow}>
                  <Button type="button" variant="secondary" size="sm" onClick={() => b.handleSelectScreen(b.selectedFlowScreen!.id)}>
                    Edit Layout
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={b.handleRemoveSelectedScreen} disabled={b.flowGraph.screens.length <= 1}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Add transition */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Add Transition</h2>
            </div>
            <div className={ws.cardBody}>
              <div className={ws.fieldGroup}>
                <div className={ws.field}>
                  <Select
                    id="tr-from"
                    label="From"
                    value={b.transitionDraft.from}
                    size="sm"
                    onChange={(e) => b.setTransitionDraft((c) => ({ ...c, from: e.target.value }))}
                    options={b.flowGraph.screens.map((s) => ({ value: s.id, label: s.title }))}
                  />
                </div>
                <div className={ws.field}>
                  <Select
                    id="tr-to"
                    label="To"
                    value={b.transitionDraft.to}
                    size="sm"
                    onChange={(e) => b.setTransitionDraft((c) => ({ ...c, to: e.target.value }))}
                    options={b.flowGraph.screens.map((s) => ({ value: s.id, label: s.title }))}
                  />
                </div>
                <div className={ws.field}>
                  <Input id="tr-event" label="Event" value={b.transitionDraft.onEvent} size="sm" onChange={(e) => b.setTransitionDraft((c) => ({ ...c, onEvent: e.target.value }))} />
                </div>
                <div className={ws.field}>
                  <Input id="tr-cond" label="Condition" value={b.transitionDraft.condition} size="sm" placeholder="rule:EligibilityPassed" onChange={(e) => b.setTransitionDraft((c) => ({ ...c, condition: e.target.value }))} />
                </div>
                <Button type="button" variant="primary" size="sm" onClick={b.handleAddTransitionFromForm}>
                  Add Transition
                </Button>
              </div>
            </div>
          </div>

          {/* Transition list */}
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Transitions</h2>
            </div>
            <div className={ws.cardBody}>
              {b.flowGraph.transitions.length === 0 ? (
                <p className={ws.emptyState}>No transitions yet. Use the form above or drag handles in the editor.</p>
              ) : (
                b.flowGraph.transitions.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${ws.listItem} ${t.id === b.selectedTransitionId ? ws.listItemActive : ''}`}
                    onClick={() => {
                      b.setSelectedTransitionId(t.id);
                      b.setSelectedFlowScreenId(t.to);
                    }}
                  >
                    <div>
                      <div className={ws.listItemTitle}>{t.from} &rarr; {t.to}</div>
                      <div className={ws.listItemMeta}>{t.onEvent}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Selected transition properties */}
          {b.selectedTransition && (
            <div className={ws.card}>
              <div className={ws.cardHeader}>
                <h2 className={ws.cardTitle}>Transition Properties</h2>
              </div>
              <div className={ws.cardBody}>
                <div className={ws.fieldGroup}>
                  <div className={ws.field}>
                    <Select label="From" value={b.selectedTransition.from} size="sm" onChange={(e) => b.handleTransitionPatch(b.selectedTransition!.id, { from: e.target.value })} options={b.flowGraph.screens.map((s) => ({ value: s.id, label: s.title }))} />
                  </div>
                  <div className={ws.field}>
                    <Select label="To" value={b.selectedTransition.to} size="sm" onChange={(e) => b.handleTransitionPatch(b.selectedTransition!.id, { to: e.target.value })} options={b.flowGraph.screens.map((s) => ({ value: s.id, label: s.title }))} />
                  </div>
                  <div className={ws.field}>
                    <Input label="Event" value={b.selectedTransition.onEvent} size="sm" onChange={(e) => b.handleTransitionPatch(b.selectedTransition!.id, { onEvent: e.target.value })} />
                  </div>
                  <div className={ws.field}>
                    <Input label="Condition" value={typeof b.selectedTransition.condition === 'string' ? b.selectedTransition.condition : ''} size="sm" onChange={(e) => b.handleTransitionPatch(b.selectedTransition!.id, { condition: e.target.value })} />
                  </div>
                </div>
                <Button type="button" variant="danger" size="sm" onClick={() => b.handleRemoveTransition(b.selectedTransition!.id)}>
                  Remove Transition
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
