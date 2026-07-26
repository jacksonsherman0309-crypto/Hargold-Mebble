import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const port = Number.parseInt(process.env.HM_PREVIEW_PORT ?? '4173', 10);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const requestPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const resolvedPath = path.resolve(root, `.${requestPath}`);

    if (!resolvedPath.startsWith(root)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const fileStat = await stat(resolvedPath);
    const filePath = fileStat.isDirectory() ? path.join(resolvedPath, 'index.html') : resolvedPath;
    const data = await readFile(filePath);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mimeTypes[path.extname(filePath)] ?? 'application/octet-stream',
    });
    response.end(data);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Hargold & Mebble preview: http://127.0.0.1:${port}`);
});
