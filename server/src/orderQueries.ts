export interface OrderListQuery {
  query: string;
  params: string[];
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildOrderListQuery(status: unknown, search: unknown): OrderListQuery {
  const normalizedStatus = normalize(status);
  const normalizedSearch = normalize(search);
  const hasStatus = normalizedStatus === 'open' || normalizedStatus === 'completed';

  let query = `
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname,
      (SELECT COUNT(DISTINCT user_id) FROM order_items WHERE order_id = o.id) as participant_count,
      (SELECT COALESCE(SUM(amount), 0) FROM order_items WHERE order_id = o.id) as current_total
    FROM orders o
    JOIN users u ON o.creator_id = u.id
  `;

  const params: string[] = [];
  const whereClauses: string[] = [];

  if (hasStatus) {
    whereClauses.push('o.status = ?');
    params.push(normalizedStatus);
  }

  if (normalizedSearch) {
    whereClauses.push('(o.shop_name LIKE ? OR o.title LIKE ?)');
    const searchTerm = `%${normalizedSearch}%`;
    params.push(searchTerm, searchTerm);
  }

  if (whereClauses.length > 0) {
    query += ' WHERE ' + whereClauses.join(' AND ');
  }

  if (normalizedStatus === 'open') {
    query += ' ORDER BY o.deadline ASC';
  } else {
    query += ' ORDER BY o.completed_at DESC, o.created_at DESC';
  }

  return { query, params };
}
