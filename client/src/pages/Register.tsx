import React, { useState, FormEvent } from 'react';
import { useRouter } from '../App';
import api from '../api';
import { AxiosError } from 'axios';

const s = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 32px',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  },
  logo: { textAlign: 'center' as const, marginBottom: 32 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 700, color: '#333' },
  subtitle: { fontSize: 14, color: '#999', marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 16 },
  input: {
    width: '100%', padding: '12px 16px', border: '1px solid #e0e0e0',
    borderRadius: 8, fontSize: 15, outline: 'none',
  },
  btn: {
    width: '100%', padding: '12px 16px', background: '#1a73e8', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
  },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: {
    color: '#e74c3c', fontSize: 14, textAlign: 'center' as const,
    padding: '8px 12px', background: '#fdf0ef', borderRadius: 6,
  },
  success: {
    color: '#27ae60', fontSize: 14, textAlign: 'center' as const,
    padding: '8px 12px', background: '#eafaf1', borderRadius: 6,
  },
  link: { textAlign: 'center' as const, marginTop: 20, fontSize: 14, color: '#666' },
  linkText: { color: '#1a73e8', cursor: 'pointer', fontWeight: 500 },
};

export default function Register() {
  const { navigate } = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', { username, password, nickname: nickname || username });
      setSuccess('注册成功！正在跳转到登录页...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { style: s.container },
    React.createElement('div', { style: s.card },
      React.createElement('div', { style: s.logo },
        React.createElement('div', { style: s.icon }, '\u{1F4DD}'),
        React.createElement('div', { style: s.title }, '注册账号'),
        React.createElement('div', { style: s.subtitle }, '加入宿舍拼单大家庭'),
      ),
      error && React.createElement('div', { style: s.error }, error),
      success && React.createElement('div', { style: s.success }, success),
      React.createElement('form', { style: s.form, onSubmit: handleSubmit },
        React.createElement('input', {
          style: s.input, type: 'text', placeholder: '用户名（2-20个字符）',
          value: username,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value),
        }),
        React.createElement('input', {
          style: s.input, type: 'password', placeholder: '密码（至少6位）',
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        }),
        React.createElement('input', {
          style: s.input, type: 'text', placeholder: '昵称（选填）',
          value: nickname,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setNickname(e.target.value),
        }),
        React.createElement('button', {
          style: { ...s.btn, ...(loading ? s.btnDisabled : {}) },
          type: 'submit', disabled: loading,
        }, loading ? '注册中...' : '注册'),
      ),
      React.createElement('div', { style: s.link },
        '已有账号？',
        React.createElement('span', {
          style: s.linkText,
          onClick: () => navigate('/'),
        }, '去登录'),
      ),
    )
  );
}
