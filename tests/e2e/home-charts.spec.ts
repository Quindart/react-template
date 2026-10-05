import { test, expect, login } from './fixtures';

test('tablet keeps chart labels inside the plotting area', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'desktop',
    'Tablet check uses desktop browser.',
  );
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/login');
  await login(page);
  const radar = page.getByRole('figure', { name: 'Hiệu suất tổng thể' });
  await radar.scrollIntoViewIfNeeded();
  const plot = radar.locator('svg.recharts-surface');
  await expect(plot).toBeVisible();
  const bounds = (await plot.boundingBox())!;
  for (const label of await radar
    .locator('.recharts-polar-angle-axis-tick-value')
    .all()) {
    const tick = (await label.boundingBox())!;
    expect(tick.x).toBeGreaterThanOrEqual(bounds.x);
    expect(tick.x + tick.width).toBeLessThanOrEqual(bounds.x + bounds.width);
  }
});

test('home displays eight charts without overflowing the viewport', async ({
  page,
}, testInfo) => {
  await page.goto('/login');
  await login(page);
  await page.getByRole('button', { name: 'Đóng thông báo' }).click();
  await expect(
    page.getByText('Dữ liệu minh họa', { exact: true }),
  ).toBeVisible();
  const charts = page.getByRole('figure');
  await expect(charts).toHaveCount(8);
  for (const chart of await charts.all()) {
    await chart.scrollIntoViewIfNeeded();
    await expect(chart.locator('svg.recharts-surface')).toBeVisible();
    const bounds = await chart.boundingBox();
    expect(bounds!.width).toBeGreaterThan(200);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/home-charts-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
