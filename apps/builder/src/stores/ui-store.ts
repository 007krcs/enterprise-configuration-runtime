import { create } from 'zustand';

export type BuilderMode = 'layout' | 'flow';
export type PreviewBreakpoint = 'desktop' | 'tablet' | 'mobile';
export type PreviewDataMode = 'mock' | 'real';

export interface UIStoreState {
  paletteOpen: boolean;
  inspectorOpen: boolean;
  editMode: boolean;
  builderMode: BuilderMode;
  previewBreakpoint: PreviewBreakpoint;
  previewDataMode: PreviewDataMode;
  skipValidationInDev: boolean;
}

export interface UIStoreActions {
  setPaletteOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setInspectorOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  setEditMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  setBuilderMode: (value: BuilderMode | ((prev: BuilderMode) => BuilderMode)) => void;
  setPreviewBreakpoint: (value: PreviewBreakpoint | ((prev: PreviewBreakpoint) => PreviewBreakpoint)) => void;
  setPreviewDataMode: (value: PreviewDataMode | ((prev: PreviewDataMode) => PreviewDataMode)) => void;
  setSkipValidationInDev: (value: boolean | ((prev: boolean) => boolean)) => void;
}

function resolve<T>(value: T | ((prev: T) => T), prev: T): T {
  return typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
}

export const useUIStore = create<UIStoreState & UIStoreActions>()((set) => ({
  paletteOpen: true,
  inspectorOpen: true,
  editMode: true,
  builderMode: 'layout',
  previewBreakpoint: 'desktop',
  previewDataMode: 'mock',
  skipValidationInDev: false,

  setPaletteOpen: (value) => set((s) => ({ paletteOpen: resolve(value, s.paletteOpen) })),
  setInspectorOpen: (value) => set((s) => ({ inspectorOpen: resolve(value, s.inspectorOpen) })),
  setEditMode: (value) => set((s) => ({ editMode: resolve(value, s.editMode) })),
  setBuilderMode: (value) => set((s) => ({ builderMode: resolve(value, s.builderMode) })),
  setPreviewBreakpoint: (value) => set((s) => ({ previewBreakpoint: resolve(value, s.previewBreakpoint) })),
  setPreviewDataMode: (value) => set((s) => ({ previewDataMode: resolve(value, s.previewDataMode) })),
  setSkipValidationInDev: (value) => set((s) => ({ skipValidationInDev: resolve(value, s.skipValidationInDev) })),
}));
