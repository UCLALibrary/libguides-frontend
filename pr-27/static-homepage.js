(function () {
  const supportedActions = new Set(['170', '172', '174', '176', '177', '178']);

  const originalOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const requestUrl = new URL(url, window.location.href);

    if (
      requestUrl.pathname === '/index_process.php' &&
      supportedActions.has(requestUrl.searchParams.get('action'))
    ) {
      const action = requestUrl.searchParams.get('action');

      // Resolve relative to the current Homepage directory.
      url = new URL(`ajax/${action}.json`, window.location.href).href;
    }

    return originalOpen.call(this, method, url, ...args);
  };
})();
