'use client';
import type { ExecutionContext, JSONValue } from '@platform/schema';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Boxes,
  GitBranch,
  Github,
  Linkedin,
  Menu,
  Repeat,
  ShieldCheck,
  Twitter,
  X,
} from 'lucide-react';
import { RenderPage } from '@platform/react-renderer';
import {
  createProviderFromBundles,
  EXAMPLE_TENANT_BUNDLES,
  PLATFORM_BUNDLES,
} from '@platform/i18n';
import type { ConfigBundle } from '@/lib/demo/types';
import { normalizeUiPages } from '@/lib/demo/ui-pages';
import { loadExampleBundle } from '@/lib/examples';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import styles from './landing.module.css';

const features = [
  {
    title: 'Builder',
    description: 'Schema-first editor for screens, flows, and rules with live validation.',
    icon: Boxes,
  },
  {
    title: 'Flow Engine',
    description: 'Steer events across states with guard conditions and actions.',
    icon: Repeat,
  },
  {
    title: 'Rules Engine',
    description: 'Safe, deterministic JSON rules with explainable outcomes.',
    icon: ShieldCheck,
  },
  {
    title: 'Export & GitOps',
    description: 'Bundle configs + metadata for reuse across tenants and clouds.',
    icon: GitBranch,
  },
  {
    title: 'Component Registry',
    description: 'Share adapter hints and metadata for consistent schema editing.',
    icon: Activity,
  },
  {
    title: 'Observability',
    description: 'Trace executions, rule hits, and runtime telemetry in one pane.',
    icon: BarChart3,
  },
];

const useCases = [
  {
    title: 'E-Commerce Control Towers',
    tag: 'Retail',
    copy: 'Digitize catalogs, checkout flows, and pricing policies without rebuilding UI layers.',
  },
  {
    title: 'SaaS Insights',
    tag: 'Analytics',
    copy: 'Compose KPI dashboards, guard report access, and keep metrics consistent.',
  },
  {
    title: 'Guided Onboarding',
    tag: 'Workflow',
    copy: 'Drive account setup journeys with validation and contextual callouts.',
  },
];

const docHighlights = [
  {
    title: 'Quick Start',
    description: 'Load a curated example, edit screens, add a rule, preview, and export JSON.',
    href: '/docs/getting-started/quick-start',
  },
  {
    title: 'Concepts',
    description: 'Study how schemas, flows, components, and events execute together.',
    href: '/docs/concepts',
  },
  {
    title: 'API Reference',
    description: 'Runtime + Builder endpoints for bundles, rules, and GitOps exports.',
    href: '/docs/api/runtime',
  },
];

const illustrations = [
  {
    title: 'Flow Graph',
    desc: 'Visualize transitions, guards, and checkpoints before you dump them into the runtime.',
    src: '/assets/illustrations/flow-graph.svg',
  },
  {
    title: 'Rules Logic',
    desc: 'Rules evaluate context and emit events deterministically; see how data flows through conditionals.',
    src: '/assets/illustrations/rules-logic.svg',
  },
  {
    title: 'Builder Studio',
    desc: 'Palette, canvas, inspector, and guides combine into a premium studio layout.',
    src: '/assets/illustrations/builder-studio.svg',
  },
];

const snapshotScreens = [
  {
    title: 'Builder canvas',
    src: '/assets/builder-canvas.png',
    alt: 'Builder canvas view with grid and ruler controls',
  },
  {
    title: 'E-Commerce flow',
    src: '/assets/ecommerce-flow.png',
    alt: 'Flow view of example commerce journey',
  },
  {
    title: 'Rules editor',
    src: '/assets/rules-editor.png',
    alt: 'Rules editor panel showing JSON guard',
  },
];

const landingNavLinks = [
  { label: 'Features', href: '#built-for' },
  { label: 'Visuals', href: '#visual-intelligence' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'Docs', href: '#docs' },
  { label: 'Sneak Peek', href: '#sneak-peek' },
  { label: 'Quickstart', href: '#quickstart' },
];

const socialLinks = [
  {
    label: 'GitHub',
    href: 'https://github.com/007krcs/enterprise-configuration-runtime',
    Icon: Github,
  },
  {
    label: 'Twitter',
    href: 'https://twitter.com/007krcs',
    Icon: Twitter,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/007krcs',
    Icon: Linkedin,
  },
];

const previewContext: ExecutionContext & {
  onboarding: { nextEnabled: boolean; preferencesValid: boolean };
} = {
  tenantId: 'tenant-1',
  userId: 'preview',
  role: 'admin',
  roles: ['admin'],
  country: 'US',
  locale: 'en-US',
  timezone: 'America/New_York',
  device: 'desktop',
  permissions: ['read'],
  featureFlags: { demo: true },
  onboarding: { nextEnabled: true, preferencesValid: true },
};

