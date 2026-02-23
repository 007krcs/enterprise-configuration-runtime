import { notFound } from 'next/navigation';
import Link from 'next/link';
import { docsBySlug, docs } from '@/lib/docs';
import { Card, CardContent } from '@/components/ui/card';
import { DocRenderer } from '@/components/docs/doc-renderer';
import styles from '../../docs.module.css';

type NestedDocParams = {
  slug: string;
  child: string;
};

export default async function NestedDocPage({ params }: { params: Promise<NestedDocParams> }) {
  const { slug, child } = await params;
  const docSlug = `${slug}/${child}`;
  const doc = docsBySlug[docSlug];
  if (!doc) return notFound();

  return (
    <div className={styles.layout}>
      <Card>
        <CardContent>
          <div className={styles.sidebarLinks}>
            {docs.map((item) => (
              <Link
                key={item.slug}
                className={item.slug === doc.slug ? `${styles.sidebarLink} ${styles.sidebarActive}` : styles.sidebarLink}
                href={`/docs/${item.slug}`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className={styles.articleWrap}>
          <article className="rfProse">
            <DocRenderer slug={doc.slug} />
          </article>
        </CardContent>
      </Card>
    </div>
  );
}
