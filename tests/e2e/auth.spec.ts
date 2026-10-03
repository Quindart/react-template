import { test, expect, login } from './fixtures';

test('empty form validates without creating a session', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText('Vui lòng nhập tên đăng nhập.')).toBeVisible();
  await expect(page.getByText('Vui lòng nhập mật khẩu.')).toBeVisible();
  await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toBeFocused();
  await expect(page.locator('.notistack-MuiContent-error')).toContainText(
    'Vui lòng kiểm tra các trường được đánh dấu.',
  );
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem('auth-session')),
  ).toBeNull();
});

for (const path of ['/', '/home']) {
  test(`guest ${path} redirects without exposing home`, async ({ page }) => {
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        if (document.body?.textContent?.includes('Xin chào, admin!'))
          (window as unknown as { exposedHome: boolean }).exposedHome = true;
      });
      observer.observe(document, { childList: true, subtree: true });
    });
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => (window as unknown as { exposedHome?: boolean }).exposedHome,
      ),
    ).toBeUndefined();
  });
}

for (const credentials of [
  { username: 'someone', password: 'admin123456Aa@' },
  { username: 'admin', password: 'wrong' },
]) {
  test(`wrong credentials ${credentials.username}/${credentials.password}`, async ({
    page,
  }) => {
    await page.goto('/login');
    await page
      .getByLabel('Tên đăng nhập', { exact: true })
      .fill(credentials.username);
    await page
      .getByLabel('Mật khẩu', { exact: true })
      .fill(credentials.password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(2);
    await expect(page.locator('form').getByRole('alert')).toContainText(
      'Tên đăng nhập hoặc mật khẩu không đúng.',
    );
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('');
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveValue(
      credentials.username,
    );
    await expect(page).toHaveURL(/\/login$/);
    expect(
      await page.evaluate(() => localStorage.getItem('auth-session')),
    ).toBeNull();
    await page.getByRole('button', { name: 'Đóng thông báo' }).click();
    await expect(page.locator('form').getByRole('alert')).toBeVisible();
    await page.getByLabel('Mật khẩu', { exact: true }).fill('new value');
    await expect(page.locator('form').getByRole('alert')).toHaveCount(0);
    await login(page);
  });
}

test('success persists exact session, reloads, shares tabs and guards login', async ({
  page,
  context,
}) => {
  await page.goto('/login');
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Xin chào, admin!' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText(
    'Đăng nhập thành công. Chào mừng admin!',
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('auth-session')!),
    ),
  ).toEqual({ state: { user: { username: 'admin' } }, version: 1 });
  const viewport = page.viewportSize()!;
  await expect
    .poll(async () => {
      const notice = await page.getByRole('alert').boundingBox();
      return (
        !!notice &&
        notice.y >= 0 &&
        notice.y < 50 &&
        notice.x >= 0 &&
        notice.x + notice.width <= viewport.width &&
        viewport.width - notice.x - notice.width < 25
      );
    })
    .toBe(true);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Xin chào, admin!' }),
  ).toBeVisible();
  const tab = await context.newPage();
  await tab.goto('/login');
  await expect(tab).toHaveURL(/\/home$/);
  await expect(
    tab.getByRole('heading', { name: 'Xin chào, admin!' }),
  ).toBeVisible();
  await page.goto('/');
  await expect(page).toHaveURL(/\/home$/);
});

test('logout, reload and Back do not expose protected home', async ({
  page,
}) => {
  await page.goto('/login');
  await login(page);
  await page.getByRole('button', { name: 'Menu tài khoản' }).click();
  await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('auth-session')!),
    ),
  ).toEqual({ state: { user: null }, version: 1 });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Chào mừng trở lại' }),
  ).toBeVisible();
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'Xin chào, admin!' }),
  ).toHaveCount(0);
});

for (const session of [
  '{broken',
  JSON.stringify({ version: 1, state: { user: { username: 'intruder' } } }),
  JSON.stringify({ version: 1, state: { user: 'admin' } }),
]) {
  test(`invalid stored session ${session}`, async ({ page }) => {
    await page.addInitScript(
      (value) => localStorage.setItem('auth-session', value),
      session,
    );
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Chào mừng trở lại' }),
    ).toBeVisible();
    await login(page);
  });
}

for (const failure of ['read', 'write', 'both']) {
  test(`storage ${failure} failure remains usable`, async ({ page }) => {
    await page.addInitScript((mode) => {
      if (mode !== 'write')
        Storage.prototype.getItem = () => {
          throw new DOMException('blocked', 'SecurityError');
        };
      if (mode !== 'read')
        Storage.prototype.setItem = () => {
          throw new DOMException('blocked', 'SecurityError');
        };
    }, failure);
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login$/);
    await login(page);
    await expect(
      page.getByRole('heading', { name: 'Xin chào, admin!' }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      'Đăng nhập thành công, nhưng không thể lưu phiên.',
    );
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
  });
}

test('password toggle, Enter, keyboard snackbar close and viewport', async ({
  page,
}, testInfo) => {
  await page.goto('/login');
  await expect(
    page.getByRole('heading', { name: 'Chào mừng trở lại' }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/login-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('admin');
  const password = page.getByLabel('Mật khẩu', { exact: true });
  await password.fill('admin123456Aa@');
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await password.press('Enter');
  await expect(page).toHaveURL(/\/home$/);
  const close = page.getByRole('button', { name: 'Đóng thông báo' });
  await close.focus();
  await expect(close).toBeFocused();
  await close.press('Enter');
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('blocked localStorage access still allows an in-memory session', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    }),
  );
  await page.goto('/home');
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await expect(page.getByRole('alert')).toContainText(
    'Đăng nhập thành công, nhưng không thể lưu phiên.',
  );
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
});

test('route error provides a working Home recovery link', async ({ page }) => {
  await page.goto('/missing-page');
  await expect(page.getByText('Không tìm thấy trang yêu cầu.')).toBeVisible();
  await page.getByRole('link', { name: 'Thử mở trang chủ lại' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole('heading', { name: 'Chào mừng trở lại' }),
  ).toBeVisible();
});
