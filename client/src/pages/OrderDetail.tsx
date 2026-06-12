import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter, useAuth, useCountdown } from '../App';
import Header from './Header';
import api from '../api';
import { AxiosError } from 'axios';

interface OrderItem {
  id: number;
  order_id: number;
  user_id: number;
  item_name: string;
  amount: number;
  username: string;
  nickname: string;
}

interface OrderDetail {
  id: number;
  title: string;
  shop_name: string;
  deadline: string;
  estimated_amount: number;
  status: string;
  total_amount: number | null;
  cost_per_person: number | null;
  completed_at: string | null;
  creator_id: number;
  creator_username: string;
  creator_nickname: string;
  participant_count: number;
  current_total: number;
  items: OrderItem[];
}

const s = {
  back: {
    fontSize: 14, color: '#666', cursor: 'pointer', marginBottom: 16, display: 'inline-block',
  },
  card: {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 4 },
  shopRow: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#666', marginBottom: 16,
  },
  tag: (status: string) => ({
    fontSize: 12, padding: '3px 10px', borderRadius: 20,
    background: status === 'open' ? '#e8f5e9' : '#fff3e0',
    color: status === 'open' ? '#2e7d32' : '#e65100', fontWeight: 500,
  }),
  infoGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16,
  },
  infoItem: { fontSize: 14, color: '#555' },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: 600, color: '#333' },
  countdownBox: {
    textAlign: 'center' as const, padding: '12px 0', marginBottom: 16,
    background: '#fff8e1', borderRadius: 8,
  },
  countdownText: (urgent: boolean) => ({
    fontSize: 20, fontWeight: 700, color: urgent ? '#e74c3c' : '#f57c00',
  }),
  countdownLabel: { fontSize: 13, color: '#999', marginTop: 4 },
  sectionTitle: {
    fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12,
    display: 'flex', alignItems: 'center', gap: 6,
  },
  participantCard: {
    padding: '14px 16px', marginBottom: 8, borderRadius: 10,
    border: '1px solid #f0f0f0', background: '#fafafa',
  },
  participantHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  avatar: {
    width: 28, height: 28, borderRadius: '50%', background: '#e3f2fd', color: '#1a73e8',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 600, marginRight: 8,
  },
  participantName: { fontSize: 14, fontWeight: 500, color: '#333' },
  participantAmount: { fontSize: 14, fontWeight: 600, color: '#1a73e8' },
  itemTag: {
    fontSize: 12, padding: '3px 10px', background: '#f0f0f0', borderRadius: 12,
    color: '#555', marginLeft: 8,
  },
  summary: {
    background: '#e8f5e9', borderRadius: 10, padding: 20, marginBottom: 16, textAlign: 'center' as const,
  },
  summaryLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  summaryAmount: { fontSize: 32, fontWeight: 700, color: '#2e7d32' },
  summaryTotal: { fontSize: 14, color: '#999', marginTop: 8 },
  joinBtn: {
    width: '100%', padding: '14px', background: '#1a73e8', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 16, fontWeight: 600, marginBottom: 16,
  },
  completeBtn: {
    width: '100%', padding: '14px', background: '#2e7d32', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 16, fontWeight: 600, marginBottom: 16,
  },
  joinForm: { marginBottom: 16 },
  joinFormTitle: { fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 12 },
  joinFormRow: {
    display: 'flex', gap: 8, marginBottom: 8,
  },
  joinInput: {
    flex: 1, padding: '10px 14px', border: '1px solid #e0e0e0', borderRadius: 8,
    fontSize: 14, outline: 'none',
  },
  joinSubmit: {
    padding: '10px 20px', background: '#1a73e8', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' as const,
  },
  error: {
    color: '#e74c3c', fontSize: 14, padding: '8px 12px', background: '#fdf0ef',
    borderRadius: 6, marginBottom: 12,
  },
  empty: { textAlign: 'center' as const, padding: 20, color: '#999', fontSize: 14 },
  loading: { textAlign: 'center' as const, padding: 40, color: '#999' },
};

