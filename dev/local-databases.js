/* global window, URL, XMLHttpRequest, Request */
/**
 * Local A-Z Databases AJAX adapter.
 *
 * Redirects Springshare database requests to the
 * local development server instead of production.
 *
 * Supports:
 * - Initial database listing
 * - Keyword search
 * - Alphabet navigation
 * - Subject, type, and vendor filters
 * - Pagination
 */

(() => {
  const SPRINGSHARE_ORIGIN = 'https://guides.library.ucla.edu';

  const DATABASE_ENDPOINT = '/process/az/render-list';

  /**
   * Rewrite only A-Z Databases requests.
   * Preserve the original query parameters.
   */
  function rewriteUrl(url) {
    const requestUrl = new URL(url, window.location.href);

    if (requestUrl.origin === SPRINGSHARE_ORIGIN && requestUrl.pathname === DATABASE_ENDPOINT) {
      return window.location.origin + requestUrl.pathname + requestUrl.search + requestUrl.hash;
    }

    return url;
  }

  /**
   * Intercept XMLHttpRequest requests.
   * Springshare uses jQuery AJAX for database results.
   */
  const nativeOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    return nativeOpen.call(this, method, rewriteUrl(url), ...args);
  };

  /**
   * Also support fetch-based requests.
   */
  const nativeFetch = window.fetch;

  window.fetch = function (input, init) {
    if (typeof input === 'string' || input instanceof URL) {
      return nativeFetch.call(this, rewriteUrl(input), init);
    }

    if (input instanceof Request) {
      const rewrittenUrl = rewriteUrl(input.url);

      if (rewrittenUrl !== input.url) {
        return nativeFetch.call(this, new Request(rewrittenUrl, input), init);
      }
    }

    return nativeFetch.call(this, input, init);
  };
})();
