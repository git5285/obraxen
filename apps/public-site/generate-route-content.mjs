import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const html = await readFile(path.join(root, 'public', 'index.html'), 'utf8');
const generated = `export const homeHtml = ${JSON.stringify(html)};\n`;

await mkdir(path.join(root, 'app'), {recursive: true});
await writeFile(path.join(root, 'app', 'generated-home-html.js'), generated);
