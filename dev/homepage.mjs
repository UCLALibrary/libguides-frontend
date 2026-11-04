import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const homepageFixtures = {
  170: 'homepage-all-guides.html',
  172: 'homepage-by-subject.html',
  174: 'homepage-by-librarian.html',
};

export async function getHomepageResponse(action) {
  // Mock guide counts.
  if (['176', '177', '178'].includes(action)) {
    return {
      errCode: 200,
      data: [],
    };
  }

  const filename = homepageFixtures[action];

  if (!filename) return null;

  const content = await readFile(resolve('dev/fixtures/ajax', filename), 'utf8');

  return {
    errCode: 200,
    errText: 'OK',
    data: { content },
  };
}
