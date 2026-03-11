import type { DeclarativePlugin, RendererRegistration } from '@platform/plugin-sdk';

function createPlaceholder(mount: HTMLElement, componentType: string | undefined): void {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'padding:12px; font-family: Segoe UI, sans-serif;';
  wrapper.textContent = `${componentType ?? 'component'} renderer placeholder.`;
  mount.textContent = '';
  mount.appendChild(wrapper);
}

function clearMount(mount: HTMLElement): void {
  while (mount.firstChild) {
    mount.removeChild(mount.firstChild);
  }
}

const reactRenderer: RendererRegistration = {
  id: 'renderer.react',
  name: 'React Renderer',
  framework: 'react',
  render: ({ mount, componentType }) => createPlaceholder(mount, componentType),
  unmount: clearMount,
};

const angularRenderer: RendererRegistration = {
  id: 'renderer.angular',
  name: 'Angular Renderer',
  framework: 'angular',
  render: ({ mount, componentType }) => createPlaceholder(mount, componentType),
  unmount: clearMount,
};

const vueRenderer: RendererRegistration = {
  id: 'renderer.vue',
  name: 'Vue Renderer',
  framework: 'vue',
  render: ({ mount, componentType }) => createPlaceholder(mount, componentType),
  unmount: clearMount,
};

export const rendererPlugins: DeclarativePlugin[] = [
  {
    meta: {
      id: 'platform.renderers',
      name: 'Renderer Pack',
      version: '0.1.0',
      apiVersion: '1.0.0',
      description: 'Registers renderers for multiple UI frameworks.',
    },
    renderers: [reactRenderer, angularRenderer, vueRenderer],
  },
];
