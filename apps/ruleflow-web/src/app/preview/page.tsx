import { Playground } from '@/components/playground/playground';
import { getConsoleSnapshot } from '@/server/repository';

export const dynamic = 'force-dynamic';

type PreviewSearchParams = {
  versionId?: string;
  example?: string;
  screen?: string;
  draftId?: string;
  preview?: string;
};

export default async function PreviewPage({ searchParams }: { searchParams: Promise<PreviewSearchParams> }) {
  const { versionId } = await searchParams;
  const snapshot = await getConsoleSnapshot();
  const requestedVersion = versionId ? snapshot.versions.find((v: { id: string }) => v.id === versionId) ?? null : null;
  return <Playground initialSnapshot={snapshot} initialVersion={requestedVersion} />;
}
