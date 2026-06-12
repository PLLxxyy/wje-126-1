import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { getJwtSecret } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response): void => {
  const { username, password, nickname } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  if (username.length < 2 || username.length > 20) {
    res.status(400).json({ error: '用户名长度应为2-20个字符' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: '密码长度不能少于6位' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    res.status(400).json({ error: '用户名已存在' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)').run(
    username,
    passwordHash,
    nickname || username
  );

  res.status(201).json({
    message: '注册成功',
    user: { id: result.lastInsertRowid, username, nickname: nickname || username },
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const user = db.prepare('SELECT id, username, password_hash, nickname FROM users WHERE username = ?').get(
    username
  ) as { id: number; username: string; password_hash: string; nickname: string } | undefined;

  if (!user) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    getJwtSecret(),
    { expiresIn: '7d' }
  );

  res.json({
    message: '登录成功',
    token,
    user: { id: user.id, username: user.username, nickname: user.nickname },
  });
});

export default router;