export default function OrderDetail({ orderId }: { orderId: number }) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [totalAmount, setTotalAmount] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrder = () => {
    api.get(`/orders/${orderId}`)
      .then((res) => setOrder(res.data))
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!itemName.trim() || !amount || Number(amount) <= 0) {
      setError('请填写商品名和有效金额');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/join`, { item_name: itemName.trim(), amount: Number(amount) });
      setShowJoin(false);
      setItemName('');
      setAmount('');
      fetchOrder();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || '加入失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError('请输入有效的总金额');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/orders/${orderId}/complete`, { total_amount: Number(totalAmount) });
      setShowComplete(false);
      setTotalAmount('');
      fetchOrder();
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return React.createElement(React.Fragment, null,
    React.createElement(Header, null),
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { style: s.loading }, '加载中...')
    )
  );

  if (!order) return React.createElement(React.Fragment, null,
    React.createElement(Header, null),
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { style: s.empty }, '拼单不存在')
    )
  );

  const isCreator = user?.id === order.creator_id;
  const isOpen = order.status === 'open';
  const isCompleted = order.status === 'completed';

  // Group items by user
  const userMap = new Map<number, { nickname: string; username: string; items: OrderItem[]; total: number }>();
  for (const item of order.items) {
    const existing = userMap.get(item.user_id);
    if (existing) {
      existing.items.push(item);
      existing.total += item.amount;
    } else {
      userMap.set(item.user_id, {
        nickname: item.nickname,
        username: item.username,
        items: [item],
        total: item.amount,
      });
    }
  }

  return React.createElement(React.Fragment, null,
    React.createElement(Header, null),
    React.createElement('div', { className: 'page-container' },
      React.createElement('span', {
        style: s.back,
        onClick: () => navigate('/'),
      }, '← 返回首页'),

      // Order info card
      React.createElement('div', { style: s.card },
        React.createElement('div', { style: s.title }, order.title),
        React.createElement('div', { style: s.shopRow },
          React.createElement('span', null, '\u{1F3EA} ', order.shop_name),
          React.createElement('span', { style: s.tag(order.status) },
            isOpen ? '进行中' : '已完成'
          ),
        ),
        React.createElement('div', { style: s.infoGrid },
          React.createElement('div', { style: s.infoItem },
            React.createElement('div', { style: s.infoLabel }, '发起人'),
            React.createElement('div', { style: s.infoValue }, order.creator_nickname),
          ),
          React.createElement('div', { style: s.infoItem },
            React.createElement('div', { style: s.infoLabel }, '参与人数'),
            React.createElement('div', { style: s.infoValue }, order.participant_count, ' 人'),
          ),
          React.createElement('div', { style: s.infoItem },
            React.createElement('div', { style: s.infoLabel }, '每人预估'),
            React.createElement('div', { style: s.infoValue }, '¥', order.estimated_amount.toFixed(2)),
          ),
          React.createElement('div', { style: s.infoItem },
            React.createElement('div', { style: s.infoLabel }, '当前合计'),
            React.createElement('div', { style: s.infoValue }, '¥', order.current_total.toFixed(2)),
          ),
        ),
        isOpen && React.createElement(OrderCountdown, { deadline: order.deadline }),
      ),

      // Completion summary
      isCompleted && order.cost_per_person != null && React.createElement('div', { style: s.summary },
        React.createElement('div', { style: s.summaryLabel }, '每人应付'),
        React.createElement('div', { style: s.summaryAmount }, '¥', order.cost_per_person.toFixed(2)),
        React.createElement('div', { style: s.summaryTotal },
          '总金额 ¥', order.total_amount?.toFixed(2), '  ÷  ', order.participant_count, '人'
        ),
      ),

      // Action buttons
      isOpen && !isCreator && !showJoin && React.createElement('button', {
        style: s.joinBtn,
        onClick: () => setShowJoin(true),
      }, '\u{1F64B} 我要加入拼单'),

      isOpen && isCreator && !showComplete && React.createElement('button', {
        style: s.completeBtn,
        onClick: () => setShowComplete(true),
      }, '✅ 标记拼单完成'),

      // Join form
      showJoin && React.createElement('div', { style: { ...s.card, ...s.joinForm } },
        React.createElement('div', { style: s.joinFormTitle }, '\u{1F64B} 加入拼单'),
        error && React.createElement('div', { style: s.error }, error),
        React.createElement('form', { onSubmit: handleJoin },
          React.createElement('div', { style: s.joinFormRow },
            React.createElement('input', {
              style: s.joinInput, placeholder: '你要买什么？',
              value: itemName,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setItemName(e.target.value),
            }),
            React.createElement('input', {
              style: s.joinInput, type: 'number', step: '0.01', min: '0.01',
              placeholder: '金额',
              value: amount,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value),
            }),
          ),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('button', {
              style: { ...s.joinSubmit, background: '#666' },
              type: 'button',
              onClick: () => { setShowJoin(false); setError(''); },
            }, '取消'),
            React.createElement('button', {
              style: { ...s.joinSubmit, ...(submitting ? { opacity: 0.6 } : {}) },
              type: 'submit', disabled: submitting,
            }, submitting ? '提交中...' : '确认加入'),
          )
        ),
      ),

      // Complete form
      showComplete && React.createElement('div', { style: { ...s.card, ...s.joinForm } },
        React.createElement('div', { style: s.joinFormTitle }, '✅ 完成拼单'),
        React.createElement('div', { style: { fontSize: 13, color: '#999', marginBottom: 12 } },
          '请输入实际总金额（含配送费等），系统将自动计算每人应付金额'
        ),
        error && React.createElement('div', { style: s.error }, error),
        React.createElement('form', { onSubmit: handleComplete },
          React.createElement('div', { style: { ...s.joinFormRow, marginBottom: 12 } },
            React.createElement('input', {
              style: s.joinInput, type: 'number', step: '0.01', min: '0.01',
              placeholder: '实际总金额',
              value: totalAmount,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTotalAmount(e.target.value),
            }),
          ),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('button', {
              style: { ...s.joinSubmit, background: '#666' },
              type: 'button',
              onClick: () => { setShowComplete(false); setError(''); },
            }, '取消'),
            React.createElement('button', {
              style: { ...s.joinSubmit, background: '#2e7d32', ...(submitting ? { opacity: 0.6 } : {}) },
              type: 'submit', disabled: submitting,
            }, submitting ? '提交中...' : '确认完成'),
          )
        ),
      ),

      // Participants list
      React.createElement('div', { style: s.card },
        React.createElement('div', { style: s.sectionTitle },
          '\u{1F465} 参与明细（', order.participant_count, '人）'
        ),
        order.items.length === 0
          ? React.createElement('div', { style: s.empty }, '还没有人加入，快分享给室友吧！')
          : React.createElement('div', null,
              ...Array.from(userMap.entries()).map(([userId, data]) =>
                React.createElement('div', { key: userId, style: s.participantCard },
                  React.createElement('div', { style: s.participantHeader },
                    React.createElement('div', { style: { display: 'flex', alignItems: 'center' } },
                      React.createElement('span', { style: s.avatar }, data.nickname[0]),
                      React.createElement('span', { style: s.participantName }, data.nickname),
                      userId === order.creator_id && React.createElement('span', {
                        style: {
                          fontSize: 11, padding: '1px 6px', background: '#e3f2fd', color: '#1a73e8',
                          borderRadius: 4, marginLeft: 6,
                        },
                      }, '发起人'),
                    ),
                    React.createElement('span', { style: s.participantAmount },
                      '¥', data.total.toFixed(2)
                    ),
                  ),
                  React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap' as const, gap: 6 } },
                    ...data.items.map((item) =>
                      React.createElement('span', { key: item.id, style: s.itemTag },
                        item.item_name, ' ¥', item.amount.toFixed(2)
                      )
                    )
                  )
                )
              )
            )
      )
    )
  );
}

function OrderCountdown({ deadline }: { deadline: string }) {
  const { text, expired } = useCountdown(deadline);
  return React.createElement('div', { style: s.countdownBox },
    React.createElement('div', { style: s.countdownText(expired) },
      expired ? '⏰ 已截止' : `⏰ ${text}`
    ),
    React.createElement('div', { style: s.countdownLabel },
      expired ? '拼单已截止，等待发起人完成' : '距离截止还剩'
    ),
  );
}
