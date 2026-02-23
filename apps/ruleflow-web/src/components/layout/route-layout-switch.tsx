'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { DocsLayout } from '@/components/layout/docs-layout';

export function RouteLayoutSwitch({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/docs')) {
    return <DocsLayout>{children}</DocsLayout>;
  }
  return <AppShell>{children}</AppShell>;
}
