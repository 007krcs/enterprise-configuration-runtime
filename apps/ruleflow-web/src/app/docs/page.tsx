import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocsSearch } from '@/components/docs/docs-search';
import { docs, type DocEntry, type DocSection } from '@/lib/docs';
import styles from './docs.module.css';

const sections: DocSection[] = [
  'Getting Started',
  'Concepts',
  'Examples',
  'API',
  'Tutorials',
  'Reference',
];

const docsBySection = (section: DocSection): DocEntry[] => docs.filter((doc) => doc.section === section);

export default function DocsPage() {
  return (
    <div className={styles.layout}>
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.sidebarLinks}>
            {sections.map((section) => {
              const entries = docsBySection(section);
              if (!entries.length) {
                return null;
              }
              return (
                <div key={section} className={styles.sidebarGroup}>
                  <p className={styles.sidebarSectionTitle}>{section}</p>
                  {entries.map((doc) => (
                    <Link key={doc.slug} className={styles.sidebarLink} href={`/docs/${doc.slug}`}>
                      {doc.title}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className={styles.contentStack}>
        <DocsSearch />
        <Card>
          <CardHeader>
            <CardTitle>Explore the docs</CardTitle>
          </CardHeader>
          <CardContent>
            <p style={{ margin: 0, color: 'var(--rf-muted)', fontSize: 14 }}>
              Discover curated sections covering Quick Start, concepts, demos, and APIs.
            </p>
            <div style={{ height: 12 }} />
            <div className={styles.tiles}>
              {sections.map((section) => {
                const entries = docsBySection(section);
                if (!entries.length) {
                  return null;
                }
                return (
                  <div key={section} className={styles.sectionGroup}>
                    <p className={styles.sectionGroupTitle}>{section}</p>
                    <div className={styles.tileGroup}>
                      {entries.map((doc) => (
                        <Link key={doc.slug} href={`/docs/${doc.slug}`} className={styles.tile}>
                          <p className={styles.tileTitle}>{doc.title}</p>
                          <p className={styles.tileDesc}>{doc.description}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
