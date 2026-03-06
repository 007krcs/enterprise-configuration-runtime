import type { ConfigBundle } from '@/lib/demo/types';

export type BundleValidationResult =
  | { valid: true; bundle: ConfigBundle }
  | { valid: false; errors: string[] };

/**
 * Validates that a parsed JSON value has the shape of a ConfigBundle.
 *
 * This is a runtime guard — it does not guarantee deep-schema correctness, but
 * catches the most common import mistakes (wrong file format, missing required
 * keys, bad types).
 */
export function validateBundle(value: unknown): BundleValidationResult {
  const errors: string[] = [];

  if (value === null || typeof value !== 'object') {
    return { valid: false, errors: ['Imported data is not a JSON object.'] };
  }

  const obj = value as Record<string, unknown>;

  // Accept both a raw ConfigBundle and a GitOps export wrapper
  let candidate: Record<string, unknown>;
  if ('payload' in obj && typeof obj.payload === 'object' && obj.payload !== null) {
    // GitOps export: unwrap the first version's bundle
    const payload = obj.payload as Record<string, unknown>;
    const packages = payload.packages;
    if (Array.isArray(packages) && packages.length > 0) {
      const pkg = packages[0] as Record<string, unknown>;
      const versions = pkg?.versions;
      if (Array.isArray(versions) && versions.length > 0) {
        candidate = (versions[0] as Record<string, unknown>).bundle as Record<string, unknown>;
        if (!candidate || typeof candidate !== 'object') {
          return { valid: false, errors: ['GitOps export contains no bundle in the first version.'] };
        }
      } else {
        return { valid: false, errors: ['GitOps export has no versions in the first package.'] };
      }
    } else {
      return { valid: false, errors: ['GitOps export has no packages.'] };
    }
  } else {
    candidate = obj;
  }

  // Required fields
  if (!('flowSchema' in candidate) || candidate.flowSchema == null) {
    errors.push('Missing required field "flowSchema".');
  } else if (typeof candidate.flowSchema !== 'object') {
    errors.push('"flowSchema" must be an object.');
  }

  if (!('rules' in candidate) || candidate.rules == null) {
    errors.push('Missing required field "rules".');
  } else if (typeof candidate.rules !== 'object') {
    errors.push('"rules" must be an object.');
  }

  if (!('apiMappingsById' in candidate)) {
    // apiMappingsById is required but allowed to be an empty object
    errors.push('Missing required field "apiMappingsById".');
  } else if (typeof candidate.apiMappingsById !== 'object' || candidate.apiMappingsById === null) {
    errors.push('"apiMappingsById" must be an object.');
  }

  // UI schema: must have either uiSchema or uiSchemasById
  const hasUiSchema = 'uiSchema' in candidate && candidate.uiSchema != null;
  const hasUiSchemasById = 'uiSchemasById' in candidate && candidate.uiSchemasById != null;

  if (!hasUiSchema && !hasUiSchemasById) {
    errors.push('Bundle must contain either "uiSchema" or "uiSchemasById".');
  }

  if (hasUiSchema && typeof candidate.uiSchema !== 'object') {
    errors.push('"uiSchema" must be an object.');
  }

  if (hasUiSchemasById && typeof candidate.uiSchemasById !== 'object') {
    errors.push('"uiSchemasById" must be an object.');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, bundle: candidate as unknown as ConfigBundle };
}
