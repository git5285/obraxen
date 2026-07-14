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
const projects = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'proyectos.json'), 'utf8'));
const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const temporaryName = String(brand.nombreTemporalNoPublicable || '').trim();
if (brand.publicar !== true && vercelConfig.git?.deploymentEnabled !== false) {
  errors.push('Los despliegues automáticos deben permanecer desactivados mientras brand.publicar no sea true');
}
const hasContactChannel = ['email', 'telefono', 'whatsapp'].some((key) => String(brand[key] || '').trim());
const expectedCtaHref = hasContactChannel ? '#contacto' : (projects.length ? '#proyectos' : '#servicios');
const ctaTargets = [...html.matchAll(/<a class="(?:btn btn-acento|capa-cta)" href="([^"]+)"/g)].map((match) => match[1]);
if (!ctaTargets.length || ctaTargets.some((href) => href !== expectedCtaHref)) {
  errors.push(`Los CTA deben apuntar a ${expectedCtaHref} en el estado actual`);
}
if (!hasContactChannel && /Pide una evaluación|Pedir evaluación/.test(html)) {
  errors.push('La preview no debe pedir una evaluación mientras no exista un canal de contacto');
}
if (!hasContactChannel && /<div class="cta-fila">|Canal de contacto pendiente|id="formContacto"/.test(html)) {
  errors.push('La preview no debe mostrar un bloque de captación mientras no exista un canal de contacto');
}
if (!String(brand.fundadorNombre || '').trim() && html.includes('Quiénes estamos detrás')) {
  errors.push('La preview no debe mostrar el bloque de equipo mientras falte el nombre del fundador');
}
const projectFiles = projects.map((project) => `proyectos/${project.slug}/index.html`);
const requiredFiles = ['index.html', 'aviso-legal/index.html', 'privacidad/index.html', 'robots.txt', 'css/tokens.css', 'css/case.css', 'img/hero-nave.jpg', ...projectFiles];
if (brand.dominio) requiredFiles.push('sitemap.xml');
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, 'dist', file))) errors.push(`Falta dist/${file}`);
}
const generatedHtml = [
  ['inicio', html],
  ['aviso-legal', fs.readFileSync(path.join(ROOT, 'dist', 'aviso-legal', 'index.html'), 'utf8')],
  ['privacidad', fs.readFileSync(path.join(ROOT, 'dist', 'privacidad', 'index.html'), 'utf8')],
  ...projects.map((project) => [
    `proyectos/${project.slug}`,
    fs.readFileSync(path.join(ROOT, 'dist', 'proyectos', project.slug, 'index.html'), 'utf8'),
  ]),
];
if (temporaryName && generatedHtml.some(([, output]) => output.toLocaleLowerCase('es').includes(temporaryName.toLocaleLowerCase('es')))) {
  errors.push(`La salida pública contiene el nombre temporal no publicable: ${temporaryName}`);
}

for (const [label, pattern] of [
  ['plantillas sin resolver', /\{\{[^}]*\}\}/],
  ['datos pendientes', /«PENDIENTE»|\[Nombre Apellido\]|\[B-00000000\]|\[Calle, nº, CP, Ciudad\]/],
  ['formulario con action #', /<form[^>]+action="#"/],
  ['teléfono inválido', /href="tel:(?:|null|undefined|«)/],
]) {
  const affectedRoutes = generatedHtml.filter(([, output]) => pattern.test(output)).map(([route]) => route);
  if (affectedRoutes.length) errors.push(`La salida contiene ${label} en: ${affectedRoutes.join(', ')}`);
}

for (const project of projects) {
  const route = `/proyectos/${project.slug}/`;
  const caseHtml = generatedHtml.find(([name]) => name === `proyectos/${project.slug}`)?.[1] || '';
  if (!html.includes(`href="${route}"`)) errors.push(`La portada no enlaza el caso ${project.slug}`);
  if ((caseHtml.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${project.slug}: debe existir un único h1`);
  if ((caseHtml.match(/<figure>/g) || []).length !== project.imagenes.length) errors.push(`${project.slug}: número de fotografías incorrecto`);
  for (const marker of ['class="breadcrumbs"', 'class="scope-rail"', 'class="case-narrative"']) {
    if (!caseHtml.includes(marker)) errors.push(`${project.slug}: falta ${marker}`);
  }
  if (brand.publicar !== true && !caseHtml.includes('name="robots" content="noindex,nofollow"')) {
    errors.push(`${project.slug}: debe permanecer noindex en preview`);
  }
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
const allGeneratedHtml = generatedHtml.map(([, output]) => output).join('\n');
const externalScripts = [...allGeneratedHtml.matchAll(/<script[^>]+src="https:[^"]+"[^>]*>/g)].map((match) => match[0]);
if (externalScripts.some((tag) => !tag.includes('integrity=') || !tag.includes('crossorigin='))) {
  errors.push('Hay scripts externos sin SRI/crossorigin');
}
const externalStyles = [...allGeneratedHtml.matchAll(/<link[^>]+href="https:[^"]+"[^>]*>/g)].map((match) => match[0]);
if (externalScripts.length || externalStyles.length) {
  errors.push('La preview no debe depender de scripts ni estilos de terceros');
}
for (const claim of ['Tu planta no se detiene', 'Mínima parada de actividad', 'bien a la primera', 'control de polvo y residuos', 'sin compromiso', 'empresa nueva']) {
  if (allGeneratedHtml.toLocaleLowerCase('es').includes(claim.toLocaleLowerCase('es'))) {
    errors.push(`La salida contiene una afirmación no aprobada: ${claim}`);
  }
}

if (errors.length) {
  console.error('\nCHECK FALLIDO\n- ' + errors.join('\n- '));
  process.exit(1);
}
console.log('check OK → build, datos, anclas, scripts, SEO y activos verificados');
