'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { apiGet, apiPost } from '@/lib/demo/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import styles from './branding.module.css';

type BrandingPayload = {
  logoUrl?: string;
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  secondaryColor: string;
  typographyScale: number;
  radius: number;
  spacing: number;
  cssVariables: Record<string, unknown>;
};

export default function BrandingPage() {
  const { toast } = useToast();
  const [branding, setBranding] = useState<BrandingPayload>({
    mode: 'light',
    primaryColor: '#0055aa',
    secondaryColor: '#0b2a44',
    typographyScale: 1,
    radius: 8,
    spacing: 8,
    cssVariables: {},
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await apiGet<{ ok: true; branding: BrandingPayload | null }>('/api/branding').catch(() => null);
      if (data?.branding) {
        setBranding(data.branding);
      }
    };
    void load();
  }, []);

  const save = async () => {
    setBusy(true);
    try {
      await apiPost('/api/branding', branding);
      toast({ variant: 'success', title: 'Branding updated' });
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Failed to save branding',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  };

  const previewStyle = {
    '--branding-primary': branding.primaryColor,
    '--branding-secondary': branding.secondaryColor,
    '--branding-radius': `${branding.radius}px`,
    '--branding-spacing': `${branding.spacing}px`,
    '--branding-scale': `${branding.typographyScale}rem`,
  } as CSSProperties;

  return (
    <div className={styles.page}>
      <Card>
        <CardHeader>
          <CardTitle>Tenant Branding</CardTitle>
        </CardHeader>
        <CardContent className={styles.formStack}>
          <div className={styles.formGrid}>
            <div>
              <label className="rfFieldLabel">Mode</label>
              <Select
                value={branding.mode}
                onChange={(event) => setBranding({ ...branding, mode: event.target.value as BrandingPayload['mode'] })}
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
                <option value="system">system</option>
              </Select>
            </div>
            <div>
              <label className="rfFieldLabel">Logo URL</label>
              <Input value={branding.logoUrl ?? ''} onChange={(event) => setBranding({ ...branding, logoUrl: event.target.value || undefined })} />
            </div>
            <div>
              <label className="rfFieldLabel">Primary Color</label>
              <Input value={branding.primaryColor} onChange={(event) => setBranding({ ...branding, primaryColor: event.target.value })} />
            </div>
            <div>
              <label className="rfFieldLabel">Secondary Color</label>
              <Input value={branding.secondaryColor} onChange={(event) => setBranding({ ...branding, secondaryColor: event.target.value })} />
            </div>
            <div>
              <label className="rfFieldLabel">Typography Scale</label>
              <Input
                value={String(branding.typographyScale)}
                onChange={(event) => setBranding({ ...branding, typographyScale: Number(event.target.value || '1') })}
              />
            </div>
            <div>
              <label className="rfFieldLabel">Radius</label>
              <Input value={String(branding.radius)} onChange={(event) => setBranding({ ...branding, radius: Number(event.target.value || '8') })} />
            </div>
          </div>
          <div>
            <Button onClick={save} disabled={busy}>
              {busy ? 'Saving...' : 'Save Branding'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.previewBox} style={previewStyle}>
            <p className={styles.previewText}>RuleFlow tenant theme preview</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
