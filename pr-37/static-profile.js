(() => {
  const nativeOpen = XMLHttpRequest.prototype.open;

  const previewRoot = new URL('.', document.currentScript.src);

  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    const requestURL = new URL(url, window.location.href);

    if (
      String(method).toUpperCase() === 'GET' &&
      requestURL.pathname.endsWith('/prf_process.php')
    ) {
      const action = requestURL.searchParams.get('action');
      const subjectId = requestURL.searchParams.get('subject_id') || '0';

      if (['530', '531'].includes(action) && /^\d+$/.test(subjectId)) {
        const staticURL = new URL(`ajax/profile-${action}-${subjectId}.json`, previewRoot);

        return nativeOpen.call(this, 'GET', staticURL.href, ...args);
      }
    }

    return nativeOpen.call(this, method, url, ...args);
  };
})();
