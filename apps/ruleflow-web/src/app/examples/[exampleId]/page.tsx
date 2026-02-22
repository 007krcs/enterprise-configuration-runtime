import Link from 'next/link';
import type { ExampleId } from '@/lib/examples';
import { exampleCatalog } from '@/lib/examples';
import styles from './example-view.module.css';

type ExamplePageProps = {
  params: {
    exampleId: ExampleId;
  };
};

export function generateStaticParams() {
  return exampleCatalog.map((example) => ({ exampleId: example.id }));
}

export default function ExampleJsonPage({ params }: ExamplePageProps) {
  const example = exampleCatalog.find((item) => item.id === params.exampleId);
  if (!example) {
    return (
      <div className={styles.shell}>
        <p className={styles.title}>Example not found</p>
        <p className={styles.description}>
          We could not locate that bundle. Return to the examples gallery to pick another demo.
        </p>
        <Link className="pf-button pf-button--primary" href="/examples">
          Back to examples
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <p className={styles.kicker}>JSON preview</p>
      <h1 className={styles.title}>{example.title}</h1>
      <p className={styles.description}>
        For now this page shows guidance on how to download and inspect the bundle. Open the builder or download the
        JSON directly from the examples gallery.
      </p>
      <div className={styles.actions}>
        <Link className="pf-button pf-button--outline" href="/examples">
          Open examples
        </Link>
        <Link className="pf-button pf-button--primary" href="/builder">
          Open builder
        </Link>
      </div>
    </div>
  );
}
