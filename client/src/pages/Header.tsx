import React from 'react';
import { useRouter, useAuth } from '../App';

const s = {
  header: {
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: '0 20px',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  },
  inner: {
    maxWidth: 600,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  logo: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1a73e8',
    cursor: 'pointer',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  link: {
    fontSize: 14,
    color: '#555',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: 6,
    transition: 'background 0.2s',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#1a73e8',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  logout: {
    fontSize: 13,
    color: '#e74c3c',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    border: 'none',
    background: 'transparent',
  },
};

export default function Header() {
  const { navigate } = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initial = user.nickname ? user.nickname[0].toUpperCase() : '?';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return React.createElement('header', { style: s.header },
    React.createElement('div', { style: s.inner },
      React.createElement('span', {
        style: s.logo,
        onClick: () => navigate('/'),
      }, '\u{1F6D2} 宿舍拼单'),
      React.createElement('nav', { style: s.nav },
        React.createElement('span', {
          style: s.link,
          onClick: () => navigate('/'),
        }, '首页'),
        React.createElement('span', {
          style: s.link,
          onClick: () => navigate('/profile'),
        }, '个人中心'),
        React.createElement('span', {
          style: s.avatar,
          onClick: () => navigate('/profile'),
          title: user.nickname,
        }, initial),
        React.createElement('button', {
          style: s.logout,
          onClick: handleLogout,
        }, '退出'),
      )
    )
  );
}
