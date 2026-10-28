import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');
const indexHtml = path.join(dist, 'index.html');

if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, path.join(dist, '404.html'));
  fs.copyFileSync(indexHtml, path.join(dist, 'login.html'));
  fs.mkdirSync(path.join(dist, 'login'), { recursive: true });
  fs.copyFileSync(indexHtml, path.join(dist, 'login', 'index.html'));
  fs.mkdirSync(path.join(dist, 'dashboard'), { recursive: true });
  fs.copyFileSync(indexHtml, path.join(dist, 'dashboard', 'index.html'));
  fs.mkdirSync(path.join(dist, 'admin'), { recursive: true });
  fs.copyFileSync(indexHtml, path.join(dist, 'admin', 'index.html'));
  fs.mkdirSync(path.join(dist, 'tickets'), { recursive: true });
  fs.copyFileSync(indexHtml, path.join(dist, 'tickets', 'index.html'));
  fs.mkdirSync(path.join(dist, 'books'), { recursive: true });
  fs.copyFileSync(indexHtml, path.join(dist, 'books', 'index.html'));
  console.log('[Postbuild] Generated static SPA fallback pages for all routes.');
}
