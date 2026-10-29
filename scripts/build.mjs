// JEDRA website build. No dependencies: run `node scripts/build.mjs`, output goes to dist/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PARTNERS, PROJECTS, T } from '../site/content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'site');
const OUT = join(ROOT, 'dist');
const FORM_KEY = (process.env.WEB3FORMS_KEY || process.env.VITE_WEB3FORMS_KEY || '').trim();

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10);
const prefix = (lang) => (lang === 'en' ? '/en' : '');
const href = (lang, path) => prefix(lang) + path;
const other = (lang) => (lang === 'ar' ? 'en' : 'ar');
const wa = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

function imageSize(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
  throw new Error('unknown image ' + file);
}

// Responsive picture from site/assets/img/<name>-<width>.webp
function img(name, alt, { cls = '', sizes = '100vw', eager = false } = {}) {
  const files = readdirSync(join(SRC, 'assets/img')).filter((f) => f.startsWith(name + '-') && /^\d+$/.test(f.slice(name.length + 1, -5)));
  const widths = files.map((f) => +f.slice(name.length + 1, -5)).sort((a, b) => a - b);
  const big = widths.at(-1);
  const { w, h } = imageSize(join(SRC, `assets/img/${name}-${big}.webp`));
  const srcset = widths.map((x) => `/assets/img/${name}-${x}.webp ${x}w`).join(', ');
  return `<img src="/assets/img/${name}-${big}.webp" srcset="${srcset}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const logo = (lang, tone) => {
  const file = `logo-${lang}-${tone}.png`;
  const { w, h } = imageSize(join(SRC, 'assets/brand', file));
  return `<img src="/assets/brand/${file}" width="${w}" height="${h}" alt="${esc(T[lang].brand)}">`;
};

const ICONS = {
  headset: '<path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/><path d="M19 19c0 1.5-2 2-5 2"/>',
  crm: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18M8 13h4M8 16h7"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/>',
  team: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M16 14.2c2.8.3 5 2.6 5 5.8"/>',
  screen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
};
const icon = (name, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';

const BUILD = { css: '', js: '' };

// ---------- layout ----------
function head(lang, page) {
  const t = T[lang];
  const url = SITE.url + href(lang, page.path);
  const alt = (l) => SITE.url + href(l, page.path);
  const ld = page.jsonld ? `<script type="application/ld+json">${JSON.stringify(page.jsonld)}</script>` : '';
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${SITE.gtm}');</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
${page.noAlternate ? '' : `<link rel="alternate" hreflang="ar" href="${alt('ar')}">
<link rel="alternate" hreflang="en" href="${alt('en')}">
<link rel="alternate" hreflang="x-default" href="${alt('ar')}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(t.brandFull)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}/assets/og-${lang}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${t.locale}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#121E3B">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/assets/brand/icon-192.png" sizes="192x192">
<link rel="apple-touch-icon" href="/assets/brand/icon-180.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap">
${page.preload || ''}
<link rel="stylesheet" href="/assets/styles.css?v=${BUILD.css}">
${ld}
</head>`;
}

function header(lang, page) {
  const t = T[lang];
  const n = t.nav;
  const links = [
    ['/projects/', n.projects, 'projects'],
    ['/developers/', n.developers, 'developers'],
    ['/international/', n.international, 'international'],
    ['/about/', n.about, 'about'],
  ];
  const navLinks = links.map(([p, label, key]) => `<a href="${href(lang, p)}"${page.key === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const careers = `<a href="/newhires.html">${n.careers}</a>`;
  const switchHref = href(other(lang), page.path);
  return `<body>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${SITE.gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-header">
<div class="wrap">
<a class="logo" href="${href(lang, '/')}" aria-label="${esc(n.home)}">${logo(lang, 'light')}</a>
<nav class="nav" aria-label="${esc(n.primary)}">${navLinks}${careers}</nav>
<div class="header-tools">
<a class="lang" href="${switchHref}" hreflang="${other(lang)}" lang="${other(lang)}" aria-label="${esc(n.switchAria)}">${n.switchLabel}</a>
<a class="btn btn-gold header-cta" href="${href(lang, '/contact/')}">${n.cta}</a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${esc(n.menu)}" data-open="${esc(n.menu)}" data-close="${esc(n.close)}"><svg class="i-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg><svg class="i-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
</div>
</div>
</header>
<nav class="mobile-nav" id="mobile-nav" aria-label="${esc(n.primary)}">${navLinks}${careers}<a href="${href(lang, '/contact/')}">${n.contact}</a><a class="btn btn-gold" href="${wa(t.waText)}" data-loc="menu">${t.actions.whatsapp}</a></nav>`;
}

function footer(lang) {
  const t = T[lang];
  const f = t.footer;
  const n = t.nav;
  return `<footer class="site-footer">
<div class="wrap">
<div class="footer-grid">
<div><a class="footer-logo" href="${href(lang, '/')}" aria-label="${esc(n.home)}">${logo(lang, 'light')}</a><p>${f.tagline}</p></div>
<div><h2>${f.company}</h2><ul><li><a href="${href(lang, '/about/')}">${n.about}</a></li><li><a href="${href(lang, '/projects/')}">${n.projects}</a></li><li><a href="/newhires.html">${n.careers}</a></li></ul></div>
<div><h2>${f.services}</h2><ul><li><a href="${href(lang, '/developers/')}">${n.developers}</a></li><li><a href="${href(lang, '/contact/')}">${f.buyers}</a></li><li><a href="${href(lang, '/international/')}">${n.international}</a></li></ul></div>
<div><h2>${f.contact}</h2><ul><li><a class="ltr" href="tel:${SITE.phone}" data-loc="footer">${SITE.phoneDisplay}</a></li><li><a href="${wa(t.waText)}" data-loc="footer">${t.actions.whatsapp}</a></li><li><a class="ltr" href="mailto:${SITE.email}">${SITE.email}</a></li><li>${lang === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</li></ul></div>
</div>
<div class="footer-bottom">
<span>© ${SITE.year} ${t.brandFull}. ${f.rights}</span>
<span class="legal"><span>${f.fal} <span class="ltr">${SITE.falLicense}</span></span><span>${f.unified} <span class="ltr">${SITE.unifiedNumber}</span></span></span>
</div>
</div>
</footer>
<a class="wa-float" href="${wa(t.waText)}" aria-label="${esc(t.actions.whatsappAria)}" data-loc="float">${WA_SVG}</a>
<nav class="action-bar" aria-label="${esc(t.actions.whatsappAria)}">
<a class="action-call" href="tel:${SITE.phone}" data-loc="bar">${icon('phone', '')}${t.actions.call}</a>
<a class="action-wa" href="${wa(t.waText)}" data-loc="bar">${WA_SVG}${t.actions.whatsapp}</a>
</nav>
<script src="/assets/main.js?v=${BUILD.js}" defer></script>
</body>
</html>`;
}

// ---------- shared sections ----------
const statsBlock = (lang) => T[lang].stats.map((s) => `<div><p class="stat-num">${s.value}${s.unit ? `<small>${s.unit}</small>` : ''}</p><p class="stat-label">${s.label}</p></div>`).join('');

const partnersBlock = (lang) => `<ul class="partners" role="list">${PARTNERS.map((p) => `<li class="partner">${p[lang]}</li>`).join('')}</ul>`;

const projectName = (p, lang) => p[lang];
const projectUrl = (lang, p) => href(lang, `/projects/${p.slug}/`);

function featureCard(lang, p) {
  const t = T[lang];
  return `<article class="project-feature">
${img('pattern-line', '', { cls: 'bg-img', sizes: '(max-width: 640px) 100vw, 50vw' })}
<span class="badge badge-available">${t.status.available}</span>
<div class="over"><h3><a href="${projectUrl(lang, p)}">${projectName(p, lang)}</a></h3><p class="meta">${t.city(p.district[lang])}</p>
<div class="btn-row"><a class="btn btn-gold" href="${p.landing}">${t.projectsPage.register}</a><a class="more" href="${projectUrl(lang, p)}">${t.projectsPage.details}</a></div></div>
</article>`;
}

function soldItem(lang, p, linked = true) {
  const t = T[lang];
  const tag = linked ? 'a' : 'div';
  const sub = p.developer ? `${p.developer[lang]}${lang === 'ar' ? '، ' : ', '}${p.district[lang]}` : p.district[lang];
  return `<${tag} class="sold-item"${linked ? ` href="${projectUrl(lang, p)}"` : ''}><div><h3>${projectName(p, lang)}</h3><p>${sub}</p></div><span class="badge badge-sold">${t.status.sold}</span></${tag}>`;
}

function leadForm(lang, kind, { project = '', interest = '', who = 'buyer', name = 'website' } = {}) {
  const f = T[lang].form;
  const common = `data-lead="${name}" data-key="${FORM_KEY}" data-subject="${lang === 'ar' ? 'طلب جديد من موقع جيدرا' : 'New lead from the JEDRA website'}" data-sending="${esc(f.sending)}" data-success="${esc(f.success)}" data-error="${esc(f.error)}" data-invalid-phone="${esc(f.invalidPhone)}"`;
  const hp = `<input class="hp" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">`;
  const hidden = `<input type="hidden" name="language" value="${lang}">${project ? `<input type="hidden" name="project" value="${esc(project)}">` : ''}${interest ? `<input type="hidden" name="interest" value="${esc(interest)}">` : ''}`;
  const field = (id, label, input, full = false) => `<div class="field${full ? ' full' : ''}"><label for="${id}">${label}</label>${input}</div>`;
  const nameF = field(`${name}-name`, f.name, `<input id="${name}-name" name="name" type="text" autocomplete="name" placeholder="${esc(f.namePh)}" required>`);
  const phoneF = field(`${name}-phone`, f.phone, `<input id="${name}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" dir="ltr" placeholder="${esc(f.phonePh)}" required>`);
  if (kind === 'developer') {
    return `<form class="form" ${common} novalidate>${hp}${hidden}<input type="hidden" name="lead_type" value="${esc(f.whoOptions.developer)}">
${nameF}
${field(`${name}-company`, f.company, `<input id="${name}-company" name="company" type="text" autocomplete="organization" required>`)}
${field(`${name}-project`, f.projectName, `<input id="${name}-project" name="project_name" type="text">`)}
${field(`${name}-units`, f.units, `<input id="${name}-units" name="units" type="number" inputmode="numeric" min="1">`)}
${phoneF}
${field(`${name}-email`, f.email, `<input id="${name}-email" name="email" type="email" autocomplete="email" dir="ltr">`)}
<button class="btn btn-navy full" type="submit">${f.submitDev}</button>
<p class="form-status" role="status" aria-live="polite"></p>
</form>`;
  }
  const chips = Object.entries(f.whoOptions).map(([k, label]) => `<label class="chip"><input type="radio" name="lead_type" value="${esc(label)}"${k === who ? ' checked' : ''}><span>${label}</span></label>`).join('');
  return `<form class="form" ${common} novalidate>${hp}${hidden}
${nameF}
${phoneF}
<fieldset class="field full"><legend>${f.who}</legend><div class="chips">${chips}</div></fieldset>
${field(`${name}-message`, `${f.message} <span class="opt">${f.optional}</span>`, `<textarea id="${name}-message" name="message" rows="3" placeholder="${esc(f.messagePh)}"></textarea>`, true)}
<button class="btn btn-navy full" type="submit">${f.submit}</button>
<p class="form-status" role="status" aria-live="polite"></p>
</form>`;
}

const glassCards = (items) => items.map((s) => `<div class="glass">${icon(s.icon)}<h3>${s.title}</h3><p>${s.text}</p></div>`).join('');

// ---------- pages ----------
function homePage(lang) {
  const t = T[lang];
  const h = t.home;
  const available = PROJECTS.filter((p) => p.status === 'available');
  const sold = PROJECTS.filter((p) => p.status === 'sold');
  const body = `<main id="main">
<section class="dark hero center">
<div class="wrap">
<h1 class="h-xl">${h.h1}</h1>
<p class="lead on-dark">${h.lead}</p>
<div class="btn-row"><a class="btn btn-gold" href="${href(lang, '/developers/')}#meet">${h.ctaDev}</a><a class="btn btn-outline" href="${href(lang, '/projects/')}">${h.ctaBuyer}</a></div>
</div>
<div class="wide hero-media">${img('hero', '', { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div>
</section>

<section class="gold pad center" aria-labelledby="stats-title">
${img('fabric', '', { cls: 'bg-img' })}
<div class="wrap over"><h2 class="h-l" id="stats-title">${h.statsTitle}</h2><div class="stats">${statsBlock(lang)}</div></div>
</section>

<section class="light pad center" aria-labelledby="partners-title">
<div class="wrap"><h2 class="h-l" id="partners-title">${h.partnersTitle}</h2><p class="lead muted" style="margin-top:16px">${h.partnersLead}</p>${partnersBlock(lang)}</div>
</section>

<section class="mist pad" aria-labelledby="projects-title">
<div class="wrap">
<div class="section-head"><div><h2 class="h-l" id="projects-title">${h.projectsTitle}</h2><p class="lead muted">${h.projectsLead}</p></div><a class="more" href="${href(lang, '/projects/')}">${h.projectsAll}</a></div>
<div class="grid-2" style="margin-top:44px">${available.map((p) => featureCard(lang, p)).join('')}</div>
<div class="grid-2 sold-list">${sold.map((p) => soldItem(lang, p)).join('')}</div>
</div>
</section>

<section class="light" style="padding:16px 0">
<div class="wide tiles">
<article class="tile tile-dev dark">
<div class="pattern-band" style="background-image:url(/assets/img/pattern-solid-800.webp)"></div>
<p class="eyebrow">${h.devTile.eyebrow}</p><h2 class="h-m">${h.devTile.title}</h2><p>${h.devTile.text}</p>
<div class="btn-row"><a class="more" href="${href(lang, '/developers/')}">${h.devTile.more}</a><a class="more" href="${href(lang, '/developers/')}#meet">${h.devTile.talk}</a></div>
</article>
<article class="tile mist">
${img('careers', '', { cls: 'bg-img', sizes: '(max-width: 760px) 100vw, 50vw' })}
<p class="eyebrow">${h.careersTile.eyebrow}</p><h2 class="h-m">${h.careersTile.title}</h2>
<div class="btn-row"><a class="more" href="/newhires.html">${h.careersTile.cta}</a></div>
</article>
<article class="tile wide-tile dark tile-shade">
${img('riyadh', lang === 'ar' ? 'أفق الرياض عند الغروب' : 'Riyadh skyline at sunset', { cls: 'bg-img' })}
<p class="eyebrow">${h.intlTile.eyebrow}</p><h2 class="h-l" lang="en" dir="ltr">${h.intlTile.title}</h2><p>${h.intlTile.text}</p>
<div class="btn-row"><a class="more" href="${href(lang, '/international/')}">${h.intlTile.cta}</a>${lang === 'ar' ? `<a class="more" href="/en/international/" lang="en" hreflang="en">${h.intlTile.ctaEn}</a>` : ''}</div>
</article>
</div>
</section>

<section class="dark pad" aria-labelledby="system-title">
${img('network', '', { cls: 'bg-img' })}
<div class="wrap over center"><h2 class="h-l" id="system-title">${h.systemTitle}</h2><p class="lead on-dark" style="margin-top:20px">${h.systemLead}</p>
<div class="grid-4" style="margin-top:64px;text-align:start">${glassCards(t.system)}</div></div>
</section>

<section class="light pad" id="contact" aria-labelledby="contact-title">
<div class="wrap" style="max-width:800px"><div class="center"><h2 class="h-l" id="contact-title">${h.contactTitle}</h2><p class="lead muted" style="margin-top:16px">${h.contactLead}</p></div>${leadForm(lang, 'general', { name: 'home' })}</div>
</section>
</main>`;
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: T[lang].brandFull,
    alternateName: lang === 'ar' ? 'JEDRA' : 'جيدرا',
    url: SITE.url + href(lang, '/'),
    logo: `${SITE.url}/assets/brand/logo-${lang}-dark.png`,
    image: `${SITE.url}/assets/og-${lang}.png`,
    telephone: SITE.phone,
    email: SITE.email,
    address: { '@type': 'PostalAddress', addressLocality: lang === 'ar' ? 'الرياض' : 'Riyadh', addressCountry: 'SA' },
    areaServed: { '@type': 'City', name: lang === 'ar' ? 'الرياض' : 'Riyadh' },
    identifier: [{ '@type': 'PropertyValue', name: 'FAL', value: SITE.falLicense }, { '@type': 'PropertyValue', name: 'Unified National Number', value: SITE.unifiedNumber }],
  };
  return { path: '/', key: 'home', title: h.title, description: h.description, body, jsonld,
    preload: `<link rel="preload" as="image" type="image/webp" href="/assets/img/hero-1600.webp" imagesrcset="/assets/img/hero-800.webp 800w, /assets/img/hero-1600.webp 1600w" imagesizes="(max-width: 1400px) 100vw, 1400px" fetchpriority="high">` };
}

