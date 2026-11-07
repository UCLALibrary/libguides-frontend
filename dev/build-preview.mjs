import { readFile, mkdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { load } from 'cheerio';

import { pages, getPage, renderTemplate } from './renderer.mjs';
import { fetchSpringsharePage, fetchSpringshareAjax } from './springshare.mjs';
import { discoverRoutes, classifyRoute, extractSubjectId } from './discover-routes.mjs';
import { rewritePreviewLinks } from './preview-links.mjs';

const outputDir = resolve('dist');
const basePath = process.env.PREVIEW_BASE_PATH ?? '/';
const CONCURRENCY = 4;

const PRODUCTION_ORIGIN = 'https://guides.library.ucla.edu';
const PROFILE_ID_PATTERN = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;

const globalHTML = await readFile(resolve('src/html/global-custom-css.html'), 'utf8');

// Process a limited number of requests concurrently.
async function mapWithConcurrency(items, limit, callback) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await callback(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));

  return results;
}

// GitHub Pages cannot execute PHP routes.
function getStaticRoute(route) {
  const staticRoutes = {
    '/sb.php': '/subjects/',
    '/prf.php': '/profiles/',
  };

  if (Object.hasOwn(staticRoutes, route)) {
    return staticRoutes[route];
  }

  return route === '/' ? '/' : `${route.replace(/\/+$/, '')}/`;
}

// Extract subject IDs from Profile Landing.
function extractProfileSubjectIds(html) {
  const $ = load(html);
  const ids = new Set();

  $('#s-lg-profile-subjects option').each((_, element) => {
    const value = $(element).attr('value');

    if (value && /^\d+$/.test(value) && value !== '0') {
      ids.add(value);
    }
  });

  return [...ids];
}

// Extract individual profile UUIDs from the Profile Landing AJAX response.
function extractProfileIds(response) {
  const $ = load(response.data?.html || '', null, false);
  const ids = new Set();

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    let url;

    try {
      url = new URL(href, PRODUCTION_ORIGIN);
    } catch {
      return;
    }

    if (url.origin !== PRODUCTION_ORIGIN || url.pathname !== '/prf.php') {
      return;
    }

    const id = url.searchParams.get('id');

    if (id && PROFILE_ID_PATTERN.test(id)) {
      ids.add(id.toLowerCase());
    }
  });

  return [...ids];
}

// Discover and validate public pages.
console.log('Discovering Springshare routes...');

const discoveredRoutes = await discoverRoutes();

const candidateRoutes = [...new Set([...Object.keys(pages), ...discoveredRoutes])];

console.log(`Found ${candidateRoutes.length} candidate routes.`);

const validated = await mapWithConcurrency(candidateRoutes, CONCURRENCY, async (route) => {
  try {
    const productionHTML = await fetchSpringsharePage(route);

    const explicitPage = pages[route];

    const type = explicitPage?.type ?? classifyRoute(route, productionHTML);

    if (!type) {
      console.warn(`Skipping unsupported route: ${route}`);
      return null;
    }

    const page = getPage(route);

    if (!page) {
      console.warn(`No template for route: ${route}`);
      return null;
    }

    const subjectId = type === 'subject-info' ? extractSubjectId(productionHTML) : null;

    if (type === 'subject-info' && !subjectId) {
      throw new Error(`Missing subject ID: ${route}`);
    }

    return {
      route,
      page: { ...page, type },
      productionHTML,
      subjectId,
    };
  } catch (error) {
    console.error(`Failed to validate ${route}: ${error.message}`);

    return null;
  }
});

const validPages = validated.filter(Boolean);

console.log(`Validated ${validPages.length} pages.`);

if (!validPages.length) {
  throw new Error('No valid pages discovered.');
}

// Find Profile Landing and discover individual profiles.
const profileLanding = validPages.find(({ page }) => page.type === 'profile-landing');

let allProfilesResponse = null;
let profileIds = [];

