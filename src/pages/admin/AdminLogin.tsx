import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { authApi, configApi, setAuthToken } from '../../lib/api';
import { SeoHead } from '../../components/SeoHead';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cmsName, setCmsName] = useState('CMS');

  useEffect(() => {
    configApi.get()
      .then((config) => setCmsName(config.cmsName))
      .catch(() => setCmsName('CMS'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuthToken(res.token);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SeoHead title="Admin Sign In" description="Private chapter CMS authentication." />

      <div className="min-h-screen bg-[#151B24] text-white blueprint-grid flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#1A222D] border border-white/15 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00E582]/15 border border-[#00E582] flex items-center justify-center text-[#00E582]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-[#00E582]">
                Private Workspace
              </p>
              <h1 className="font-display text-2xl font-bold text-white">{cmsName}</h1>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3 text-sm bg-red-500/10 border border-red-500/40 text-red-400"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 bg-[#151B24] border border-white/15 text-white text-sm focus:outline-none focus:border-[#00E582]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-[#151B24] border border-white/15 text-white text-sm focus:outline-none focus:border-[#00E582]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#00E582] text-[#151B24] font-semibold text-sm hover:brightness-95 transition-all disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </>
  );
}
