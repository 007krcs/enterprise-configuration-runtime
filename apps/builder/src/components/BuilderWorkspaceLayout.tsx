'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BuilderWorkspaceLayout.module.css';

interface BuilderWorkspaceLayoutProps {
  children: ReactNode;
}

type NavItem = { label: string; href: string; icon: string; description: string };

const navItems: NavItem[] = [
  { label: 'Screens', href: '/builder/screens', icon: '[]', description: 'Layout editor' },
  { label: 'Flow', href: '/builder/flow', icon: '->', description: 'State transitions' },
  { label: 'Rules', href: '/builder/rules', icon: 'RL', description: 'Validation' },
  { label: 'Data', href: '/builder/data', icon: 'DB', description: 'Config & versions' },
  { label: 'JSON', href: '/builder/json', icon: '{}', description: 'Bundle preview' },
  { label: 'Docs', href: '/builder/docs', icon: 'DC', description: 'Documentation' },
];

export function BuilderWorkspaceLayout({ children }: BuilderWorkspaceLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={styles.workspaceShell} data-testid="builder-shell">
      <nav className={styles.navRail} aria-label="Builder workspaces">
        <div className={styles.navBrand}>
          <span className={styles.brandMark}>R</span>
          <span className={styles.brandLabel}>Builder</span>
        </div>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`.trim()}
                  aria-current={isActive ? 'page' : undefined}
                  title={item.description}
                >
                  <span aria-hidden className={styles.navIcon}>
                    {item.icon}
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className={styles.navFooter}>
          <Link className={styles.navLinkMuted} href="/builder/legacy">
            Legacy
          </Link>
          <Link className={styles.navLinkMuted} href="/studio">
            Studio
          </Link>
        </div>
      </nav>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
