import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import brandLogo from '../assets/images/aws-student-builder-group-logo.jpeg';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/team', label: 'Team' },
  { to: '/events', label: 'Events' },
  { to: '/projects', label: 'Projects' },
  { to: '/blog', label: 'Blog' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

export function BrandLogo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <img
        src={brandLogo}
        alt="AWS Student Builder Group"
        className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-lg object-cover"
      />
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif text-[clamp(0.7rem,3.2vw,0.85rem)] sm:text-[1.15rem] font-semibold tracking-tight whitespace-nowrap ${
            inverted ? 'text-white' : 'text-[#151B24] dark:text-white'
          }`}
        >
          AWS Student Builder Group
        </span>
        <span
          className={`mt-1 text-[0.6rem] sm:text-[0.68rem] font-medium tracking-wide ${
            inverted ? 'text-slate-200' : 'text-[#64748B] dark:text-slate-400'
          }`}
        >
          Indo Global Group of Colleges
        </span>
      </span>
    </span>
  );
}

export function Navbar({ onOpenJoin }: { onOpenJoin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const lastScrollY = useRef(0);

  const isHomeTop = location.pathname === '/' && !scrolled;

  // Scroll detect: neeche scroll karne par hide karega, upar scroll karne par show karega
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY.current && currentScrollY > 70) {
        // Scroll down -> navbar hat jayega
        setVisible(false);
      } else {
        // Scroll up ya top par -> navbar wapas aa jayega
        setVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Full-width surface styling (Floating rounded pill styling removed)
  const navSurface = isHomeTop
    ? 'bg-white/[0.05] border-b border-white/15'
    : 'bg-white/90 dark:bg-[#151B24]/90 border-b border-slate-200/80 dark:border-white/10 shadow-sm';

  const iconButton = isHomeTop
    ? 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-[#00E582]/60'
    : 'border-slate-200 dark:border-white/15 bg-slate-100/80 dark:bg-white/5 text-[#151B24] dark:text-white hover:bg-slate-200/80 dark:hover:bg-white/10 hover:border-[#00E582]/60';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-xl transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${navSurface}`}
      >
        <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E582] shrink-0"
            aria-label="AWS Student Builder Group Home"
          >
            <BrandLogo inverted={isHomeTop} />
          </Link>

          {/* Desktop Links */}
          <nav className="hidden items-center gap-5 xl:flex min-[1400px]:gap-8" aria-label="Primary Navigation">
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative py-1.5 font-serif text-[0.95rem] tracking-wide whitespace-nowrap shrink-0 transition-colors rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00E582] ${
                    isActive
                      ? isHomeTop
                        ? 'text-[#00E582]'
                        : 'text-[#007A46] dark:text-[#00E582]'
                      : isHomeTop
                      ? 'text-slate-100/90 hover:text-[#00E582]'
                      : 'text-[#334155] dark:text-slate-300 hover:text-[#151B24] dark:hover:text-[#00E582]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-active-underline"
                        className="absolute left-0 right-0 -bottom-1 h-0.5 bg-[#00E582]"
                        transition={{ duration: 0.25 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden items-center gap-3 shrink-0 xl:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={`p-2 rounded-full border backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-[#00E582] ${iconButton}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onOpenJoin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00E582] text-[#151B24] font-serif text-[0.95rem] font-semibold shadow-[0_4px_16px_rgba(0,229,130,0.3)] hover:brightness-95 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00E582]"
            >
              Join Community
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className={`rounded-full border p-2 backdrop-blur-md transition-colors sm:p-2.5 ${iconButton}`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className={`rounded-full border p-2 backdrop-blur-md transition-colors sm:p-2.5 ${iconButton}`}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 bg-[#151B24]/90 backdrop-blur-2xl text-white pt-24 pb-8 px-6 flex flex-col justify-between overflow-y-auto xl:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile Navigation">
              {NAV_LINKS.map((item, idx) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * idx }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block py-3.5 font-serif text-2xl tracking-tight border-b border-white/10 transition-colors ${
                        isActive ? 'text-[#00E582]' : 'text-white/90 hover:text-[#00E582]'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <div className="pt-8 space-y-4">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenJoin();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-[#00E582] text-[#151B24] font-serif text-lg font-semibold flex items-center justify-between shadow-[0_4px_20px_rgba(0,229,130,0.3)]"
              >
                <span>Join Community</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-slate-400">
                AWS Student Builder Group — Indo Global Group of Colleges
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}