export type AssistantIntent =
  | { type: 'home' }
  | { type: 'users' }
  | { type: 'search-users'; query: string }
  | { type: 'export-users'; query: string }
  | { type: 'question'; text: string };

function normalizeIntent(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseAssistantIntent(text: string): AssistantIntent {
  const normalized = normalizeIntent(text);

  if (/^(mo|den|di toi|quay lai) (trang chu|home|tong quan)$/.test(normalized))
    return { type: 'home' };

  if (
    /^(mo|den|di toi) (trang )?(quan ly )?(nguoi dung|users?)$/.test(normalized)
  )
    return { type: 'users' };

  const exportMatch = text.match(
    /^\s*(?:xuất|xuat|tải|tai)(?:\s+(?:xuống|xuong|excel))?\s+(?:danh\s+sách\s+)?(?:người\s+dùng|nguoi\s+dung|users?)(?:\s+(.*))?\s*$/i,
  );
  if (exportMatch)
    return { type: 'export-users', query: exportMatch[1]?.trim() ?? '' };

  const searchMatch = text.match(
    /^\s*(?:tìm|tim|lọc|loc|liệt kê|liet ke|danh sách|danh sach)\s+(?:người\s+dùng|nguoi\s+dung|users?|khách\s+hàng|khach\s+hang)(?:\s+(.*))?\s*$/i,
  );
  if (searchMatch) {
    return { type: 'search-users', query: searchMatch[1]?.trim() ?? '' };
  }

  return { type: 'question', text: text.trim() };
}
