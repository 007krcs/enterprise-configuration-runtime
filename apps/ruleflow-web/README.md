# Enterprise Configuration Runtime (ECR)

A schema-driven UI + Flow + Rules platform for regulated enterprises. ECR enables teams to visually build screens, orchestrate flows, and author business rules -- then publish them as governed, auditable GitOps payloads.

---

## Features

| Capability | Description |
|---|---|
| **Builder Studio** | Visual editor for screens, flows, and business rules with drag-and-drop composition |
| **Flow Engine** | State-machine orchestration with guards, transitions, and conditional branching |
| **Rules Engine** | Condition evaluation, data enrichment, and gating for business logic |
| **Component Registry** | Shared library of verified, versioned components across teams |
| **Export & GitOps** | Publish configurations as GitOps-ready payloads for CI/CD pipelines |
| **Governance & Approvals** | RBAC, policy enforcement, OPA integration, and signed releases |

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 9+

### Install

```bash
pnpm install
```

### Development

```bash
pnpm --filter ruleflow-web dev
```

### Build

```bash
pnpm --filter ruleflow-web build
```

### Open

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Demo Projects

ECR ships with built-in demo projects to illustrate platform capabilities:

- **E-Commerce Store** -- 5-screen commerce flow with cart validation and discount rules
- **SaaS Dashboard** -- Login, dashboard, and reports with role-based access controls
- **User Onboarding** -- Multi-step wizard with field validation and conditional progression

Access demos from the landing page or the `/examples` route.

---

## Architecture

```
Browser
  |
  v
Next.js 15 App Router (ruleflow-web)
  |
  +-- Zustand stores (state management with Immer)
  |
  +-- Schema-driven UI rendering (@platform/react-renderer)
  |
  +-- Rules Engine (@platform/rules-engine)
  |
  +-- Flow Engine (@platform/flow-engine)
  |
  +-- Core Runtime (@platform/core-runtime)
```

The platform follows a **monorepo** layout managed with **pnpm workspaces**. The web application consumes shared packages that encapsulate domain logic, rendering, and integrations.

### Key Packages

| Package | Purpose |
|---|---|
| `@platform/schema` | Canonical schema definitions for screens, flows, and rules |
| `@platform/rules-engine` | Rule evaluation, condition matching, and data enrichment |
| `@platform/flow-engine` | State-machine orchestration and transition management |
| `@platform/core-runtime` | Shared runtime services and execution context |
| `@platform/ui-kit` | Design-system primitives and reusable UI components |
| `@platform/react-renderer` | Schema-to-React rendering pipeline |
| `@platform/component-registry` | Versioned component catalog and resolution |
| `@platform/validator` | Schema and payload validation |
| `@platform/observability` | Telemetry, logging, and diagnostics |

---

## Project Structure

```
apps/
  ruleflow-web/        # Next.js 15 web application (this package)
  builder/             # Standalone builder module
  builder-web/         # Builder web shell
  playground/          # Interactive playground
  ui-docs/             # Component documentation site
  demo-host-react/     # React demo host
  demo-host-angular/   # Angular demo host
  demo-host-vue/       # Vue demo host

packages/
  schema/              # Schema definitions
  rules-engine/        # Business rules evaluation
  flow-engine/         # Flow orchestration
  core-runtime/        # Shared runtime
  ui-kit/              # Design system components
  react-renderer/      # React rendering pipeline
  component-registry/  # Component catalog
  validator/           # Validation utilities
  observability/       # Telemetry and logging
  i18n/                # Internationalization
  theme-config/        # Theming and design tokens
  adapters/            # Framework adapter layer
  persistence-dal/     # Data access layer
  persistence-postgres/# PostgreSQL persistence
  governance-sdk/      # Governance and policy SDK
  api-orchestrator/    # API orchestration layer
```

---

## Tech Stack

| Technology | Usage |
|---|---|
| **Next.js 15** | App router, server components, API routes |
| **React 19** | UI rendering |
| **TypeScript** | Type safety across the entire codebase |
| **Zustand** | Lightweight state management |
| **Immer** | Immutable state updates |
| **Lucide React** | Icon library |
| **SCSS Modules** | Scoped component styling |
| **pnpm Workspaces** | Monorepo dependency management |
| **Vitest** | Unit testing |
| **Playwright** | End-to-end testing |

---

## Scripts

| Command | Description |
|---|---|
| `pnpm --filter ruleflow-web dev` | Start development server |
| `pnpm --filter ruleflow-web build` | Production build |
| `pnpm --filter ruleflow-web start` | Serve production build |
| `pnpm --filter ruleflow-web lint` | Run ESLint |
| `pnpm --filter ruleflow-web typecheck` | Run TypeScript type checking |
| `pnpm --filter ruleflow-web test` | Run unit tests with Vitest |

---

## Policy Enforcement

All mutating API routes run shared policy checks before executing writes.

- Built-in RBAC/policy checks always run.
- External OPA policy checks run when `OPA_URL` is configured.
- Policy stages: `save`, `submit-for-review`, `approve`, `promote`.

### OPA Environment Variables

| Variable | Description | Example |
|---|---|---|
| `OPA_URL` | Base OPA URL | `http://localhost:8181` |
| `OPA_PACKAGE` | OPA data path package | `ruleflow/allow` |
| `OPA_TIMEOUT_MS` | Request timeout in ms (default `1500`) | `2000` |

---

## Runtime Controls

Runtime feature flags and kill switches are exposed via:

```
GET /api/runtime-flags?env=prod&versionId=...&packageId=...
```

Builder and Playground consume this endpoint through `useRuntimeFlags()` and block operations when a kill switch is active.

---

## License

MIT
