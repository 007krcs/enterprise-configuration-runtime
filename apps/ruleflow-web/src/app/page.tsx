'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  GitBranch,
  GitCommit,
  Layers,
  ShieldCheck,
  Sparkles,
  Terminal,
} from 'lucide-react';
import styles from './landing.module.css';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Docs', href: '#docs' },
  { label: 'Examples', href: '/examples' },
  { label: 'Builder', href: '/builder' },
];

const featureCards = [
  {
    title: 'Builder Studio',
    description: 'Design screens, flows, and rules together in one live canvas.',
    href: '/docs/tutorial-builder',
    icon: Sparkles,
  },
  {
    title: 'Flow Engine',
    description: 'Visualize states, transitions, and guards that drive journeys.',
    href: '/docs/concepts/flows',
    icon: GitBranch,
  },
  {
    title: 'Rules Engine',
    description: 'Evaluate conditions, enrich data, and gate every transition.',
    href: '/docs/concepts/rules',
    icon: ShieldCheck,
  },
  {
    title: 'Component Registry',
    description: 'Share verified components across bundles and teams.',
    href: '/docs/concepts/components',
    icon: Layers,
  },
  {
    title: 'Export & GitOps',
    description: 'Publish bundles as GitOps payloads for approval pipelines.',
    href: '/docs/tutorial-builder',
    icon: GitCommit,
  },
  {
    title: 'Governance & Approvals',
    description: 'Track RBAC, policies, and signed releases for compliance.',
    href: '/docs/getting-started/quick-start',
    icon: BadgeCheck,
  },
];

const previewCards = [
  {
    title: 'Flow: Checkout',
    description: 'home → category → product → cart → checkout',
    badge: 'Flow',
  },
  {
    title: 'Rule: Cart discount',
    description: 'Applies 10% when cart.total > 100',
    badge: 'Rule',
  },
  {
    title: 'Export: GitOps',
    description: 'Bundle ready for git-sync with metadata and tags',
    badge: 'Export',
  },
];

const useCases = [
  {
    exampleId: 'e-commerce-store-demo',
    title: 'E-Commerce Control Tower',
    description: 'Combine catalog experiences, checkout validation, and admin metrics behind guarded flows.',
    highlights: [
      'Multi-screen commerce flow plus admin metrics panel.',
      'Flow guards: onBrowseCategory, onAddToCart, onCheckout, RequiredFieldsPresent.',
      'Rules: CartNotEmpty, ApplyDiscount, UserIsAdmin.',
    ],
    tag: 'Retail',
  },
  {
    exampleId: 'saas-dashboard',
    title: 'SaaS Insights Dashboard',
    description: 'Mix KPI cards, reports, and inactivity-based guards for admins.',
    highlights: [
      'Linear login → dashboard → reports, with admin guards.',
      'Rules: IsAdmin, InactivityLogout (simulated).',
      'Charts + tables adapting to context data.',
    ],
    tag: 'Analytics',
  },
  {
    exampleId: 'onboarding',
    title: 'Guided Onboarding Journey',
    description: 'Linear welcome → preferences flow with disabled Next buttons until rules pass.',
    highlights: [
      'Screens: welcome, account-setup, preferences, finish.',
      'Rules: AccountFieldsValid, PreferencesValid, DisableNextUnlessValid.',
      'Context flags lock navigation until validation succeeds.',
    ],
    tag: 'Onboarding',
  },
];

const docsLinks = [
  {
    title: 'Quick Start',
    description: 'Load an example, edit screens, add a rule, preview, and export JSON.',
    href: '/docs/getting-started/quick-start',
    icon: BookOpen,
  },
  {
    title: 'Concepts',
    description: 'Schemas, components, flows, rules, and events explained end-to-end.',
    href: '/docs/concepts',
    icon: Layers,
  },
  {
    title: 'API Reference',
    description: 'Runtime + builder APIs for loading bundles and exporting GitOps.',
    href: '/docs/api/runtime',
    icon: Terminal,
  },
];

