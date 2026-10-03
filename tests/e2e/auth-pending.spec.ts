import { test, expect } from './fixtures';
test('real Home module request keeps login pending until navigation completes', async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested!: () => void;
  const intercepted = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route(/\/assets\/home-[^/]+\.js$/, async (route) => {
    requested();
    await gate;
    await route.continue();
  });
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('admin');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin123456Aa@');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await intercepted;
  try {
    await expect(
      page.getByRole('progressbar', { name: 'Đang đăng nhập' }),
    ).toBeVisible();
    await expect(page.locator('form')).toHaveAttribute('aria-busy', 'true');
    await expect(
      page.getByLabel('Tên đăng nhập', { exact: true }),
    ).toBeDisabled();
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Đang chuyển đến trang chủ…' }),
    ).toBeDisabled();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.locator('form').evaluate((form) => {
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
      form.dispatchEvent(
        new Event('submit', { bubbles: true, cancelable: true }),
      );
    });
    await expect(page.getByRole('alert')).toHaveCount(1);
    await expect(page.getByRole('alert')).toContainText(
      'Đăng nhập thành công. Chào mừng admin!',
    );
    await expect(page).toHaveURL(/\/login$/);
  } finally {
    release();
  }
  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole('heading', { name: 'Xin chào, admin!' }),
  ).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
});
