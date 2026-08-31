import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(process.cwd(), 'dist');
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const server = createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  if (pathname === '/__qa_shutdown__') {
    response.end('OK');
    setImmediate(() => server.close(() => process.exit(0)));
    return;
  }
  const relative = normalize(pathname).replace(/^([/\\])+/, '');
  let file = join(root, relative);

  try {
    const details = await stat(file);
    if (details.isDirectory()) file = join(file, 'index.html');
    const finalDetails = await stat(file);
    if (!finalDetails.isFile() || !file.startsWith(root)) throw new Error('Not found');
    response.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(4321, '127.0.0.1', () => {
  console.log('Serving dist at http://127.0.0.1:4321');
});

const parentPid = process.ppid;
setInterval(() => {
  try {
    process.kill(parentPid, 0);
  } catch {
    server.close(() => process.exit(0));
  }
}, 1_000).unref();
