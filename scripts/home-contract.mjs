import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory } from './public-site-evidence.mjs';

export const HOME_ROUTES = ['/', '/en', '/de'];
export const HOME_ROUTE_FILES = ['de/route.js', 'en/route.js', 'route.js'];

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map(([, name, double, single, bare]) => [name.toLowerCase(), double ?? single ?? bare]));
}

// Regression guardrails, not a JavaScript sandbox or a publication authorization.
export function inspectHomeContract({ html, scripts = [], routeFiles = HOME_ROUTE_FILES, publicFiles = [] }) {
  const violations = [];
  const require = (condition, reason) => { if (!condition) violations.push(reason); };
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  const robots = metas.filter(meta => /^(robots|googlebot|bingbot)$/i.test(meta.name ?? ''));
  require(robots.some(meta => meta.name.toLowerCase() === 'robots')
    && robots.every(meta => {
      const tokens = (meta.content ?? '').toLowerCase().split(/[\s,]+/);
      return tokens.includes('noindex') && tokens.includes('nofollow') && !tokens.some(token => ['index', 'follow', 'all'].includes(token));
    }), 'Home must retain noindex,nofollow');
  require(metas.some(meta => meta['http-equiv']?.toLowerCase() === 'content-security-policy'
    && /(?:^|;)\s*form-action\s+'none'\s*(?:;|$)/.test(meta.content ?? '')), 'Home must block native form submission');
  for (const match of html.matchAll(/<(?:form|button|input)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    require(!('action' in attrs) && !('formaction' in attrs), 'Home must not declare a sending form action');
  }
  require(/href=["']mailto:info@obraxen\.com["']/i.test(html), 'Home must retain its approved direct mailto channel');
  for (const match of html.matchAll(/<(?:script|iframe|img|source|video|link)\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    for (const name of ['src', 'href', 'poster']) {
      if (attrs[name]) require(/^\/(?!\/)/.test(attrs[name]), 'Home resources must remain local');
    }
    require(!/^<iframe/i.test(match[0]), 'Home must not embed external applications');
  }
  const code = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).concat(scripts).join('\n');
  require(!/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon\s*\(|localStorage|sessionStorage|indexedDB|gtag\s*\(|dataLayer)|document\s*\.\s*cookie\s*=/.test(code),
    'Home must not send requests, activate analytics or persist visitor data');
  require(JSON.stringify([...routeFiles].sort()) === JSON.stringify(HOME_ROUTE_FILES), 'Home routes must remain /, /en and /de only');
  require(!publicFiles.some(path => /(?:^|\/)\.|(?:^|\/)(?:robots\.txt|sitemap[^/]*\.xml)$/.test(path)), 'Home must not add hidden files, robots or sitemaps');
  require(publicFiles.every(path => path === 'index.html' || (path.startsWith('assets/') && !/\.html?$/i.test(path))),
    'Home public files must be its canonical index and assets, not additional pages');
  return { schemaVersion: 1, subsystem: 'Home', ok: violations.length === 0, violations,
    routes: HOME_ROUTES, publicationAuthorized: false };
}

export function assertHomeContract(app) {
  assert(!existsSync(join(app, 'pages')) && !existsSync(join(app, 'src'))
    && !readdirSync(app).some(name => /^(?:proxy|middleware)\./.test(name)), 'Home must not add another router or request interceptor');
  const files = inventory(join(app, 'public'));
  const result = inspectHomeContract({
    html: readFileSync(join(app, 'public/index.html'), 'utf8'),
    scripts: files.filter(file => /\.(?:m?js)$/.test(file.path)).map(file => readFileSync(join(app, 'public', file.path), 'utf8')),
    routeFiles: inventory(join(app, 'app')).filter(file => file.path !== 'generated-home-html.js').map(file => file.path),
    publicFiles: files.map(file => file.path),
  });
  assert(result.ok, result.violations.join('; '));
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(assertHomeContract(fileURLToPath(new URL('../apps/public-site', import.meta.url))), null, 2));
}
