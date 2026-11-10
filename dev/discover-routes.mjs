import { load } from 'cheerio';
import { fetchSpringsharePage, fetchSpringshareAjax } from './springshare.mjs';

const ORIGIN = 'https://guides.library.ucla.edu';

const redirectRoutes = new Set(['/business-databases', '/directory', '/law', '/posters']);

function extractRoutes(html) {
  const $ = load(html);
  const routes = new Set();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    let url;

    try {
      url = new URL(href, ORIGIN);
    } catch {
      return;
    }

    if (url.origin !== ORIGIN) return;

    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // Only collect single-segment guide and subject routes.
    if (!/^\/[a-z0-9][a-z0-9-]*$/i.test(pathname)) {
      return;
    }

    routes.add(pathname);
  });

  return routes;
}

function getAjaxHtml(response) {
  return typeof response.data?.content === 'string' ? response.data.content : '';
}

export async function discoverRoutes() {
  const candidates = new Set();

  // Fetch the live Subject Landing page.
  const subjectHTML = await fetchSpringsharePage('/sb.php');

  for (const route of extractRoutes(subjectHTML)) {
    candidates.add(route);
  }

  // Fetch the Homepage's All Guides and By Subject listings.
  for (const action of ['170', '172']) {
    const params = new URLSearchParams({
      action,
      order: '0',
      type_id: '0',
      owner_id: '0',
      group_id: '0',
      num_cols: '3',
      search: '',
      bs5: '0',
    });

    const response = await fetchSpringshareAjax(`/index_process.php?${params}`);

    for (const route of extractRoutes(getAjaxHtml(response))) {
      candidates.add(route);
    }
  }

  // Exclude routes already registered explicitly.
  const excluded = new Set(['/', '/communication', '/africa-guides']);

  return [...candidates]
    .filter((route) => !excluded.has(route))
    .filter((route) => !redirectRoutes.has(route))
    .sort();
}

export function classifyRoute(pathname, html) {
  const $ = load(html);

  // Check the actual page structure rather than the URL name.
  if ($('#s-lg-sb-cols').length) {
    return 'subject-info';
  }

  if ($('#s-lg-guide-main').length) {
    return 'guide';
  }

  return null;
}

export function extractSubjectId(html) {
  // Springshare initializes Subject Info pages using:
  // loadSubjectGuides(4483);
  const match = html.match(/loadSubjectGuides\(\s*(\d+)\s*\)/);

  return match ? match[1] : null;
}
