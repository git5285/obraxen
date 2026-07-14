#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = spawnSync(process.execPath, ['scripts/build.mjs'], {
  cwd: ROOT,
  encoding: 'utf8',
});
if (build.stdout) process.stdout.write(build.stdout);
if (build.status !== 0) {
  if (build.stderr) process.stderr.write(build.stderr);
  process.exit(build.status || 1);
}

const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
const errors = [];
for (const file of ['data/brand.json', 'data/proyectos.json', 'data/proyectos.schema.json', 'vercel.json']) {
  try {
    JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch (error) {
    errors.push(`${file} no contiene JSON válido: ${error.message}`);
  }
}
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'brand.json'), 'utf8'));
const temporaryName = String(brand.nombreTemporalNoPublicable || '').trim();
if (temporaryName && html.toLocaleLowerCase('es').includes(temporaryName.toLocaleLowerCase('es'))) {
  errors.push(`La salida pública contiene el nombre temporal no publicable: ${temporaryName}`);
}
const requiredFiles = ['index.html', 'aviso-legal/index.html', 'privacidad/index.html', 'robots.txt', 'css/tokens.css', 'img/hero-nave.jpg'];
if (brand.dominio) requiredFiles.push('sitemap.xml');
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, 'dist', file))) errors.push(`Falta dist/${file}`);
}

for (const [label, pattern] of [
  ['plantillas sin resolver', /\{\{[^}]*\}\}/],
  ['datos pendientes', /«PENDIENTE»|\[Nombre Apellido\]|\[B-00000000\]|\[Calle, nº, CP, Ciudad\]/],
  ['formulario con action #', /<form[^>]+action="#"/],
  ['teléfono inválido', /href="tel:(?:|null|undefined|«)/],
]) {
  if (pattern.test(html)) errors.push(`La salida contiene ${label}`);
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicates.length) errors.push(`IDs duplicados: ${[...new Set(duplicates)].join(', ')}`);
const idSet = new Set(ids);
const missingAnchors = [...html.matchAll(/href="#([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id) => !idSet.has(id));
if (missingAnchors.length) errors.push(`Anclas inexistentes: ${[...new Set(missingAnchors)].join(', ')}`);

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
for (const script of scripts) {
  if (!script.trim()) continue;
  try {
    if (script.trim().startsWith('{')) JSON.parse(script);
    else new Function(script);
  } catch (error) {
    errors.push(`Script inválido: ${error.message}`);
  }
}

const seoMarkers = ['name="twitter:card"', 'type="application/ld+json"'];
if (brand.dominio) seoMarkers.push('rel="canonical"', 'property="og:image"');
for (const marker of seoMarkers) {
  if (!html.includes(marker)) errors.push(`Falta ${marker}`);
}
const externalScripts = [...html.matchAll(/<script[^>]+src="https:[^"]+"[^>]*>/g)].map((match) => match[0]);
if (externalScripts.some((tag) => !tag.includes('integrity=') || !tag.includes('crossorigin='))) {
  errors.push('Hay scripts externos sin SRI/crossorigin');
}

if (errors.length) {
  console.error('\nCHECK FALLIDO\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check OK → build, datos, anclas, scripts, SEO y activos verificados');
