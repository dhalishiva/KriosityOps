import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { WhatsAppBubble } from '../components/WhatsAppBubble';
import { useAuth } from '../lib/auth';

export function RequireAuth({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { session, profile, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="app-loading" role="status">Loading your board…</div>;
  if (!session) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  if (admin && profile && !profile.is_admin) return <Navigate to="/app" replace />;
  if (admin && !profile) return <div className="app-loading" role="status">Loading…</div>;
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, session, signOut } = useAuth();
  useEffect(() => {
    document.body.classList.add('in-app');
    return () => document.body.classList.remove('in-app');
  }, []);
  return (
    <div className="app">
      <header className="app-top">
        <div className="app-top-inner">
          <Link to="/app" aria-label="Your apps">
            <Logo size={26} />
          </Link>
          <nav className="app-nav" aria-label="App">
            <NavLink to="/app" end>
              Apps
            </NavLink>
            <NavLink to="/app/billing">Billing</NavLink>
            <NavLink to="/app/settings">Settings</NavLink>
            {profile?.is_admin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
          <div className="app-me">
            <span className={`plan-badge plan-${profile?.plan ?? 'free'}`}>{profile?.plan === 'pro' ? 'Pro' : 'Free'}</span>
            <span className="app-email" title={session?.user.email}>
              {session?.user.email}
            </span>
            <button type="button" className="btn btn-quiet btn-sm" onClick={signOut}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="app-main" id="main">
        {children}
      </main>
      <WhatsAppBubble />
    </div>
  );
}
