import { redirect } from 'next/navigation';

type LegacyPathParams = {
  legacyPath: string[];
};

const legacyRedirects: Record<string, string> = {
  screens: '/builder/screens',
  flow: '/builder/flow',
  rules: '/builder/rules',
  'api-mappings': '/builder/api-mappings',
  playground: '/playground',
};

export default async function LegacyRouteRedirect({ params }: { params: Promise<LegacyPathParams> }) {
  const { legacyPath } = await params;
  const [segment] = legacyPath;
  const target = segment ? legacyRedirects[segment] : undefined;

  if (target) {
    redirect(target);
  }

  redirect('/builder/legacy');
}
