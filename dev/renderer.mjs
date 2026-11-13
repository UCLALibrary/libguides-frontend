import { load } from 'cheerio';

/**
 * Build the preview <head>.
 *
 * Most pages replace Springshare's global custom CSS
 * with the repository version.
 *
 * A-Z Databases currently has a different production
 * CSS structure, so repository CSS is appended last.
 */
function buildPreviewHead($, globalHTML, type) {
  const $local = load(globalHTML);
  const localStyles = $local('style').toArray();
  const productionStyles = $('head style').toArray();

  // A-Z Databases uses a different production CSS structure.
  // Preserve existing styles and apply repository CSS last.
  if (type === 'az-databases') {
    $('head').append(globalHTML);
    return $('head').html() || '';
  }

  // Identify the start of Springshare's global custom CSS.
  // Page-specific styles may appear before these blocks.
  const globalStartIndex = productionStyles.findIndex((element) => {
    const css = $(element).html() || '';

    return css.includes('header {') && css.includes('background-color: #0B6AB7');
  });

  if (globalStartIndex === -1) {
    throw new Error(
      'Could not locate Springshare global CSS. ' +
        'Production stylesheet structure may have changed.'
    );
  }

  const globalEndIndex = globalStartIndex + localStyles.length;

  if (globalEndIndex > productionStyles.length) {
    throw new Error('Production global CSS block count does not match repository CSS.');
  }

  // Replace only shared global CSS.
  // Preserve page-specific CSS before and after it.
  const globalProductionStyles = productionStyles.slice(globalStartIndex, globalEndIndex);

  for (const element of globalProductionStyles) {
    $(element).remove();
  }

  // Insert repository CSS in the original global CSS position.
  const nextStyle = productionStyles[globalEndIndex];

  if (nextStyle) {
    $(nextStyle).before(globalHTML);
  } else {
    $('head').append(globalHTML);
  }

  return $('head').html() || '';
}

/**
 * Explicit routes supported by the preview renderer.
 */
export const pages = {
  '/': {
    template: 'src/html/home/three-column-guide-index-side.html',
    productionUrl: '/',
    type: 'home',
  },

  '/communication': {
    template: 'src/html/guide/side-nav-layout/ucla-default-template.html',
    productionUrl: '/communication',
    type: 'guide',
  },

  '/sb.php': {
    template: 'src/html/subject/landing-page/system-default-landing-template.html',
    productionUrl: '/sb.php',
    type: 'subject-landing',
  },

  '/africa-guides': {
    template: 'src/html/subject/individual-subject/subject-page-sans-databases.html',
    productionUrl: '/africa-guides',
    type: 'subject-info',
  },

  '/prf.php': {
    template: 'src/html/profile/landing-page/custom-profile-landing-page-2026.html',
    productionUrl: '/prf.php',
    type: 'profile-landing',
  },

  '/srch.php': {
    template: 'src/html/search/flipped-footers.html',
    productionUrl: '/srch.php',
    type: 'search',
  },

  '/az/databases': {
    template: 'src/html/a-z-databases/az-new-2021.html',
    productionUrl: '/az/databases',
    type: 'az-databases',
  },
};

/**
 * Resolve local preview routes.
 */
export function getPage(pathname, search = '') {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

  // Individual Profile Detail: /prf.php?id=UUID
  if (normalized === '/prf.php') {
    const params = new URLSearchParams(search);
    const profileId = params.get('id');

    if (profileId) {
      if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(profileId)) {
        return null;
      }

      return {
        template: 'src/html/profile/individual-profile/profile-page-swap-footers.html',
        productionUrl: `/prf.php?id=${encodeURIComponent(profileId)}`,
        type: 'profile-info',
      };
    }
  }

  if (Object.hasOwn(pages, normalized)) {
    return pages[normalized];
  }

  // Dynamic Subject Info pages.
  if (/^\/[a-z0-9-]+-guides?$/i.test(normalized)) {
    return {
      template: 'src/html/subject/individual-subject/subject-page-sans-databases.html',
      productionUrl: normalized,
      type: 'subject-info',
    };
  }

  // Dynamic single-segment Guide pages.
  if (/^\/[a-z0-9][a-z0-9-]*$/i.test(normalized)) {
    return {
      template: 'src/html/guide/side-nav-layout/ucla-default-template.html',
      productionUrl: normalized,
      type: 'guide',
    };
  }

  return null;
}

