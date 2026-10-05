import { test, expect, login } from './fixtures';
import type { Page } from '@playwright/test';

async function loginEmployee(page: Page) {
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('employee');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('employee123456Aa@');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
}

test('employee sees Home and cannot open Users, including after reload', async ({
  page,
}) => {
  await page.goto('/login');
  await loginEmployee(page);
  await expect(page).toHaveURL(/\/home$/);
  await expect(
    page.getByRole('heading', { name: 'Xin chào, employee!' }),
  ).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Chào mừng employee!');
  await expect(
    page.getByRole('link', { name: 'Quản lý người dùng' }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Xin chào, employee!' }),
  ).toBeVisible();
  for (const path of [
    '/users',
    '/Users',
    '/USERS',
    '/users/',
    '/users//',
    '/%75sers',
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/home$/);
    await expect(page.getByRole('table')).toHaveCount(0);
  }
});

test('admin disables employee, revokes an open session, and reactivates the account', async ({
  page,
  context,
}) => {
  await page.goto('/login');
  await login(page);
  await page.goto('/users');
  await expect(
    page.getByRole('columnheader', { name: 'Action', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Tài khoản đăng nhập' }),
  ).toHaveCount(0);
  const accounts = page
    .getByRole('row', { includeHidden: true })
    .filter({ has: page.getByText('employee', { exact: true }) });
  await expect(accounts.getByText('employee', { exact: true })).toBeVisible();

  // Each tab retains its current in-memory identity while sharing account status.
  const employee = await context.newPage();
  await employee.goto('/login');
  await employee.getByRole('button', { name: 'Menu tài khoản' }).click();
  await employee
    .getByRole('menuitem', { name: 'Đăng xuất', exact: true })
    .click();
  await loginEmployee(employee);
  await expect(employee).toHaveURL(/\/home$/);
  await accounts.getByRole('button', { name: 'Vô hiệu hóa employee' }).click();
  const modal = page.getByRole('dialog');
  await expect(modal).toContainText(
    'Có chắc chắn muốn vô hiệu hóa tài khoản không?',
  );
  await expect(
    modal.getByRole('button', { name: 'Hủy', exact: true }),
  ).toBeFocused();
  await expect(accounts.getByText('Hoạt động', { exact: true })).toBeVisible();
  await expect(employee).toHaveURL(/\/home$/);
  await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(accounts.getByText('Hoạt động', { exact: true })).toBeVisible();
  await accounts.getByRole('button', { name: 'Vô hiệu hóa employee' }).click();
  await page.keyboard.press('Escape');
  await expect(modal).toHaveCount(0);
  await expect(
    accounts.getByRole('button', { name: 'Vô hiệu hóa employee' }),
  ).toBeFocused();
  await accounts.getByRole('button', { name: 'Vô hiệu hóa employee' }).click();
  await modal.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(employee).toHaveURL(/\/login$/);
  await expect(accounts.getByText('Tạm khóa', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await login(page);
  await page.goto('/users');
  await expect(accounts.getByText('Tạm khóa', { exact: true })).toBeVisible();
  await loginEmployee(employee);
  await expect(employee.locator('form').getByRole('alert')).toContainText(
    'Tài khoản đã bị vô hiệu hóa',
  );
  await expect(employee).toHaveURL(/\/login$/);
  await accounts.getByRole('button', { name: 'Kích hoạt employee' }).click();
  await expect(modal).toContainText(
    'Có chắc chắn muốn kích hoạt tài khoản không?',
  );
  await modal.getByRole('button', { name: 'Hủy', exact: true }).click();
  await expect(accounts.getByText('Tạm khóa', { exact: true })).toBeVisible();
  await accounts.getByRole('button', { name: 'Kích hoạt employee' }).click();
  await modal.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(accounts.getByText('Hoạt động', { exact: true })).toBeVisible();
  await loginEmployee(employee);
  await expect(employee).toHaveURL(/\/home$/);
});
