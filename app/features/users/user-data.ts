export type UserRecord = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'Quản trị viên' | 'Biên tập viên' | 'Thành viên' | 'Nhân viên';
  username?: 'employee';
  status: 'Hoạt động' | 'Tạm khóa';
};

const surnames = [
  'Nguyễn',
  'Trần',
  'Lê',
  'Phạm',
  'Hoàng',
  'Vũ',
  'Đặng',
  'Bùi',
  'Đỗ',
  'Hồ',
];
const givenNames = [
  'Minh Anh',
  'Quốc Bảo',
  'Ngọc Châu',
  'Anh Dũng',
  'Thu Hà',
  'Gia Huy',
  'Khánh Linh',
  'Hoàng Nam',
  'Bảo Ngọc',
  'Minh Quân',
];

// Deterministic fixtures keep bookmarks, reloads and exports consistent.
export const mockUsers: UserRecord[] = Array.from(
  { length: 100 },
  (_, index) => ({
    id: `USR-${String(index + 1).padStart(3, '0')}`,
    name: `${surnames[Math.floor(index / 10)]} ${givenNames[index % 10]}`,
    phone: `090${String(index + 1).padStart(7, '0')}`,
    email: `user${String(index + 1).padStart(3, '0')}@example.com`,
    role:
      index % 10 === 0
        ? 'Quản trị viên'
        : index % 3 === 0
          ? 'Biên tập viên'
          : 'Thành viên',
    status: index % 7 === 6 ? 'Tạm khóa' : 'Hoạt động',
  }),
);

export const directoryUsers: UserRecord[] = [
  {
    id: 'EMP-001',
    username: 'employee',
    name: 'employee',
    phone: '—',
    email: 'employee@example.com',
    role: 'Nhân viên',
    status: 'Hoạt động',
  },
  ...mockUsers,
];
