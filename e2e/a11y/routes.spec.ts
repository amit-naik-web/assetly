import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { assertNoSeriousViolations } from './helpers/assert-no-serious-violations';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] as const;

const routes = [
  '/overview',
  '/prices',
  '/holdings',
  '/alerts',
  '/reports',
  '/chart/AAPL',
] as const;

for (const path of routes) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('navigation', { name: 'Main navigation' }).waitFor();

    if (path === '/overview') {
      await page.locator('app-treemap').waitFor({ timeout: 15_000 });
    } else if (path === '/prices') {
      await page.locator('app-sector-heatmap').waitFor({ timeout: 15_000 });
    } else if (path.startsWith('/chart/')) {
      await page.locator('main').waitFor({ state: 'visible' });
    }

    const results = await new AxeBuilder({ page })
      .withTags([...WCAG_TAGS])
      .analyze();

    assertNoSeriousViolations(results);
  });
}
