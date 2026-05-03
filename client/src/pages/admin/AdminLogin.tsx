import React, { useState } from 'react';
import { api, setToken } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.login({ username, password });
      setToken(res.token);
      onLogin();
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError('Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-2">
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase">Super Admin</h1>
          <p className="text-xs text-gray-600 tracking-widest">RESTRICTED ACCESS — AUTHORISED PERSONNEL ONLY</p>
        </div>

        <div className="bg-[#0d0d0d] border border-red-900/40 rounded-xl p-8 shadow-2xl shadow-red-950/20">
          <div className="font-mono text-xs text-red-500/60 mb-6 border-b border-white/5 pb-4">
            <span className="text-green-500">root@prav-pc</span>
            <span className="text-white/30">:</span>
            <span className="text-blue-400">~</span>
            <span className="text-white/30">$ </span>
            <span className="text-white/60">sudo super-admin --auth</span>
            <span className="animate-pulse">▋</span>
          </div>

          {error && (
            <div className="mb-5 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-mono">
              ✗ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase tracking-widest">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-green-400 font-mono focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-white/10"
                placeholder="enter username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-500 mb-1.5 uppercase tracking-widest">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-green-400 font-mono focus:outline-none focus:border-red-500/50 transition-colors placeholder:text-white/10"
                placeholder="enter password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-red-600/80 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-40 text-sm tracking-widest uppercase font-mono"
            >
              {loading ? '[ authenticating… ]' : '[ authenticate ]'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-800 font-mono tracking-widest">
          UNAUTHORISED ACCESS ATTEMPTS ARE LOGGED AND MONITORED
        </p>

        <div className="text-center">
          <a href="/" className="text-xs text-gray-700 hover:text-gray-500 font-mono transition-colors">
            ← back to desktop
          </a>
        </div>
      </div>
    </div>
  );
}
