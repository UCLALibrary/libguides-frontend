const ORIGIN = 'https://guides.library.ucla.edu';

const ajaxCache = new Map();

const MAX_ATTEMPTS = 3;
const AJAX_TIMEOUT = 30000;
const CACHE_TTL = 5 * 60 * 1000;

// Fetch live Springshare HTML for Guides, Subjects, and Profiles.
export async function fetchSpringsharePage(path) {
  const url = new URL(path, ORIGIN);

  if (url.origin !== ORIGIN) {
    throw new Error('Invalid Springshare origin');
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url.pathname}: HTTP ${response.status}`);
  }

  return response.text();
}

// Fetch live Springshare AJAX JSON with retries and caching.
export async function fetchSpringshareAjax(path) {
  const url = new URL(path, ORIGIN);

  if (url.origin !== ORIGIN) {
    throw new Error('Invalid Springshare origin');
  }

  const cacheKey = url.href;
  const cached = ajaxCache.get(cacheKey);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`Fetching Springshare AJAX: ${url.pathname} (attempt ${attempt})`);

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest',
          Referer: `${ORIGIN}/`,
        },
        signal: AbortSignal.timeout(AJAX_TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`AJAX request failed: ${url.pathname} (${response.status})`);
      }

      const data = await response.json();

      if (data.errCode !== 200) {
        throw new Error(`Unexpected Springshare response: ${data.errCode}`);
      }

      ajaxCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + CACHE_TTL,
      });

      return data;
    } catch (error) {
      console.warn(`Springshare AJAX attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error.message);

      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

/**
 * Fetch live A-Z Database HTML results.
 *
 * Unlike the existing Springshare AJAX endpoints,
 * /process/az/render-list returns HTML.
 */
export async function fetchSpringshareHtml(path) {
  const url = new URL(path, 'https://guides.library.ucla.edu');

  if (url.origin !== 'https://guides.library.ucla.edu') {
    throw new Error('Invalid Springshare origin');
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'text/html, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: 'https://guides.library.ucla.edu/az/databases',
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`A-Z Database request failed: ${response.status}`);
  }

  return response.text();
}
