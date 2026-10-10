import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { Route, Routes } from 'react-router-dom';
import { MARKETING } from './routes';

/** Server render of a marketing page, used once at build time. */
export function render(path: string) {
  const page = MARKETING.find((r) => r.path === path);
  if (!page) throw new Error(`No marketing page at ${path}`);
  const html = renderToString(
    <StaticRouter location={path}>
      <Routes>
        <Route path={path} element={page.element} />
      </Routes>
    </StaticRouter>,
  );
  return { html, meta: page.meta };
}

export const pages = MARKETING.map((r) => ({ path: r.path, priority: r.priority }));
