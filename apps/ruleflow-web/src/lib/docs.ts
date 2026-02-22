export type DocSection = 'Getting Started' | 'Tutorials' | 'Concepts' | 'Examples' | 'API' | 'Reference';

export type DocEntry = {
  slug: string;
  title: string;
  description: string;
  section: DocSection;
};

export const docs: DocEntry[] = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Understand config lifecycles, runtime inputs, and the shortest path from draft to runtime.',
    section: 'Getting Started',
  },
  {
    slug: 'getting-started/quick-start',
    title: 'Quick Start',
    description: 'Load an example, edit screens, add a rule, preview the flow, and export JSON.',
    section: 'Getting Started',
  },
  {
    slug: 'quickstart',
    title: 'Quick Start (legacy)',
    description: 'Legacy entry point that redirects to the same quick start narrative.',
    section: 'Getting Started',
  },
  {
    slug: 'start-here',
    title: 'Start Here',
    description: 'Learn about configId, versionId, demo mode, and the governance flow that keeps data safe.',
    section: 'Getting Started',
  },
  {
    slug: 'tutorial-console',
    title: 'Tutorial: Console + Versioning',
    description: 'Manage packages, approvals, and GitOps exports inside the Admin Console.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-builder',
    title: 'Tutorial: Builder',
    description: 'Drag/drop components, inspect props, and save schema-driven screens.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-flow-editor',
    title: 'Tutorial: Flow Editor',
    description: 'Edit flow state machines safely through guarded transitions.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-rules',
    title: 'Tutorial: Rules',
    description: 'Add deterministic rules without `eval` and use explain mode for clarity.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-playground',
    title: 'Tutorial: Playground',
    description: 'Simulate runtime, tweak context, and inspect trace events with explainability.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-component-registry',
    title: 'Tutorial: Component Registry',
    description: 'Register manifest-driven components that expose props and palette metadata.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-template-library',
    title: 'Tutorial: Template Library',
    description: 'Compose reusable screen templates and publish them to the Builder.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-company-adapter',
    title: 'Tutorial: Custom Adapter',
    description: 'Ship your own adapter hints (company.*) and surface them inside Builder.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-integrations',
    title: 'Tutorial: Integrations',
    description: 'Embed the runtime inside React, Angular, or Vue with thin adapters.',
    section: 'Tutorials',
  },
  {
    slug: 'tutorial-theming',
    title: 'Tutorial: Theming',
    description: 'Override design tokens via CSS variables without touching component code.',
    section: 'Tutorials',
  },
  {
    slug: 'interim-workarounds',
    title: 'Interim Workarounds',
    description: 'Temporary patterns you can use while advanced orchestrations are in progress.',
    section: 'Tutorials',
  },
  {
    slug: 'concepts',
    title: 'Concepts',
    description: 'High-level overview of the flow engine, rules engine, and API orchestrator.',
    section: 'Concepts',
  },
  {
    slug: 'concepts/schemas',
    title: 'Concepts: Schemas',
    description: 'Break down UI, flow, rule, and API mapping contracts.',
    section: 'Concepts',
  },
  {
    slug: 'concepts/components',
    title: 'Concepts: Components',
    description: 'Understand the component registry, palette metadata, and adapter hints.',
    section: 'Concepts',
  },
  {
    slug: 'concepts/rules',
    title: 'Concepts: Rules',
    description: 'Learn how guard rules read context/data and mutate the next state.',
    section: 'Concepts',
  },
  {
    slug: 'concepts/flows',
    title: 'Concepts: Flows',
    description: 'Model transitions, states, and the runtime events that drive screens.',
    section: 'Concepts',
  },
  {
    slug: 'concepts/events',
    title: 'Concepts: Events',
    description: 'Document event names like `onCheckout`, `onSubmitOrder`, and emitted signals.',
    section: 'Concepts',
  },
  {
    slug: 'examples/ecommerce',
    title: 'Examples: E-Commerce Demo',
    description: 'Storefront screens, discounted rules, metrics, and admin guards.',
    section: 'Examples',
  },
  {
    slug: 'examples/saas-dashboard',
    title: 'Examples: SaaS Dashboard',
    description: 'Login, dashboard, reports, and inactivity-logout guard.',
    section: 'Examples',
  },
  {
    slug: 'examples/onboarding',
    title: 'Examples: Onboarding Journey',
    description: 'Linear welcome/account/preferences/finish flow with contextual rules.',
    section: 'Examples',
  },
  {
    slug: 'api/runtime',
    title: 'API: Runtime',
    description: 'Runtime endpoints for config bundles, traces, kill switches, and governance.',
    section: 'API',
  },
  {
    slug: 'api/builder',
    title: 'API: Builder',
    description: 'Builder-facing endpoints for schemas, flows, rules, and diffs.',
    section: 'API',
  },
  {
    slug: 'schemas',
    title: 'Schemas',
    description: 'Versioned contracts that describe UI, flow, rule, and API mappings.',
    section: 'Reference',
  },
  {
    slug: 'adapters',
    title: 'Adapters',
    description: 'Plug in new renderers through `adapterHint` registrations.',
    section: 'Reference',
  },
  {
    slug: 'security',
    title: 'Security',
    description: 'Tenant isolation, audit, and no-`eval` guardrails.',
    section: 'Reference',
  },
  {
    slug: 'wcag',
    title: 'WCAG',
    description: 'Accessibility mistakes to avoid and enforced metadata.',
    section: 'Reference',
  },
  {
    slug: 'i18n',
    title: 'I18n',
    description: 'Translation bundles, RTL support, and override precedence.',
    section: 'Reference',
  },
  {
    slug: 'deployment',
    title: 'Deployment',
    description: 'CI pipeline, GitOps export, and promotion guidance.',
    section: 'Reference',
  },
  {
    slug: 'feature-roadmap',
    title: 'Feature Roadmap',
    description: 'Upcoming platform add-ons for adapters, flows, and observability.',
    section: 'Reference',
  },
  {
    slug: 'release-checklist',
    title: 'Release Checklist',
    description: 'Acceptance criteria, testing, and accessibility verification.',
    section: 'Reference',
  },
  {
    slug: 'common-mistakes',
    title: 'Common Mistakes',
    description: 'Pitfalls with schema IDs, adapter hints, and missing metadata.',
    section: 'Reference',
  },
  {
    slug: 'debugging',
    title: 'Debugging',
    description: 'Validator output, trace inspection, and runtime failure investigation.',
    section: 'Reference',
  },
  {
    slug: 'glossary',
    title: 'Glossary',
    description: 'Short definitions for core RuleFlow terms.',
    section: 'Reference',
  },
];

export const docsBySlug = Object.fromEntries(docs.map((doc) => [doc.slug, doc]));
