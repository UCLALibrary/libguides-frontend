import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE_URL = 'https://guides.library.ucla.edu';
const OUTPUT_DIR = resolve('dev/fixtures/ajax');

const homepageParams = {
  order: '0',
  type_id: '0',
  owner_id: '0',
  group_id: '0',
  num_cols: '3',
  search: '',
  bs5: '0',
};

const fixtures = [
  {
    name: 'homepage-all-guides',
    endpoint: '/index_process.php',
    params: {
      ...homepageParams,
      action: '170',
    },
  },
  {
    name: 'homepage-by-subject',
    endpoint: '/index_process.php',
    params: {
      ...homepageParams,
      action: '172',
    },
  },
  {
    name: 'homepage-by-librarian',
    endpoint: '/index_process.php',
    params: {
      ...homepageParams,
      action: '174',
    },
  },
];

await mkdir(OUTPUT_DIR, { recursive: true });

for (const fixture of fixtures) {
  const url = new URL(fixture.endpoint, BASE_URL);

  for (const [key, value] of Object.entries(fixture.params)) {
    url.searchParams.set(key, value);
  }

  console.log(`Fetching ${fixture.name}...`);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: `${BASE_URL}/`,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`${fixture.name}: HTTP ${response.status}`);
  }

  const raw = await response.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`${fixture.name}: Springshare returned invalid JSON`);
  }

  if (data.errCode !== 200 || !data.data?.content) {
    throw new Error(`${fixture.name}: Unexpected response structure`);
  }

  await writeFile(
    resolve(OUTPUT_DIR, `${fixture.name}.json`),
    JSON.stringify(data, null, 2),
    'utf8'
  );

  console.log(`Saved: ${fixture.name}.json`);
}

console.log('Springshare AJAX fixtures refreshed.');