if (profileLanding) {
  allProfilesResponse = await fetchSpringshareAjax('/prf_process.php?action=530&subject_id=0');

  profileIds = extractProfileIds(allProfilesResponse);

  console.log(`Discovered ${profileIds.length} individual profiles.`);
}

// Build route mappings only from validated pages.
const generatedRoutes = Object.fromEntries(
  validPages.map(({ route }) => [route, getStaticRoute(route)])
);

// Tracks only successfully generated individual profiles.
const generatedProfileIds = new Set();

// Rewrite links inside Springshare AJAX response HTML.
function rewriteAjaxResponse(response) {
  const result = structuredClone(response);

  for (const key of ['content', 'html', 'guides']) {
    if (typeof result.data?.[key] === 'string') {
      result.data[key] = rewritePreviewLinks(result.data[key], {
        staticPreview: true,
        basePath,
        generatedRoutes,
        generatedProfileIds,
      });
    }
  }

  return result;
}

// Clean the output directory.
await rm(outputDir, {
  recursive: true,
  force: true,
});

await mkdir(outputDir, {
  recursive: true,
});

// Fetch and render Individual Profile Detail pages first.
if (profileIds.length) {
  const profileTemplate = await readFile(
    resolve('src/html/profile/individual-profile/profile-page-swap-footers.html'),
    'utf8'
  );

  const results = await mapWithConcurrency(profileIds, CONCURRENCY, async (profileId) => {
    try {
      const productionHTML = await fetchSpringsharePage(
        `/prf.php?id=${encodeURIComponent(profileId)}`
      );

      return {
        profileId,
        html: renderTemplate(profileTemplate, productionHTML, 'profile-info', globalHTML),
      };
    } catch (error) {
      console.warn(`Failed to generate profile ${profileId}: ${error.message}`);

      return null;
    }
  });

  const successfulProfiles = results.filter(Boolean);

  // Register only profiles that were successfully rendered.
  for (const { profileId } of successfulProfiles) {
    generatedProfileIds.add(profileId);
  }

  for (const { profileId, html } of successfulProfiles) {
    let rewritten = rewritePreviewLinks(html, {
      staticPreview: true,
      basePath,
      generatedRoutes,
      generatedProfileIds,
    });

    // Individual Profile pages can trigger Springshare profile AJAX.
    // Install the static adapter before Springshare scripts execute.
    rewritten = rewritten.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n<script src="../../static-profile.js"></script>`
    );

    const outputPath = join(outputDir, 'profiles', profileId, 'index.html');

    await mkdir(dirname(outputPath), {
      recursive: true,
    });

    await writeFile(outputPath, rewritten, 'utf8');

    console.log(`Generated Profile Detail: ${profileId}`);
  }
}

// Render all validated pages.
for (const { route, page, productionHTML } of validPages) {
  const template = await readFile(resolve(page.template), 'utf8');

  let html = renderTemplate(template, productionHTML, page.type, globalHTML);

  html = rewritePreviewLinks(html, {
    staticPreview: true,
    basePath,
    generatedRoutes,
    generatedProfileIds,
  });

  // Install static AJAX adapters before Springshare scripts.
  if (page.type === 'home') {
    html = html.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n<script src="./static-homepage.js"></script>`
    );
  }

  if (page.type === 'subject-info') {
    html = html.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n<script src="../static-subject.js"></script>`
    );
  }

  if (page.type === 'profile-landing') {
    html = html.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n<script src="../static-profile.js"></script>`
    );
  }

  const staticRoute = getStaticRoute(route);

  const relativePath =
    staticRoute === '/' ? 'index.html' : join(staticRoute.slice(1), 'index.html');

  const outputPath = join(outputDir, relativePath);

  await mkdir(dirname(outputPath), {
    recursive: true,
  });

  await writeFile(outputPath, html, 'utf8');

  console.log(`Generated: ${route}`);
}

// Create AJAX output directory.
const ajaxDir = join(outputDir, 'ajax');

