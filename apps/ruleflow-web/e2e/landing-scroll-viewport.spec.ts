import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1366x768', width: 1366, height: 768 },
  { name: 'mobile-375x812', width: 375, height: 812 },
];

for (const viewport of viewports) {
  test(`landing scroll reaches footer on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/', { waitUntil: 'networkidle' });

    const onboardingDialog = page.getByRole('dialog', { name: 'Getting Started' });
    if (await onboardingDialog.isVisible()) {
      const dismiss = page.getByRole('button', { name: 'Dismiss' });
      if (await dismiss.isVisible()) {
        await dismiss.click();
      } else {
        await page.getByRole('button', { name: 'Close dialog' }).first().click();
      }
    }

    const footer = page.locator('footer').first();

    const scrollInfo = await page.evaluate(() => {
      const docEl = document.scrollingElement ?? document.documentElement;
      const shellMain = document.querySelector('main');
      const mainEl = shellMain instanceof HTMLElement ? shellMain : null;
      const target =
        mainEl && mainEl.scrollHeight > mainEl.clientHeight + 1
          ? mainEl
          : docEl;

      return {
        target: target === docEl ? 'document' : 'main',
        scrollHeight: target.scrollHeight,
        viewportHeight: target.clientHeight,
        scrollTop: target.scrollTop,
      };
    });

    expect(scrollInfo.scrollHeight).toBeGreaterThan(scrollInfo.viewportHeight);

    await page.mouse.move(Math.floor(viewport.width / 2), Math.floor(viewport.height / 2));
    await page.mouse.wheel(0, Math.max(700, viewport.height));
    await page.waitForTimeout(120);

    const wheelScrollTop = await page.evaluate((targetName) => {
      const docEl = document.scrollingElement ?? document.documentElement;
      const shellMain = document.querySelector('main');
      const mainEl = shellMain instanceof HTMLElement ? shellMain : null;
      const target = targetName === 'main' && mainEl ? mainEl : docEl;
      return target.scrollTop;
    }, scrollInfo.target);
    expect(wheelScrollTop).toBeGreaterThan(scrollInfo.scrollTop);

    await page.evaluate((targetName) => {
      const docEl = document.scrollingElement ?? document.documentElement;
      const shellMain = document.querySelector('main');
      const mainEl = shellMain instanceof HTMLElement ? shellMain : null;
      const target = targetName === 'main' && mainEl ? mainEl : docEl;
      target.scrollTo({ top: target.scrollHeight, behavior: 'auto' });
    }, scrollInfo.target);

    await expect(footer).toBeInViewport();

    const reachedBottom = await page.evaluate((targetName) => {
      const docEl = document.scrollingElement ?? document.documentElement;
      const shellMain = document.querySelector('main');
      const mainEl = shellMain instanceof HTMLElement ? shellMain : null;
      const target = targetName === 'main' && mainEl ? mainEl : docEl;
      return Math.ceil(target.scrollTop + target.clientHeight) >= target.scrollHeight - 2;
    }, scrollInfo.target);
    expect(reachedBottom).toBeTruthy();
  });
}
