import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getPage, renderTemplate } from './renderer.mjs';
import { getHomepageResponse } from './homepage.mjs';
import { getSubjectResponse } from './subject.mjs';

const port = 3000;

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  try {
    // Homepage AJAX fixtures.
    if (pathname === '/index_process.php') {
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

    // Mock Springshare Subject Info AJAX requests.
    if (pathname === '/sb_process.php') {
      const action = url.searchParams.get('action');
      const subjectId = url.searchParams.get('subject_id');

      const response = await getSubjectResponse(action, subjectId);

      if (!response) {
        res.writeHead(404);
        return res.end('Subject mock not available');
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return res.end(JSON.stringify(response));
    }

    // Resolve Homepage, Guide, and Subject pages.
    const page = getPage(pathname);

    if (!page) {
      res.writeHead(404);
      return res.end('Page not found');
    }

    // Reload templates, fixtures, and CSS on every request.
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

    res.writeHead(500, {
      'Content-Type': 'text/plain; charset=utf-8',
    });

    return res.end('Local rendering failed. Check terminal.');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Local preview: http://localhost:${port}`);
});
