import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'desktop-1440x900', width: 1440, height: 900 },
  { name: 'desktop-1366x768', width: 1366, height: 768 },
  { name: 'mobile-375x812', width: 375, height: 812 },
];

for (const viewport of viewports) {
  test(`landing scroll reaches footer on ${viewport.name}`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'rf:onboarding:v1',
        JSON.stringify({ open: false, dismissed: true, activeVersionId: null, steps: {} }),
      );
    });
    const effectiveBaseUrl =
      baseURL ??
      process.env.PLAYWRIGHT_BASE_URL ??
      process.env.BASE_URL ??
      'http://localhost:3000';
    await page.goto(new URL('/', effectiveBaseUrl).toString(), { waitUntil: 'networkidle' });

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

    const readScrollTops = () =>
      page.evaluate(() => {
        const docEl = document.scrollingElement ?? document.documentElement;
        const shellMain = document.querySelector('main.rfScrollbar');
        const mainEl = shellMain instanceof HTMLElement ? shellMain : null;
        return {
          docTop: docEl.scrollTop,
          mainTop: mainEl?.scrollTop ?? 0,
        };
      });

    const isFooterInViewport = () =>
      footer.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0;
      });

    const beforeWheel = await readScrollTops();

    await page.mouse.move(Math.floor(viewport.width / 2), Math.floor(viewport.height / 2));
    let reachedFooterByWheel = await isFooterInViewport();
    for (let i = 0; i < 24 && !reachedFooterByWheel; i += 1) {
      await page.mouse.wheel(0, Math.max(520, Math.floor(viewport.height * 0.75)));
      await page.waitForTimeout(60);
      reachedFooterByWheel = await isFooterInViewport();
    }

    const afterWheel = await readScrollTops();
    const wheelMoved =
      afterWheel.docTop > beforeWheel.docTop || afterWheel.mainTop > beforeWheel.mainTop;
    expect(wheelMoved).toBeTruthy();
    expect(reachedFooterByWheel).toBeTruthy();
  });
}
