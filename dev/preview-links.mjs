import { load } from 'cheerio';

const PRODUCTION_ORIGIN = 'https://guides.library.ucla.edu';

const PROFILE_ID_PATTERN = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

// Explicit local routes supported by renderer.mjs.
const localRoutes = {
  '/': '/',
  '/communication': '/communication/',
  '/sb.php': '/sb.php',
  '/prf.php': '/prf.php',
  '/srch.php': '/srch.php',
  '/africa-guides': '/africa-guides/',
  '/az/databases': '/az/databases/',
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

function getPreviewPath(pathname, staticPreview, generatedRoutes) {
  if (staticPreview) {
    return generatedRoutes[pathname] ?? null;
  }

  return getLocalPreviewPath(pathname);
}

// Rewrite a Springshare URL to a local or static preview URL.
// Unsupported pages remain on production.
export function rewritePreviewUrl(
  href,
  {
    staticPreview = false,
    basePath = '/',
    generatedRoutes = {},
    generatedProfileIds = new Set(),
  } = {}
) {
  if (!href) {
    return href;
  }

  // Preserve in-page anchors.
  if (href.startsWith('#')) {
    return href;
  }

  // Ignore non-HTTP links.
  if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) {
    return href;
  }

  // Fix Springshare accordion links.
  // //#collapse4483 -> #collapse4483
  // /#collapse4483 -> #collapse4483
  if (/^\/+#/.test(href)) {
    return `#${href.replace(/^\/+#/, '')}`;
  }

  let url;

  try {
    url = new URL(href, PRODUCTION_ORIGIN);
  } catch {
    return href;
  }

  // Leave external websites unchanged.
  if (url.origin !== PRODUCTION_ORIGIN) {
    return href;
  }

  const pathname = normalizePath(url.pathname);

  const prefix = staticPreview ? normalizeBasePath(basePath) : '';

  // Individual Profile Detail pages use /prf.php?id=UUID.
  // Keep them separate from Profile Landing.
  if (pathname === '/prf.php' && url.searchParams.has('id')) {
    const profileId = url.searchParams.get('id');

    if (!profileId || !PROFILE_ID_PATTERN.test(profileId)) {
      return url.href;
    }

    const normalizedId = profileId.toLowerCase();

    if (staticPreview) {
      // Rewrite only successfully generated profiles.
      if (generatedProfileIds.has(normalizedId)) {
        return `${prefix}/profiles/${normalizedId}/` + url.hash;
      }

      // Profile was not generated.
      // Keep its production URL.
      return url.href;
    }

    // Local development supports dynamic profiles.
    return `/prf.php?id=${encodeURIComponent(profileId)}` + url.hash;
  }

  const previewPath = getPreviewPath(pathname, staticPreview, generatedRoutes);

  if (!previewPath) {
    // Unsupported routes remain on production.
    return url.href;
  }

  // Preserve search parameters and fragments.
  return `${prefix}${previewPath}` + url.search + url.hash;
}

// Rewrite internal links and supported form actions
// inside complete HTML documents or AJAX fragments.
export function rewritePreviewLinks(
  html,
  {
    staticPreview = false,
    basePath = '/',
    generatedRoutes = {},
    generatedProfileIds = new Set(),
  } = {}
) {
  if (!html) {
    return html;
  }

  // Preserve the DOCTYPE for complete HTML documents.
  // Keep AJAX fragments without html/body wrappers.
  const isDocument = /^\s*<!doctype\s+html/i.test(html);

  const $ = load(html, null, isDocument);

  const options = {
    staticPreview,
    basePath,
    generatedRoutes,
    generatedProfileIds,
  };

  // Rewrite supported internal links.
  $('a[href]').each((_, element) => {
    const originalHref = $(element).attr('href');

    if (!originalHref) {
      return;
    }

    const rewrittenHref = rewritePreviewUrl(originalHref, options);

    if (rewrittenHref !== originalHref) {
      $(element).attr('href', rewrittenHref);
    }
  });

  // Rewrite the Search form action.
  //
  // Local:
  //   /srch.php
  //
  // Static:
  //   /search/
  //
  // GitHub Pages PR:
  //   /libguides-frontend/pr-18/search/
  //
  // This preserves the original form fields, including q.
  $('#s-lg-srch-form').each((_, element) => {
    const $form = $(element);

    const originalAction = $form.attr('action') || '/srch.php';

    const actionUrl = new URL(originalAction, PRODUCTION_ORIGIN);

    // Only rewrite Springshare Search actions.
    if (
      actionUrl.origin !== PRODUCTION_ORIGIN ||
      normalizePath(actionUrl.pathname) !== '/srch.php'
    ) {
      return;
    }

    const rewrittenAction = rewritePreviewUrl('/srch.php', options);

    $form.attr('action', rewrittenAction);

    // GitHub Pages serves static HTML.
    // Preserve query parameters through a GET request.
    if (staticPreview) {
      $form.attr('method', 'get');
    }
  });

  return $.html();
}
