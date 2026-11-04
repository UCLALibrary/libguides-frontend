import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { load } from 'cheerio';

export async function getSubjectResponse(action, subjectId) {
  if (action !== '540' || subjectId !== '4483') {
    return null;
  }

  const fixture = await readFile(resolve('dev/fixtures/subject-info.html'), 'utf8');

  const $ = load(fixture);

  return {
    errCode: 200,
    errText: 'OK',
    data: {
      guides: $('#s-lg-sb-content-guides').html() || '',
      databases: $('#s-lg-sb-content-databases').html() || '',
      experts: $('#s-lg-sb-experts-div').html() || '',
      blog_posts: $('#s-lg-sb-content-blog-posts').html() || '',
      er_courses: $('#s-lg-sb-content-er-courses').html() || '',
    },
  };
}
