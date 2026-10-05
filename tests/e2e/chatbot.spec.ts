import { test, expect, login } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('button', { name: 'Mở chatbot' })).toHaveCount(0);
  await login(page);
  await page.getByRole('button', { name: 'Đóng thông báo' }).click();
});

test('opens a responsive drawer and quick questions produce replies that survive closing', async ({
  page,
}, testInfo) => {
  const trigger = page.getByRole('button', { name: 'Mở chatbot' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Trợ lý kinh doanh' });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText('Phân tích kết quả kinh doanh với chatbot'),
  ).toBeVisible();
  const width = (await dialog.boundingBox())!.width;
  const viewportWidth = page.viewportSize()!.width;
  expect(width).toBeCloseTo(
    testInfo.project.name === 'mobile'
      ? viewportWidth
      : Math.max(360, viewportWidth / 4),
    0,
  );
  await page.screenshot({
    path: `test-results/chatbot-empty-${testInfo.project.name}.png`,
    animations: 'disabled',
  });
  await dialog
    .getByRole('button', { name: 'Doanh thu 6 tháng thế nào?' })
    .click();
  await expect(dialog.getByRole('status')).toHaveText('Đang trả lời…');
  await expect(dialog.getByRole('log')).toContainText('1.116 triệu đồng');
  await expect(
    dialog.getByText('Phân tích kết quả kinh doanh với chatbot'),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog.getByRole('log')).toContainText('1.116 triệu đồng');
  await page.screenshot({
    path: `test-results/chatbot-messages-${testInfo.project.name}.png`,
    animations: 'disabled',
  });
});

test('long conversations scroll to the latest reply and restore it on reopen', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Mở chatbot' }).click();
  const dialog = page.getByRole('dialog', { name: 'Trợ lý kinh doanh' });
  await dialog
    .getByRole('textbox', { name: 'Tin nhắn' })
    .fill(`don hang ${'nội dung dài '.repeat(150)}`);
  await dialog.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  const reply = dialog.getByText(
    /Theo dữ liệu minh họa tháng 1–6\/2026, có 2.790/,
  );
  await expect(reply).toBeVisible();
  await expect(reply).toBeInViewport();
  const scrollArea = dialog.getByRole('log').locator('..');
  expect(
    await scrollArea.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(true);
  await scrollArea.evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(reply).not.toBeInViewport();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Mở chatbot' }).click();
  await expect(reply).toBeInViewport();
  await expect(
    dialog.getByRole('textbox', { name: 'Tin nhắn' }),
  ).toBeInViewport();
});

test('typed messages, multiline input, empty sends and unknown questions', async ({
  page,
}) => {
  await page.goto('/users');
  await page.getByRole('button', { name: 'Mở chatbot' }).click();
  const dialog = page.getByRole('dialog', { name: 'Trợ lý kinh doanh' });
  const input = dialog.getByRole('textbox', { name: 'Tin nhắn' });
  const send = dialog.getByRole('button', { name: 'Gửi tin nhắn' });
  await input.fill('   ');
  await expect(send).toBeDisabled();
  await input.fill('don hang');
  await input.press('Shift+Enter');
  await expect(input).toHaveValue('don hang\n');
  await input.press('Enter');
  await expect(input).toHaveValue('');
  await expect(send).toBeDisabled();
  await expect(dialog.getByRole('log')).toContainText('2.790 đơn hàng');
  await input.fill('Câu hỏi chưa có dữ liệu');
  await send.click();
  await expect(dialog.getByRole('log')).toContainText(
    'Bạn có thể hỏi về doanh thu, đơn hàng hoặc khách hàng',
  );
});

test('attachments can be removed or sent without text and are explicitly simulated', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Mở chatbot' }).click();
  const dialog = page.getByRole('dialog', { name: 'Trợ lý kinh doanh' });
  const picker = dialog.getByLabel('Chọn tệp đính kèm');
  await picker.setInputFiles([
    {
      name: 'report.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('revenue\n100'),
    },
  ]);
  await expect(dialog.getByText('report.csv', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Bỏ tệp report.csv' }).click();
  await expect(
    dialog.getByRole('button', { name: 'Gửi tin nhắn' }),
  ).toBeDisabled();
  await picker.setInputFiles([
    {
      name: 'report.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('revenue\n100'),
    },
  ]);
  await dialog.getByRole('button', { name: 'Gửi tin nhắn' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Mở chatbot' }).click();
  await expect(dialog.getByRole('log')).toContainText('report.csv');
  await expect(dialog.getByRole('log')).toContainText(
    'chưa đọc hoặc phân tích nội dung tệp',
  );
  await expect(
    dialog.getByRole('button', { name: 'Bỏ tệp report.csv' }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
