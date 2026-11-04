import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pages, renderTemplate } from './renderer.mjs';
import { getHomepageResponse } from './homepage.mjs';

const port = 3000;

createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  try {
    // Mock Springshare Homepage AJAX requests.
    if (pathname === '/index_process.php') {
      const url = new URL(req.url, 'http://localhost');
      const action = url.searchParams.get('action');

      const response = await getHomepageResponse(action);

      if (!response) {
        res.writeHead(404);
        return res.end('Mock not available');
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return res.end(JSON.stringify(response));
    }

    const page = pages[pathname];

    if (!page) {
      res.writeHead(404);
      return res.end('Page not found');
    }

    // Read files on every request for live editing.
    const [template, fixture, globalHTML] = await Promise.all([
      readFile(resolve(page.template), 'utf8'),
      readFile(resolve(page.fixture), 'utf8'),
      readFile(resolve('src/html/global-custom-css.html'), 'utf8'),
    ]);

    const html = renderTemplate(template, fixture, page.type, globalHTML);

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    return res.end(html);
  } catch (error) {
    console.error(error);

    res.writeHead(500);
    return res.end('Local rendering failed. Check terminal.');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Local preview: http://localhost:${port}`);
});
