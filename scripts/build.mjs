#!/usr/bin/env node
/**
 * build.mjs — render estático sin dependencias.
 *
 * Lee data/brand.json y src/index.html (+ src/partials/*.html) y escribe
 * index.html en la raíz, con <title>, meta, Open Graph y JSON-LD resueltos en
 * build. El HTML de salida es 100% estático: no hay fetch ni inyección de marca
 * en runtime.
 *
 * Sintaxis de plantilla:
 *   {{ ruta.punteada }}    → valor escapado para HTML/atributos
 *   {{{ ruta.punteada }}}  → valor en crudo (fragmentos HTML ya seguros)
 *   {{> nombre-parcial }}  → incrusta src/partials/<nombre>.html (recursivo)
 *
 * Uso: node scripts/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const OUT_DIR = path.join(ROOT, 'dist');   // directorio servido (outputDirectory en vercel.json)
const ASSETS = ['css', 'img'];             // activos que se copian tal cual a dist/

const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'brand.json'), 'utf8'));

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// ---- Derivados de marca (única fuente: data/brand.json) ----
const nombre = brand.nombre || '';
const claim = brand.claim || '';
const noPend = (v) => v && String(v).indexOf('PENDIENTE') < 0;

// Logotipo bicolor: las 2 últimas letras van en color de acento (constante de plantilla).
const TAIL = 2;
const cut = Math.max(0, nombre.length - TAIL);
const logoInner = esc(nombre.slice(0, cut)) + '<span>' + esc(nombre.slice(cut)) + '</span>';

const titleText = nombre ? `${nombre} — ${claim}` : claim;
const descText = `${nombre} — reparación de pavimentos industriales: juntas, fisuras, recrecidos y tratamientos superficiales. Intervenciones planificadas con mínima parada de actividad.`;

// JSON-LD resuelto en build
const ld = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: nombre,
  description: `${claim}: juntas, fisuras, recrecidos y tratamientos superficiales.`,
  areaServed: ['España', 'Europa'],
  openingHours: 'Mo-Fr 08:00-18:00',
};
if (brand.email) ld.email = brand.email;
if (brand.dominio) ld.url = 'https://' + brand.dominio;
if (noPend(brand.telefono)) ld.telephone = brand.telefono;
if (noPend(brand.direccion)) ld.address = brand.direccion;
const jsonld = JSON.stringify(ld, null, 2);

// Navegación: única fuente de los enlaces → se renderiza a 3 variantes.
// Añadir aquí un item lo publica en las tres barras (móvil, sticky y hero).
const NAV = [
  ['proceso', 'Proceso'],
  ['servicios', 'Servicios'],
  ['empresa', 'Empresa'],
  ['faq', 'FAQ'],
];
const navHeroLinks = NAV.map(([id, l]) => `<li><a href="#${id}">${l}</a></li>`).join('\n      ');
const navStickyLinks = NAV.map(([id, l]) => `<li><a href="#${id}" data-sec="${id}">${l}</a></li>`).join('\n      ');
const navMobileLinks = NAV.map(([id, l]) => `<a href="#${id}" onclick="menuMovil.classList.remove('abierto')">${l}</a>`).join('\n  ');

const ctx = {
  brand,
  logoInner,
  ctaText: 'Pide una evaluación',
  capaCtaText: 'Pedir evaluación →',
  titleText,
  descText,
  ogTitle: titleText,
  jsonld,
  navHeroLinks,
  navStickyLinks,
  navMobileLinks,
};

// ---- Motor de plantillas mínimo ----
function inlinePartials(str, depth = 0) {
  if (depth > 10) throw new Error('Recursión de parciales demasiado profunda');
  return str.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    const file = path.join(SRC, 'partials', name + '.html');
    return inlinePartials(fs.readFileSync(file, 'utf8').replace(/\n$/, ''), depth + 1);
  });
}
const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

function render(str) {
  str = inlinePartials(str);
  str = str.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, p) => { const v = get(ctx, p); return v == null ? '' : String(v); });
  str = str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, p) => { const v = get(ctx, p); return v == null ? '' : esc(v); });
  return str;
}

const out = render(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));

// Ninguna marca de plantilla debe quedar sin resolver.
const leftover = out.match(/\{\{[^}]*\}\}/g);
if (leftover) throw new Error('Placeholders sin resolver: ' + leftover.join(', '));

// dist/ contiene SOLO lo que se sirve (index.html + activos). Ni src/ ni
// scripts/ ni data/ ni *.md llegan aquí → en producción devuelven 404.
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), out);
for (const dir of ASSETS) {
  fs.cpSync(path.join(ROOT, dir), path.join(OUT_DIR, dir), { recursive: true });
}
console.log('build OK → dist/  (index.html', `${out.length} bytes  +  ${ASSETS.join('/ + ')}/)`);
