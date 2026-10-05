import { mockUsers } from './user-data';

export const pageSizes = [5, 10, 20, 50];

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function queryUsers(params: URLSearchParams) {
  const searchKey = (params.get('search_key') ?? '').trim();
  const key = normalize(searchKey);
  const phoneKey = key.replace(/[\s().+-]/g, '');
  const filtered = mockUsers.filter(
    (user) =>
      [user.name, user.email, user.id].some((value) =>
        normalize(value).includes(key),
      ) ||
      (/^\d+$/.test(phoneKey) && user.phone.includes(phoneKey)),
  );
  const requestedLimit = Number(params.get('limit'));
  const limit = pageSizes.includes(requestedLimit) ? requestedLimit : 10;
  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const requestedPage = Number(params.get('page'));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
  const rows = filtered.slice((page - 1) * limit, page * limit);
  return { rows, filtered, total, page, limit, pageCount, searchKey };
}
