# Enterprise Configuration Runtime (ECR)

Enterprise Configuration Runtime (ECR) is a schema-driven builder, flow orchestration, and rules execution platform that lets enterprises compose UI, validation, and automation from JSON bundles without hand-writing UI code. ECR keeps guardrails, observability, and exportable artifacts in one place so regulated teams can deliver new journeys with confidence.

## Installation

```bash
npm install @ecr-platform/core
```

### Peer Dependencies

ECR assumes these peer dependencies exist in the host renderer bundle:

- `react`
- `react-dom`

## Usage (React)

```tsx
import React from 'react';
import { ECRProvider, useECR } from '@ecr-platform/core';

function RuntimeScreen() {
  const config = useECR();
  return <pre>{JSON.stringify(config, null, 2)}</pre>;
}

export default function App() {
  return (
    <ECRProvider config={{ tenantId: 'tenant-1', locale: 'en-US', environment: 'prod' }}>
      <RuntimeScreen />
    </ECRProvider>
  );
}
```

## How to run the web experience

The RuleFlow demo host exposes the builder, landing site, docs, and playground:

```bash
pnpm install
pnpm --filter ruleflow-web dev         # launch the Next.js experience locally
pnpm --filter ruleflow-web build       # compile the production site
pnpm --filter ruleflow-web start       # serve a built production bundle
```

Use `pnpm --filter ruleflow-web lint` to run the frontend lint during development, or rely on the top-level `npm run check` (below) that runs the build, unit tests, and lint gatekeepers end-to-end.

## Quality checklist

- `npm run build` → bundles the ECR packages for publishing.
- `npm run test` → runs the Vitest unit suite.
- `npm run lint` → runs the RuleFlow web lint rules (via `next lint`).
- `npm run check` → runs `build`, `test`, and `lint` in sequence so CI easily gates releases.

## Examples

The live demo host exposes `/examples`, where three curated journeys (E-Commerce Store, SaaS Dashboard, and User Onboarding Flow) live as cards. Each card can:

- Preview the bundle inline without editing the schema.
- Open the bundle in the builder shell to inspect screens, flows, and rules.
- Download the bundle JSON for reuse in another project.

This page is ideal for onboarding, QA, and anyone who needs a working bundle to tinker with before building from scratch.

## Docs

Roadmaps, guides, and API references live under `/docs`. Start with the Quick Start guide (load an example, edit screens, apply a rule, preview, and export) before exploring Concepts (schemas, components, rules, flows, and events) or the Runtime/Builder API reference for automation hooks.

## Try examples from code

Use the `loadExampleBundle` helper from `@/lib/examples` to fetch a local JSON bundle, then feed it to `applyBundleToBuilder` for builder state or `RenderPage`/`RenderPreview` for runtime rendering. Bundles live in `apps/ruleflow-web/public/examples/bundles` and are great fixtures for CI smoke tests (the repo already has Vitest coverage that loads each bundle and validates the builder state).
