import { expect, test } from '@playwright/test';

test('landing hero, docs links, examples preview, and responsive nav', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Ship hydrogen-fast UI \+ flow \+ rules across regulated enterprises/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Docs' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Examples' })).toBeVisible();

  await page.getByRole('link', { name: 'View Examples' }).click();
  await expect(page).toHaveURL(/\/examples/);
  await expect(page.getByRole('heading', { name: 'Jump straight into the runtime' })).toBeVisible();

  const previewButton = page.getByRole('button', { name: 'Preview' }).first();
  await previewButton.click();
  await expect(page.getByRole('dialog', { name: /Preview for/i })).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.setViewportSize({ width: 375, height: 780 });
  await page.goto('/');

  const menu = page.getByRole('button', { name: 'Open navigation menu' });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(page.getByText('Navigation')).toBeVisible();
  await page.getByRole('button', { name: 'Close navigation menu' }).click();
});
