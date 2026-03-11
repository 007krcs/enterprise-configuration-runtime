import { describe, it, expect } from 'vitest';
import { rendererPlugins } from '../src/plugins/renderer-plugins';

describe('renderer plugins XSS safety', () => {
  it('uses textContent instead of innerHTML for component type', () => {
    const plugin = rendererPlugins[0];
    const renderer = plugin.renderers![0]; // reactRenderer

    const mount = document.createElement('div');
    const maliciousType = '<img src=x onerror=alert(1)>';

    renderer.render({ mount, componentType: maliciousType } as any);

    // No actual <img> element should be created — script injection is neutralized
    expect(mount.querySelector('img')).toBeNull();
    // The malicious string appears as safe text content, not executable HTML
    expect(mount.textContent).toContain(maliciousType);
    // innerHTML should contain entity-escaped version (&lt;img...)
    expect(mount.innerHTML).toContain('&lt;img');
  });

  it('renders placeholder text safely with undefined componentType', () => {
    const plugin = rendererPlugins[0];
    const renderer = plugin.renderers![0];

    const mount = document.createElement('div');
    renderer.render({ mount, componentType: undefined } as any);

    expect(mount.textContent).toContain('component');
    expect(mount.children.length).toBe(1);
  });

  it('clears mount on unmount without innerHTML', () => {
    const plugin = rendererPlugins[0];
    const renderer = plugin.renderers![0];

    const mount = document.createElement('div');
    mount.appendChild(document.createElement('span'));
    mount.appendChild(document.createElement('div'));

    renderer.unmount!(mount);
    expect(mount.children.length).toBe(0);
    expect(mount.textContent).toBe('');
  });

  it('all three renderers are defined', () => {
    const plugin = rendererPlugins[0];
    expect(plugin.renderers).toHaveLength(3);
    expect(plugin.renderers!.map((r) => r.id)).toEqual([
      'renderer.react',
      'renderer.angular',
      'renderer.vue',
    ]);
  });
});
