import React, { createContext, useContext, useState, useCallback } from 'react';

// ============ Types ============
interface User {
  id: number;
  username: string;
  nickname: string;
}

interface RouterContextType {
  path: string;
  navigate: (path: string) => void;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

// ============ Contexts ============
const RouterContext = createContext<RouterContextType>({ path: '/', navigate: () => {} });
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});

export function useRouter() {
  return useContext(RouterContext);
}

export function useAuth() {
  return useContext(AuthContext);
}

// ============ Hooks ============
export function useCountdown(deadline: string): { text: string; expired: boolean } {
  const [state, setState] = useState(() => calc(deadline));

  React.useEffect(() => {
    const timer = setInterval(() => setState(calc(deadline)), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return state;
}

function calc(deadline: string): { text: string; expired: boolean } {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { text: '已截止', expired: true };

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return { text: `${days}天${hours}时${minutes}分`, expired: false };
  if (hours > 0) return { text: `${hours}时${minutes}分${seconds}秒`, expired: false };
  return { text: `${minutes}分${seconds}秒`, expired: false };
}

// ============ Components ============
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  const login = useCallback((t: string, u: User) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return React.createElement(AuthContext.Provider, { value: { user, token, login, logout } }, children);
}

function RouterProvider({ children }: { children: React.ReactNode }) {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');

  React.useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((p: string) => {
    window.location.hash = p;
  }, []);

  return React.createElement(RouterContext.Provider, { value: { path, navigate } }, children);
}

// ============ Page Imports ============
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateOrder from './pages/CreateOrder';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';

// ============ App ============
function AppRoutes() {
  const { path } = useRouter();
  const { user } = useAuth();

  if (!user) {
    if (path === '/register') return React.createElement(Register);
    return React.createElement(Login);
  }

  if (path === '/create') return React.createElement(CreateOrder);
  if (path.startsWith('/order/')) {
    const id = path.split('/')[2];
    return React.createElement(OrderDetail, { orderId: Number(id) });
  }
  if (path === '/profile') return React.createElement(Profile);
  return React.createElement(Home);
}

export default function App() {
  return React.createElement(
    RouterProvider,
    null,
    React.createElement(AuthProvider, null, React.createElement(AppRoutes))
  );
}
