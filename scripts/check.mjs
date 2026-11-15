import { readdir, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateDirectory, catalogueStats } from '../src/directory.js';
const root = fileURLToPath(new URL('../', import.meta.url));
let count = 0;
for (const dir of ['src','scripts','tests']) {
  for (const file of await readdir(new URL(`../${dir}/`,import.meta.url))) {
    if (!/\.m?js$/.test(file)) continue;
    execFileSync(process.execPath,['--check',`${dir}/${file}`],{cwd:root,stdio:'inherit'}); count++;
  }
}
const data=validateDirectory(JSON.parse(await readFile(new URL('../data/directory.json',import.meta.url),'utf8')));
console.log(`Syntax: ${count} modules. Catalogue valid:`,catalogueStats(data));
