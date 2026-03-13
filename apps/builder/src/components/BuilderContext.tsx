'use client';

/**
 * Backward-compatible re-export layer.
 *
 * All state management has been moved to Zustand stores in `src/stores/`.
 * This file re-exports the public API so existing imports continue to work.
 *
 * Consumers can also import directly from `../stores` for finer-grained
 * subscriptions (useUIStore, useFlowStore, useConfigStoreHook, useLayoutStore).
 */

export {
  BuilderProvider,
  useBuilder,
  type BuilderContextValue,
  type BuilderPaletteEntry,
  type BuilderProviderProps,
  type BuilderMode,
  type PreviewBreakpoint,
  type PreviewDataMode,
} from '../stores/builder-store';
