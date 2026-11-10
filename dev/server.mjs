import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getPage, renderTemplate } from './renderer.mjs';
import { fetchSpringsharePage, fetchSpringshareAjax } from './springshare.mjs';
import { rewritePreviewLinks } from './preview-links.mjs';

const port = 3000;

const ajaxEndpoints = new Set([
  '/index_process.php',
  '/sb_process.php',
  '/prf_process.php',
  '/srch_process_cs.php',
]);

function rewriteAjaxResponse(response) {
  const result = structuredClone(response);

  for (const key of ['content', 'html', 'guides']) {
    if (typeof result.data?.[key] === 'string') {
      result.data[key] = rewritePreviewLinks(result.data[key]);
    }
  }

  return result;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  try {
    // Fetch live Springshare AJAX responses.
    if (ajaxEndpoints.has(pathname)) {
      const response = await fetchSpringshareAjax(`${pathname}${url.search}`);

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return res.end(JSON.stringify(rewriteAjaxResponse(response)));
    }

    // Resolve the requested page.
    const page = getPage(pathname, url.search);

    if (!page) {
      res.writeHead(404);
      return res.end('Page not found');
    }

    // Read editable templates and global CSS locally.
    // Fetch the current page content from Springshare.
    const [template, productionHTML, globalHTML] = await Promise.all([
      readFile(resolve(page.template), 'utf8'),
      fetchSpringsharePage(page.productionUrl),
      readFile(resolve('src/html/global-custom-css.html'), 'utf8'),
    ]);

    const html = rewritePreviewLinks(
      renderTemplate(template, productionHTML, page.type, globalHTML)
    );

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    return res.end(html);
  } catch (error) {
    console.error(error);

    res.writeHead(502, {
      'Content-Type': 'text/plain; charset=utf-8',
    });

    return res.end('Springshare preview failed. Check terminal.');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Local preview: http://localhost:${port}`);
});
