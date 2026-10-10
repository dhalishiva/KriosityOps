import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { MARKETING } from './routes';

// The signed-in app loads only when needed, keeping marketing pages light.
const AppArea = lazy(() => import('./app/AppArea'));

function MetaSync() {
  const { pathname } = useLocation();
  useEffect(() => {
    const m = MARKETING.find((r) => r.path === pathname);
    if (m) document.title = m.meta.title;
    if (!location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <MetaSync />
      <Routes>
        {MARKETING.map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
        <Route
          path="/*"
          element={
            <Suspense fallback={<div className="app-loading">Loading…</div>}>
              <AppArea />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
