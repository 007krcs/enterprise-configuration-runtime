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
      <h1>We hit a snag.</h1>
      <p className={styles.message}>
        Something went wrong while rendering this page. You can retry, or head back to the home page and start fresh.
      </p>
      <p className={styles.errorText}>{error.message}</p>
      <div className={styles.actions}>
        <button type="button" className="pf-button pf-button--outline" onClick={() => reset()}>
          Retry
        </button>
        <Link href="/" className="pf-button pf-button--primary">
          Go Home
        </Link>
      </div>
    </main>
  );
}
