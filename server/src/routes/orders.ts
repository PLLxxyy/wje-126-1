import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/orders - list orders with optional status filter
router.get('/', (req: AuthRequest, res: Response): void => {
  const status = req.query.status as string;

  let query = `
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname,
      (SELECT COUNT(DISTINCT user_id) FROM order_items WHERE order_id = o.id) as participant_count,
      (SELECT COALESCE(SUM(amount), 0) FROM order_items WHERE order_id = o.id) as current_total
    FROM orders o
    JOIN users u ON o.creator_id = u.id
  `;

  const params: string[] = [];
  if (status === 'open' || status === 'completed') {
    query += ' WHERE o.status = ?';
    params.push(status);
  }

  query += status === 'open' ? ' ORDER BY o.deadline ASC' : ' ORDER BY o.completed_at DESC, o.created_at DESC';

  const orders = db.prepare(query).all(...params);
  res.json(orders);
});

// POST /api/orders - create new order (auth required)
router.post('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const { title, shop_name, deadline, estimated_amount } = req.body;

  if (!title || !shop_name || !deadline || !estimated_amount) {
    res.status(400).json({ error: '请填写完整的拼单信息' });
    return;
  }

  if (Number(estimated_amount) <= 0) {
    res.status(400).json({ error: '预估金额必须大于0' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO orders (creator_id, title, shop_name, deadline, estimated_amount) VALUES (?, ?, ?, ?, ?)'
  ).run(req.user!.userId, title, shop_name, deadline, Number(estimated_amount));

  const order = db.prepare(`
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname,
      0 as participant_count, 0 as current_total
    FROM orders o
    JOIN users u ON o.creator_id = u.id
    WHERE o.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(order);
});

// GET /api/orders/:id - order detail with items
router.get('/:id', (req: AuthRequest, res: Response): void => {
  const orderId = Number(req.params.id);

  const order = db.prepare(`
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname
    FROM orders o
    JOIN users u ON o.creator_id = u.id
    WHERE o.id = ?
  `).get(orderId) as Record<string, unknown> | undefined;

  if (!order) {
    res.status(404).json({ error: '拼单不存在' });
    return;
  }

  const items = db.prepare(`
    SELECT oi.*, u.username, u.nickname
    FROM order_items oi
    JOIN users u ON oi.user_id = u.id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at ASC
  `).all(orderId);

  const participantCount = db.prepare(
    'SELECT COUNT(DISTINCT user_id) as count FROM order_items WHERE order_id = ?'
  ).get(orderId) as { count: number };

  const currentTotal = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) as total FROM order_items WHERE order_id = ?'
  ).get(orderId) as { total: number };

  res.json({
    ...order,
    items,
    participant_count: participantCount.count,
    current_total: currentTotal.total,
  });
});

// POST /api/orders/:id/join - join an order (auth required)
router.post('/:id/join', authMiddleware, (req: AuthRequest, res: Response): void => {
  const orderId = Number(req.params.id);
  const { item_name, amount } = req.body;

  if (!item_name || !amount) {
    res.status(400).json({ error: '请填写商品名和金额' });
    return;
  }

  if (Number(amount) <= 0) {
    res.status(400).json({ error: '金额必须大于0' });
    return;
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown> | undefined;

  if (!order) {
    res.status(404).json({ error: '拼单不存在' });
    return;
  }

  if (order.status !== 'open') {
    res.status(400).json({ error: '该拼单已结束，无法加入' });
    return;
  }

  if (order.creator_id === req.user!.userId) {
    res.status(400).json({ error: '你是发起人，不能加入自己的拼单' });
    return;
  }

  db.prepare('INSERT INTO order_items (order_id, user_id, item_name, amount) VALUES (?, ?, ?, ?)').run(
    orderId,
    req.user!.userId,
    item_name,
    Number(amount)
  );

  const updatedOrder = db.prepare(`
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname,
      (SELECT COUNT(DISTINCT user_id) FROM order_items WHERE order_id = o.id) as participant_count,
      (SELECT COALESCE(SUM(amount), 0) FROM order_items WHERE order_id = o.id) as current_total
    FROM orders o
    JOIN users u ON o.creator_id = u.id
    WHERE o.id = ?
  `).get(orderId);

  res.json(updatedOrder);
});

// PATCH /api/orders/:id/complete - mark order as completed (creator only)
router.patch('/:id/complete', authMiddleware, (req: AuthRequest, res: Response): void => {
  const orderId = Number(req.params.id);
  const { total_amount } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown> | undefined;

  if (!order) {
    res.status(404).json({ error: '拼单不存在' });
    return;
  }

  if (order.creator_id !== req.user!.userId) {
    res.status(403).json({ error: '只有发起人才能完成拼单' });
    return;
  }

  if (order.status !== 'open') {
    res.status(400).json({ error: '该拼单已结束' });
    return;
  }

  if (!total_amount || Number(total_amount) <= 0) {
    res.status(400).json({ error: '请输入实际总金额' });
    return;
  }

  const participantCount = db.prepare(
    'SELECT COUNT(DISTINCT user_id) as count FROM order_items WHERE order_id = ?'
  ).get(orderId) as { count: number };

  const total = Number(total_amount);
  const count = participantCount.count || 1;
  const costPerPerson = Math.round((total / count) * 100) / 100;

  db.prepare(
    "UPDATE orders SET status = 'completed', total_amount = ?, cost_per_person = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(total, costPerPerson, orderId);

  const updatedOrder = db.prepare(`
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname
    FROM orders o
    JOIN users u ON o.creator_id = u.id
    WHERE o.id = ?
  `).get(orderId) as Record<string, unknown> | undefined;

  if (!updatedOrder) {
    res.status(404).json({ error: '拼单不存在' });
    return;
  }

  const items = db.prepare(`
    SELECT oi.*, u.username, u.nickname
    FROM order_items oi
    JOIN users u ON oi.user_id = u.id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at ASC
  `).all(orderId);

  res.json({
    ...updatedOrder,
    items,
    participant_count: participantCount.count,
    current_total: total,
  });
});

export default router;
