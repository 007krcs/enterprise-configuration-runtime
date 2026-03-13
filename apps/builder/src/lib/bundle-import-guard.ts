import type { ApplicationBundle } from '@platform/schema';

const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export type ImportGuardResult =
  | { ok: true; bundle: ApplicationBundle }
  | { ok: false; error: string };

export function checkFileSize(file: File): string | null {
  if (file.size > MAX_IMPORT_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File too large (${sizeMB} MB). Maximum allowed size is 5 MB.`;
  }
  return null;
}

export function validateBundleStructure(raw: unknown): ImportGuardResult {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Invalid bundle format: expected a JSON object.' };
  }

  const obj = raw as Record<string, unknown>;

  // metadata — required object with configId and tenantId
  if (!obj.metadata || typeof obj.metadata !== 'object' || Array.isArray(obj.metadata)) {
    return { ok: false, error: 'Bundle is missing required "metadata" object.' };
  }

  const metadata = obj.metadata as Record<string, unknown>;

  if (typeof metadata.configId !== 'string' || metadata.configId.length === 0) {
    return { ok: false, error: 'Bundle metadata is missing a valid "configId" string.' };
  }

  if (typeof metadata.tenantId !== 'string' || metadata.tenantId.length === 0) {
    return { ok: false, error: 'Bundle metadata is missing a valid "tenantId" string.' };
  }

  if (typeof metadata.version !== 'number' || !Number.isFinite(metadata.version) || metadata.version < 1) {
    return { ok: false, error: 'Bundle metadata is missing a valid "version" number.' };
  }

  if (typeof metadata.status !== 'string' || metadata.status.length === 0) {
    return { ok: false, error: 'Bundle metadata is missing a valid "status" string.' };
  }

  const validStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PUBLISHED', 'ARCHIVED'];
  if (!validStatuses.includes(metadata.status)) {
    return { ok: false, error: `Invalid bundle status "${metadata.status}". Must be one of: ${validStatuses.join(', ')}.` };
  }

  // flowSchema — required object with screens and transitions arrays
  if (!obj.flowSchema || typeof obj.flowSchema !== 'object' || Array.isArray(obj.flowSchema)) {
    return { ok: false, error: 'Bundle is missing required "flowSchema" object.' };
  }

  const flowSchema = obj.flowSchema as Record<string, unknown>;
  if (!Array.isArray(flowSchema.screens)) {
    return { ok: false, error: 'Bundle flowSchema is missing a valid "screens" array.' };
  }
  if (!Array.isArray(flowSchema.transitions)) {
    return { ok: false, error: 'Bundle flowSchema is missing a valid "transitions" array.' };
  }

  // uiSchemas — required record of string to object
  if (!obj.uiSchemas || typeof obj.uiSchemas !== 'object' || Array.isArray(obj.uiSchemas)) {
    return { ok: false, error: 'Bundle is missing required "uiSchemas" object.' };
  }

  // rules — required object
  if (!obj.rules || typeof obj.rules !== 'object' || Array.isArray(obj.rules)) {
    return { ok: false, error: 'Bundle is missing required "rules" object.' };
  }

  // apiMappings — required array
  if (!Array.isArray(obj.apiMappings)) {
    return { ok: false, error: 'Bundle is missing required "apiMappings" array.' };
  }

  return { ok: true, bundle: raw as ApplicationBundle };
}