const footerColumns = [
  {
    title: 'Docs',
    links: [
      { label: 'Quick Start', href: '/docs/getting-started/quick-start' },
      { label: 'Concepts', href: '/docs/concepts' },
      { label: 'API Reference', href: '/docs/api/runtime' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Builder', href: '/builder' },
      { label: 'Examples', href: '/examples' },
      { label: 'Playground', href: '/playground' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: 'https://github.com/007krcs/enterprise-configuration-runtime' },
      { label: 'Integration Hub', href: '/integrations' },
      { label: 'Support & Issues', href: '/docs' },
    ],
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.landing}>
      <div className={styles.gradientBackdrop} aria-hidden="true" />
      <div className={styles.noiseLayer} aria-hidden="true" />

      <header className={styles.marketingHeader}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>ECR</span>
          <div>
            <p className={styles.brandTitle}>Enterprise Configuration Runtime</p>
            <p className={styles.brandTag}>Schema-driven UI + flow + rules</p>
          </div>
        </div>

        <nav className={styles.navLinks} aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.navLink}
              onClick={() => setMobileMenuOpen(false)}
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <Link href="/builder" className={styles.buttonPrimary}>
            Open Builder
          </Link>
          <Link href="/examples" className={styles.buttonGhost}>
            View Examples
          </Link>
          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className={styles.mobileMenuBackdrop}
          role="presentation"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
          }}
        />
      )}

      {mobileMenuOpen && (
        <nav
          className={styles.mobileMenu}
          aria-label="Mobile navigation"
          role="navigation"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setMobileMenuOpen(false);
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={styles.mobileMenuLink}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileMenuActions}>
            <Link href="/builder" className={styles.buttonPrimary}>
              Open Builder
            </Link>
            <Link href="/examples" className={styles.buttonGhost}>
              View Examples
            </Link>
          </div>
        </nav>
      )}

      <main className={styles.content}>
        <section className={styles.hero} id="hero">
          <div className={styles.heroCopy}>
            <p className={styles.heroKicker}>Schema-driven UI · Flow automation · Rules governance</p>
            <h1 className={styles.heroTitle}>Ship UI + flows + rules across regulated enterprises.</h1>
            <p className={styles.heroSubtitle}>
              ECR combines schema-defined screens, flow orchestration, and rule execution into a single runtime. Preview,
              build, and export GitOps artifacts without stitching disparate tools together.
            </p>

            <div className={styles.heroActions}>
              <Link href="/builder" className={styles.ctaPrimary}>
                Open Builder
              </Link>
              <Link href="/examples" className={styles.ctaSecondary}>
                View Examples
              </Link>
            </div>
          </div>
          <div className={styles.heroPreview}>
            {previewCards.map((card) => (
              <article key={card.title} className={styles.previewCard}>
                <span className={styles.previewBadge}>{card.badge}</span>
                <p className={styles.previewTitle}>{card.title}</p>
                <p className={styles.previewDescription}>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="features">
          <div className={styles.sectionHeader}>
            <h2>Feature-rich foundation</h2>
            <p>Everything you need to design, guard, and release experiences for regulated programs.</p>
          </div>
          <div className={styles.featuresGrid}>
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.title} className={styles.featureCard}>
                  <div className={styles.featureIcon}>
                    <Icon aria-hidden="true" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <Link href={feature.href} className={styles.featureLink}>
                    Learn more
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.section} id="use-cases">
          <div className={styles.sectionHeader}>
            <h2>Use cases ready to clone</h2>
            <p>Load a curated demo, open it in the builder, or grab the JSON to tailor the experience.</p>
          </div>
          <div className={styles.useCases}>
            {useCases.map((useCase) => (
              <article key={useCase.exampleId} className={styles.useCaseCard}>
                <div className={styles.useCaseTag}>{useCase.tag}</div>
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
                <ul className={styles.useCaseHighlights}>
                  {useCase.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
                <div className={styles.useCaseActions}>
                  <Link
                    href={`/examples?open=${encodeURIComponent(useCase.exampleId)}`}
                    className={styles.useCaseButton}
                  >
                    Open Example
                  </Link>
                  <Link href={`/examples/${useCase.exampleId}`} className={styles.useCaseButtonSecondary}>
                    View JSON
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section} id="docs">
          <div className={styles.sectionHeader}>
            <h2>Docs & quick start</h2>
            <p>Guided tutorials, concept rundowns, and API references for builders and operators.</p>
          </div>
          <div className={styles.docsGrid}>
            {docsLinks.map((doc) => {
              const Icon = doc.icon;
              return (
                <article key={doc.title} className={styles.docsCard}>
                  <Icon className={styles.docsIcon} aria-hidden="true" />
                  <h3>{doc.title}</h3>
                  <p>{doc.description}</p>
                  <Link href={doc.href} className={styles.featureLink}>
                    View docs
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.section} aria-label="Call to action">
          <div className={styles.ctaPanel}>
            <div>
              <h3>Ready to ship?</h3>
              <p>
                Try one of the examples, open the builder, and use the guided tour to understand how schema, flow,
                rules, and exports work together.
              </p>
            </div>
            <div className={styles.ctaPanelActions}>
              <Link href="/builder" className={styles.ctaPrimary}>
                Open Builder
              </Link>
              <Link href="/examples?open=e-commerce-store-demo" className={styles.ctaSecondary}>
                Quick start with an example
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        {footerColumns.map((column) => (
          <div key={column.title} className={styles.footerColumn}>
            <p className={styles.footerTitle}>{column.title}</p>
            {column.links.map((link) => (
              <Link key={link.label} href={link.href} className={styles.footerLink}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </footer>

      <div className={styles.legal}>
        © {new Date().getFullYear()} Enterprise Configuration Runtime (ECR) · Schema-driven UI + Flow + Rules.
      </div>
    </div>
  );
}
