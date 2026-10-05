import ExcelJS from 'exceljs';
import type { UserRecord } from './user-data';

export async function exportUsers(users: UserRecord[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Users', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  sheet.columns = [
    { header: 'Mã người dùng', key: 'id', width: 18 },
    { header: 'Họ và tên', key: 'name', width: 28 },
    {
      header: 'Số điện thoại',
      key: 'phone',
      width: 20,
      style: { numFmt: '@' },
    },
    { header: 'Email', key: 'email', width: 32 },
    { header: 'Vai trò', key: 'role', width: 20 },
    { header: 'Trạng thái', key: 'status', width: 18 },
  ];
  sheet.addRows(users);
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' },
  };
  sheet.getRow(1).height = 24;
  sheet.autoFilter = { from: 'A1', to: `F${users.length + 1}` };
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `users-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Allow the browser to start reading the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
