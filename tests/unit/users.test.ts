import { describe, expect, it } from 'vitest';
import { mockUsers } from '~/features/users/user-data';
import { queryUsers } from '~/features/users/user-query';

describe('user directory query', () => {
  it('paginates employee and 100 demo users without duplicates between pages', () => {
    const first = queryUsers(new URLSearchParams());
    const second = queryUsers(new URLSearchParams('page=2&limit=10'));
    expect(first.total).toBe(101);
    expect(new Set(mockUsers.map((user) => user.id)).size).toBe(100);
    expect(first.rows).toHaveLength(10);
    expect(second.rows).toHaveLength(10);
    expect(first.rows[0].username).toBe('employee');
    expect(second.rows[0].id).toBe('USR-010');
  });

  it.each([
    ['  NGUYEN  ', 10],
    ['Nguyễn', 10],
    ['dang', 10],
    ['user001@example.com', 1],
    ['090 000 0001', 1],
    ['not-a-real-user', 0],
    ['employee', 1],
  ])('searches names, email and phone: %s', (key, count) => {
    const result = queryUsers(new URLSearchParams({ search_key: key }));
    expect(result.total).toBe(count);
  });

  it('filters before pagination and retains every matching row for export', () => {
    const result = queryUsers(
      new URLSearchParams('search_key=nguyen&page=2&limit=5'),
    );
    expect(result.total).toBe(10);
    expect(result.filtered).toHaveLength(10);
    expect(result.rows.map((user) => user.id)).toEqual([
      'USR-006',
      'USR-007',
      'USR-008',
      'USR-009',
      'USR-010',
    ]);
  });

  it.each([
    'page=-1&limit=0',
    'page=abc&limit=abc',
    'page=1.5&limit=999',
    'page=Infinity&limit=-10',
  ])('falls back for malformed pagination: %s', (query) => {
    const result = queryUsers(new URLSearchParams(query));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('clamps pages after filtering, including empty results', () => {
    expect(queryUsers(new URLSearchParams('page=999&limit=5')).page).toBe(21);
    const empty = queryUsers(
      new URLSearchParams('page=999&search_key=missing-user'),
    );
    expect(empty.page).toBe(1);
    expect(empty.rows).toEqual([]);
  });
});
