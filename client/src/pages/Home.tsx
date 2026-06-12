import React, { useState, useEffect } from 'react';
import { useRouter, useCountdown } from '../App';
import Header from './Header';
import api from '../api';

interface Order {
  id: number;
  title: string;
  shop_name: string;
  deadline: string;
  estimated_amount: number;
  status: string;
  total_amount: number | null;
  cost_per_person: number | null;
  creator_nickname: string;
  creator_username: string;
  participant_count: number;
  current_total: number;
}

const s = {
  section: { marginBottom: 24 },
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: '#333' },
  createBtn: {
    padding: '8px 20px', background: '#1a73e8', color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 14, fontWeight: 600,
  },
  tabs: {
    display: 'flex', gap: 0, marginBottom: 24,
    background: '#e8e8e8', borderRadius: 10, padding: 4,
  },
  tab: (active: boolean) => ({
    flex: 1, padding: '10px 16px', textAlign: 'center' as const,
    borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400,
    cursor: 'pointer', border: 'none',
    background: active ? '#fff' : 'transparent',
    color: active ? '#1a73e8' : '#666',
    boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
    transition: 'all 0.2s',
  }),
  card: {
    background: '#fff', borderRadius: 12, padding: 20, marginBottom: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  cardTop: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#333' },
  tag: (status: string) => ({
    fontSize: 12, padding: '2px 10px', borderRadius: 20,
    background: status === 'open' ? '#e8f5e9' : '#f5f5f5',
    color: status === 'open' ? '#2e7d32' : '#999',
    fontWeight: 500,
  }),
  shop: { fontSize: 14, color: '#666', marginBottom: 8 },
  cardBottom: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0',
  },
  meta: { fontSize: 13, color: '#999' },
  people: { fontSize: 13, color: '#1a73e8', fontWeight: 500 },
  countdown: (urgent: boolean) => ({
    fontSize: 13, fontWeight: 600,
    color: urgent ? '#e74c3c' : '#ff9800',
  }),
  empty: {
    textAlign: 'center' as const, padding: '40px 20px', color: '#999',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  loading: {
    textAlign: 'center' as const, padding: 40, color: '#999',
  },
  searchBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  searchBtn: {
    padding: '10px 20px',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  searchResultsHeader: {
    marginBottom: 16,
    padding: '12px 16px',
    background: '#f0f7ff',
    borderRadius: 8,
    borderLeft: '3px solid #1a73e8',
  },
  searchResultsTitle: {
    fontSize: 14,
    color: '#1a73e8',
    fontWeight: 600,
  },
};

function OrderCard({ order, onClick, highlightStatus = false }: { order: Order; onClick: () => void; highlightStatus?: boolean }) {
  const { text, expired } = useCountdown(order.deadline);

  const tagStyle = highlightStatus
    ? { ...s.tag(order.status), padding: '4px 12px', fontSize: 13, fontWeight: 600 }
    : s.tag(order.status);

  return React.createElement('div', {
    style: s.card,
    onClick,
    onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
    },
  },
    React.createElement('div', { style: s.cardTop },
      React.createElement('span', { style: s.cardTitle }, order.title),
      React.createElement('span', { style: tagStyle },
        order.status === 'open' ? '进行中' : '已完成'
      ),
    ),
    React.createElement('div', { style: s.shop },
      '\u{1F3EA} ', order.shop_name,
      '      \u{1F464} ', order.creator_nickname,
    ),
    React.createElement('div', { style: s.cardBottom },
      React.createElement('span', { style: s.people },
        '\u{1F465} ', order.participant_count, '人参与'
      ),
      order.status === 'open'
        ? React.createElement('span', { style: s.countdown(expired) },
            '⏰ ', expired ? '已截止' : text
          )
        : React.createElement('span', { style: s.meta },
            '人均 ¥', order.cost_per_person?.toFixed(2) || '--'
          ),
    )
  );
}

export default function Home() {
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'open' | 'completed'>('open');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (!searchKeyword.trim()) {
      params.set('status', tab);
    }
    if (searchKeyword.trim()) {
      params.set('search', searchKeyword.trim());
    }
    api.get(`/orders?${params.toString()}`)
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab, searchKeyword]);

  const handleSearch = () => {
    setSearchKeyword(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return React.createElement(React.Fragment, null,
    React.createElement(Header, null),
    React.createElement('div', { className: 'page-container' },
      React.createElement('div', { style: s.section },
        React.createElement('div', { style: s.sectionHeader },
          React.createElement('span', { style: s.sectionTitle }, '\u{1F30D} 拼单广场'),
          React.createElement('button', {
            style: s.createBtn,
            onClick: () => navigate('/create'),
          }, '+ 发起拼单'),
        ),
      ),
      React.createElement('div', { style: s.searchBar },
        React.createElement('input', {
          style: s.searchInput,
          type: 'text',
          placeholder: '搜索店铺名或拼单标题...',
          value: searchInput,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value),
          onKeyDown: handleKeyDown,
          onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
            (e.target as HTMLInputElement).style.borderColor = '#1a73e8';
          },
          onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
            (e.target as HTMLInputElement).style.borderColor = '#ddd';
          },
        }),
        React.createElement('button', {
          style: s.searchBtn,
          onClick: handleSearch,
        }, '\u{1F50D} 搜索'),
        searchKeyword.trim() && React.createElement('button', {
          style: { ...s.searchBtn, background: '#757575' },
          onClick: () => {
            setSearchKeyword('');
            setSearchInput('');
          },
        }, '\u{2715} 清除'),
      ),
      searchKeyword.trim()
        ? React.createElement('div', { style: s.searchResultsHeader },
            React.createElement('span', { style: s.searchResultsTitle },
              '\u{1F50D} 搜索 "', searchKeyword, '" 共 ', orders.length, ' 条结果'
            ),
          )
        : React.createElement('div', { style: s.tabs },
            React.createElement('button', {
              style: s.tab(tab === 'open'),
              onClick: () => setTab('open'),
            }, '\u{1F7E2} 进行中'),
            React.createElement('button', {
              style: s.tab(tab === 'completed'),
              onClick: () => setTab('completed'),
            }, '✅ 已结束'),
          ),
      loading
        ? React.createElement('div', { style: s.loading }, '加载中...')
        : orders.length === 0
          ? React.createElement('div', { style: s.empty },
              React.createElement('div', { style: s.emptyIcon },
                searchKeyword.trim() ? '\u{1F50D}' : (tab === 'open' ? '\u{1F4ED}' : '\u{1F4CB}')
              ),
              React.createElement('div', null,
                searchKeyword.trim()
                  ? `没有找到与 "${searchKeyword}" 相关的拼单`
                  : (tab === 'open' ? '暂无进行中的拼单' : '暂无已结束的拼单')
              ),
              React.createElement('div', { style: { marginTop: 8, fontSize: 13 } },
                searchKeyword.trim()
                  ? '试试其他关键词，或点击"清除"返回浏览'
                  : (tab === 'open' ? '点击上方按钮发起第一个拼单吧！' : '')
              ),
            )
          : React.createElement('div', null,
              ...orders.map((order) =>
                React.createElement(OrderCard, {
                  key: order.id,
                  order,
                  onClick: () => navigate(`/order/${order.id}`),
                  highlightStatus: !!searchKeyword.trim(),
                })
              )
            )
    )
  );
}
