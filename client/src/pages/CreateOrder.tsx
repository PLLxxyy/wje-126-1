import React, { useState, useMemo, FormEvent } from 'react';
import { useRouter } from '../App';
import Header from './Header';
import api from '../api';
import { AxiosError } from 'axios';

const s = {
  container: { maxWidth: 500, margin: '0 auto', padding: '20px 0' },
  back: {
    fontSize: 14, color: '#666', cursor: 'pointer', marginBottom: 16, display: 'inline-block',
  },
  card: {
    background: '#fff', borderRadius: 12, padding: '28px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  title: { fontSize: 20, fontWeight: 700, color: '#333', marginBottom: 24, textAlign: 'center' as const },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 20 },
  field: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label: { fontSize: 14, fontWeight: 500, color: '#555' },
  input: {
    width: '100%', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 8,
    fontSize: 15, outline: 'none',
  },
  hint: { fontSize: 12, color: '#999' },
  btn: {
    padding: '14px', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8,
    fontSize: 16, fontWeight: 600, marginTop: 8,
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: {
    color: '#e74c3c', fontSize: 14, textAlign: 'center' as const,
    padding: '8px 12px', background: '#fdf0ef', borderRadius: 6,
  },
};

export default function CreateOrder() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [shopName, setShopName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('请输入拼单标题'); return; }
    if (!shopName.trim()) { setError('请输入店铺名称'); return; }
    if (!deadline) { setError('请选择截止时间'); return; }
    if (!estimatedAmount || Number(estimatedAmount) <= 0) { setError('请输入有效的预估金额'); return; }

    setLoading(true);
    try {
      const res = await api.post('/orders', {
        title: title.trim(),
        shop_name: shopName.trim(),
        deadline: new Date(deadline).toISOString(),
        estimated_amount: Number(estimatedAmount),
      });
      navigate(`/order/${res.data.id}`);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Default deadline: 2 hours from now
  const defaultDeadline = React.useMemo(() => {
    const d = new Date(Date.now() + 7200000);
    return d.toISOString().slice(0, 16);
  }, []);

  return React.createElement(React.Fragment, null,
    React.createElement(Header, null),
    React.createElement('div', { className: 'page-container', style: s.container },
      React.createElement('span', {
        style: s.back,
        onClick: () => navigate('/'),
      }, '← 返回首页'),
      React.createElement('div', { style: s.card },
        React.createElement('div', { style: s.title }, '\u{1F4DD} 发起拼单'),
        error && React.createElement('div', { style: s.error }, error),
        React.createElement('form', { style: s.form, onSubmit: handleSubmit },
          React.createElement('div', { style: s.field },
            React.createElement('label', { style: s.label }, '拼单标题 *'),
            React.createElement('input', {
              style: s.input, placeholder: '例如：奶茶拼单、炸鸡拼单',
              value: title,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value),
            }),
          ),
          React.createElement('div', { style: s.field },
            React.createElement('label', { style: s.label }, '店铺名称 *'),
            React.createElement('input', {
              style: s.input, placeholder: '例如：蜜雪冰城、正新鸡排',
              value: shopName,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setShopName(e.target.value),
            }),
          ),
          React.createElement('div', { style: s.field },
            React.createElement('label', { style: s.label }, '截止时间 *'),
            React.createElement('input', {
              style: s.input, type: 'datetime-local',
              defaultValue: defaultDeadline,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value),
            }),
            React.createElement('span', { style: s.hint }, '到截止时间后，拼单将不再接受新加入'),
          ),
          React.createElement('div', { style: s.field },
            React.createElement('label', { style: s.label }, '每人预估金额（元）*'),
            React.createElement('input', {
              style: s.input, type: 'number', step: '0.01', min: '0.01',
              placeholder: '15',
              value: estimatedAmount,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEstimatedAmount(e.target.value),
            }),
          ),
          React.createElement('button', {
            style: { ...s.btn, ...(loading ? s.btnDisabled : {}) },
            type: 'submit', disabled: loading,
          }, loading ? '创建中...' : '发布拼单'),
        ),
      )
    )
  );
}
