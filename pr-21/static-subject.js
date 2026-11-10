(function () {
  const script = document.currentScript;
  if (!script) return;

  const ajaxBaseUrl = new URL('ajax/', script.src);
  const originalOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const requestUrl = new URL(url, window.location.href);

    if (
      requestUrl.pathname.endsWith('/sb_process.php') &&
      requestUrl.searchParams.get('action') === '540'
    ) {
      const subjectId = requestUrl.searchParams.get('subject_id');

      // Only allow numeric subject IDs.
      if (/^\d+$/.test(subjectId || '')) {
        const staticUrl = new URL(`subject-${subjectId}.json`, ajaxBaseUrl);

        return originalOpen.call(this, method, staticUrl.href, ...args);
      }
    }

    return originalOpen.call(this, method, url, ...args);
  };
})();