/**
 * Render a repository template using content captured
 * from the corresponding production Springshare page.
 */
export function renderTemplate(template, fixture, type, globalHTML = '') {
  const $ = load(fixture);

  const outer = (selector) => $(selector).first().toString();

  const inner = (selector) => $(selector).first().html() || '';

  const text = (selector) => $(selector).first().text().trim();

  const noIndex = '<meta name="robots" content="noindex, nofollow, noarchive">';

  // Shared template placeholders.
  const common = {
    public_header: outer('body > header'),
    public_footer: '',
    breadcrumbs: inner('#s-lib-bc'),
    login_url: '#',
  };

  // Homepage.
  const home = {
    title: text('#s-lib-public-header-title'),
    system_intro: inner('#s-lib-public-header-desc'),
    page_nav: inner('#s-lib-public-nav'),
    button_all_guides: outer('#s-lg-index-all-btn'),
    button_by_subject: outer('#s-lg-index-subject-btn'),
    button_by_owner: outer('#s-lg-index-owner-btn'),
    search_guides: outer('#s-lg-hp-nav form'),
    content: inner('#s-lg-index-list'),
    content_boxes: inner('#col2'),
  };

  // Individual Guide pages.
  const guide = {
    skip_link: outer('#s-lg-public-skiplink'),
    guide_title: text('#s-lg-guide-name'),
    guide_description: inner('#s-lg-guide-description'),
    guide_search: inner('#s-lg-guide-header-search'),
    guide_nav: inner('.s-lg-tabs-side > nav > ul'),
    side_nav_boxes: inner('.s-lg-tabs-side > [role="complementary"]'),
    content: inner('#s-lg-guide-main'),
    page_prev_next_links: outer('#s-lg-page-prevnext'),
    last_updated_display: inner('#s-lg-guide-header-updated'),
    guide_url_display: inner('#s-lg-guide-header-url'),
    print_url_display: inner('#s-lg-guide-print-url'),
    login_url_display: inner('#s-lib-footer-login-link'),
    guide_subjects: inner('#s-lg-guide-header-subjects'),
    guide_tags: inner('#s-lg-guide-header-tags'),
    empty_page_sub_page_list: '',
    ADMIN_CMD_BAR: '',
    ADMIN_MINI_CMD_BAR: '',
  };

  // Shared Subject page placeholders.
  const subjectCommon = {
    skip_link: outer('#s-lg-public-skiplink'),
    page_title: text('#s-lib-public-header-title'),
    page_description: inner('#s-lib-public-header-desc'),
    page_nav: inner('#s-lib-public-nav'),
    navbar: inner('#sb-search-col-1'),

    // Extract the complete Search sidebar section.
    content_box_search: $('#col2 .margin-bottom-xlg')
      .filter((_, element) => {
        return $(element).find('.s-lib-public-side-header h2').first().text().trim() === 'Search';
      })
      .first()
      .toString(),
  };

  // Subject Landing.
  const subjectLanding = {
    ...subjectCommon,
    system_footer: outer('#s-lib-footer-public'),
  };

  // Individual Subject page.
  const subjectInfo = {
    ...subjectCommon,
    content_box_experts: outer('#s-lg-sb-experts-div'),
  };

  // Profile Landing.
  const profileLanding = {
    skip_link: outer('#s-lg-public-skiplink'),
    page_title: text('#s-lib-public-header-title'),
    page_description: inner('#s-lib-public-header-desc'),
    page_nav: inner('#s-lib-public-nav'),

    // Profile count and By Name / By Subject tabs.
    navbar: outer('#s-lib-public-main > .clearfix'),

    // Subject dropdown/filter.
    subject_list: inner('#s-lg-profile-subjects'),

    // Preserve original container IDs for Springshare JS.
    content_box_search: outer('#s-lg-profile-search-div'),
    content_box_az: outer('#s-lg-profile-az-div'),
    content_box_help: outer('#s-lg-profile-help-div'),
    content_box_guides: outer('#s-lg-profile-guides-div'),

    system_footer: outer('#s-lib-footer-public'),
  };

  // Individual Profile page.
  const profileInfo = {
    ...subjectCommon,
    profile_box: inner('#s-lg-profile-cols > #col1'),
    personal_statement: inner('#s-lg-profile-cols > #col2'),
    guide_list: '',
    content_box_specialties: inner('#s-lg-profile-cols > #col3'),
  };

  // Search Landing page.
  const search = {
    skip_link: outer('#s-lg-public-skiplink'),
    page_title: text('#s-lib-public-header-title'),
    page_description: inner('#s-lib-public-header-desc'),
    page_nav: inner('#s-lib-public-nav'),
    content_box_search: outer('#s-lg-srch-local'),
    content: inner('#s-lg-srch-cols'),
    system_footer: outer('#s-lib-footer-public'),
  };

  // A-Z Databases Landing page.
  const azDatabases = {
    skip_link: outer('#s-lg-public-skiplink'),
    page_title: text('#s-lib-public-header-title'),
    page_description: inner('#s-lib-public-header-desc'),
    page_nav: inner('#s-lib-public-nav'),

    // Search, subject, type, and vendor controls.
    navbar_wide: inner('#az-search-col-1'),

    // Alphabet navigation is populated by Springshare JS.
    alpha_list: inner('#s-lg-az-index'),

    // Reset controls.
    search_reset: inner('#s-lg-az-search-reset'),

    // Sidebar accordions.
    content_box_3872822: outer('#s-lg-az-custom-box-3872822'),
    content_box_3577872: outer('#s-lg-az-custom-box-3577872'),

    // New / Trial Databases accordion.
    trials_box: outer('#s-lg-az-trials'),

    system_footer: outer('#s-lib-footer-public'),
  };

  // Select placeholders for the requested page type.
  const pageValues = {
    home,
    guide,
    'subject-landing': subjectLanding,
    'subject-info': subjectInfo,
    'profile-landing': profileLanding,
    'profile-info': profileInfo,
    search,
    'az-databases': azDatabases,
  };

  const values = {
    ...common,
    ...(pageValues[type] || {}),
  };

  // Replace placeholders while preserving HTML comments.
  let body = template.replace(/<!--[\s\S]*?-->|{{([A-Za-z0-9_]+)}}/g, (match, key) => {
    if (match.startsWith('<!--')) {
      return match;
    }

    if (!Object.hasOwn(values, key)) {
      console.warn(`Missing placeholder (${type}): ${key}`);
      return match;
    }

    return values[key];
  });

  // Restore dynamic Subject content from production.
  if (type === 'subject-landing' || type === 'subject-info') {
    const rendered = load(body);

    if (type === 'subject-landing') {
      rendered('#s-lg-sb-cols > #col1').html(inner('#s-lg-sb-cols > #col1'));
    }

    if (type === 'subject-info') {
      rendered('#s-lg-sb-content-guides').html(inner('#s-lg-sb-content-guides'));

      rendered('#s-lg-sb-content-databases').html(inner('#s-lg-sb-content-databases'));
    }

    body = rendered('body').toString();
  }

  // Prevent LibCal widget errors when its trigger
  // is missing from the captured local fixture.
  if (type === 'subject-info') {
    body = body.replace(
      /document\.getElementById\((["'])(lc_appointments_\d+)\1\)\.addEventListener\(/g,
      'document.getElementById("$2")?.addEventListener('
    );
  }

  // Preserve production metadata, CSS, and JavaScript.
  const head = buildPreviewHead($, globalHTML, type);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${noIndex}
${head}
</head>
${body}
</html>`;
}
