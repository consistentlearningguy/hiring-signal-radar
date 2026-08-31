import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  (page as typeof page & { qaErrors?: string[] }).qaErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as typeof page & { qaErrors?: string[] }).qaErrors ?? []).toEqual([]);
});

test('home exposes trust, navigation, and metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('companies are');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\/[^/]+\/$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Hiring Signal Radar/);
  await expect(page.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  const warning = page.locator('[data-dataset-warning]');
  const generatedAt = await warning.getAttribute('data-generated-at');
  const overdue = !generatedAt || Date.now() - Date.parse(generatedAt) > 48 * 60 * 60 * 1000;
  if (overdue) await expect(warning).toBeVisible();
  else await expect(warning).toBeHidden();
});

test('job index loads lazily and filters roles', async ({ page }) => {
  await page.goto('/jobs/');
  const list = page.locator('[data-job-list]');
  await expect(list).toHaveAttribute('aria-busy', 'false', { timeout: 60_000 });
  await expect(list.locator('.job-card')).toHaveCount(25);
  await page.locator('#title-filter').fill('machine learning');
  await expect(page.locator('[data-result-count]')).not.toHaveText('0');
  await expect(list.locator('.job-card').first()).toContainText(/machine learning/i);
});

test('status page lists every configured source', async ({ page }) => {
  await page.goto('/status/');
  await expect(page.getByRole('heading', { name: 'Trust the timestamp.' })).toBeVisible();
  const sourceCount = await page.evaluate(async () => {
    const status = await fetch('/data/status.json').then((response) => response.json());
    return Object.keys(status.companies).length;
  });
  await expect(page.locator('tbody tr')).toHaveCount(sourceCount);
});

test('mobile pages do not overflow horizontally', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'Mobile-only layout assertion');
  for (const path of ['/', '/jobs/', '/status/']) {
    await page.goto(path);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});