function developersPage(lang) {
  const t = T[lang];
  const d = t.developers;
  const sold = PROJECTS.filter((p) => p.status === 'sold');
  const s = d.subnav;
  const body = `<div class="subnav"><div class="wrap"><p class="subnav-title">${d.subnavTitle}</p>
<div style="display:flex;align-items:center;gap:24px"><nav aria-label="${esc(d.subnavTitle)}"><a href="#overview">${s.overview}</a><a href="#journey">${s.journey}</a><a href="#results">${s.results}</a><a href="#included">${s.included}</a></nav><a class="btn btn-gold" href="#meet">${d.subnavCta}</a></div></div></div>
<main id="main">
<section class="dark hero center" id="overview">
<div class="wrap"><h1 class="h-xl">${d.h1}</h1><p class="lead on-dark">${d.lead}</p>
<div class="btn-row"><a class="btn btn-gold" href="#meet">${d.ctaMeet}</a><a class="more" href="#journey">${d.ctaJourney}</a></div></div>
<div class="wide hero-media">${img('pattern-solid', '', { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div>
</section>

<section class="light pad" aria-labelledby="hl-title">
<div class="wrap"><h2 class="h-l" id="hl-title">${d.highlightsTitle}</h2></div>
<div class="rail-wrap" data-rail style="margin-top:44px">
<div class="rail">${d.highlights.map((c) => `<article class="rail-card tone-${c.tone}">${c.tone === 'network' ? img('network', '', { cls: 'bg-img', sizes: '400px' }) : ''}<h3>${c.title}</h3><p>${c.text}</p></article>`).join('')}</div>
<div class="wrap rail-controls"><button class="rail-btn" type="button" aria-label="${esc(d.prev)}">${icon('chevron', '').replace('m9 6 6 6-6 6', 'm15 6-6 6 6 6')}</button><button class="rail-btn" type="button" aria-label="${esc(d.next)}">${icon('chevron', '')}</button></div>
</div>
</section>

<section class="light pad" id="journey" aria-labelledby="journey-title" style="padding-top:0">
<div class="wrap"><div class="center"><h2 class="h-l" id="journey-title">${d.journeyTitle}</h2><p class="lead muted" style="margin-top:16px">${d.journeyLead}</p></div>
<ol class="journey">${d.journey.map((j) => `<li><h3>${j.title}</h3><p>${j.text}</p></li>`).join('')}</ol></div>
</section>

<section class="dark pad" id="results" aria-labelledby="results-title">
${img('pattern-line', '', { cls: 'bg-img dim' })}
<div class="wrap over"><h2 class="h-l center" id="results-title">${d.resultsTitle}</h2><div class="stats">${statsBlock(lang)}</div>
<h3 class="h-s" style="margin-top:88px">${d.resultsSold}</h3>
<div class="grid-2" style="margin-top:24px">${sold.map((p) => soldItem(lang, p, false)).join('')}</div>
<p class="on-dark" style="margin-top:40px"><strong style="color:#fff">${d.resultsPartners}:</strong> ${PARTNERS.map((p) => p[lang]).join(lang === 'ar' ? '، ' : ', ')}</p></div>
</section>

<section class="light pad" id="included" aria-labelledby="inc-title">
<div class="wrap"><h2 class="h-l center" id="inc-title">${d.includedTitle}</h2>
<div class="grid-4 features" style="margin-top:64px;gap:44px 28px">${d.included.map((i) => `<div class="feature">${icon(i.icon)}<h3>${i.title}</h3><p>${i.text}</p></div>`).join('')}</div></div>
</section>

<section class="gold pad" id="meet" aria-labelledby="meet-title">
<div class="wrap" style="max-width:840px"><div class="center"><h2 class="h-l" id="meet-title">${d.meetTitle}</h2><p class="lead" style="margin-top:16px">${d.meetLead}</p></div>${leadForm(lang, 'developer', { name: 'developer' })}</div>
</section>
</main>`;
  return { path: '/developers/', key: 'developers', title: d.title, description: d.description, body, bodyClass: 'has-subnav' };
}

