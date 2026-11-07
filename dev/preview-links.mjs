import { load } from 'cheerio';

const PRODUCTION_ORIGIN = 'https://guides.library.ucla.edu';

// Explicit local routes supported by renderer.mjs.
const localRoutes = {
  '/': '/',
  '/communication': '/communication/',
  '/sb.php': '/sb.php',
  '/africa-guides': '/africa-guides/',
};

function normalizePath(pathname) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

function normalizeBasePath(basePath) {
  const segments = basePath.split('/').filter(Boolean);

  return segments.length ? `/${segments.join('/')}` : '';
}

function getLocalPreviewPath(pathname) {
  if (Object.hasOwn(localRoutes, pathname)) {
    return localRoutes[pathname];
  }

  // Dynamic Subject Info pages.
  if (/^\/[a-z0-9-]+-guides?$/i.test(pathname)) {
    return `${pathname}/`;
  }

  // Dynamic single-segment Guide pages.
  // Preserve uppercase route names such as /Search.
  if (/^\/[a-z0-9][a-z0-9-]*$/i.test(pathname)) {
    return `${pathname}/`;
  }

  return null;
}

export function rewritePreviewLinks(
  html,
  { staticPreview = false, basePath = '/', generatedRoutes = {} } = {}
) {
  if (!html) return html;

  // Parse HTML fragments without adding html/body wrappers.

  const isDocument = /^\s*<!doctype\s+html/i.test(html);

  const $ = load(html, null, isDocument);

  const prefix = staticPreview ? normalizeBasePath(basePath) : '';

  $('a[href]').each((_, element) => {
    const originalHref = $(element).attr('href');

    if (!originalHref) return;

    // Preserve in-page anchors.
    if (originalHref.startsWith('#')) {
      return;
    }

    // Ignore non-HTTP links.
    if (/^(mailto:|tel:|javascript:|data:)/i.test(originalHref)) {
      return;
    }

    // Fix Springshare accordion links.
    // //#collapse4483 -> #collapse4483
    // /#collapse4483 -> #collapse4483
    if (/^\/+#/.test(originalHref)) {
      $(element).attr('href', `#${originalHref.replace(/^\/+#/, '')}`);
      return;
    }

    let url;

    try {
      url = new URL(originalHref, PRODUCTION_ORIGIN);
    } catch {
      return;
    }

    // Leave external websites unchanged.
    if (url.origin !== PRODUCTION_ORIGIN) {
      return;
    }

    const pathname = normalizePath(url.pathname);

    const previewPath = staticPreview
      ? (generatedRoutes[pathname] ?? null)
      : getLocalPreviewPath(pathname);

    if (!previewPath) {
      // Unsupported routes remain on production.
      $(element).attr('href', url.href);
      return;
    }

    $(element).attr('href', `${prefix}${previewPath}${url.search}${url.hash}`);
  });

  return $.html();
}
