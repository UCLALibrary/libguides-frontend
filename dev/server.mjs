import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { getPage, renderTemplate } from './renderer.mjs';

import {
  fetchSpringsharePage,
  fetchSpringshareAjax,
  fetchSpringshareHtml,
} from './springshare.mjs';

import { rewritePreviewLinks } from './preview-links.mjs';

const port = 3000;

const ajaxEndpoints = new Set([
  '/index_process.php',
  '/sb_process.php',
  '/prf_process.php',
  '/srch_process_cs.php',
]);

/**
 * Rewrite internal links inside Springshare AJAX JSON.
 *
 * Used by Homepage, Subjects, Profiles, and Search.
 */
function rewriteAjaxResponse(response) {
  const result = structuredClone(response);

  for (const key of ['content', 'html', 'guides', 'results', 'facets']) {
    if (typeof result.data?.[key] === 'string') {
      result.data[key] = rewritePreviewLinks(result.data[key]);
    }
  }

  return result;
}

/**
 * Rewrite links inside A-Z Databases JSON responses.
 *
 * Springshare returns JSON containing HTML fragments,
 * including az_index_html and database results.
 */
function rewriteAzResponse(response) {
  const result = structuredClone(response);

  if (!result.data) {
    return result;
  }

  for (const [key, value] of Object.entries(result.data)) {
    if (typeof value === 'string' && value.includes('<')) {
      result.data[key] = rewritePreviewLinks(value);
    }
  }

  return result;
}

/**
 * Inject a script immediately after the opening <head>.
 *
 * This ensures the local adapter runs before
 * Springshare's external JavaScript.
 */
function injectScript(html, scriptPath) {
  return html.replace(/<head[^>]*>/i, (match) => `${match}\n<script src="${scriptPath}"></script>`);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');

  const pathname = url.pathname;

  try {
    /**
     * Serve the local A-Z Databases adapter.
     */
    if (pathname === '/dev/local-databases.js') {
      const script = await readFile(resolve('dev/local-databases.js'), 'utf8');

      res.writeHead(200, {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return res.end(script);
    }

    /**
     * Proxy existing Springshare AJAX requests.
     *
     * Homepage, Subjects, Profiles, and Search.
     */
    if (ajaxEndpoints.has(pathname)) {
      const response = await fetchSpringshareAjax(`${pathname}${url.search}`);

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return res.end(JSON.stringify(rewriteAjaxResponse(response)));
    }

    /**
     * Proxy live A-Z Databases requests.
     *
     * Endpoint:
     * /process/az/render-list
     *
     * Returns JSON containing HTML fragments.
     */
    if (pathname === '/process/az/render-list') {
      const response = await fetchSpringshareHtml(`${pathname}${url.search}`);

      const data = JSON.parse(response);

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });

      return res.end(JSON.stringify(rewriteAzResponse(data)));
    }

    /**
     * Resolve the requested preview page.
     */
    const page = getPage(pathname, url.search);

    if (!page) {
      res.writeHead(404, {
        'Content-Type': 'text/plain; charset=utf-8',
      });

      return res.end('Page not found');
    }

    /**
     * Load the repository template and global CSS,
     * along with the live Springshare page.
     */
    const [template, productionHTML, globalHTML] = await Promise.all([
      readFile(resolve(page.template), 'utf8'),
      fetchSpringsharePage(page.productionUrl),
      readFile(resolve('src/html/global-custom-css.html'), 'utf8'),
    ]);

    /**
     * Render the local preview.
     */
    let html = rewritePreviewLinks(renderTemplate(template, productionHTML, page.type, globalHTML));

    /**
     * A-Z Databases:
     *
     * Intercept Springshare database requests
     * and route them through localhost:3000.
     */
    if (page.type === 'az-databases') {
      html = injectScript(html, '/dev/local-databases.js');
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });

    return res.end(html);
  } catch (error) {
    console.error('Springshare preview error:', error);

    res.writeHead(502, {
      'Content-Type': 'text/plain; charset=utf-8',
    });

    return res.end('Springshare preview failed. Check terminal.');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Local preview: http://localhost:${port}`);
});
