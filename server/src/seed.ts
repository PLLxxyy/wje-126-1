import db from './db';
import bcrypt from 'bcryptjs';

export function seedDatabase(): void {
  const existingUser = db.prepare('SELECT id FROM users LIMIT 1').get();
  if (existingUser) {
    console.log('Database already has data, skipping seed');
    return;
  }

  console.log('Seeding database with test data...');

  const hash1 = bcrypt.hashSync('123456', 10);
  const hash2 = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare('INSERT INTO users (username, password_hash, nickname) VALUES (?, ?, ?)');
  const insertOrder = db.prepare(
    'INSERT INTO orders (creator_id, title, shop_name, deadline, estimated_amount, status, total_amount, cost_per_person, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertItem = db.prepare('INSERT INTO order_items (order_id, user_id, item_name, amount) VALUES (?, ?, ?, ?)');

  const seedAll = db.transaction(() => {
    // Users
    insertUser.run('test', hash1, '小明');
    insertUser.run('host', hash2, '阿杰');

    // Order 1: already completed
    const now = new Date();
    const pastDeadline = new Date(now.getTime() - 7200000).toISOString(); // 2 hours ago
    insertOrder.run(
      2,
      '周末奶茶拼单',
      '蜜雪冰城',
      pastDeadline,
      12,
      'completed',
      43,
      14.33,
      new Date(now.getTime() - 3600000).toISOString()
    );

    // Order 2: open (expires in 2 hours)
    const futureDeadline = new Date(now.getTime() + 7200000).toISOString();
    insertOrder.run(2, '文具拼单', '晨光文具店', futureDeadline, 20, 'open', null, null, null);

    // Items for Order 1
    insertItem.run(1, 2, '珍珠奶茶', 10);
    insertItem.run(1, 1, '杨枝甘露', 15);
    insertItem.run(1, 2, '柠檬水', 8);

    // Items for Order 2
    insertItem.run(2, 2, '笔记本3本', 15);
  });

  seedAll();
  console.log('Seed data inserted successfully');
}
