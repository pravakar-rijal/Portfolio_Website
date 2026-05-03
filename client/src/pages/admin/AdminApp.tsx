import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { api, getToken, clearToken } from '../../api/client';
import AdminLogin from './AdminLogin';
import AdminSetup from './AdminSetup';
import AdminDashboard from './AdminDashboard';
import BlogList from './BlogList';
import BlogEditor from './BlogEditor';
import ProfileEditor from './ProfileEditor';
import MediumSettings from './MediumSettings';

const NAV = [
  { to: '/admin/dashboard', label: 'Dashboard',       icon: '▸' },
  { to: '/admin/blog',      label: 'Blog Posts',       icon: '▸' },
  { to: '/admin/profile',   label: 'Profile Editor',   icon: '▸' },
  { to: '/admin/medium',    label: 'Medium Settings',  icon: '▸' },
];

export default function AdminApp() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'setup_needed'>('loading');
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const setupInfo = await api.auth.setupNeeded();
        if (setupInfo.setupNeeded) { setAuthStatus('setup_needed'); return; }
        const token = getToken();
        if (!token) { setAuthStatus('unauthenticated'); return; }
        await api.auth.me();
        setAuthStatus('authenticated');
      } catch {
        setAuthStatus('unauthenticated');
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    clearToken();
    setAuthStatus('unauthenticated');
    navigate('/admin/login');
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center font-mono">
        <div className="text-center space-y-3">
          <div className="text-red-500 text-2xl animate-pulse">⚡</div>
          <p className="text-gray-600 text-xs tracking-widest">INITIALISING SUPER ADMIN…</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'setup_needed') {
    return (
      <Routes>
        <Route path="/setup" element={<AdminSetup onComplete={() => setAuthStatus('authenticated')} />} />
        <Route path="*" element={<Navigate to="/admin/setup" replace />} />
      </Routes>
    );
  }

  if (authStatus === 'unauthenticated') {
    return (
      <Routes>
        <Route path="/login" element={<AdminLogin onLogin={() => setAuthStatus('authenticated')} />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-mono overflow-hidden">

      {/* Sidebar */}
      <div className="w-60 bg-[#0d0d0d] border-r border-white/5 flex flex-col shrink-0">

        {/* Header */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-500 text-lg">⚡</span>
            <span className="text-xs font-bold tracking-widest uppercase text-white">Super Admin</span>
          </div>
          <p className="text-[10px] text-gray-700 tracking-widest">prav-pc / root</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon }) => {
            const active = location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(to));
            return (
              <Link key={to} to={to}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                  active
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                    : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                }`}>
                <span className={active ? 'text-red-400' : 'text-gray-700'}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="px-3 py-4 border-t border-white/5 space-y-1">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-600 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all text-left">
            <span>✕</span> Logout
          </button>
          <a href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 hover:text-white hover:bg-white/5 border border-transparent transition-all">
            <span>←</span> Back to Desktop
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a]">

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center justify-between">
          <div className="text-[10px] text-gray-700 tracking-widest">
            <span className="text-green-500/70">root@prav-pc</span>
            <span className="text-white/20">:</span>
            <span className="text-blue-400/70">/admin{location.pathname.replace('/admin', '') || ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] text-gray-700">LIVE</span>
          </div>
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/blog"      element={<BlogList />} />
          <Route path="/blog/new"  element={<BlogEditor />} />
          <Route path="/blog/edit/:id" element={<BlogEditor />} />
          <Route path="/profile"   element={<ProfileEditor />} />
          <Route path="/medium"    element={<MediumSettings />} />
          <Route path="*"          element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}
