'use client';

import React, { useState } from 'react';
import ws from '../workspace.module.css';

type DocSection = 'getting-started' | 'concepts' | 'builder' | 'flow' | 'rules' | 'data' | 'api' | 'advanced';

interface DocEntry {
  id: DocSection;
  label: string;
  description: string;
}

const sections: DocEntry[] = [
  { id: 'getting-started', label: 'Getting Started', description: 'Installation, setup, and your first bundle' },
  { id: 'concepts', label: 'Core Concepts', description: 'Schemas, components, flow, rules, and events' },
  { id: 'builder', label: 'Screen Builder', description: 'Layout editor, palette, canvas, and inspector' },
  { id: 'flow', label: 'Flow Editor', description: 'State machines, transitions, and screen flow' },
  { id: 'rules', label: 'Rules & Validation', description: 'Bundle validation, accessibility, and compliance' },
  { id: 'data', label: 'Data & Config', description: 'Lifecycle management, versioning, and audit' },
  { id: 'api', label: 'API Reference', description: 'Runtime hooks, plugin SDK, and component contracts' },
  { id: 'advanced', label: 'Advanced Topics', description: 'Custom plugins, adapters, theming, and multi-tenancy' },
];

export default function DocsWorkspacePage() {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started');

  return (
    <div>
      <div className={ws.pageHeader}>
        <h1 className={ws.pageTitle}>Documentation</h1>
        <p className={ws.pageSubtitle}>
          Comprehensive guides covering everything from installation to advanced plugin development.
          Learn how to build enterprise UI configurations with schema-driven JSON bundles.
        </p>
      </div>

      <div className={ws.splitLayout}>
        {/* Main docs content */}
        <div className={ws.sidebar}>
          {/* Quick nav tabs */}
          <div className={ws.tabBar}>
            {sections.slice(0, 4).map((section) => (
              <button
                key={section.id}
                type="button"
                className={`${ws.tab} ${activeSection === section.id ? ws.tabActive : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <DocContent section={activeSection} />
        </div>

        {/* Sidebar navigation */}
        <aside className={ws.sidebar}>
          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Documentation</h2>
            </div>
            <div className={ws.cardBody}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  className={`${ws.listItem} ${activeSection === section.id ? ws.listItemActive : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div>
                    <div className={ws.listItemTitle}>{section.label}</div>
                    <div className={ws.listItemMeta}>{section.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={ws.card}>
            <div className={ws.cardHeader}>
              <h2 className={ws.cardTitle}>Quick Links</h2>
            </div>
            <div className={ws.cardBody}>
              <p className={ws.notice}>
                Visit /studio to explore the live component catalog with interactive previews.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocContent({ section }: { section: DocSection }) {
  switch (section) {
    case 'getting-started':
      return <GettingStartedDocs />;
    case 'concepts':
      return <ConceptsDocs />;
    case 'builder':
      return <BuilderDocs />;
    case 'flow':
      return <FlowDocs />;
    case 'rules':
      return <RulesDocs />;
    case 'data':
      return <DataDocs />;
    case 'api':
      return <ApiDocs />;
    case 'advanced':
      return <AdvancedDocs />;
    default:
      return null;
  }
}

function GettingStartedDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Getting Started</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="1. Installation">
          Install the core runtime package to get started with ECR in your project.
          The platform supports React, Angular, and Vue through framework-specific adapters.
        </DocBlock>
        <pre className={ws.codeBlock}>{`npm install @ecr-platform/core
# or
pnpm add @ecr-platform/core`}</pre>

        <DocBlock title="2. Development Setup">
          Clone the monorepo and install dependencies to run the builder locally.
          The builder runs on port 3200 by default with hot module reloading.
        </DocBlock>
        <pre className={ws.codeBlock}>{`git clone <repo-url>
cd enterprise-configuration-runtime
pnpm install
pnpm --filter builder dev    # starts on http://localhost:3200`}</pre>

        <DocBlock title="3. Your First Bundle">
          Navigate to the Screen Builder tab. Create a new screen, drag components from the palette
          onto the canvas, configure properties in the inspector, then export your bundle as JSON.
        </DocBlock>
        <pre className={ws.codeBlock}>{`// Minimal ECR integration in React
import { ECRProvider, useECR } from '@ecr-platform/core';

function RuntimeScreen() {
  const config = useECR();
  return <pre>{JSON.stringify(config, null, 2)}</pre>;
}

export default function App() {
  return (
    <ECRProvider config={{
      tenantId: 'tenant-1',
      locale: 'en-US',
      environment: 'prod'
    }}>
      <RuntimeScreen />
    </ECRProvider>
  );
}`}</pre>

        <DocBlock title="4. Quality Gate">
          Run the full quality checklist before committing changes. This validates the build,
          runs unit tests, and checks lint rules across the entire monorepo.
        </DocBlock>
        <pre className={ws.codeBlock}>{`npm run check     # build + test + lint
npm run test      # Vitest unit suite only
npm run build     # bundle for publishing`}</pre>
      </div>
    </div>
  );
}

function ConceptsDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Core Concepts</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="Application Bundle">
          The core artifact in ECR. A JSON bundle contains all the information needed to render
          a complete UI experience: screen schemas, flow graph, component configurations, validation
          rules, and metadata. Bundles are versioned, auditable, and portable across environments.
        </DocBlock>
        <DocBlock title="UISchema">
          Describes a single screen layout using a tree of Sections, Rows, Columns, and Components.
          Each section can contain rows, rows contain columns, and columns contain either components
          or nested sections. This mirrors a responsive 12-column grid system.
        </DocBlock>
        <DocBlock title="FlowGraph">
          A directed graph of screens and transitions. Each screen maps to a UISchema page.
          Transitions define navigation between screens using events and optional conditions.
          The flow graph compiles to an XState-compatible state machine.
        </DocBlock>
        <DocBlock title="Component Contract">
          Defines the metadata, configurable properties, and validation rules for each UI component.
          Contracts support typed props (string, number, boolean, enum, JSON), default values,
          editability flags, and documentation annotations.
        </DocBlock>
        <DocBlock title="Rules Engine">
          Validates bundles against configurable rule sets. Built-in rules check for accessibility
          compliance, i18n readiness, schema completeness, and flow integrity. Custom rules can
          be added via the plugin SDK. Rules produce errors and warnings with actionable messages.
        </DocBlock>
        <DocBlock title="Plugin System">
          Extend ECR with custom components, renderers, and validation rules. Plugins register
          component contracts that appear in the builder palette. The plugin host supports
          lazy loading, caching, and hot-reload during development.
        </DocBlock>
      </div>
    </div>
  );
}

function BuilderDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Screen Builder Guide</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="Three-Panel Layout">
          The Screen Builder uses a three-column layout: the left sidebar contains screen
          navigation and the component palette, the center panel is the interactive canvas,
          and the right sidebar shows the property inspector for selected elements.
        </DocBlock>
        <DocBlock title="Working with the Canvas">
          The canvas renders the live layout tree from the active UISchema. In edit mode,
          you can select sections, rows, columns, and components to view and modify their
          properties. A dot-grid background appears in edit mode for visual alignment guidance.
        </DocBlock>
        <DocBlock title="Drag-and-Drop">
          Drag components from the palette onto the canvas. Components can be dropped into
          column containers or onto the root canvas to create new sections automatically.
          The drop zone highlights with a blue indicator when a valid target is detected.
        </DocBlock>
        <DocBlock title="Property Inspector">
          Select any node in the canvas to view its properties in the right sidebar. Layout
          nodes expose label, class name, and span controls. Components show typed property
          editors generated from their contract definitions (inputs, selects, checkboxes).
        </DocBlock>
        <DocBlock title="Preview Mode">
          Toggle between Edit and Preview modes using the toolbar button. Preview mode
          hides the edit chrome and renders the layout as it would appear at runtime.
          Use the breakpoint selector (Desktop, Tablet, Mobile) to test responsive layouts.
        </DocBlock>
      </div>
    </div>
  );
}

function FlowDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Flow Editor Guide</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="Flow Graph Overview">
          The flow editor provides a visual canvas for designing state transitions between
          screens. Each screen appears as a draggable node with connection handles. Transitions
          are drawn as curved paths with directional arrows and event labels.
        </DocBlock>
        <DocBlock title="Creating Transitions">
          To create a transition, click the Source handle on a screen node and drag to the
          Target handle on the destination screen. You can also use the sidebar form to
          specify From, To, Event, and optional Condition fields.
        </DocBlock>
        <DocBlock title="Events and Conditions">
          Each transition is triggered by a named event (e.g., NEXT, SUBMIT, CANCEL).
          Optional conditions can guard transitions using rule references. The flow
          engine evaluates conditions at runtime before allowing a transition.
        </DocBlock>
        <DocBlock title="State Machine Compilation">
          The flow graph compiles to an XState-compatible state machine definition. View
          the compiled output in the JSON Preview workspace under the State Machine tab.
          This machine can be imported directly into any XState-powered runtime.
        </DocBlock>
      </div>
    </div>
  );
}

function RulesDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Rules &amp; Validation Guide</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="Validation Overview">
          ECR validates bundles against a comprehensive rule set before publishing. The Rules
          workspace displays errors and warnings with severity badges, JSON paths, and
          actionable fix descriptions.
        </DocBlock>
        <DocBlock title="Built-in Rules">
          The validator checks for: orphaned screen references, missing component types,
          circular flow transitions, accessibility attributes, i18n key coverage, schema
          completeness, and naming conventions.
        </DocBlock>
        <DocBlock title="Development Mode">
          Enable the Dev Mode toggle to downgrade accessibility and i18n errors to warnings
          during development. This allows rapid iteration while still surfacing potential
          issues. Always run with strict validation before publishing.
        </DocBlock>
        <DocBlock title="Custom Rules">
          Add custom validation rules via the plugin SDK. Rules receive the full application
          bundle and return an array of issues with path, message, and severity. Register
          rules in your plugin to have them run alongside built-in checks.
        </DocBlock>
      </div>
    </div>
  );
}

function DataDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Data &amp; Configuration Guide</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="Configuration Lifecycle">
          ECR manages configurations through a lifecycle workflow:
          Draft, Submitted, Approved, Published. Each state transition is audited
          with timestamps, actor information, and change summaries.
        </DocBlock>
        <DocBlock title="Version Management">
          Create new draft versions from the Data workspace. Each version captures a
          complete snapshot of the application bundle. Active versions can be switched
          to compare different configurations side by side.
        </DocBlock>
        <DocBlock title="Import and Export">
          Export bundles as JSON files for backup, migration, or sharing. Import bundles
          from JSON files to restore configurations or load examples. The importer
          validates the bundle format before applying changes.
        </DocBlock>
        <DocBlock title="Audit Trail">
          Every configuration change generates an audit log entry. The audit trail
          records create, update, promote, approve, reject, and publish events with
          actor, timestamp, and summary information.
        </DocBlock>
      </div>
    </div>
  );
}

function ApiDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>API Reference</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="ECRProvider">
          The root context provider for ECR runtime. Wraps your application and provides
          configuration state to all child components via the useECR() hook.
        </DocBlock>
        <pre className={ws.codeBlock}>{`interface ECRProviderConfig {
  tenantId: string;
  locale: string;
  environment: 'dev' | 'staging' | 'prod';
  bundle?: ApplicationBundle;
}`}</pre>

        <DocBlock title="useBuilder() Hook">
          The primary hook for accessing builder state. Returns the complete workspace
          state including schemas, flow graph, validation results, and action handlers.
        </DocBlock>
        <pre className={ws.codeBlock}>{`const b = useBuilder();
// b.activeSchema      - Current UISchema
// b.flowGraph         - Flow graph with screens and transitions
// b.validationResult  - Validation errors and warnings
// b.handleAddScreen   - Add a new screen
// b.handleExportBundle - Export as JSON`}</pre>

        <DocBlock title="Plugin SDK">
          Register custom component contracts and renderer plugins to extend the builder.
          Plugins are loaded asynchronously and cached for performance.
        </DocBlock>
        <pre className={ws.codeBlock}>{`import { registerPlugin } from '@platform/plugin-sdk';

registerPlugin({
  id: 'my-plugin',
  components: [{
    type: 'CustomWidget',
    displayName: 'Custom Widget',
    category: 'Enterprise',
    props: {
      title: { kind: 'string', label: 'Title' },
      variant: { kind: 'enum', label: 'Variant',
        options: ['default', 'compact'] }
    }
  }]
});`}</pre>
      </div>
    </div>
  );
}

function AdvancedDocs() {
  return (
    <div className={ws.card}>
      <div className={ws.cardHeader}>
        <h2 className={ws.cardTitle}>Advanced Topics</h2>
      </div>
      <div className={ws.cardBody} style={{ gap: '16px' }}>
        <DocBlock title="Framework Adapters">
          ECR provides adapters for React, Angular, and Vue. Each adapter translates the
          component contract system into native framework components. The adapter registry
          automatically selects the correct renderer based on the host framework.
        </DocBlock>
        <DocBlock title="Custom Theming">
          Override CSS custom properties (design tokens) in the :root or [data-theme] selector
          to customize colors, typography, spacing, and elevation. The theme bridge package
          synchronizes tokens between the builder and runtime environments.
        </DocBlock>
        <DocBlock title="Multi-Tenancy">
          ECR supports tenant-scoped configurations. Each tenant has isolated config packages
          with independent versioning and lifecycle management. The governance SDK enforces
          tenant boundaries and permission checks.
        </DocBlock>
        <DocBlock title="Observability">
          Built-in observability hooks capture performance metrics, error rates, and usage
          patterns. Integrate with your APM platform using the observability package for
          distributed tracing and structured logging.
        </DocBlock>
        <DocBlock title="CI/CD Integration">
          Use the quality gate commands in your CI pipeline. The validator can run headlessly
          to validate bundles before deployment. Export bundles as artifacts for downstream
          deployment pipelines.
        </DocBlock>
      </div>
    </div>
  );
}

function DocBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{
        margin: '0 0 6px',
        fontSize: 'var(--ecr-font-size-base, 1rem)',
        fontWeight: 600,
        color: 'var(--ecr-color-text-strong, #020617)',
      }}>
        {title}
      </h3>
      <p style={{
        margin: 0,
        fontSize: 'var(--ecr-font-size-sm, 0.875rem)',
        color: 'var(--ecr-color-text-secondary, #334155)',
        lineHeight: 1.7,
      }}>
        {children}
      </p>
    </div>
  );
}
