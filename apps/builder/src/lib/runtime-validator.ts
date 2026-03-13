import type { SectionNode, UISchema } from '@platform/schema';

export interface RuntimeValidationError {
  path: string;
  message: string;
}

export interface RuntimeValidationResult {
  valid: boolean;
  errors: RuntimeValidationError[];
}

/**
 * Validates that an unknown value conforms to the ApplicationBundle shape at runtime.
 * Returns detailed error paths for every missing or malformed field.
 */
export function validateBundleRuntime(raw: unknown): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];

  if (raw === null || raw === undefined || typeof raw !== 'object') {
    return { valid: false, errors: [{ path: '', message: 'Bundle must be a non-null object' }] };
  }

  const bundle = raw as Record<string, unknown>;

  // --- metadata ---
  if (!bundle.metadata || typeof bundle.metadata !== 'object') {
    errors.push({ path: 'metadata', message: 'metadata is required and must be an object' });
  } else {
    const meta = bundle.metadata as Record<string, unknown>;

    if (!meta.configId || typeof meta.configId !== 'string') {
      errors.push({ path: 'metadata.configId', message: 'configId is required and must be a string' });
    }
    if (!meta.tenantId || typeof meta.tenantId !== 'string') {
      errors.push({ path: 'metadata.tenantId', message: 'tenantId is required and must be a string' });
    }
    if (typeof meta.version !== 'number' || !Number.isFinite(meta.version) || meta.version < 1) {
      errors.push({ path: 'metadata.version', message: 'version must be a finite number >= 1' });
    }
  }

  // --- flowSchema ---
  if (!bundle.flowSchema || typeof bundle.flowSchema !== 'object') {
    errors.push({ path: 'flowSchema', message: 'flowSchema is required and must be an object' });
  } else {
    const flow = bundle.flowSchema as Record<string, unknown>;
    if (!flow.states || typeof flow.states !== 'object') {
      errors.push({ path: 'flowSchema.states', message: 'flowSchema.states is required and must be an object' });
    }
  }

  // --- uiSchemas ---
  if (!bundle.uiSchemas || typeof bundle.uiSchemas !== 'object' || Array.isArray(bundle.uiSchemas)) {
    errors.push({ path: 'uiSchemas', message: 'uiSchemas is required and must be a plain object' });
  }

  // --- rules ---
  if (bundle.rules === undefined || bundle.rules === null) {
    errors.push({ path: 'rules', message: 'rules is required' });
  }

  // --- apiMappings ---
  if (!Array.isArray(bundle.apiMappings)) {
    errors.push({ path: 'apiMappings', message: 'apiMappings is required and must be an array' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that every transition's `from` and `to` fields reference existing screen IDs
 * in a FlowGraphSchema-shaped object.
 */
export function validateFlowTransitionTargets(flow: {
  screens: Array<{ id: string }>;
  transitions: Array<{ id: string; from: string; to: string }>;
}): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];
  const screenIds = new Set(flow.screens.map((s) => s.id));

  for (const transition of flow.transitions) {
    if (!screenIds.has(transition.from)) {
      errors.push({
        path: `transitions.${transition.id}.from`,
        message: `Transition "from" references unknown screen "${transition.from}"`,
      });
    }
    if (!screenIds.has(transition.to)) {
      errors.push({
        path: `transitions.${transition.id}.to`,
        message: `Transition "to" references unknown screen "${transition.to}"`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks that all layout node IDs in a UISchema are unique (no duplicates).
 */
export function validateLayoutNodeUniqueness(schema: UISchema): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  function visit(node: { id: string; kind: string; rows?: unknown[]; columns?: unknown[]; children?: unknown[] }): void {
    if (seen.has(node.id)) {
      duplicates.add(node.id);
    } else {
      seen.add(node.id);
    }

    if (node.kind === 'section' && Array.isArray(node.rows)) {
      for (const row of node.rows as Array<{ id: string; kind: string; columns?: unknown[] }>) {
        visit(row);
      }
    }

    if (node.kind === 'row' && Array.isArray(node.columns)) {
      for (const col of node.columns as Array<{ id: string; kind: string; children?: unknown[] }>) {
        visit(col);
      }
    }

    if (node.kind === 'column' && Array.isArray(node.children)) {
      for (const child of node.children as Array<{ id: string; kind: string; rows?: unknown[]; columns?: unknown[] }>) {
        visit(child);
      }
    }
  }

  for (const section of schema.sections ?? []) {
    visit(section as unknown as { id: string; kind: string; rows?: unknown[] });
  }

  for (const id of duplicates) {
    errors.push({
      path: `sections`,
      message: `Duplicate layout node id "${id}"`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Detects circular references in nested sections — i.e. a section whose child
 * sections eventually reference back to an ancestor section id.
 *
 * Because the data model uses plain objects (not references), true object cycles
 * cannot occur. Instead, this checks whether any nested section re-uses the `id`
 * of an ancestor section, which would represent a logical circular reference.
 */
export function detectLayoutCircularReference(sections: SectionNode[]): RuntimeValidationResult {
  const errors: RuntimeValidationError[] = [];

  function walk(section: SectionNode, ancestors: Set<string>): void {
    if (ancestors.has(section.id)) {
      errors.push({
        path: `sections.${section.id}`,
        message: `Circular reference detected: section "${section.id}" is nested within itself`,
      });
      return;
    }

    const next = new Set(ancestors);
    next.add(section.id);

    for (const row of section.rows) {
      for (const col of row.columns) {
        for (const child of col.children) {
          if (child.kind === 'section') {
            walk(child, next);
          }
        }
      }
    }
  }

  for (const section of sections) {
    walk(section, new Set());
  }

  return { valid: errors.length === 0, errors };
}
