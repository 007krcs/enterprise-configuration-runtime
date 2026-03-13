export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface BuilderError {
  code: string;
  severity: ErrorSeverity;
  message: string;
  recovery?: string;
  context?: Record<string, unknown>;
}

type ErrorListener = (error: BuilderError) => void;

const listeners = new Set<ErrorListener>();

export function reportError(error: BuilderError): void {
  for (const listener of listeners) {
    try {
      listener(error);
    } catch {
      // Prevent listener errors from breaking the reporter
    }
  }

  if (error.severity === 'fatal' || error.severity === 'error') {
    console.error(`[builder:${error.code}] ${error.message}`, error.context);
  } else if (error.severity === 'warning') {
    console.warn(`[builder:${error.code}] ${error.message}`);
  }
}

export function onBuilderError(listener: ErrorListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function clearErrorListeners(): void {
  listeners.clear();
}

/* ── Common error factories ── */

export function pluginLoadError(pluginId: string, cause: unknown): BuilderError {
  return {
    code: 'PLUGIN_LOAD_FAILED',
    severity: 'warning',
    message: `Plugin "${pluginId}" failed to load.`,
    recovery: 'The builder will continue without this plugin. Check the plugin configuration.',
    context: { pluginId, cause: cause instanceof Error ? cause.message : String(cause) },
  };
}

export function storagePersistError(cause: string): BuilderError {
  return {
    code: 'STORAGE_PERSIST_FAILED',
    severity: 'error',
    message: `Failed to persist config: ${cause}`,
    recovery: 'Export your bundle as JSON to avoid data loss.',
    context: { cause },
  };
}

export function validationTimeoutError(): BuilderError {
  return {
    code: 'VALIDATION_TIMEOUT',
    severity: 'warning',
    message: 'Bundle validation took too long and was aborted.',
    recovery: 'Reduce bundle complexity or disable optional validations.',
  };
}

export function importParseError(filename: string, cause: string): BuilderError {
  return {
    code: 'IMPORT_PARSE_FAILED',
    severity: 'error',
    message: `Failed to parse imported file "${filename}": ${cause}`,
    recovery: 'Ensure the file is valid JSON and follows the application bundle schema.',
    context: { filename, cause },
  };
}
