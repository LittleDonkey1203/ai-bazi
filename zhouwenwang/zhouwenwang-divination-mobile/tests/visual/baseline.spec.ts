import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/masters', name: 'masters' },
  { path: '/liuyao', name: 'liuyao' },
  { path: '/qimen', name: 'qimen' },
  { path: '/bazi', name: 'bazi' },
  { path: '/zhougong', name: 'zhougong' },
  { path: '/lifekline', name: 'lifekline' },
  { path: '/palmistry', name: 'palmistry' },
];

for (const route of ROUTES) {
  test(`baseline ${route.name}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      fullPage: true,
    });
  });
}
