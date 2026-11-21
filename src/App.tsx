import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { JoinCommunityModal } from './components/JoinCommunityModal';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const TeamPage = lazy(() => import('./pages/TeamPage').then((m) => ({ default: m.TeamPage })));
const EventsPage = lazy(() => import('./pages/EventsPage').then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() =>
  import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage }))
);
const ProjectsPage = lazy(() =>
  import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('./pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const BlogPage = lazy(() => import('./pages/BlogPage').then((m) => ({ default: m.BlogPage })));
const BlogPostPage = lazy(() =>
  import('./pages/BlogPostPage').then((m) => ({ default: m.BlogPostPage }))
);
const GalleryPage = lazy(() =>
  import('./pages/GalleryPage').then((m) => ({ default: m.GalleryPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);

const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
);
const AdminLayout = lazy(() =>
  import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
);
const AdminEvents = lazy(() =>
  import('./pages/admin/AdminEvents').then((m) => ({ default: m.AdminEvents }))
);
const AdminPosts = lazy(() =>
  import('./pages/admin/AdminPosts').then((m) => ({ default: m.AdminPosts }))
);
const AdminProjects = lazy(() =>
  import('./pages/admin/AdminProjects').then((m) => ({ default: m.AdminProjects }))
);
const AdminGallery = lazy(() =>
  import('./pages/admin/AdminGallery').then((m) => ({ default: m.AdminGallery }))
);
const AdminTeam = lazy(() =>
  import('./pages/admin/AdminTeam').then((m) => ({ default: m.AdminTeam }))
);
const AdminSettings = lazy(() =>
  import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings }))
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PublicLayout({ onOpenJoin }: { onOpenJoin: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7F6] dark:bg-[#151B24] text-[#151B24] dark:text-white">
      <Navbar onOpenJoin={onOpenJoin} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#151B24] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00E582] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <ScrollToTop />
          <JoinCommunityModal open={joinOpen} onClose={() => setJoinOpen(false)} />

          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout onOpenJoin={() => setJoinOpen(true)} />}>
                <Route path="/" element={<HomePage onOpenJoin={() => setJoinOpen(true)} />} />
                <Route path="/about" element={<AboutPage onOpenJoin={() => setJoinOpen(true)} />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Private Admin CMS Routes (never linked on public website) */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="posts" element={<AdminPosts />} />
                <Route path="projects" element={<AdminProjects />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="team" element={<AdminTeam />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </MotionConfig>
    </ThemeProvider>
  );
}
