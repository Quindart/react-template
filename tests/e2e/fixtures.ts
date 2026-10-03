import { test as base, expect, type Page } from '@playwright/test';
export const test = base.extend<{ browserErrors: string[] }>({
  browserErrors: [
    async ({ context }, use) => {
      const errors: string[] = [];
      const collect = (page: Page) => {
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
          if (
            message.type() === 'error' &&
            /hydrat|server rendered|didn't match/i.test(message.text())
          )
            errors.push(message.text());
        });
      };
      context.pages().forEach(collect);
      context.on('page', collect);
      await use(errors);
      expect(errors).toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };
export async function login(page: Page) {
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('admin');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin123456Aa@');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}
