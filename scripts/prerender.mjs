// Writes a static HTML file for each marketing page, plus an app shell, sitemap and robots.txt.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://ops.kriosity.in';

const template = readFileSync(join(dist, 'index.html'), 'utf8');
const { render, pages } = await import(pathToFileURL(join(root, 'dist-ssr', 'entry-server.js')).href);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function withMeta(html, { title, description }, url) {
  return html
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(title)}"`)
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${esc(title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${esc(description)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`);
}

for (const { path } of pages) {
  const { html, meta } = render(path);
  const url = path === '/' ? `${SITE}/` : `${SITE}${path}`;
  const out = withMeta(template, meta, url).replace('<!--app-html-->', html);
  const file = path === '/' ? join(dist, 'index.html') : join(dist, path.slice(1), 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out);
  console.log('prerendered', path);
}

// Shell for the signed-in app and auth pages: no marketing content, not indexed.
const shell = template
  .replace(/<title>.*?<\/title>/s, '<title>KriosityOps</title>')
  .replace('<meta name="robots" content="index, follow" />', '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  .replace('<!--app-html-->', '');
mkdirSync(join(dist, 'app'), { recursive: true });
writeFileSync(join(dist, 'app', 'index.html'), shell);
writeFileSync(join(dist, '404.html'), shell);

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map((p) => `  <url><loc>${p.path === '/' ? `${SITE}/` : SITE + p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority.toFixed(1)}</priority></url>`)
  .join('\n')}
</urlset>
`;
writeFileSync(join(dist, 'sitemap.xml'), sitemap);
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /admin\nDisallow: /login\nDisallow: /signup\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

rmSync(join(root, 'dist-ssr'), { recursive: true, force: true });
console.log('sitemap, robots and app shell written');
