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

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  } catch (error) {
    errors.push(`${file} no contiene JSON válido: ${error.message}`);
    return fallback;
  }
}

const brand = readJson('data/brand.json', {});
const projects = readJson('data/proyectos.json', []);
const projectSchema = readJson('data/proyectos.schema.json', {});
const offers = readJson('data/ofertas.json', []);
const offerSchema = readJson('data/ofertas.schema.json', {});
const vercelConfig = readJson('vercel.json', {});
const temporaryName = String(brand.nombreTemporalNoPublicable || '').trim();

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nullableText = (value) => value === null || (typeof value === 'string' && value.trim().length > 0);
const nonEmptyText = (value) => typeof value === 'string' && value.trim().length > 0;
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const validDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const projectRequired = new Set(projectSchema?.items?.required || []);
for (const field of ['plazoPrevisto', 'cierre']) {
  if (!projectRequired.has(field)) errors.push(`data/proyectos.schema.json debe exigir ${field}`);
}
const offerRequired = new Set(offerSchema?.items?.required || []);
for (const field of ['slug', 'prioridad', 'estadoInterno', 'estadoPublicacion', 'evidencia', 'traducciones']) {
  if (!offerRequired.has(field)) errors.push(`data/ofertas.schema.json debe exigir ${field}`);
}

if (!Array.isArray(projects)) errors.push('data/proyectos.json debe contener un array');
if (!Array.isArray(offers)) errors.push('data/ofertas.json debe contener un array');
const projectSlugs = new Set();
for (const project of Array.isArray(projects) ? projects : []) {
  const label = nonEmptyText(project?.slug) ? project.slug : 'proyecto sin slug';
  if (!slugPattern.test(String(project?.slug || ''))) errors.push(`${label}: slug de proyecto inválido`);
  if (projectSlugs.has(project?.slug)) errors.push(`${label}: slug de proyecto duplicado`);
  projectSlugs.add(project?.slug);
  if (!own(project, 'plazoPrevisto') || !nullableText(project.plazoPrevisto)) {
    errors.push(`${label}: plazoPrevisto debe ser texto no vacío o null`);
  }
  const closure = project?.cierre;
  if (!closure || typeof closure !== 'object' || Array.isArray(closure)) {
    errors.push(`${label}: cierre debe ser un objeto`);
    continue;
  }
  for (const field of ['entregaConforme', 'correccionesPosteriores']) {
    if (typeof closure[field] !== 'boolean') errors.push(`${label}: cierre.${field} debe ser booleano`);
  }
  if (!nonEmptyText(closure.fuente)) errors.push(`${label}: cierre.fuente es obligatorio`);
  if (!validDate(closure.confirmadoEl)) errors.push(`${label}: cierre.confirmadoEl debe ser una fecha YYYY-MM-DD válida`);
  for (const field of ['fechaEjecucion', 'duracionReal', 'resultadoAdicional']) {
    if (!own(closure, field) || !nullableText(closure[field])) {
      errors.push(`${label}: cierre.${field} debe ser texto no vacío o null`);
    }
  }
  if (!own(closure, 'continuidadOperativa') || ![null, 'total', 'parcial', 'detenida'].includes(closure.continuidadOperativa)) {
    errors.push(`${label}: cierre.continuidadOperativa debe ser total, parcial, detenida o null`);
  }
}

const validInternalStates = new Set(['preparar_ahora', 'oferta_central', 'desarrollo_controlado']);
const validPublicationStates = new Set(['borrador_interno', 'preparada_preview', 'publicable']);
const offerSlugs = new Set();
const offerPriorities = new Set();
for (const offer of Array.isArray(offers) ? offers : []) {
  const label = nonEmptyText(offer?.slug) ? offer.slug : 'oferta sin slug';
  if (!slugPattern.test(String(offer?.slug || ''))) errors.push(`${label}: slug de oferta inválido`);
  if (offerSlugs.has(offer?.slug)) errors.push(`${label}: slug de oferta duplicado`);
  offerSlugs.add(offer?.slug);
  if (!Number.isInteger(offer?.prioridad) || offer.prioridad < 1) {
    errors.push(`${label}: prioridad debe ser un entero positivo`);
  } else if (offerPriorities.has(offer.prioridad)) {
    errors.push(`${label}: prioridad de oferta duplicada`);
  }
  offerPriorities.add(offer?.prioridad);
  if (!validInternalStates.has(offer?.estadoInterno)) errors.push(`${label}: estadoInterno inválido`);
  if (!validPublicationStates.has(offer?.estadoPublicacion)) errors.push(`${label}: estadoPublicacion inválido`);
  for (const field of ['compradores', 'problemas', 'alcance', 'limites', 'condicionesSalida']) {
    if (!Array.isArray(offer?.[field]) || !offer[field].length || offer[field].some((item) => !nonEmptyText(item))) {
      errors.push(`${label}: ${field} debe contener textos no vacíos`);
    }
  }
  if (!Array.isArray(offer?.evidencia)) {
    errors.push(`${label}: evidencia debe ser un array`);
  } else {
    for (const item of offer.evidencia) {
      if (!projectSlugs.has(item?.proyecto)) errors.push(`${label}: evidencia referencia un proyecto inexistente (${item?.proyecto || 'vacío'})`);
      if (!nonEmptyText(item?.acredita)) errors.push(`${label}: cada evidencia debe explicar qué acredita`);
    }
  }
  const es = offer?.traducciones?.es;
  for (const field of ['titulo', 'entradilla', 'propuesta', 'cta']) {
    if (!nonEmptyText(es?.[field])) errors.push(`${label}: traducciones.es.${field} es obligatorio`);
  }
}

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
  const nonWebpImages = project.imagenes.filter((image) => !String(image.src || '').endsWith('.webp'));
  if (!html.includes(`href="${route}"`)) errors.push(`La portada no enlaza el caso ${project.slug}`);
  if ((caseHtml.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${project.slug}: debe existir un único h1`);
  if ((caseHtml.match(/<figure>/g) || []).length !== project.imagenes.length) errors.push(`${project.slug}: número de fotografías incorrecto`);
  if (nonWebpImages.length) errors.push(`${project.slug}: las fotografías publicadas deben usar derivados WebP`);
  if (/<link[^>]+rel="preload"[^>]+proyectos\//.test(caseHtml) || /fetchpriority="high"/.test(caseHtml)) {
    errors.push(`${project.slug}: las fotografías bajo el pliegue no deben competir con el contenido inicial`);
  }
  for (const marker of ['class="breadcrumbs"', 'class="scope-rail"', 'class="case-narrative"']) {
    if (!caseHtml.includes(marker)) errors.push(`${project.slug}: falta ${marker}`);
  }
  if (brand.publicar !== true && !caseHtml.includes('name="robots" content="noindex,nofollow"')) {
    errors.push(`${project.slug}: debe permanecer noindex en preview`);
  }
}

const titles = generatedHtml.map(([route, output]) => [route, output.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() || '']);
const missingTitles = titles.filter(([, title]) => !title).map(([route]) => route);
const duplicateTitles = titles.filter(([, title], index) => title && titles.findIndex(([, candidate]) => candidate === title) !== index);
if (missingTitles.length) errors.push(`Falta title en: ${missingTitles.join(', ')}`);
if (duplicateTitles.length) errors.push(`Titles duplicados en: ${duplicateTitles.map(([route]) => route).join(', ')}`);

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