function projectsPage(lang) {
  const t = T[lang];
  const p = t.projectsPage;
  const available = PROJECTS.filter((x) => x.status === 'available');
  const sold = PROJECTS.filter((x) => x.status === 'sold');
  const body = `<main id="main">
<section class="dark hero center pad-s" style="padding-bottom:72px"><div class="wrap"><h1 class="h-xl">${p.h1}</h1><p class="lead on-dark">${p.lead}</p></div></section>
<section class="mist pad" aria-labelledby="avail-title"><div class="wrap">
<h2 class="h-m" id="avail-title">${p.availableTitle}</h2>
<div class="grid-2" style="margin-top:32px">${available.map((x) => featureCard(lang, x)).join('')}</div>
<h2 class="h-m" style="margin-top:88px">${p.soldTitle}</h2>
<div class="grid-2 sold-list" style="margin-top:32px">${sold.map((x) => soldItem(lang, x)).join('')}</div>
</div></section>
<section class="light pad center"><div class="wrap"><h2 class="h-l">${p.askSimilar}</h2><p class="lead muted" style="margin-top:16px">${p.askSimilarText}</p>
<div class="btn-row" style="margin-top:28px"><a class="btn btn-navy" href="${href(lang, '/contact/')}">${t.nav.cta}</a><a class="more" href="${wa(t.waText)}" data-loc="projects">${t.actions.whatsapp}</a></div></div></section>
</main>`;
  return { path: '/projects/', key: 'projects', title: p.title, description: p.description, body };
}