await mkdir(ajaxDir, {
  recursive: true,
});

// Fetch Homepage AJAX responses.
const homepageActions = ['170', '172', '174', '176', '177', '178'];

for (const action of homepageActions) {
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

  if (['176', '177', '178'].includes(action)) {
    params.set('site_id', '705');
  }

  const response = await fetchSpringshareAjax(`/index_process.php?${params}`);

  await writeFile(
    join(ajaxDir, `${action}.json`),
    JSON.stringify(rewriteAjaxResponse(response)),
    'utf8'
  );

  console.log(`Generated Homepage AJAX: ${action}`);
}

// Generate Subject Info AJAX responses.
const subjectPages = validPages.filter(({ page }) => page.type === 'subject-info');

const subjectIds = [...new Set(subjectPages.map(({ subjectId }) => subjectId))];

console.log(`Generating AJAX for ${subjectIds.length} subjects.`);

await mapWithConcurrency(subjectIds, CONCURRENCY, async (subjectId) => {
  const params = new URLSearchParams({
    action: '540',
    subject_id: String(subjectId),
  });

  const response = await fetchSpringshareAjax(`/sb_process.php?${params}`);

  await writeFile(
    join(ajaxDir, `subject-${subjectId}.json`),
    JSON.stringify(rewriteAjaxResponse(response)),
    'utf8'
  );

  console.log(`Generated Subject AJAX: ${subjectId}`);
});

// Generate Profile Landing AJAX responses.
let profileSubjectIds = [];

if (profileLanding) {
  profileSubjectIds = extractProfileSubjectIds(profileLanding.productionHTML);

  console.log(`Generating Profile AJAX for ${profileSubjectIds.length} subjects.`);

  // action=530: All profiles and profiles filtered by subject.
  const profileFilters = ['0', ...profileSubjectIds];

  await mapWithConcurrency(profileFilters, CONCURRENCY, async (subjectId) => {
    const params = new URLSearchParams({
      action: '530',
      subject_id: subjectId,
    });

    const response =
      subjectId === '0'
        ? allProfilesResponse
        : await fetchSpringshareAjax(`/prf_process.php?${params}`);

    await writeFile(
      join(ajaxDir, `profile-530-${subjectId}.json`),
      JSON.stringify(rewriteAjaxResponse(response)),
      'utf8'
    );

    console.log(`Generated Profile AJAX: 530/${subjectId}`);
  });

  // action=531: Guides sidebar for selected subjects.
  await mapWithConcurrency(profileSubjectIds, CONCURRENCY, async (subjectId) => {
    const params = new URLSearchParams({
      action: '531',
      subject_id: subjectId,
    });

    const response = await fetchSpringshareAjax(`/prf_process.php?${params}`);

    await writeFile(
      join(ajaxDir, `profile-531-${subjectId}.json`),
      JSON.stringify(rewriteAjaxResponse(response)),
      'utf8'
    );

    console.log(`Generated Profile AJAX: 531/${subjectId}`);
  });
}

// Copy static AJAX adapters.
const adapters = [
  ['dev/static-homepage.js', 'static-homepage.js'],
  ['dev/static-subject.js', 'static-subject.js'],
];

if (profileLanding) {
  adapters.push(['dev/static-profile.js', 'static-profile.js']);
}

await Promise.all(
  adapters.map(([source, destination]) => copyFile(resolve(source), join(outputDir, destination)))
);

console.log('');
console.log('Static preview build complete.');
console.log(`Generated ${validPages.length} pages.`);
console.log(`Generated ${generatedProfileIds.size} Profile Detail pages.`);
console.log(`Generated ${subjectIds.length} Subject AJAX responses.`);

if (profileLanding) {
  console.log(`Generated ${profileSubjectIds.length + 1} Profile listing AJAX responses.`);

  console.log(`Generated ${profileSubjectIds.length} Profile Guides AJAX responses.`);
}
