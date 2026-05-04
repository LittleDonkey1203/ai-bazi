import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list']],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{projectName}/{arg}{ext}',
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
  },
  // 不内置 webServer:dev server 由用户/CI 在跑测试前手动启动(npm run dev)。
  // 原因:Playwright 1.49 在 `reuseExistingServer: true` 下仍会先 spawn `npm run dev`,
  // 与已运行的 server 端口冲突时会以非零码退出,无法优雅回退到现有 server。
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        channel: 'chromium',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
