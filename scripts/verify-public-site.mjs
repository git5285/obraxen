import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { assertHomeContract } from './home-contract.mjs';
import { inventory, verifyServedInventory } from './public-site-evidence.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
assert(args.every(arg => arg === '--compare-production' || arg.startsWith('--url=') || arg.startsWith('--compare-url=')), 'unknown Home verification option');
const targetArgument = args.find(arg => arg.startsWith('--compare-url='))?.slice(14);
assert(!(targetArgument && args.includes('--compare-production')), 'choose one comparison destination');
const compare = args.includes('--compare-production') || Boolean(targetArgument);
const suppliedUrl = args.find(arg => arg.startsWith('--url='))?.slice(6);
const output = new URL('../test-results/published-home/', import.meta.url);
await mkdir(output, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = await readFile(new URL('../apps/public-site/public/index.html', import.meta.url));
const provenance = JSON.parse(await readFile(new URL('../docs/published-site-source.json', import.meta.url), 'utf8'));
const destination = compare ? new URL(targetArgument || provenance.productionUrl).origin : null;
const contract = assertHomeContract(fileURLToPath(new URL('../apps/public-site', import.meta.url)));
const currentFiles = inventory(fileURLToPath(new URL('../apps/public-site/public', import.meta.url)));
let server;
let browser;
let serverLog = '';
const report = { checkedAt: new Date().toISOString(), comparison: compare, comparisonDestination: destination,
  recoverySourceDeploymentId: provenance.deploymentId, contract, routes: [], assets: [], browser: [] };

async function localServer() {
  if (suppliedUrl) {
    const url = new URL(suppliedUrl);
    assert(['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname), '--url must be local');
    return url.origin;
  }
  const reservation = createServer();
  await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(0, '127.0.0.1', resolve); });
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  server = spawn(process.execPath, ['scripts/public-site.mjs', 'start', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => { serverLog += data; });
  server.stderr.on('data', data => { serverLog += data; });
  const url = `http://127.0.0.1:${port}`;
  await expect.poll(async () => {
    if (server.exitCode !== null) throw new Error(serverLog);
    try { return (await fetch(url)).status; } catch { return 0; }
  }, { timeout: 20000 }).toBe(200);
  return url;
}

const variants = [
  { path: '/', lang: 'es', title: 'Obraxen · Reparación de pavimentos industriales', h1: /Recuperamos tus pavimentos/ },
  { path: '/en', lang: 'en', title: 'Obraxen · Industrial floor repair', h1: /We restore your floors/ },
  { path: '/de', lang: 'de', title: 'Obraxen · Reparatur von Industrieböden', h1: /Wir/ },
];

async function capturePage(page, output, label) {
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = 'eager';
    await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
    await document.fonts.ready;
  });
  // Verify actual video load/playback before freezing a common frame for screenshots.
  await page.locator('#hero-background-video').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const video = document.querySelector('video');
    return video.readyState >= 2 && video.currentTime > 0;
  }, null, { timeout: 20000 });
  await page.locator('.hero-video-toggle').click();
  await page.waitForFunction(() => document.querySelector('video').paused);
  await page.evaluate(() => { document.querySelector('video').currentTime = 0; window.scrollTo(0, 0); });
  await page.waitForFunction(() => !document.querySelector('video').seeking);
  const snapshot = await page.evaluate(() => {
    const visible = element => element.checkVisibility({ checkVisibilityCSS: true });
    const elements = [...document.querySelectorAll('h1,h2,h3,header a,main section,footer,.hero-image,.project-cover')].filter(visible);
    return {
      lang: document.documentElement.lang, title: document.title,
      text: document.body.innerText.replace(/\s+/g, ' ').trim(),
      elements: elements.map(element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { tag: element.tagName, id: element.id, text: element.textContent.trim().replace(/\s+/g, ' '), box: [rect.x, rect.y, rect.width, rect.height].map(n => Math.round(n * 100) / 100), color: style.color, font: style.font, background: style.backgroundColor };
      }),
      links: [...document.querySelectorAll('a[href]')].filter(visible).map(a => a.getAttribute('href')),
      images: [...document.images].map(image => ({ path: new URL(image.currentSrc || image.src).pathname, width: image.naturalWidth, height: image.naturalHeight })),
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  assert.equal(snapshot.overflow, false, `${label}: horizontal page overflow`);
  assert(snapshot.images.every(image => image.width > 0), `${label}: broken image`);
  assert(snapshot.links.every(href => /^(#|tel:|mailto:|\/$|\/en\/?$|\/de\/?$)/.test(href)), `${label}: unexpected active link`);
  const screenshot = await page.screenshot({ path: fileURLToPath(new URL(`${label}.png`, output)), fullPage: true, animations: 'disabled' });
  return { snapshot, screenshot };
}

async function inspectNavigation(page, viewport) {
  if (viewport.width < 700) {
    await page.locator('#menu-toggle').click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await expect(page.locator('#mobile-nav a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu-toggle')).toBeFocused();
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await page.locator('#menu-toggle').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('header .nav a').first()).toBeFocused();
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await page.setViewportSize(viewport);
    await expect(page.locator('#menu-toggle')).toBeFocused();
    await page.locator('#menu-toggle').click();
    await page.locator('#mobile-nav a[href="#projects"]').click();
    await expect(page.locator('#mobile-nav')).toBeHidden();
  } else await page.locator('header .nav a[href="#projects"]').click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(page.locator('#projects')).toBeFocused();
  await page.locator('#project-next').click();
  await expect.poll(() => page.locator('#project-rail').evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
  if (viewport.width < 700) await page.locator('#sector-select').selectOption('industria');
  else await page.locator('#tab-industria').click();
  await expect(page.locator('#panel-industria')).toBeVisible();
  await expect(page.locator('#panel-logistica')).toBeHidden();
}

async function inspectEnquiry(page, variant, label) {
  await page.locator('#hero-repair-trigger').click();
  await expect(page.locator('#hero-repair-menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#hero-repair-menu')).toBeHidden();
  await expect(page.locator('#hero-repair-trigger')).toBeFocused();
  await page.locator('#hero-repair-trigger').click();
  await page.locator('#hero-repair-menu [data-repair]').first().click();
  await expect(page.locator('#enquiry-context')).toBeVisible();
  await page.locator('#enquiry-review').click();
  await expect(page.locator('#enquiry-name')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#enquiry-name').fill('Prueba local');
  await page.locator('#enquiry-contact').fill('invalid');
  await page.locator('#enquiry-review').click();
  await expect(page.locator('#enquiry-contact')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#enquiry-contact').fill('prueba@example.invalid');
  await page.locator('#enquiry-message').fill('Comprobación local de paridad, sin envío.');
  await page.locator('#enquiry-review').click();
  await expect(page.locator('#enquiry-status a')).toHaveAttribute('href', /^mailto:info@obraxen\.com\?/);
  const draft = new URL(await page.locator('#enquiry-status a').getAttribute('href'));
  assert(draft.searchParams.get('body').includes('Prueba local'));
  assert(draft.searchParams.get('body').includes('prueba@example.invalid'));
  assert(draft.searchParams.get('body').includes('Comprobación local de paridad, sin envío.'));
  const selectedContext = await page.locator('#enquiry-context').textContent();
  assert(draft.searchParams.get('body').includes(selectedContext));
  await page.locator('#enquiry-context-clear').click();
  await expect(page.locator('#enquiry-message')).toHaveValue('Comprobación local de paridad, sin envío.');
  await expect(page.locator('#enquiry-context')).toBeHidden();
  if (variant.lang !== 'es') {
    await expect(page.locator('#enquiry-status')).not.toContainText('Selección eliminada');
    assert.notEqual(draft.searchParams.get('subject'), 'Consulta sobre pavimento');
  }
  // Every migrated sector prompt and both length branches must remain translated.
  for (const sector of ['logistica', 'industria', 'automocion', 'distribucion', 'alimentacion', 'aparcamientos']) {
    const mobile = (await page.viewportSize()).width < 700;
    if (mobile) await page.locator('#sector-select').selectOption(sector);
    else await page.locator('#tab-' + sector).click();
    await page.locator('#panel-' + sector + ' .sector-card').first().click();
    await expect(page.locator('#enquiry-message')).toHaveAttribute('placeholder',
      await page.evaluate(key => window.obraxenI18n.message(key), 'contact.prompt.' + sector));
  }
  await page.locator('#enquiry-message').fill('X');
  await page.locator('#enquiry-review').click();
  await expect(page.locator('#enquiry-message')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#enquiry-message').fill('Comprobación local de paridad, sin envío.');
  await page.locator('#enquiry-name').evaluate(field => {
    field.value = 'X'.repeat(field.maxLength + 1);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await expect(page.locator('#enquiry-name')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#enquiry-name').fill('Prueba local');
  await page.locator('#enquiry-contact').fill('+34 600 000 000');
  await page.locator('#enquiry-review').click();
  await expect(page.locator('#enquiry-status a')).toHaveAttribute('href', /^mailto:info@obraxen\.com\?/);
  assert.deepEqual(await page.evaluate(() => window.obraxenI18n.missingTranslations), [], `${label}: missing dynamic translations`);
}

async function inspectDisclosuresAndLanguage(page, variant) {
  const details = page.locator('.footer-legal-disclosure').first();
  await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  const otherLocale = variant.lang === 'en' ? 'de' : 'en';
  const hash = new URL(page.url()).hash;
  const languageLink = page.locator(`.language-switcher a[lang="${otherLocale}"]`);
  await expect(languageLink).toHaveAttribute('href', `/${otherLocale}/${hash}`);
  await languageLink.click();
  await expect(page.locator('html')).toHaveAttribute('lang', otherLocale);
  assert.equal(new URL(page.url()).hash, hash, 'language switch must retain the current section');
}

async function inspectLanguageHistory(origin, variant, viewport) {
  const context = await browser.newContext({viewport, reducedMotion: 'reduce'});
  const page = await context.newPage();
  try {
    const assertLinks = async hash => {
      for (const lang of ['es', 'en', 'de']) {
        await expect(page.locator(`.language-switcher a[lang="${lang}"]`))
          .toHaveAttribute('href', (lang === 'es' ? '/' : `/${lang}/`) + hash);
      }
    };
    for (const target of variants.filter(item => item.lang !== variant.lang)) {
      await page.goto(origin + variant.path + '#projects');
      await assertLinks('#projects');
      const nav = viewport.width < 700 ? '#mobile-nav' : 'header .nav';
      if (viewport.width < 700) await page.locator('#menu-toggle').click();
      await page.locator(`${nav} a[href="#contact"]`).click();
      await expect(page).toHaveURL(/#contact$/);
      await assertLinks('#contact');
      await page.goBack();
      await expect(page).toHaveURL(/#projects$/);
      await assertLinks('#projects');
      await page.goForward();
      await expect(page).toHaveURL(/#contact$/);
      await assertLinks('#contact');
      await page.evaluate(() => { location.hash = '#servicios'; });
      await assertLinks('#servicios');
      await page.goBack();
      await assertLinks('#contact');
      const link = page.locator(`.language-switcher a[lang="${target.lang}"]`);
      // Native links must also carry the updated section into a new tab.
      const newPage = context.waitForEvent('page');
      await link.click({button: 'middle'});
      const tab = await newPage;
      await expect(tab.locator('html')).toHaveAttribute('lang', target.lang);
      assert.equal(new URL(tab.url()).hash, '#contact');
      await tab.close();
      await link.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('html')).toHaveAttribute('lang', target.lang);
      assert.equal(new URL(page.url()).hash, '#contact');
    }
  } finally { await context.close(); }
}

async function inspect(origin, variant, viewport, label, htmlOverride) {
  const context = await browser.newContext({ viewport, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  const errorStacks = [];
  const failedRequests = [];
  const externalRequests = [];
  const forbiddenRequests = [];
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !['GET', 'HEAD'].includes(request.method()) || url.pathname.startsWith('/api/')) {
      forbiddenRequests.push({ url: request.url(), method: request.method() });
      await route.abort();
    } else await route.continue();
  });
  page.on('pageerror', error => { errors.push(error.message); errorStacks.push(error.stack); });
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') failedRequests.push({ url: request.url(), error: request.failure()?.errorText });
  });
  page.on('request', request => {
    if (!request.url().startsWith(origin + '/') && /^https?:/.test(request.url())) externalRequests.push(request.url());
  });
  if (htmlOverride) await page.route(origin + variant.path, route => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8', body: htmlOverride,
  }));
  await page.goto(origin + variant.path, { waitUntil: 'load' });
  await expect(page.locator('html')).toHaveAttribute('lang', variant.lang);
  await expect(page).toHaveTitle(variant.title);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('h1')).toContainText(htmlOverride && variant.lang === 'es'
    ? /Recuperamos tus pavimentos industriales/ : variant.h1);
  await expect(page.locator('#enquiry-review')).toBeEnabled();
  assert.deepEqual(await page.evaluate(() => window.obraxenI18n.missingTranslations), [], `${label}: missing initial translations`);
  const { snapshot, screenshot } = await capturePage(page, output, label);

  // Landing navigation, mobile menu, repair dialog, carousel, sectors, local-only enquiry and legal disclosures.
  await inspectNavigation(page, viewport);
  await inspectEnquiry(page, variant, label);
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }));
  assert.deepEqual(storage, { local: 0, session: 0 }, `${label}: visitor data stored`);
  assert.deepEqual(await context.cookies(), [], `${label}: cookies created`);
  await inspectDisclosuresAndLanguage(page, variant);
  assert.deepEqual(errors, [], `${label}: unexpected browser errors`);
  assert.deepEqual(failedRequests, [], `${label}: failed requests`);
  assert.deepEqual(externalRequests, [], `${label}: external request`);
  assert.deepEqual(forbiddenRequests, [], `${label}: API, sending or external request`);
  await context.close();
  return { snapshot, screenshot: sha(screenshot), errors, errorStacks, failedRequests, interactions: 'passed' };
}

try {
  const local = await localServer();
  report.localUrl = local;
  for (const variant of variants) {
    const response = await fetch(local + variant.path);
    assert.equal(response.status, 200);
    const html = Buffer.from(await response.arrayBuffer());
    assert.equal(sha(html), sha(source), `local ${variant.path}: served HTML differs from canonical source`);
    const entry = { path: variant.path, localHtmlSha256: sha(html) };
    if (compare) {
      const remote = await fetch(destination + variant.path, { redirect: 'error' });
      assert.equal(remote.status, 200);
      entry.destinationHtmlSha256 = sha(Buffer.from(await remote.arrayBuffer()));
      assert.equal(entry.destinationHtmlSha256, entry.localHtmlSha256, `destination drift at ${variant.path}`);
    }
    report.routes.push(entry);
  }
  report.assets = await verifyServedInventory(local, currentFiles);
  if (compare) report.destinationAssets = await verifyServedInventory(destination, currentFiles);
  for (const path of ['/es', '/fr', '/api/contact', '/api/analytics-config', '/robots.txt', '/sitemap.xml']) {
    assert.equal((await fetch(local + path, { redirect: 'manual' })).status, 404, `Home exposes excluded route: ${path}`);
  }
  browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    for (const variant of variants) {
      const label = `${variant.lang}-${viewport.width}`;
      const localResult = await inspect(local, variant, viewport, `local-${label}`);
      const entry = { lang: variant.lang, viewport, local: localResult };
      if (compare) {
        entry.destination = await inspect(destination, variant, viewport, `destination-${label}`);
        assert.deepEqual(localResult.errors, entry.destination.errors, `new browser error: ${label}`);
        assert.deepEqual(localResult.snapshot, entry.destination.snapshot, `rendered DOM differs: ${label}`);
        assert.equal(localResult.screenshot, entry.destination.screenshot, `screenshot differs: ${label}`);
      }
      report.browser.push(entry);
      await inspectLanguageHistory(local, variant, viewport);
      console.log(`PASS ${label}: content, images, navigation, video, carousel, sectors, dialog, enquiry, languages, legal${compare ? ', destination parity' : ''}`);
    }
  }
  // Editorial edits must not change the error contract or lose keyed translations.
  const editorialHtml = source.toString().replace('Recuperamos tus pavimentos. ', 'Recuperamos tus pavimentos industriales. ')
    + '\n<!-- harmless editorial change -->';
  for (const variant of variants.slice(0, 2)) {
    await inspect(local, variant, { width: 390, height: 844 }, `local-copy-edit-${variant.lang}`, editorialHtml);
  }
  const missingTranslationContext = await browser.newContext();
  const missingPage = await missingTranslationContext.newPage();
  await missingPage.route(local + '/en', route => route.fulfill({
    status: 200, contentType: 'text/html; charset=utf-8',
    body: source.toString().replace('id="services-title">Soluciones', 'id="services-title">Soluciones pendientes de traducir'),
  }));
  await missingPage.goto(local + '/en');
  await missingPage.waitForFunction(() => window.obraxenI18n);
  assert((await missingPage.evaluate(() => window.obraxenI18n.missingTranslations))
    .includes('Soluciones pendientes de traducir'), 'unknown editorial copy must be reported');
  await missingTranslationContext.close();
  for (const lang of ['en', 'de']) {
    const dynamicContext = await browser.newContext();
    const dynamicPage = await dynamicContext.newPage();
    await dynamicPage.goto(local + '/' + lang);
    await dynamicPage.waitForFunction(() => window.obraxenI18n);
    await dynamicPage.evaluate(() => {
      const text = document.createElement('p');
      text.id = 'translation-probe';
      text.textContent = 'Mensaje dinámico pendiente';
      document.body.append(text);
    });
    await expect.poll(() => dynamicPage.evaluate(() => window.obraxenI18n.missingTranslations))
      .toContain('Mensaje dinámico pendiente');
    await dynamicPage.locator('#translation-probe').evaluate(element => {
      element.firstChild.nodeValue = 'Mensaje dinámico modificado';
      element.setAttribute('title', 'Atributo dinámico pendiente');
    });
    await expect.poll(() => dynamicPage.evaluate(() => window.obraxenI18n.missingTranslations))
      .toEqual(['Atributo dinámico pendiente', 'Mensaje dinámico modificado', 'Mensaje dinámico pendiente']);
    await dynamicContext.close();
  }
  report.dynamicTranslationAudit = 'passed';
  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await noScript.newPage();
  await page.goto(local);
  await expect(page.locator('h1')).toContainText('Recuperamos tus pavimentos.');
  await expect(page.locator('header .nav a[href="#projects"]')).toBeVisible();
  await expect(page.locator('.contact-direct a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:info@obraxen.com');
  assert.deepEqual(await page.locator('a[href]').evaluateAll(links => links.map(a => a.getAttribute('href'))
    .filter(href => !/^(#|tel:|mailto:)/.test(href))), [], 'no-script: inactive interior links');
  await noScript.close();
  report.editorialChange = 'passed';
  report.noScript = 'passed';
  report.result = 'passed';
} catch (error) {
  report.result = 'failed';
  report.error = error.stack;
  if (serverLog) console.error(serverLog);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server) {
    server.kill('SIGTERM');
    await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
  }
  await writeFile(new URL(compare ? 'comparison.json' : 'checks.json', output), JSON.stringify(report, null, 2) + '\n');
}
