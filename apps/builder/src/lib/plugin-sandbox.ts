import type { ComponentPluginInterface } from '@platform/plugin-sdk';

/**
 * Plugin capability allow-list.
 * Plugins may only access capabilities explicitly granted here.
 */
export type PluginCapability = 'canRenderUI' | 'canAccessData' | 'canAccessTheme' | 'canEmitEvents';

const ALLOWED_CAPABILITIES: ReadonlySet<PluginCapability> = new Set([
  'canRenderUI',
  'canAccessData',
  'canAccessTheme',
  'canEmitEvents',
]);

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SandboxedPlugin {
  type: string;
  capabilities: ReadonlySet<PluginCapability>;
  frozen: boolean;
}

const registrationLog: Array<{
  type: string;
  timestamp: string;
  result: 'allowed' | 'rejected';
  reason?: string;
}> = [];

/**
 * Validate a plugin component before registration.
 * Checks metadata shape, capability allow-list, and renderer type.
 */
export function validatePluginComponent(component: unknown): PluginValidationResult {
  const errors: string[] = [];

  if (!component || typeof component !== 'object' || Array.isArray(component)) {
    return { valid: false, errors: ['Plugin must be a non-null object'] };
  }

  const record = component as Record<string, unknown>;

  if (typeof record.type !== 'string' || record.type.trim().length === 0) {
    errors.push('Plugin must have a non-empty string "type"');
  }

  if (typeof record.renderer !== 'function') {
    errors.push('Plugin must have a "renderer" function');
  }

  if (!record.contract || typeof record.contract !== 'object') {
    errors.push('Plugin must have a "contract" object');
  } else {
    const contract = record.contract as Record<string, unknown>;
    if (typeof contract.type !== 'string') {
      errors.push('Plugin contract must have a string "type"');
    }
    if (typeof contract.displayName !== 'string') {
      errors.push('Plugin contract must have a string "displayName"');
    }
  }

  // Warn about unknown capabilities but don't block registration
  const warnings: string[] = [];
  if (Array.isArray(record.capabilities)) {
    for (const cap of record.capabilities) {
      if (typeof cap !== 'string' || !ALLOWED_CAPABILITIES.has(cap as PluginCapability)) {
        warnings.push(`Unknown capability "${cap}" will be ignored. Allowed: ${[...ALLOWED_CAPABILITIES].join(', ')}`);
      }
    }
  }

  return { valid: errors.length === 0, errors: [...errors, ...warnings] };
}

/**
 * Wrap a validated plugin component with a frozen interface
 * to prevent runtime mutation of the registry.
 */
export function sandboxPlugin(component: ComponentPluginInterface): SandboxedPlugin {
  const capabilities = new Set<PluginCapability>(
    (component.capabilities ?? []).filter((c): c is PluginCapability =>
      ALLOWED_CAPABILITIES.has(c as PluginCapability),
    ),
  );

  const sandboxed: SandboxedPlugin = {
    type: component.type,
    capabilities,
    frozen: true,
  };

  return Object.freeze(sandboxed);
}

/**
 * Log a plugin registration attempt for audit purposes.
 */
export function logPluginRegistration(
  type: string,
  result: 'allowed' | 'rejected',
  reason?: string,
): void {
  registrationLog.push({
    type,
    timestamp: new Date().toISOString(),
    result,
    reason,
  });
}

/**
 * Get all plugin registration audit entries.
 */
export function getPluginRegistrationLog(): ReadonlyArray<{
  type: string;
  timestamp: string;
  result: 'allowed' | 'rejected';
  reason?: string;
}> {
  return registrationLog;
}

/**
 * Clear plugin registration log (useful for testing).
 */
export function clearPluginRegistrationLog(): void {
  registrationLog.length = 0;
}

/**
 * Check if a sandboxed plugin has a specific capability.
 */
export function hasCapability(plugin: SandboxedPlugin, capability: PluginCapability): boolean {
  return plugin.capabilities.has(capability);
}

/**
 * Maximum rule nesting depth to prevent stack overflow in rule evaluation.
 */
export const MAX_RULE_DEPTH = 20;

/**
 * Guard against excessive rule nesting depth.
 * Throws a controlled error if the depth exceeds MAX_RULE_DEPTH.
 */
export function enforceRuleDepth(depth: number, context?: string): void {
  if (depth > MAX_RULE_DEPTH) {
    const location = context ? ` in ${context}` : '';
    throw new Error(
      `Rule nesting depth (${depth}) exceeds maximum of ${MAX_RULE_DEPTH}${location}. ` +
        'Simplify your rule tree or break it into smaller sub-rules.',
    );
  }
}
