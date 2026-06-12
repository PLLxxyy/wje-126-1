import assert from 'assert/strict';
import Database from 'better-sqlite3';
import { buildOrderListQuery } from '../orderQueries';

type TestOrder = {
  id: number;
  title: string;
  shop_name: string;
  status: string;
};

const db = new Database(':memory:');

function setupSchema(): void {
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      shop_name TEXT NOT NULL,
      deadline TEXT NOT NULL,
      estimated_amount REAL NOT NULL,
      status TEXT DEFAULT 'open',
      total_amount REAL,
      cost_per_person REAL,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function setupData(): void {
  db.prepare('INSERT INTO users (id, username, password_hash, nickname) VALUES (?, ?, ?, ?)').run(
    1,
    'host',
    'hash',
    '阿杰',
  );

  const insertOrder = db.prepare(`
    INSERT INTO orders
      (id, creator_id, title, shop_name, deadline, estimated_amount, status, total_amount, cost_per_person, completed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run(1, 1, '周末奶茶拼单', '蜜雪冰城', '2026-06-12T12:00:00.000Z', 50, 'open', null, null, null, '2026-06-12 09:00:00');
  insertOrder.run(2, 1, '奶茶下午茶', '喜茶', '2026-06-12T13:00:00.000Z', 80, 'open', null, null, null, '2026-06-12 10:00:00');
  insertOrder.run(3, 1, '文具拼单', '晨光文具店', '2026-06-12T11:00:00.000Z', 30, 'completed', 30, 30, '2026-06-12 11:00:00', '2026-06-12 08:00:00');
  insertOrder.run(4, 1, '奶茶分享', '蜜雪冰城', '2026-06-12T10:00:00.000Z', 40, 'completed', 40, 40, '2026-06-12 12:00:00', '2026-06-12 07:00:00');
  insertOrder.run(5, 1, '水果拼单', '百果园', '2026-06-12T14:00:00.000Z', 60, 'open', null, null, null, '2026-06-12 06:00:00');
}

function listOrders(status?: string, search?: string): TestOrder[] {
  const { query, params } = buildOrderListQuery(status, search);
  return db.prepare(query).all(...params) as TestOrder[];
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

setupSchema();
setupData();

test('search by shop name returns matching open and completed orders', () => {
  const results = listOrders(undefined, '蜜雪冰城');

  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((order) => order.status).sort(),
    ['completed', 'open'],
  );
});

test('search by title keyword returns matching open and completed orders', () => {
  const results = listOrders(undefined, '奶茶');

  assert.equal(results.length, 3);
  assert.deepEqual(
    results.map((order) => order.status).sort(),
    ['completed', 'open', 'open'],
  );
});

test('status tabs still filter orders when no search keyword is provided', () => {
  const results = listOrders('open');

  assert.equal(results.length, 3);
  assert.ok(results.every((order) => order.status === 'open'));
});

test('status and search can still be combined by explicit callers', () => {
  const results = listOrders('completed', '奶茶');

  assert.equal(results.length, 1);
  assert.equal(results[0].status, 'completed');
  assert.equal(results[0].title, '奶茶分享');
});

test('unknown search keyword returns an empty result set', () => {
  const results = listOrders(undefined, '不存在的店铺');

  assert.deepEqual(results, []);
});
