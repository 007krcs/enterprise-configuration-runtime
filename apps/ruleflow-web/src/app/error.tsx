'use client';

import Link from 'next/link';
import styles from './error.module.css';

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <main className={styles.container}>
      <p className={styles.kicker}>Application error</p>
      <h1>We hit a snag loading ECR.</h1>
      <p className={styles.message}>
        The landing page failed to render. Our engineers have been notified, and you can try again or head straight
        into the builder.
      </p>
      <p className={styles.errorText}>{error.message}</p>
      <div className={styles.actions}>
        <button type="button" className="pf-button pf-button--outline" onClick={() => reset()}>
          Retry
        </button>
        <Link href="/builder" className="pf-button pf-button--primary">
          Open Builder
        </Link>
      </div>
    </main>
  );
}
