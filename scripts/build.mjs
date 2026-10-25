import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
await rm(join(root, 'dist'), { recursive: true, force: true });
await mkdir(join(root, 'dist'), { recursive: true });
for (const file of ['index.html', 'styles.css', 'favicon.svg', 'src']) await cp(join(root, file), join(root, 'dist', file), { recursive: true });
console.log('Static site ready in dist/');
