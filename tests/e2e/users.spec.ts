import ExcelJS from 'exceljs';
import { test, expect, login } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await login(page);
});

test('search, pagination and browser history stay synchronized with the URL', async ({
  page,
}) => {
  await page.goto('/users');
  await expect(
    page.getByRole('heading', { name: 'Quản lý người dùng' }),
  ).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(10);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page).toHaveURL(/page=2&limit=10/);
  await expect(page.locator('tbody tr').first()).toContainText('USR-011');
  await page
    .getByRole('searchbox', { name: 'Tìm kiếm người dùng' })
    .fill('nguyen');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page).toHaveURL(/page=1&limit=10&search_key=nguyen/);
  await page.getByLabel('Số dòng mỗi trang').selectOption('5');
  await expect(page).toHaveURL(/page=1&limit=5&search_key=nguyen/);
  await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
  await expect(page.locator('tbody tr').first()).toContainText('USR-006');
  await page.reload();
  await expect(
    page.getByRole('searchbox', { name: 'Tìm kiếm người dùng' }),
  ).toHaveValue('nguyen');
  await expect(page.getByLabel('Số dòng mỗi trang')).toHaveValue('5');
  await expect(page.locator('tbody tr')).toHaveCount(5);
  await page.goBack();
  await expect(page).toHaveURL(/page=1&limit=5&search_key=nguyen/);
  await expect(page.locator('tbody tr').first()).toContainText('USR-001');
  await page.goForward();
  await expect(page.locator('tbody tr').first()).toContainText('USR-006');
  await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click();
  await expect(page).toHaveURL(/\/users\?page=1&limit=5$/);
  await expect(
    page.getByRole('searchbox', { name: 'Tìm kiếm người dùng' }),
  ).toHaveValue('');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/users-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test('deep links normalize invalid pages and display empty results', async ({
  page,
}) => {
  await page.goto('/users?page=999&limit=5&search_key=user001%40example.com');
  await expect(page).toHaveURL(/page=1&limit=5/);
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('user001@example.com');
  await page.goto('/users?page=0&limit=oops');
  await expect(page).toHaveURL(/page=1&limit=10/);
  await page
    .getByRole('searchbox', { name: 'Tìm kiếm người dùng' })
    .fill('no-such-person');
  await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click();
  await expect(page.getByText('Không tìm thấy người dùng')).toBeVisible();
  await expect(page.getByRole('button', { name: /Xuất Excel/ })).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Trang sau', exact: true }),
  ).toBeDisabled();
});

test('Excel download contains all filtered users, preserving phone strings', async ({
  page,
}) => {
  await page.goto('/users?page=2&limit=5&search_key=nguyen');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Xuất Excel/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await download.path())!);
  const sheet = workbook.getWorksheet('Users')!;
  expect(sheet.rowCount).toBe(11);
  expect(sheet.getCell('A2').value).toBe('USR-001');
  expect(sheet.getCell('C2').value).toBe('0900000001');
  expect(sheet.getCell('A11').value).toBe('USR-010');
});
