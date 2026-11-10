/**
 * Live Search adapter for GitHub Pages previews.
 *
 * Redirects Springshare Search AJAX requests to the
 * Netlify proxy without changing the search parameters.
 *
 * The proxy URL is injected during the static build.
 */

(() => {
  const script = document.currentScript;

  const proxyUrl = script?.dataset.searchProxyUrl;

  if (!proxyUrl) {
    console.error('Search proxy URL is missing. Set SEARCH_PROXY_URL during build.');
    return;
  }

  const nativeOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const requestUrl = new URL(url, window.location.href);

    // Only intercept Springshare Search AJAX requests.
    if (
      String(method).toUpperCase() !== 'GET' ||
      !requestUrl.pathname.endsWith('/srch_process_cs.php')
    ) {
      return nativeOpen.call(this, method, url, ...args);
    }

    const proxyRequestUrl = new URL(proxyUrl);

    // Preserve query, action, search source, sorting,
    // filtering, and pagination parameters.
    proxyRequestUrl.search = requestUrl.search;

    return nativeOpen.call(this, 'GET', proxyRequestUrl.href, ...args);
  };
})();