const previewData: Record<string, JSONValue> = {
  onboarding: {
    accountName: 'Jordan Sales',
    accountEmail: 'jordan.sales@enterprise.com',
    preferenceTier: 'enterprise',
    preferenceRegion: 'EMEA',
  },
};

export default function LandingPage() {
  const [previewBundle, setPreviewBundle] = useState<ConfigBundle | null>(null);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [revealedSections, setRevealedSections] = useState<string[]>([]);

  const previewPages = useMemo(() => {
    if (!previewBundle) return null;
    return normalizeUiPages({
      uiSchema: previewBundle.uiSchema,
      uiSchemasById: previewBundle.uiSchemasById,
      activeUiPageId: previewBundle.activeUiPageId,
      flowSchema: previewBundle.flowSchema,
    });
  }, [previewBundle]);

  const previewSchema = previewPages?.uiSchemasById[previewPages.activeUiPageId];

  const previewI18n = useMemo(() => {
    if (!previewBundle) return null;
    return createProviderFromBundles({
      locale: previewContext.locale.split('-')[0] ?? previewContext.locale,
      fallbackLocale: 'en',
      bundles: [...PLATFORM_BUNDLES, ...EXAMPLE_TENANT_BUNDLES],
      mode: 'dev',
    });
  }, [previewBundle]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('data-reveal-section');
          if (!id) return;
          setRevealedSections((current) => (current.includes(id) ? current : [...current, id]));
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.2 },
    );
    const sections = Array.from(document.querySelectorAll('[data-reveal-section]'));
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const sectionClass = (id: string) =>
    cn(styles.section, revealedSections.includes(id) ? styles.sectionVisible : '');


  const handleGetStarted = async () => {
    setBusy(true);
    try {
      const bundle = await loadExampleBundle('e-commerce-store-demo');
      setPreviewBundle(bundle);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className={styles.landing}>
      <nav className={styles.landingNav}>
        <div className={styles.landingNavSection}>
          <span className={styles.logoMark}>ECR</span>
          <span className={styles.logoTitle}>Enterprise Configuration Runtime</span>
        </div>
        <div className={styles.landingNavSection}>
          {landingNavLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className={styles.navActions}>
          <Link href="/builder" className={cn(styles.cta, styles.primary)}>
            Open Builder
          </Link>
          <Link href="/examples" className={cn(styles.cta, styles.secondary)}>
            Examples
          </Link>
          <button
            type="button"
            className={styles.navToggle}
            aria-label="Open navigation menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </nav>

      {drawerOpen && (
        <div className={styles.drawerPortal}>
          <button type="button" className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)} />
          <div className={styles.mobileDrawer}>
            <div className={styles.drawerHeader}>
              <p className={styles.drawerTitle}>Navigation</p>
              <button
                type="button"
                className={styles.drawerClose}
                aria-label="Close navigation menu"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.drawerLinks}>
              {landingNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={styles.drawerLink}
                  onClick={() => setDrawerOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/builder" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
                Builder
              </Link>
              <Link href="/examples" className={styles.drawerLink} onClick={() => setDrawerOpen(false)}>
                Examples
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <p className="rfOverline" style={{ letterSpacing: '0.3em', textTransform: 'uppercase' }}>
              Enterprise Configuration Runtime
            </p>
            <h1 className={styles.heroHeadline}>
              Ship hydrogen-fast UI + flow + rules across regulated enterprises.
            </h1>
            <p className={styles.heroSubhead}>
              ECR unifies your builder, flow engine, rules engine, and observability stack into one governable platform so you can
              release enterprise workflows without rewriting renderers.
            </p>
            <div className={styles.heroActions}>
              <Link href="/builder" className={`${styles.ctaLink} ${styles.ctaPrimary}`}>
                Open Builder
              </Link>
              <Link href="/examples" className={`${styles.ctaLink} ${styles.ctaSecondary}`}>
                View Examples
              </Link>
              <Button
                variant="ghost"
                size="md"
                onClick={() => void handleGetStarted()}
                disabled={busy}
                className={styles.heroButton}
              >
                {busy ? 'Loading preview…' : 'Get Started'}
              </Button>
            </div>
          </div>
          <div className={styles.heroPreview}>
            {previewSchema && previewI18n ? (
              <RenderPage
                uiSchema={previewSchema}
                data={{ ...previewData, metrics: { kpis: [], revenueSeries: [] } }}
                context={previewContext}
                i18n={previewI18n}
                mode="controlled"
              />
            ) : (
              <div className={styles.previewPlaceholder}>Preview your next config instantly</div>
            )}
          </div>
        </div>
      </section>

      <section id="built-for" data-reveal-section="built-for" className={sectionClass('built-for')}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for highly regulated teams</h2>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>
                  <Icon size={20} />
                </span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="visual-intelligence" data-reveal-section="visual-intelligence" className={sectionClass('visual-intelligence')}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Visual intelligence</h2>
          <span className="rfHelperText">Illustrations for flow, rules, and the builder studio.</span>
        </div>
        <div className={styles.visualGrid}>
          {illustrations.map((item) => (
            <article key={item.title} className={styles.visualCard}>
              <img src={item.src} alt={item.title} loading="lazy" className={styles.visualImage} />
              <h3 className={styles.visualCardTitle}>{item.title}</h3>
              <p className={styles.visualCardDesc}>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="use-cases" data-reveal-section="use-cases" className={sectionClass('use-cases')}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Use cases ready to clone</h2>
          <span className="rfHelperText">Core demos show Builder, Flow, and Rules working together.</span>
        </div>
        <div className={styles.useCases}>
          {useCases.map((useCase) => (
            <article key={useCase.title} className={styles.useCaseCard}>
              <span className={styles.useCaseTag}>{useCase.tag}</span>
              <h3 className={styles.useCaseTitle}>{useCase.title}</h3>
              <p>{useCase.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="docs" data-reveal-section="docs" className={sectionClass('docs')}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Docs & Reference</h2>
          <span className="rfHelperText">Guided paths for builders, architects, and operators.</span>
        </div>
        <div className={styles.docsGrid}>
          {docHighlights.map((highlight) => (
            <article key={highlight.title} className={styles.docsCard}>
              <h3 className={styles.docsCardTitle}>{highlight.title}</h3>
              <p className={styles.docsCardDesc}>{highlight.description}</p>
              <Link href={highlight.href} className={styles.docsCardLink}>
                Explore →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="sneak-peek" data-reveal-section="sneak-peek" className={sectionClass('sneak-peek')}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Sneak peek demos</h2>
          <span className="rfHelperText">Static mockups of builder and onboarding flows.</span>
        </div>
        <div className={styles.screenshots}>
          {snapshotScreens.map((shot) => (
            <article key={shot.title} className={styles.screenshotCard}>
              <picture>
                <source srcSet={shot.src.replace('.png', '.webp')} type="image/webp" />
                <img src={shot.src} alt={shot.alt} loading="lazy" />
              </picture>
              <p className={styles.screenshotCaption}>{shot.title}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="quickstart" data-reveal-section="quickstart" className={sectionClass('quickstart')}>
        <div className={styles.ctaPanel}>
          <div>
            <h3 className={styles.sectionTitle}>New to ECR?</h3>
            <p>
              Follow the quickstart guide to understand ECR terminology, config lifecycle, and how to publish your first bundle.
              The Docs & Reference section above highlights the core getting-started, concepts, and API pathways.
            </p>
            <Link href="/docs/getting-started/quick-start" className={styles.ctaLink + ' ' + styles.ctaSecondary}>
              Visit Quickstart
            </Link>
          </div>
          <div>
            <p>
              The Builder, Flow Editor, Rules, and previews remain accessible at <Link href="/builder">/builder</Link>, while the
              Examples gallery shows curated bundles and runtime previews.
            </p>
            <Link href="/builder" className={`${styles.ctaLink} ${styles.ctaPrimary}`}>
              Open Builder
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerColumn}>
          <p className={styles.footerColumnTitle}>Product</p>
          <Link href="/builder" className={styles.footerLink}>
            Builder
          </Link>
          <Link href="/examples" className={styles.footerLink}>
            Examples
          </Link>
          <Link href="/playground" className={styles.footerLink}>
            Playground
          </Link>
        </div>
        <div className={styles.footerColumn}>
          <p className={styles.footerColumnTitle}>Resources</p>
          <Link href="/docs" className={styles.footerLink}>
            Docs
          </Link>
          <Link href="/docs/concepts" className={styles.footerLink}>
            Concepts
          </Link>
          <Link href="/docs/api/runtime" className={styles.footerLink}>
            API Reference
          </Link>
        </div>
        <div className={styles.footerColumn}>
          <p className={styles.footerColumnTitle}>Connect</p>
          <div className={styles.socialLinks}>
            {socialLinks.map(({ label, href, Icon }) => (
              <Link key={label} href={href} className={styles.socialLink}>
                <Icon size={18} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className={styles.footerColumn}>
          <p className={styles.footerColumnTitle}>Company</p>
          <span>© {new Date().getFullYear()} Enterprise Configuration Runtime</span>
          <span>Powered by Ruleflow Labs</span>
        </div>
      </footer>
    </main>
  );
}
