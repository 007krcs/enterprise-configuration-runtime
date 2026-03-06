import Link from 'next/link';
import styles from './error.module.css';

export default function NotFoundPage() {
  return (
    <main className={styles.container}>
      <p className={styles.kicker}>404</p>
      <h1>Page not found</h1>
      <p className={styles.message}>
        The page you are looking for does not exist or has been moved. Head back to the home page or jump straight into
        the builder.
      </p>
      <div className={styles.actions}>
        <Link href="/" className="pf-button pf-button--outline">
          Go Home
        </Link>
        <Link href="/builder" className="pf-button pf-button--primary">
          Open Builder
        </Link>
      </div>
    </main>
  );
}
