'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

const docComponents: Record<string, ComponentType> = {
  'getting-started': dynamic(() => import('@/content/docs/getting-started/index.mdx')),
  'getting-started/quick-start': dynamic(() => import('@/content/docs/getting-started/quick-start.mdx')),
  quickstart: dynamic(() => import('@/content/docs/getting-started/quick-start.mdx')),
  'start-here': dynamic(() => import('@/content/docs/start-here.mdx')),
  'tutorial-console': dynamic(() => import('@/content/docs/tutorial-console.mdx')),
  'tutorial-builder': dynamic(() => import('@/content/docs/tutorial-builder.mdx')),
  'tutorial-flow-editor': dynamic(() => import('@/content/docs/tutorial-flow-editor.mdx')),
  'tutorial-rules': dynamic(() => import('@/content/docs/tutorial-rules.mdx')),
  'tutorial-playground': dynamic(() => import('@/content/docs/tutorial-playground.mdx')),
  'tutorial-component-registry': dynamic(() => import('@/content/docs/tutorial-component-registry.mdx')),
  'tutorial-template-library': dynamic(() => import('@/content/docs/tutorial-template-library.mdx')),
  'tutorial-company-adapter': dynamic(() => import('@/content/docs/tutorial-company-adapter.mdx')),
  'tutorial-integrations': dynamic(() => import('@/content/docs/tutorial-integrations.mdx')),
  'interim-workarounds': dynamic(() => import('@/content/docs/interim-workarounds.mdx')),
  'tutorial-theming': dynamic(() => import('@/content/docs/tutorial-theming.mdx')),
  'examples/ecommerce': dynamic(() => import('@/content/docs/examples/ecommerce.mdx')),
  'examples/saas-dashboard': dynamic(() => import('@/content/docs/examples/saas-dashboard.mdx')),
  'examples/onboarding': dynamic(() => import('@/content/docs/examples/onboarding.mdx')),
  concepts: dynamic(() => import('@/content/docs/concepts/index.mdx')),
  'concepts/schemas': dynamic(() => import('@/content/docs/concepts/schemas.mdx')),
  'concepts/components': dynamic(() => import('@/content/docs/concepts/components.mdx')),
  'concepts/rules': dynamic(() => import('@/content/docs/concepts/rules.mdx')),
  'concepts/flows': dynamic(() => import('@/content/docs/concepts/flows.mdx')),
  'concepts/events': dynamic(() => import('@/content/docs/concepts/events.mdx')),
  schemas: dynamic(() => import('@/content/docs/schemas.mdx')),
  adapters: dynamic(() => import('@/content/docs/adapters.mdx')),
  security: dynamic(() => import('@/content/docs/security.mdx')),
  wcag: dynamic(() => import('@/content/docs/wcag.mdx')),
  i18n: dynamic(() => import('@/content/docs/i18n.mdx')),
  deployment: dynamic(() => import('@/content/docs/deployment.mdx')),
  'feature-roadmap': dynamic(() => import('@/content/docs/feature-roadmap.mdx')),
  'release-checklist': dynamic(() => import('@/content/docs/release-checklist.mdx')),
  'common-mistakes': dynamic(() => import('@/content/docs/common-mistakes.mdx')),
  debugging: dynamic(() => import('@/content/docs/debugging.mdx')),
  glossary: dynamic(() => import('@/content/docs/glossary.mdx')),
  'api/runtime': dynamic(() => import('@/content/docs/api/runtime.mdx')),
  'api/builder': dynamic(() => import('@/content/docs/api/builder.mdx')),
};

export function DocRenderer({ slug }: { slug: string }) {
  const DocComponent = docComponents[slug];
  if (!DocComponent) {
    return null;
  }

  return <DocComponent />;
}
