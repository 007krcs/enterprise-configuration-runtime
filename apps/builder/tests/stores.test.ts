import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useUIStore } from '../src/stores/ui-store';
import { useHistoryStore } from '../src/stores/history-store';
import { isValidTransition } from '../src/lib/config-governance';

describe('UI Store', () => {
  beforeEach(() => {
    useUIStore.setState({
      paletteOpen: true,
      inspectorOpen: true,
      editMode: true,
      builderMode: 'layout',
      previewBreakpoint: 'desktop',
      previewDataMode: 'mock',
      skipValidationInDev: false,
    });
  });

  it('toggles palette open state', () => {
    const store = useUIStore.getState();
    store.setPaletteOpen(false);
    expect(useUIStore.getState().paletteOpen).toBe(false);
  });

  it('accepts updater function for state setter', () => {
    const store = useUIStore.getState();
    store.setPaletteOpen((prev) => !prev);
    expect(useUIStore.getState().paletteOpen).toBe(false);
    store.setPaletteOpen((prev) => !prev);
    expect(useUIStore.getState().paletteOpen).toBe(true);
  });

  it('changes builder mode', () => {
    useUIStore.getState().setBuilderMode('flow');
    expect(useUIStore.getState().builderMode).toBe('flow');
  });

  it('changes preview breakpoint', () => {
    useUIStore.getState().setPreviewBreakpoint('mobile');
    expect(useUIStore.getState().previewBreakpoint).toBe('mobile');
  });
});

describe('History Store (undo/redo)', () => {
  beforeEach(() => {
    useHistoryStore.getState().clear();
  });

  it('pushes and undoes a command', () => {
    let value = 0;
    useHistoryStore.getState().push({
      id: 'cmd-1',
      label: 'increment',
      execute: () => { value = 1; },
      undo: () => { value = 0; },
    });
    expect(value).toBe(1);
    expect(useHistoryStore.getState().canUndo()).toBe(true);

    useHistoryStore.getState().undo();
    expect(value).toBe(0);
    expect(useHistoryStore.getState().canUndo()).toBe(false);
  });

  it('supports redo after undo', () => {
    let value = 0;
    useHistoryStore.getState().push({
      id: 'cmd-1',
      label: 'increment',
      execute: () => { value = 1; },
      undo: () => { value = 0; },
    });
    useHistoryStore.getState().undo();
    expect(value).toBe(0);
    expect(useHistoryStore.getState().canRedo()).toBe(true);

    useHistoryStore.getState().redo();
    expect(value).toBe(1);
  });

  it('clears redo stack on new push', () => {
    let value = 0;
    useHistoryStore.getState().push({
      id: 'cmd-1', label: 'set-1',
      execute: () => { value = 1; }, undo: () => { value = 0; },
    });
    useHistoryStore.getState().undo();
    expect(useHistoryStore.getState().canRedo()).toBe(true);

    useHistoryStore.getState().push({
      id: 'cmd-2', label: 'set-2',
      execute: () => { value = 2; }, undo: () => { value = 0; },
    });
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });

  it('limits stack to 50 entries', () => {
    for (let i = 0; i < 60; i++) {
      useHistoryStore.getState().push({
        id: `cmd-${i}`, label: `cmd-${i}`,
        execute: () => {}, undo: () => {},
      });
    }
    expect(useHistoryStore.getState().undoStack.length).toBeLessThanOrEqual(50);
  });

  it('clears all history', () => {
    useHistoryStore.getState().push({
      id: 'cmd-1', label: 'test',
      execute: () => {}, undo: () => {},
    });
    useHistoryStore.getState().clear();
    expect(useHistoryStore.getState().canUndo()).toBe(false);
    expect(useHistoryStore.getState().canRedo()).toBe(false);
  });
});

describe('Config Transition Enforcement', () => {
  it('allows DRAFT → SUBMITTED', () => {
    expect(isValidTransition('DRAFT', 'SUBMITTED')).toBe(true);
  });

  it('allows SUBMITTED → APPROVED', () => {
    expect(isValidTransition('SUBMITTED', 'APPROVED')).toBe(true);
  });

  it('allows SUBMITTED → REJECTED', () => {
    expect(isValidTransition('SUBMITTED', 'REJECTED')).toBe(true);
  });

  it('allows APPROVED → PUBLISHED', () => {
    expect(isValidTransition('APPROVED', 'PUBLISHED')).toBe(true);
  });

  it('allows REJECTED → DRAFT', () => {
    expect(isValidTransition('REJECTED', 'DRAFT')).toBe(true);
  });

  it('disallows DRAFT → PUBLISHED (skipping steps)', () => {
    expect(isValidTransition('DRAFT', 'PUBLISHED')).toBe(false);
  });

  it('disallows DRAFT → APPROVED (skipping steps)', () => {
    expect(isValidTransition('DRAFT', 'APPROVED')).toBe(false);
  });

  it('disallows PUBLISHED → DRAFT (backwards)', () => {
    expect(isValidTransition('PUBLISHED', 'DRAFT')).toBe(false);
  });

  it('disallows ARCHIVED → any', () => {
    expect(isValidTransition('ARCHIVED', 'DRAFT')).toBe(false);
    expect(isValidTransition('ARCHIVED', 'PUBLISHED')).toBe(false);
  });
});
