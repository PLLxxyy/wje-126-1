import React, { useState, useEffect } from 'react';
import { useRouter, useCountdown } from '../App';
import Header from './Header';
import api from '../api';

interface Order {
  id: number;
  title: string;
  shop_name: string;
  deadline: string;
  status: string;
  total_amount: number | null;
  cost_per_person: number | null;
  creator_nickname: string;
  participant_count: number;
  current_total: number;
}

const s = {
  section: { marginBottom: 20 },
  userCard: {
    background: '#fff', borderRadius: 12, padding: '24px 20px', marginBottom: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 700,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 700, color: '#333' },
  userId: { fontSize: 13, color: '#999', marginTop: 2 },
  tabs: {
    display: 'flex', gap: 0, marginBottom: 16,
    background: '#e8e8e8', borderRadius: 10, padding: 4,
  },
  tab: (active: boolean) => ({
    flex: 1, padding: '10px 16px', textAlign: 'center' as const, borderRadius: 8,
    fontSize: 14, fontWeight: active ? 600 : 400, cursor: 'pointer', border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a73e8' : '#666',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
  }),
  card: {
    background: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
  },
  cardTitle: { fontSize: 15, fontWeight: 600, color: '#333' },
  cardRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8,
  },
  cardShop: { fontSize: 13, color: '#888' },
  tag: (status: string) => ({
    fontSize: 11, padding: '2px 8px', borderRadius: 20,
    background: status === 'open' ? '#e8f5e9' : '#f5f5f5',
    color: status === 'open' ? '#2e7d32' : '#999',
  }),
  countdown: (urgent: boolean) => ({
    fontSize: 12, fontWeight: 600, color: urgent ? '#e74c3c' : '#ff9800',
  }),
  meta: { fontSize: 13, color: '#1a73e8', fontWeight: 500 },
  empty: { textAlign: 'center' as const, padding: '30px 20px', color: '#999', fontSize: 14 },
  loading: { textAlign: 'center' as const, padding: 40, color: '#999' },
};

function ProfileOrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const { text, expired } = useCountdown(order.deadline);

  return React.createElement('div', { style: s.card, onClick },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      React.createElement('span', { style: s.cardTitle }, order.title),
      React.createElement('span', { style: s.tag(order.status) },
        order.status === 'open' ? '进行中' : '已完成'
      ),
    ),
    React.createElement('div', { style: s.cardRow },
      React.createElement('span', { style: s.cardShop },
        '\u{1F3EA} ', order.shop_name, '   \u{1F465} ', order.participant_count, '人'
      ),
      order.status === 'open'
        ? React.createElement('span', { style: s.countdown(expired) }, '⏰ ', expired ? '已截止' : text)
        : React.createElement('span', { style: s.meta }, '人均 ¥', order.cost_per_person?.toFixed(2) || '--'),
    )
  );
}

export default function Profile() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'created' | 'joined'>('created');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [joinedOrders, setJoinedOrders] = useState<Order[]>([]);
  const [userInfo, setUserInfo] = useState<{ nickname: string; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/me')
      .then((res) => {
        setUserInfo(res.data.user);
        setMyOrders(res.data.my_orders);
        setJoinedOrders(res.data.joined_orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentOrders = tab === 'created' ? myOrders : joinedOrders;

  return React.createElement(React.Fragment, null,
    React.createElement(Header, null),
    React.createElement('div', { className: 'page-container' },
      // User card
      userInfo && React.createElement('div', { style: s.userCard },
        React.createElement('div', { style: s.avatar }, userInfo.nickname[0]),
        React.createElement('div', { style: s.userInfo },
          React.createElement('div', { style: s.userName }, userInfo.nickname),
          React.createElement('div', { style: s.userId }, '@', userInfo.username),
        ),
      ),

      React.createElement('div', { style: s.section },
        // Tabs
        React.createElement('div', { style: s.tabs },
          React.createElement('button', {
            style: s.tab(tab === 'created'),
            onClick: () => setTab('created'),
          }, '\u{1F4DD} 我发起的（', myOrders.length, '）'),
          React.createElement('button', {
            style: s.tab(tab === 'joined'),
            onClick: () => setTab('joined'),
          }, '\u{1F64B} 我参与的（', joinedOrders.length, '）'),
        ),

        loading
          ? React.createElement('div', { style: s.loading }, '加载中...')
          : currentOrders.length === 0
            ? React.createElement('div', { style: s.empty },
                tab === 'created' ? '你还没有发起过拼单' : '你还没有参与过拼单'
              )
            : React.createElement('div', null,
                ...currentOrders.map((order) =>
                  React.createElement(ProfileOrderCard, {
                    key: order.id,
                    order,
                    onClick: () => navigate(`/order/${order.id}`),
                  })
                )
              )
      )
    )
  );
}
