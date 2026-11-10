
/* global window, document, URL, Request, XMLHttpRequest */

/**
 * A-Z Databases adapter for static GitHub Pages previews.
 *
 * Uses the live Netlify proxy for database listings,
 * searches, filters, and pagination.
 */

(() => {
  const script = document.currentScript;
  const proxyUrl = script?.dataset.databaseProxyUrl;

  if (!proxyUrl) {
    console.error('A-Z Databases proxy URL is missing.');
    return;
  }

  const SPRINGSHARE_ORIGIN =
    'https://guides.library.ucla.edu';

  const DATABASE_ENDPOINT = '/process/az/render-list';

  function rewriteUrl(url) {
    const requestUrl = new URL(url, window.location.href);

    if (
      requestUrl.pathname !== DATABASE_ENDPOINT ||
      ![
        SPRINGSHARE_ORIGIN,
        window.location.origin,
      ].includes(requestUrl.origin)
    ) {
      return url;
    }

    const target = new URL(proxyUrl);

    // Preserve all search and filter parameters.
    target.search = requestUrl.search;

    return target.href;
  }

  // Intercept jQuery XMLHttpRequest calls.
  const nativeOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (
    method,
    url,
    ...args
  ) {
    return nativeOpen.call(
      this,
      method,
      rewriteUrl(url),
      ...args
    );
  };

  // Support fetch-based requests as well.
  const nativeFetch = window.fetch;

  window.fetch = function (input, init) {
    if (
      typeof input === 'string' ||
      input instanceof URL
    ) {
      return nativeFetch.call(
        this,
        rewriteUrl(input),
        init
      );
    }

    if (input instanceof Request) {
      const rewrittenUrl = rewriteUrl(input.url);

      if (rewrittenUrl !== input.url) {
        return nativeFetch.call(
          this,
          new Request(rewrittenUrl, input),
          init
        );
      }
    }

    return nativeFetch.call(this, input, init);
  };
})();
