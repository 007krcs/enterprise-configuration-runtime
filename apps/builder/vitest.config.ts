import { defineConfig, mergeConfig } from 'vitest/config';
import path from 'node:path';
import sharedConfig from '../../vitest.shared';

const packages = path.resolve(__dirname, '../../packages');

export default mergeConfig(
  sharedConfig,
  defineConfig({
    resolve: {
      alias: {
        '@platform/schema': path.join(packages, 'schema/src/index.ts'),
        '@platform/component-contract': path.join(packages, 'component-contract/src/index.ts'),
        '@platform/component-system': path.join(packages, 'component-system/src/index.ts'),
        '@platform/plugin-sdk': path.join(packages, 'plugin-sdk/src/index.ts'),
        '@platform/design-tokens': path.join(packages, 'design-tokens/src/index.ts'),
        '@platform/data-grid': path.join(packages, 'data-grid/src/index.ts'),
      },
    },
    test: {
      name: 'builder',
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
      environment: 'jsdom',
      setupFiles: ['tests/setup.ts'],
    },
  }),
);
