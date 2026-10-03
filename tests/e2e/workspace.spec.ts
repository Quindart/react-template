import { test, expect, login } from './fixtures';

test('workspace navigation and account menu remain available after reload', async ({
  page,
}, testInfo) => {
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: 'Menu tài khoản' }),
  ).toHaveCount(0);
  await login(page);
  await page.reload();
  const breadcrumb = page.getByRole('navigation', {
    name: 'Đường dẫn hiện tại',
  });
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText(
    'Trang chủ',
  );
  if (testInfo.project.name === 'mobile') {
    const toggle = page.getByRole('button', {
      name: 'Bật/tắt thanh điều hướng',
    });
    await toggle.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await page
      .getByRole('button', { name: 'Bật/tắt thanh điều hướng' })
      .click();
  }
  const navigation = page.getByRole('navigation', { name: 'Điều hướng chính' });
  const home = navigation.getByRole('link', { name: 'Trang chủ' });
  await expect(home).toBeVisible();
  await expect(home).toHaveAttribute('aria-current', 'page');
  await home.click();
  if (testInfo.project.name === 'mobile') {
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  const avatar = page.getByRole('button', { name: 'Menu tài khoản' });
  await avatar.click();
  await expect(page.getByRole('menuitem', { name: 'Đăng xuất' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(avatar).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/workspace-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
