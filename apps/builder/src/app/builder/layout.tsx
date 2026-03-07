import type { ReactNode } from 'react';
import { BuilderLayoutClient } from '../../components/BuilderLayoutClient';

export const metadata = {
  title: 'Builder Workspaces',
  description: 'Multi-workspace console for Ruleflow.',
};

export default function BuilderLayout({ children }: { children: ReactNode }) {
  return <BuilderLayoutClient>{children}</BuilderLayoutClient>;
}