function projectPage(lang, p) {
  const t = T[lang];
  const c = t.project;
  const name = p[lang];
  const available = p.status === 'available';
  const facts = [
    p.developer ? [c.developer, p.developer[lang]] : null,
    [c.location, t.city(p.district[lang])],
    [c.status, t.status[p.status]],
  ].filter(Boolean);
  const body = `<main id="main">
<section class="dark hero pad-s" style="padding-bottom:88px">
${img('pattern-line', '', { cls: 'bg-img dim' })}
<div class="wrap over">
<p><a class="more" href="${href(lang, '/projects/')}" style="font-weight:500">${c.back}</a></p>
<span class="badge ${available ? 'badge-available' : 'badge-sold'}" style="margin-top:28px">${t.status[p.status]}</span>
<h1 class="h-xl" style="margin-top:18px">${name}</h1>
<p class="lead on-dark" style="margin-top:18px">${available ? c.availableLead(name) : c.soldLead(name)}</p>
<div class="btn-row" style="margin-top:32px">${available
    ? `<a class="btn btn-gold" href="${p.landing}">${c.register}</a><a class="btn btn-outline" href="${wa(c.waText(name))}" data-loc="project">${c.whatsapp}</a>`
    : `<a class="btn btn-gold" href="${href(lang, '/projects/')}">${c.soldCta}</a><a class="btn btn-outline" href="${wa(t.waText)}" data-loc="project">${t.actions.whatsapp}</a>`}</div>
</div>
</section>
<section class="light pad-s"><div class="wrap"><dl class="facts" style="margin-top:0">${facts.map(([k, v]) => `<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div></section>
<section class="gold pad center">${img('fabric', '', { cls: 'bg-img' })}<div class="wrap over"><h2 class="h-l">${t.home.statsTitle}</h2><div class="stats">${statsBlock(lang)}</div>
<div class="btn-row" style="margin-top:56px"><a class="btn btn-navy" href="${href(lang, '/contact/')}">${t.nav.cta}</a></div></div></section>
</main>`;
  return { path: `/projects/${p.slug}/`, key: 'projects', title: `${name} | ${t.city(p.district[lang])} | ${c.titleSuffix}`, description: c.description(name, p.district[lang]), body };
}

function aboutPage(lang) {
  const t = T[lang];
  const a = t.about;
  const body = `<main id="main">
<section class="dark hero center"><div class="wrap"><h1 class="h-xl">${a.h1}</h1><p class="lead on-dark">${a.lead}</p></div>
<div class="wide hero-media">${img('careers', '', { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div></section>
<section class="gold pad center">${img('fabric', '', { cls: 'bg-img' })}<div class="wrap over"><div class="stats" style="margin-top:0">${statsBlock(lang)}</div></div></section>
<section class="light pad"><div class="wrap split">
<div><h2 class="h-l">${a.storyTitle}</h2></div>
<div class="stack-m lead">${a.story.map((x) => `<p>${x}</p>`).join('')}</div>
</div></section>
<section class="dark pad">${img('network', '', { cls: 'bg-img' })}<div class="wrap over"><h2 class="h-l center">${a.howTitle}</h2><div class="grid-4" style="margin-top:56px">${glassCards(t.system)}</div></div></section>
<section class="light pad"><div class="wrap">
<h2 class="h-l">${a.licenseTitle}</h2>
<dl class="facts"><div class="fact"><dt>${a.licenseFal}</dt><dd class="ltr">${SITE.falLicense}</dd></div><div class="fact"><dt>${a.licenseUnified}</dt><dd class="ltr">${SITE.unifiedNumber}</dd></div><div class="fact"><dt>${a.officeTitle.replace('.', '')}</dt><dd>${a.office}</dd></div></dl>
<div class="center" style="margin-top:72px"><h2 class="h-m">${T[lang].home.partnersTitle}</h2>${partnersBlock(lang)}</div>
</div></section>
</main>`;
  return { path: '/about/', key: 'about', title: a.title, description: a.description, body };
}

function internationalPage(lang) {
  const t = T[lang];
  const i = t.international;
  const body = `<main id="main">
<section class="dark hero center"><div class="wrap"><p class="eyebrow">${i.eyebrow}</p><h1 class="h-xl" lang="en" dir="ltr" style="margin-top:12px">${i.h1}</h1><p class="lead on-dark">${i.lead}</p>
<div class="btn-row"><a class="btn btn-gold" href="#contact">${i.cta}</a><a class="btn btn-outline" href="${wa(t.waText)}" data-loc="international">${t.actions.whatsapp}</a></div></div>
<div class="wide hero-media">${img('riyadh', lang === 'ar' ? 'أفق الرياض عند الغروب' : 'Riyadh skyline at sunset', { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div></section>
<section class="light pad"><div class="wrap"><h2 class="h-l center">${i.pointsTitle}</h2>
<div class="grid-3" style="margin-top:56px;gap:40px 28px">${i.points.map((x) => `<div class="feature">${icon(x.icon)}<h3>${x.title}</h3><p>${x.text}</p></div>`).join('')}</div></div></section>
<section class="gold pad center">${img('fabric', '', { cls: 'bg-img' })}<div class="wrap over"><div class="stats" style="margin-top:0">${statsBlock(lang)}</div></div></section>
<section class="light pad" id="contact"><div class="wrap" style="max-width:800px"><div class="center"><h2 class="h-l">${t.home.contactTitle}</h2><p class="lead muted" style="margin-top:16px">${t.home.contactLead}</p></div>${leadForm(lang, 'general', { who: 'investor', interest: 'international', name: 'international' })}</div></section>
</main>`;
  return { path: '/international/', key: 'international', title: i.title, description: i.description, body };
}

function contactPage(lang) {
  const t = T[lang];
  const c = t.contactPage;
  const body = `<main id="main">
<section class="dark hero center pad-s" style="padding-bottom:72px"><div class="wrap"><h1 class="h-xl">${c.h1}</h1><p class="lead on-dark">${c.lead}</p></div></section>
<section class="light pad"><div class="wrap split">
<div>${leadForm(lang, 'general', { name: 'contact' })}</div>
<div><h2 class="h-s" style="margin-top:44px">${c.direct}</h2>
<div class="channels" style="margin-top:20px">
<a class="channel" href="${wa(t.waText)}" data-loc="contact">${WA_SVG.replace('<svg', '<svg width="26" height="26"')}<span>${t.actions.whatsapp}<small class="ltr">${SITE.phoneDisplay}</small></span></a>
<a class="channel" href="tel:${SITE.phone}" data-loc="contact">${icon('phone', '')}<span>${t.actions.call}<small class="ltr">${SITE.phoneDisplay}</small></span></a>
<a class="channel" href="mailto:${SITE.email}">${icon('mail', '')}<span>${t.form.email}<small class="ltr">${SITE.email}</small></span></a>
<div class="channel">${icon('pin', '')}<span>${t.about.officeTitle.replace('.', '')}<small>${t.about.office}</small></span></div>
</div></div>
</div></section>
</main>`;
  return { path: '/contact/', key: 'contact', title: c.title, description: c.description, body };
}

function notFoundPage() {
  const a = T.ar.notFound;
  const e = T.en.notFound;
  const body = `<main id="main"><section class="dark hero center pad" style="min-height:70vh"><div class="wrap">
<h1 class="h-l">${a.h1}</h1><p class="lead on-dark">${a.text}</p>
<div class="btn-row"><a class="btn btn-gold" href="/">${a.home}</a><a class="more" href="/projects/">${T.ar.nav.projects}</a></div>
<p class="lead on-dark" lang="en" dir="ltr" style="margin-top:56px">${e.h1} ${e.text}</p>
<div class="btn-row"><a class="more" href="/en/" lang="en">${e.home}</a></div>
</div></section></main>`;
  return { path: '/404', key: '404', title: `${a.title} | ${T.ar.brand}`, description: a.text, body, noAlternate: true, noindex: true };
}

// ---------- write ----------
function writePage(lang, page) {
  let html = head(lang, page) + '\n' + header(lang, page).replace('<body>', `<body${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>`) + '\n' + page.body + '\n' + footer(lang);
  if (page.noindex) html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">');
  const file = page.path === '/404' ? join(OUT, '404.html') : join(OUT, prefix(lang), page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html.replace(/\n{2,}/g, '\n'));
  return page.path;
}

// static assets
cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
cpSync(join(SRC, 'styles.css'), join(OUT, 'assets/styles.css'));
cpSync(join(SRC, 'main.js'), join(OUT, 'assets/main.js'));
cpSync(join(SRC, 'assets/brand/favicon.ico'), join(OUT, 'favicon.ico'));
BUILD.css = hash(join(SRC, 'styles.css'));
BUILD.js = hash(join(SRC, 'main.js'));

// existing campaign / QR landing pages and the careers form: copied unchanged
const LEGACY = join(ROOT, 'public');
for (const entry of readdirSync(LEGACY)) {
  if (entry === 'index.html') continue; // the old redirect stub is not part of the site
  cpSync(join(LEGACY, entry), join(OUT, entry), { recursive: true });
}

const routes = [];
for (const lang of ['ar', 'en']) {
  const pages = [homePage(lang), developersPage(lang), projectsPage(lang), aboutPage(lang), internationalPage(lang), contactPage(lang), ...PROJECTS.map((p) => projectPage(lang, p))];
  for (const page of pages) routes.push({ lang, path: writePage(lang, page) });
}
writePage('ar', notFoundPage());

// sitemap, robots, manifest
const paths = [...new Set(routes.map((r) => r.path))];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.flatMap((p) => ['ar', 'en'].map((lang) => `<url><loc>${SITE.url}${href(lang, p)}</loc><xhtml:link rel="alternate" hreflang="ar" href="${SITE.url}${p}"/><xhtml:link rel="alternate" hreflang="en" href="${SITE.url}/en${p}"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE.url}${p}"/></url>`)).join('\n')}
</urlset>
`;
writeFileSync(join(OUT, 'sitemap.xml'), sitemap);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(join(OUT, 'site.webmanifest'), JSON.stringify({ name: T.ar.brandFull, short_name: T.ar.brand, lang: 'ar', dir: 'rtl', start_url: '/', display: 'browser', background_color: '#121E3B', theme_color: '#121E3B', icons: [{ src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2));

const count = (dir) => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? count(join(dir, f)) : 1), 0);
console.log(`Built ${routes.length + 1} pages, ${count(OUT)} files.${FORM_KEY ? '' : ' Warning: WEB3FORMS_KEY / VITE_WEB3FORMS_KEY is not set, so lead forms will show an error until it is.'}`);
if (!existsSync(join(OUT, 'submitrequest.html'))) throw new Error('landing page missing from build');
