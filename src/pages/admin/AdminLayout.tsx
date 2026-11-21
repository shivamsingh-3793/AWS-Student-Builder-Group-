import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { authApi, clearAuthToken, configApi, getAuthToken } from '../../lib/api';
import type { AdminUser } from '../../types';
import { useTheme } from '../../context/ThemeContext';

const ADMIN_LINKS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/events', label: 'Events', icon: Calendar },
  { to: '/admin/posts', label: 'Posts', icon: FileText },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
  { to: '/admin/team', label: 'Team', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmsName, setCmsName] = useState('CMS');

  useEffect(() => {
    configApi.get()
      .then((config) => setCmsName(config.cmsName))
      .catch(() => setCmsName('CMS'));
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    authApi
      .me()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        clearAuthToken();
        navigate('/admin/login', { replace: true });
      })
      .finally(() => setChecking(false));
  }, [navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      console.warn('Server logout could not be confirmed; the local session was cleared.');
    } finally {
      clearAuthToken();
      navigate('/admin/login', { replace: true });
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#151B24] text-white flex items-center justify-center font-mono text-sm">
        Verifying session...
      </div>
    );
  }

  const currentSection =
    ADMIN_LINKS.find((l) => location.pathname.startsWith(l.to))?.label || 'Workspace';

  return (
    <div className="min-h-screen bg-[#F5F7F6] dark:bg-[#151B24] text-[#151B24] dark:text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] shrink-0">
        <div className="h-16 px-6 border-b border-[#151B24]/12 dark:border-white/12 flex items-center justify-between">
          <Link to="/admin/dashboard" className="font-display font-bold text-lg tracking-tight truncate">
            {cmsName}
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1" aria-label="Admin Navigation">
          {ADMIN_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#00E582] text-[#151B24] font-semibold'
                      : 'text-[#475569] dark:text-slate-300 hover:bg-[#151B24]/5 dark:hover:bg-white/5 hover:text-[#151B24] dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#151B24]/12 dark:border-white/12 space-y-3">
          {user && (
            <div className="px-2">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs font-mono text-[#475569] dark:text-slate-400 truncate">
                {user.email}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#151B24]/80"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-white dark:bg-[#1A222D] border-r border-white/10 flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#151B24]/10 dark:border-white/10">
                <span className="font-display font-bold text-lg">
                  {cmsName}
                </span>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                  className="p-1.5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-1">
                {ADMIN_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium ${
                          isActive
                            ? 'bg-[#00E582] text-[#151B24] font-semibold'
                            : 'text-[#475569] dark:text-slate-300'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-red-500"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 px-4 sm:px-8 border-b border-[#151B24]/12 dark:border-white/12 bg-white dark:bg-[#1A222D] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 border border-[#151B24]/15 dark:border-white/15"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 text-sm font-mono truncate">
              <span className="text-[#475569] dark:text-slate-400">Admin</span>
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-[#151B24] dark:text-white">
                {currentSection}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 border border-[#151B24]/15 dark:border-white/15 hover:border-[#00E582] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 text-xs font-mono border border-[#151B24]/15 dark:border-white/15 hover:border-[#00E582] transition-colors whitespace-nowrap"
            >
              View Public Site
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
