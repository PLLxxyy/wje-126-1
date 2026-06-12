import React, { useState, FormEvent } from 'react';
import { useRouter, useAuth } from '../App';
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
  logo: {
    textAlign: 'center' as const,
    marginBottom: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '12px 16px',
    background: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center' as const,
    padding: '8px 12px',
    background: '#fdf0ef',
    borderRadius: 6,
  },
  link: {
    textAlign: 'center' as const,
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  linkText: {
    color: '#1a73e8',
    cursor: 'pointer',
    fontWeight: 500,
  },
};

export default function Login() {
  const { navigate } = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ error?: string }>;
      setError(axiosErr.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { style: s.container },
    React.createElement('div', { style: s.card },
      React.createElement('div', { style: s.logo },
        React.createElement('div', { style: s.icon }, '\u{1F6D2}'),
        React.createElement('div', { style: s.title }, '宿舍拼单'),
        React.createElement('div', { style: s.subtitle }, '大学生活拼单平台'),
      ),
      error && React.createElement('div', { style: s.error }, error),
      React.createElement('form', { style: s.form, onSubmit: handleSubmit },
        React.createElement('input', {
          style: s.input,
          type: 'text',
          placeholder: '用户名',
          value: username,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value),
        }),
        React.createElement('input', {
          style: s.input,
          type: 'password',
          placeholder: '密码',
          value: password,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
        }),
        React.createElement('button', {
          style: { ...s.btn, ...(loading ? s.btnDisabled : {}) },
          type: 'submit',
          disabled: loading,
        }, loading ? '登录中...' : '登录'),
      ),
      React.createElement('div', { style: s.link },
        '还没账号？',
        React.createElement('span', {
          style: s.linkText,
          onClick: () => navigate('/register'),
        }, '去注册'),
      ),
    )
  );
}
