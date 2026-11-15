import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('Todas las hojas, módulos, iconos e importaciones locales existen',async()=>{
  for(const file of ['index.html','admin.html']){
    const html=await readFile(new URL(file,root),'utf8');
    for(const [,link] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)(?:#[^"]*)?"/g))await access(new URL(link,new URL(file,root)));
  }
  for(const file of await readdir(new URL('src/',root))){
    if(!file.endsWith('.js'))continue;const path=new URL(`src/${file}`,root),code=await readFile(path,'utf8');
    for(const [,dependency] of code.matchAll(/(?:from\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g))await access(new URL(dependency,path));
  }
});
test('No se reintroducen enlaces al repositorio ni servicios de seguimiento',async()=>{
  for(const file of ['index.html','admin.html','src/app.js','src/directory-view.js','src/admin.js']){
    const source=await readFile(new URL(file,root),'utf8');assert.doesNotMatch(source,/href=["']https:\/\/(?:www\.)?github\.com/i);assert.doesNotMatch(source,/google-analytics|googletagmanager|connect\.facebook/);
  }
});
test('No quedan mensajes vigentes que bloqueen Física por dos certámenes bajos',async()=>{
  for(const file of ['src/app.js','src/engine.js','src/courses.js'])assert.doesNotMatch(await readFile(new URL(file,root),'utf8'),/two-certs|máximo un certamen bajo|dos certámenes bajo 50 bloquean|Con esta restricción no puedes/);
});
