import { Router, Response } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/me - get current user profile and order history
router.get('/me', authMiddleware, (req: AuthRequest, res: Response): void => {
  const userId = req.user!.userId;

  const user = db.prepare('SELECT id, username, nickname, created_at FROM users WHERE id = ?').get(userId);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }

  // Orders I created
  const myOrders = db.prepare(`
    SELECT o.*, u.username as creator_username, u.nickname as creator_nickname,
      (SELECT COUNT(DISTINCT user_id) FROM order_items WHERE order_id = o.id) as participant_count,
      (SELECT COALESCE(SUM(amount), 0) FROM order_items WHERE order_id = o.id) as current_total
    FROM orders o
    JOIN users u ON o.creator_id = u.id
    WHERE o.creator_id = ?
    ORDER BY o.created_at DESC
  `).all(userId);

  // Orders I participated in (but didn't create)
  const joinedOrders = db.prepare(`
    SELECT DISTINCT o.*, u.username as creator_username, u.nickname as creator_nickname,
      (SELECT COUNT(DISTINCT user_id) FROM order_items WHERE order_id = o.id) as participant_count,
      (SELECT COALESCE(SUM(amount), 0) FROM order_items WHERE order_id = o.id) as current_total
    FROM orders o
    JOIN users u ON o.creator_id = u.id
    JOIN order_items oi ON oi.order_id = o.id
    WHERE oi.user_id = ? AND o.creator_id != ?
    ORDER BY o.created_at DESC
  `).all(userId, userId);

  res.json({
    user,
    my_orders: myOrders,
    joined_orders: joinedOrders,
  });
});

export default router;
