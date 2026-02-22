import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyBundleToBuilder } from '@/lib/examples';
import { useBuilderStore } from '@/app/builder/_domain/builderStore';

const exampleIds = [
  'e-commerce-store-demo',
  'saas-dashboard',
  'user-onboarding-flow-demo',
  'ecommerce',
  'onboarding',
] as const;

function loadBundle(exampleId: typeof exampleIds[number]) {
  const filePath = join(
    __dirname,
    '..',
    '..',
    'public',
    'examples',
    'bundles',
    `${exampleId}.json`,
  );
  const raw = readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

describe('example bundles', () => {
  for (const exampleId of exampleIds) {
    it(`loads and applies ${exampleId}`, () => {
      const bundle = loadBundle(exampleId);
      applyBundleToBuilder(bundle);
      const state = useBuilderStore.getState();
      expect(state.activeScreenId).toBe(bundle.activeUiPageId);
      expect(state.flow.schema).toEqual(bundle.flowSchema);
      expect(Object.keys(state.rules)).toHaveLength(bundle.rules.rules.length);
    });
  }
});
