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
const comma = (lang) => (lang === 'ar' ? '، ' : ', ');

function imageSize(file) {
  const b = readFileSync(file);
  if (b.toString('ascii', 1, 4) === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') { const n = b.readUInt32LE(21); return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1 }; }
  throw new Error('unknown image ' + file);
}

// Responsive image from site/assets/img/<name>-<width>.webp
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
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m8.8 12 2.2 2.2 4.3-4.4"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M3 12.5h18"/>',
  megaphone: '<path d="M3 10v4a1 1 0 0 0 1 1h3l8 4V5L7 9H4a1 1 0 0 0-1 1z"/><path d="M18.5 9.5a3.5 3.5 0 0 1 0 5M7 15l1.5 5h2.5l-1-4.5"/>',
  handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1.4 1.4 0 0 1-2-2l2.8-2.8a3.4 3.4 0 0 1 4.4-.3l.4.3a3 3 0 0 0 2.1.6H21"/><path d="M3 5.4h1.6a3 3 0 0 1 2.1.9L11 10.6M3 13l5.5 5.5a1.4 1.4 0 0 0 2-2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  pin: '<path d="M12 21s7-6.1 7-12a7 7 0 0 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevronBack: '<path d="m15 6-6 6 6 6"/>',
  menu: '<path d="M4 8h16M4 16h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const icon = (name, cls = 'icon') => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';
const SOCIAL = {
  x: ['X', '<path d="M4 4l7.2 9.6L4.4 20h1.8l5.8-5.4 4 5.4H20l-7.5-10L19 4h-1.8l-5.3 5L8 4z" fill="currentColor" stroke="none"/>'],
  instagram: ['Instagram', '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'],
  snapchat: ['Snapchat', '<path d="M12 3.5c2.8 0 4.6 2.1 4.6 4.7v2.3l1.6-.4c.6 0 .8.7.3 1l-1.8.9c.6 1.6 1.8 2.8 3.3 3.3-.3.7-1.4 1-2.6 1.1-.2.6-.2 1.1-.7 1.1-.9 0-1.7-.4-2.7.3-.8.6-1.5.9-2 .9s-1.2-.3-2-.9c-1-.7-1.8-.3-2.7-.3-.5 0-.5-.5-.7-1.1-1.2-.1-2.3-.4-2.6-1.1 1.5-.5 2.7-1.7 3.3-3.3l-1.8-.9c-.5-.3-.3-1 .3-1l1.6.4V8.2c0-2.6 1.8-4.7 4.6-4.7z"/>'],
  tiktok: ['TikTok', '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.4 2.5 2.2 4.3 5 4.5"/>'],
  linkedin: ['LinkedIn', '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 10.5V16M8 7.8v.1M11.5 16v-3.2c0-1.4 1-2.3 2.2-2.3s2 .9 2 2.3V16M11.5 10.5V16"/>'],
};

const BUILD = { css: '', js: '' };
// International section image: add site/assets/img/makkah-<width>.webp and it is used automatically.
const INTL = existsSync(join(SRC, 'assets/img/makkah-800.webp'))
  ? { img: 'makkah', alt: { ar: 'المسجد الحرام في مكة المكرمة', en: 'The Grand Mosque in Makkah' } }
  : { img: 'riyadh', alt: { ar: 'أفق الرياض عند الغروب', en: 'Riyadh skyline at sunset' } };

// ---------- layout ----------
function head(lang, page) {
  const t = T[lang];
  const url = SITE.url + href(lang, page.path);
  const alt = (l) => SITE.url + href(l, page.path);
  const ld = (page.jsonld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n');
  return `<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${SITE.gtm}');</script>
<meta charset="utf-8">${page.noindex ? '\n<meta name="robots" content="noindex">' : ''}
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
${page.noAlternate ? '' : `<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ar" href="${alt('ar')}">
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
    ['/properties/', n.projects, 'projects'],
    ['/developers/', n.developers, 'developers'],
    ['/international/', n.international, 'international'],
    ['/about/', n.about, 'about'],
  ];
  const navLinks = links.map(([p, label, key]) => `<a href="${href(lang, p)}"${page.key === key ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const careers = `<a href="/newhires.html">${n.careers}</a>`;
  const switchHref = href(other(lang), page.path === '/404' ? '/' : page.path);
  return `<body${page.bodyClass ? ` class="${page.bodyClass}"` : ''}>
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${SITE.gtm}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<a class="skip" href="#main">${t.skip}</a>
<header class="site-header">
<div class="wrap">
<a class="logo" href="${href(lang, '/')}" aria-label="${esc(n.homeAria)}">${logo(lang, 'light')}</a>
<nav class="nav" aria-label="${esc(n.primary)}">${navLinks}${careers}</nav>
<div class="header-tools">
<a class="lang" href="${switchHref}" hreflang="${other(lang)}" lang="${other(lang)}" aria-label="${esc(n.switchAria)}">${n.switchLabel}</a>
<a class="btn btn-gold header-cta" href="${href(lang, '/contact/')}">${n.cta}</a>
<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="${esc(n.menu)}" data-open="${esc(n.menu)}" data-close="${esc(n.close)}">${icon('menu', 'i-open')}${icon('close', 'i-close')}</button>
</div>
</div>
</header>
<nav class="mobile-nav" id="mobile-nav" aria-label="${esc(n.primary)}">${navLinks}${careers}<a href="${href(lang, '/contact/')}">${n.contact}</a><a class="btn btn-gold" href="${wa(t.waText)}" data-loc="menu">${t.cta.whatsapp}</a></nav>`;
}

function footer(lang, page) {
  const t = T[lang];
  const f = t.footer;
  const n = t.nav;
  // Apple-style: the breadcrumb above the site map
  const crumbs = page.crumbs ? `<nav class="crumbs" aria-label="${esc(n.breadcrumb)}"><a href="${href(lang, '/')}">${t.brand}</a>${page.crumbs.map(([label, p], i) => (i === page.crumbs.length - 1 ? `<span aria-current="page">${label}</span>` : `<a href="${href(lang, p)}">${label}</a>`)).join('')}</nav>` : '';
  const social = Object.entries(SITE.social).filter(([, u]) => u);
  const socialHtml = social.length ? `<div class="social"><p>${f.follow}</p>${social.map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" aria-label="${SOCIAL[k][0]}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SOCIAL[k][1]}</svg></a>`).join('')}</div>` : '';
  return `<footer class="site-footer">
<div class="wrap">
${crumbs}
<div class="footer-grid">
<div><a class="footer-logo" href="${href(lang, '/')}" aria-label="${esc(n.homeAria)}">${logo(lang, 'light')}</a><p>${f.tagline}</p>${socialHtml}</div>
<div><h2>${f.company}</h2><ul><li><a href="${href(lang, '/about/')}">${n.about}</a></li><li><a href="${href(lang, '/properties/')}">${n.projects}</a></li><li><a href="/newhires.html">${n.careers}</a></li></ul></div>
<div><h2>${f.services}</h2><ul><li><a href="${href(lang, '/developers/')}">${n.developers}</a></li><li><a href="${href(lang, '/properties/')}">${f.buyers}</a></li><li><a href="${href(lang, '/international/')}">${n.international}</a></li></ul></div>
<div><h2>${f.contact}</h2><div class="social contact-icons"><a href="tel:${SITE.phone}" data-loc="footer" aria-label="${esc(t.actions.call)} ${SITE.phoneDisplay}" title="${SITE.phoneDisplay}">${icon('phone', '')}</a><a href="${wa(t.waText)}" data-loc="footer" aria-label="${esc(t.actions.whatsapp)}" title="${esc(t.actions.whatsapp)}">${WA_SVG}</a><a href="mailto:${SITE.email}" aria-label="${SITE.email}" title="${SITE.email}">${icon('mail', '')}</a></div><ul style="margin-top:16px"><li><a href="${href(lang, '/contact/')}">${n.contact}</a></li></ul></div>
</div>
<div class="footer-bottom">
<span>© ${SITE.year} ${t.brandFull}. ${f.rights}</span>
<span class="legal"><span>${f.fal} <span class="ltr">${SITE.falLicense}</span></span><span>${f.unified} <span class="ltr">${SITE.unifiedNumber}</span></span><a href="${href(lang, '/privacy/')}">${n.privacy}</a><a href="${href(lang, '/terms/')}">${n.terms}</a></span>
</div>
</div>
</footer>
<a class="wa-float" href="${wa(t.waText)}" aria-label="${esc(t.actions.whatsappAria)}" data-loc="float">${WA_SVG}</a>
<nav class="action-bar" aria-label="${esc(t.actions.bar)}">
<a class="action-call" href="tel:${SITE.phone}" data-loc="bar">${icon('phone', '')}${t.actions.call}</a>
<a class="action-wa" href="${wa(t.waText)}" data-loc="bar">${WA_SVG}${t.actions.whatsapp}</a>
</nav>
<script src="/assets/main.js?v=${BUILD.js}" defer></script>
</body>
</html>`;
}

// ---------- shared blocks ----------
const statsBlock = (lang) => T[lang].stats.map((s) => `<div><p class="stat-num">${s.value}${s.unit ? `<small>${s.unit}</small>` : ''}</p><p class="stat-label">${s.label}</p></div>`).join('');
const stats = (lang, style = '') => `<div class="stats"${style ? ` style="${style}"` : ''}>${statsBlock(lang)}</div>`;

function partnerLogo(p, lang) {
  if (!p.logo) return p[lang];
  const { w, h } = imageSize(join(SRC, 'assets/partners', p.logo));
  return `<img src="/assets/partners/${p.logo}" alt="${esc(p[lang])}" width="${Math.round((p.h * w) / h)}" height="${p.h}" style="--h:${p.h}px" loading="lazy" decoding="async">`;
}
const partnersBlock = (lang, tone = '') => `<ul class="partners${tone ? ' ' + tone : ''}" role="list">${PARTNERS.map((p) => `<li class="partner">${partnerLogo(p, lang)}</li>`).join('')}</ul>`;

const projectUrl = (lang, p) => href(lang, `/properties/${p.slug}/`);

function featureCard(lang, p) {
  const t = T[lang];
  return `<article class="project-feature${p.cover ? ' has-photo' : ''}" data-status="${p.status}">
${p.cover ? img(p.cover, p[lang], { cls: 'bg-img', sizes: '(max-width: 640px) 100vw, 50vw' }) : img('pattern-line', '', { cls: 'bg-img', sizes: '(max-width: 640px) 100vw, 50vw' })}
<span class="badge badge-available">${t.status.available}</span>
<div class="over"><h3><a href="${projectUrl(lang, p)}">${p[lang]}</a></h3><p class="meta">${t.city(p.district[lang])}${p.type ? comma(lang) + p.type[lang] : ''}</p>
<div class="btn-row"><a class="btn btn-gold" href="${projectUrl(lang, p)}">${t.cta.viewProject}</a><a class="more" href="${projectUrl(lang, p)}#request">${p.price ? p.price[lang] : t.cta.price}</a></div></div>
</article>`;
}

function soldItem(lang, p, linked = true) {
  const t = T[lang];
  const tag = linked ? 'a' : 'div';
  const sub = p.developer ? `${p.developer[lang]}${comma(lang)}${p.district[lang]}` : p.district[lang];
  return `<${tag} class="sold-item" data-status="sold"${linked ? ` href="${projectUrl(lang, p)}"` : ''}><div><h3>${p[lang]}</h3><p>${sub}</p></div><span class="badge badge-sold">${t.status.sold}</span></${tag}>`;
}

// Lead forms. kind: general | project | developer. All post to Web3Forms with campaign data (see main.js).
function leadForm(lang, kind, { project = '', interest = '', name = 'website', compact = false } = {}) {
  const t = T[lang];
  const f = t.form;
  const attrs = `data-lead="${name}" data-key="${FORM_KEY}" data-subject="${lang === 'ar' ? 'طلب جديد من موقع جيدرا' : 'New lead from the JEDRA website'}" data-sending="${esc(f.sending)}" data-success="${esc(f.success)}" data-error="${esc(f.error)}" data-invalid-phone="${esc(f.invalidPhone)}" data-need-consent="${esc(f.needConsent)}"`;
  const hidden = `<input class="hp" type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true"><input type="hidden" name="language" value="${lang}">${project ? `<input type="hidden" name="project" value="${esc(project)}">` : ''}${interest ? `<input type="hidden" name="interest" value="${esc(interest)}">` : ''}`;
  const id = (x) => `${name}-${x}`;
  const field = (key, label, input, full = false) => `<div class="field${full ? ' full' : ''}"><label for="${id(key)}">${label}</label>${input}</div>`;
  const chips = (group, legend, options, checked, full = true, extra = '') => `<fieldset class="field${full ? ' full' : ''}"${extra}><legend>${legend}</legend><div class="chips">${Object.entries(options).map(([k, label]) => `<label class="chip"><input type="radio" name="${group}" value="${esc(label)}" data-key="${k}"${k === checked ? ' checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>`;
  const nameF = field('name', f.name, `<input id="${id('name')}" name="name" type="text" autocomplete="name" placeholder="${esc(f.namePh)}" required>`);
  const phoneF = field('phone', f.phone, `<input id="${id('phone')}" name="phone" type="tel" autocomplete="tel" inputmode="tel" dir="ltr" placeholder="${esc(f.phonePh)}" required>`);
  const emailF = (full = false) => field('email', `${f.email} <span class="opt">${f.optional}</span>`, `<input id="${id('email')}" name="email" type="email" autocomplete="email" dir="ltr">`, full);
  const messageF = (label = f.message) => field('message', `${label} <span class="opt">${f.optional}</span>`, `<textarea id="${id('message')}" name="message" rows="3" placeholder="${esc(f.messagePh)}"></textarea>`, true);
  const consent = `<label class="consent full"><input type="checkbox" name="consent" value="yes" required><span>${f.consent(href(lang, '/privacy/'))}</span></label>
<label class="consent full optional"><input type="checkbox" name="marketing_consent" value="yes"><span>${f.marketing}</span></label>`;
  const submit = (label) => `<button class="btn btn-navy full" type="submit">${label}</button><p class="form-status" role="status" aria-live="polite"></p>`;
  const projectOptions = [`<option value="${esc(f.projectAny)}">${f.projectAny}</option>`, ...PROJECTS.filter((p) => p.status === 'available').map((p) => `<option value="${esc(p[lang])}">${p[lang]}</option>`)].join('');

  if (kind === 'developer') {
    return `<form class="form" ${attrs} novalidate>${hidden}<input type="hidden" name="request_type" value="${esc(f.types.developer)}">
${nameF}
${field('company', f.company, `<input id="${id('company')}" name="company" type="text" autocomplete="organization" required>`)}
${phoneF}
${emailF()}
${chips('project_type', f.projectType, f.projectTypes, 'residential')}
${field('units', f.units, `<input id="${id('units')}" name="units" type="number" inputmode="numeric" min="1" required>`)}
${messageF()}
${consent}
${submit(f.submitDev)}
</form>`;
  }
  if (kind === 'project') {
    return `<form class="form" ${attrs} novalidate>${hidden}
${chips('request_type', f.requestType, { project: f.types.project, visit: f.types.visit }, 'project')}
${nameF}
${phoneF}
${chips('visit_time', f.visitTime, f.visitTimes, 'evening', true, ' data-show-when="visit" hidden')}
${messageF()}
${consent}
${submit(f.submitProject)}
</form>`;
  }
  // general
  return `<form class="form" ${attrs} novalidate>${hidden}
${chips('request_type', f.requestType, f.types, 'project')}
${nameF}
${phoneF}
${compact ? '' : `<div class="field" data-show-when="project visit"><label for="${id('project')}">${f.projectSel}</label><select id="${id('project')}" name="project">${projectOptions}</select></div>
${chips('contact_by', f.contactBy, f.contactWays, 'call')}`}
${chips('visit_time', f.visitTime, f.visitTimes, 'evening', true, ' data-show-when="visit" hidden')}
${messageF()}
${consent}
${submit(f.submit)}
</form>`;
}

// One "Talk to JEDRA" block, same layout on every page: heading, the form, and direct channels beside it.
function contactSection(lang, { kind = 'general', name = 'contact', interest = '', project = '', title, lead, id = 'contact', tone = 'light', after = '' } = {}) {
  const t = T[lang];
  const h = t.home;
  const heading = title === null ? '' : `<div class="contact-head"><h2 class="h-l" id="${id}-title">${title || h.contactTitle}</h2><p class="lead">${lead || h.contactLead}</p></div>`;
  return `<section class="${tone} pad" id="${id}"${title === null ? '' : ` aria-labelledby="${id}-title"`}><div class="wrap">
${heading}
<div class="contact-split">
<div class="contact-form">${leadForm(lang, kind, { name, interest, project })}${after}</div>
<aside class="contact-aside" aria-label="${esc(h.contactDirect)}">
<h3>${h.contactDirect}</h3>
<div class="channels">
<a class="channel" href="${wa(project ? t.project.waText(project) : t.waText)}" data-loc="${name}">${WA_SVG}<span>${t.actions.whatsapp}<small class="ltr">${SITE.phoneDisplay}</small></span></a>
<a class="channel" href="tel:${SITE.phone}" data-loc="${name}">${icon('phone', '')}<span>${t.actions.call}<small class="ltr">${SITE.phoneDisplay}</small></span></a>
<a class="channel" href="mailto:${SITE.email}">${icon('mail', '')}<span>${t.form.email}<small class="ltr">${SITE.email}</small></span></a>
</div>
<p class="aside-legal">${t.footer.fal} <span class="ltr">${SITE.falLicense}</span><br>${t.footer.unified} <span class="ltr">${SITE.unifiedNumber}</span></p>
</aside>
</div></div></section>`;
}

const cards = (items, cls = 'glass') => items.map((s) => `<div class="${cls}">${icon(s.icon)}<h3>${s.title}</h3><p>${s.text}</p></div>`).join('');

const breadcrumbLd = (lang, crumbs) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [[T[lang].brand, '/'], ...crumbs].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE.url + href(lang, p) })),
});

// ---------- pages ----------
function homePage(lang) {
  const t = T[lang];
  const h = t.home;
  const available = PROJECTS.filter((p) => p.status === 'available');
  const sold = PROJECTS.filter((p) => p.status === 'sold');
  const path = (x) => `<article class="path path-${x.key}">
<p class="eyebrow">${x.eyebrow}</p><h3 class="h-m">${x.title}</h3>
<ul class="checks">${x.points.map((pt) => `<li>${icon('check', '')}${pt}</li>`).join('')}</ul>
<div class="btn-row"><a class="btn ${x.key === 'dev' ? 'btn-gold' : 'btn-navy'}" href="${href(lang, x.ctaHref)}">${t.cta[x.cta]}</a><a class="more" href="${href(lang, x.cta2Href)}">${t.cta[x.cta2]}</a></div>
</article>`;
  const heroProject = PROJECTS.find((p) => p.status === 'available' && p.cover);
  const body = `<main id="main">
<section class="dark hero center">
<div class="wrap">
<h1 class="h-xl">${h.h1}</h1>
<p class="lead on-dark">${h.lead}</p>
<div class="btn-row"><a class="btn btn-gold" href="${href(lang, '/properties/')}">${t.cta.explore}</a><a class="btn btn-outline" href="${href(lang, '/developers/')}">${t.cta.devSolutions}</a></div>
</div>
${heroProject ? `<figure class="wide hero-media">${img(heroProject.cover, T[lang].project.photoAlt(heroProject[lang]), { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}<figcaption><a class="more" href="${projectUrl(lang, heroProject)}">${h.heroCaption(heroProject[lang], heroProject.district[lang])}</a></figcaption></figure>` : ''}
</section>

<section class="light pad" aria-labelledby="paths-title">
<div class="wrap"><h2 class="h-l center" id="paths-title">${h.pathsTitle}</h2>
<div class="paths">${h.paths.map(path).join('')}</div></div>
</section>

<section class="gold pad center" aria-labelledby="stats-title">
${img('fabric', '', { cls: 'bg-img' })}
<div class="wrap over"><h2 class="h-l" id="stats-title">${h.statsTitle}</h2>${stats(lang)}</div>
</section>

<section class="light pad center" aria-labelledby="partners-title">
<div class="wrap"><h2 class="h-l" id="partners-title">${h.partnersTitle}</h2><p class="lead muted" style="margin-top:16px">${h.partnersLead}</p>${partnersBlock(lang)}</div>
</section>

<section class="mist pad" aria-labelledby="projects-title">
<div class="wrap">
<div class="section-head"><div><h2 class="h-l" id="projects-title">${h.projectsTitle}</h2><p class="lead muted">${h.projectsLead}</p></div><a class="more" href="${href(lang, '/properties/')}">${t.cta.allProjects}</a></div>
<div class="grid-2" style="margin-top:44px">${available.map((p) => featureCard(lang, p)).join('')}</div>
<div class="grid-2 sold-list">${sold.map((p) => soldItem(lang, p)).join('')}</div>
</div>
</section>

<section class="light pad" aria-labelledby="why-title">
<div class="wrap"><h2 class="h-l center" id="why-title">${h.whyTitle}</h2>
<div class="grid-4 features" style="margin-top:56px;gap:44px 28px">${cards(h.why, 'feature')}</div></div>
</section>

<section class="dark pad" aria-labelledby="method-title">
${img('network', '', { cls: 'bg-img' })}
<div class="wrap over center"><h2 class="h-l" id="method-title">${h.methodTitle}</h2><p class="lead on-dark" style="margin-top:20px">${h.methodLead}</p>
<div class="grid-4" style="margin-top:64px;text-align:start">${cards(t.method)}</div></div>
</section>

<section class="light" style="padding:16px 0">
<div class="wide tiles">
<article class="tile gold">
${img('fabric', '', { cls: 'bg-img', sizes: '(max-width: 760px) 100vw, 50vw' })}
<p class="eyebrow">${h.careersTile.eyebrow}</p><h2 class="h-m">${h.careersTile.title}</h2>
<div class="btn-row"><a class="more" href="/newhires.html">${t.cta.apply}</a></div>
</article>
<article class="tile dark tile-shade">
${img(INTL.img, INTL.alt[lang], { cls: 'bg-img', sizes: '(max-width: 760px) 100vw, 50vw' })}
<p class="eyebrow">${h.intlTile.eyebrow}</p><h2 class="h-m">${h.intlTile.title}</h2><p>${h.intlTile.text}</p>
<div class="btn-row"><a class="more" href="${href(lang, '/international/')}">${t.cta.learnMore}</a>${lang === 'ar' ? `<a class="more" href="/en/international/" lang="en" hreflang="en">${h.intlTile.ctaEn}</a>` : ''}</div>
</article>
</div>
</section>

${contactSection(lang, { name: 'home' })}
</main>`;
  const org = {
    '@context': 'https://schema.org', '@type': 'RealEstateAgent',
    name: t.brandFull, alternateName: lang === 'ar' ? 'JEDRA' : 'جيدرا',
    url: SITE.url + href(lang, '/'), logo: `${SITE.url}/assets/brand/logo-${lang}-dark.png`, image: `${SITE.url}/assets/og-${lang}.png`,
    telephone: SITE.phone, email: SITE.email,
    address: { '@type': 'PostalAddress', streetAddress: lang === 'ar' ? 'طريق أنس بن مالك، حي الياسمين' : 'Anas Ibn Malik Road, Al Yasmin', addressLocality: lang === 'ar' ? 'الرياض' : 'Riyadh', postalCode: '13326', addressCountry: 'SA' },
    areaServed: { '@type': 'City', name: lang === 'ar' ? 'الرياض' : 'Riyadh' },
    identifier: [{ '@type': 'PropertyValue', name: 'FAL', value: SITE.falLicense }, { '@type': 'PropertyValue', name: 'Unified National Number', value: SITE.unifiedNumber }],
    foundingDate: String(SITE.founded),
    sameAs: Object.values(SITE.social).filter(Boolean),
  };
  return { path: '/', key: 'home', title: h.title, description: h.description, body, jsonld: [org],
    preload: `<link rel="preload" as="image" type="image/webp" href="/assets/img/project-bonsai-1600.webp" imagesrcset="/assets/img/project-bonsai-800.webp 800w, /assets/img/project-bonsai-1600.webp 1600w" imagesizes="(max-width: 1400px) 100vw, 1400px" fetchpriority="high">` };
}

function developersPage(lang) {
  const t = T[lang];
  const d = t.developers;
  const sold = PROJECTS.filter((p) => p.status === 'sold');
  const s = d.subnav;
  const crumbs = [[d.subnavTitle, '/developers/']];
  const body = `<div class="subnav"><div class="wrap"><p class="subnav-title">${d.subnavTitle}</p>
<div class="subnav-end"><nav aria-label="${esc(d.subnavTitle)}"><a href="#challenge">${s.challenge}</a><a href="#services">${s.services}</a><a href="#journey">${s.journey}</a><a href="#results">${s.results}</a></nav><a class="btn btn-gold" href="#meet">${t.cta.discuss}</a></div></div></div>
<main id="main">
<section class="dark hero center" id="overview">
<div class="wrap"><h1 class="h-xl">${d.h1}</h1><p class="lead on-dark">${d.lead}</p>
<div class="btn-row"><a class="btn btn-gold" href="#meet">${t.cta.discuss}</a><a class="more" href="#journey">${d.ctaJourney}</a></div></div>
<div class="wide hero-media">${img('pattern-solid', '', { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div>
</section>

<section class="mist pad" id="challenge" aria-labelledby="challenge-title">
<div class="wrap"><div class="center"><h2 class="h-l" id="challenge-title">${d.challengeTitle}</h2><p class="lead muted" style="margin-top:16px">${d.challengeLead}</p></div>
<div class="grid-3" style="margin-top:56px">${d.challenges.map((c) => `<div class="problem"><h3>${c.title}</h3><p>${c.text}</p></div>`).join('')}</div></div>
</section>

<section class="light pad" id="services" aria-labelledby="services-title">
<div class="wrap"><h2 class="h-l center" id="services-title">${d.servicesTitle}</h2>
<div class="grid-3 features" style="margin-top:64px;gap:48px 32px">${cards(d.services, 'feature')}</div></div>
</section>

<section class="light pad" id="journey" aria-labelledby="journey-title" style="padding-top:0">
<div class="wrap"><div class="center"><h2 class="h-l" id="journey-title">${d.journeyTitle}</h2><p class="lead muted" style="margin-top:16px">${d.journeyLead}</p></div>
<ol class="journey">${d.journey.map((j) => `<li><h3>${j.title}</h3><p>${j.text}</p></li>`).join('')}</ol></div>
</section>

<section class="dark pad" id="results" aria-labelledby="results-title">
${img('pattern-line', '', { cls: 'bg-img dim' })}
<div class="wrap over"><h2 class="h-l center" id="results-title">${d.resultsTitle}</h2>${stats(lang)}
<h3 class="h-s" style="margin-top:88px">${d.resultsSold}</h3>
<div class="grid-2" style="margin-top:24px">${sold.map((p) => soldItem(lang, p, false)).join('')}</div>
<h3 class="h-s" style="margin-top:72px">${d.resultsPartners}</h3>${partnersBlock(lang, 'on-dark-logos')}</div>
</section>

<section class="light pad" aria-labelledby="benefits-title">
<div class="wrap"><h2 class="h-l center" id="benefits-title">${d.benefitsTitle}</h2>
<div class="grid-4 features" style="margin-top:64px;gap:44px 28px">${cards(d.benefits, 'feature')}</div></div>
</section>

${contactSection(lang, { kind: 'developer', name: 'developer', id: 'meet', tone: 'mist', title: d.meetTitle, lead: d.meetLead })}
</main>`;
  return { path: '/developers/', key: 'developers', title: d.title, description: d.description, body, bodyClass: 'has-subnav', crumbs, jsonld: [breadcrumbLd(lang, crumbs)] };
}

function projectsPage(lang) {
  const t = T[lang];
  const p = t.projectsPage;
  const available = PROJECTS.filter((x) => x.status === 'available');
  const sold = PROJECTS.filter((x) => x.status === 'sold');
  const crumbs = [[t.nav.projects, '/properties/']];
  const body = `<main id="main">
<section class="dark hero center pad-s" style="padding-bottom:72px"><div class="wrap"><h1 class="h-xl">${p.h1}</h1><p class="lead on-dark">${p.lead}</p></div></section>
<section class="mist pad" style="padding-top:48px"><div class="wrap" data-filter-scope>
<div class="filters" role="group" aria-label="${esc(p.filterLabel)}">${Object.entries(p.filters).map(([k, label], i) => `<button type="button" class="filter" data-filter="${k}" aria-pressed="${i === 0}">${label}</button>`).join('')}</div>
<div data-group="available"><h2 class="h-m" style="margin-top:40px">${p.availableTitle}</h2>
<div class="grid-2" style="margin-top:28px">${available.map((x) => featureCard(lang, x)).join('')}</div></div>
<div data-group="sold"><h2 class="h-m" style="margin-top:72px">${p.soldTitle}</h2>
<div class="grid-2 sold-list" style="margin-top:28px">${sold.map((x) => soldItem(lang, x)).join('')}</div></div>
</div></section>
${contactSection(lang, { name: 'properties', title: p.askSimilar, lead: p.askSimilarText })}
</main>`;
  const list = { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: PROJECTS.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x[lang], url: SITE.url + projectUrl(lang, x) })) };
  return { path: '/properties/', key: 'projects', title: p.title, description: p.description, body, crumbs, jsonld: [breadcrumbLd(lang, crumbs), list] };
}

function projectPage(lang, p) {
  const t = T[lang];
  const c = t.project;
  const name = p[lang];
  const available = p.status === 'available';
  const facts = [
    p.developer ? [c.developer, p.developer[lang]] : null,
    [c.location, t.city(p.district[lang])],
    p.type ? [c.type, p.type[lang]] : null,
    available ? [c.price, p.price ? p.price[lang] : `<a class="more" href="#request">${c.priceOnRequest}</a>`] : null,
    [c.status, t.status[p.status]],
    p.adLicense ? [c.adLicense, `<span class="ltr">${p.adLicense}</span>`] : null,
  ].filter(Boolean);
  const crumbs = [[t.nav.projects, '/properties/'], [name, `/properties/${p.slug}/`]];
  const productBar = available ? `<div class="subnav"><div class="wrap"><p class="subnav-title">${name}</p><div class="subnav-end"><a class="more sub-wa" href="${wa(c.waText(name))}" data-loc="project-bar">${t.actions.whatsapp}</a><a class="btn btn-gold" href="#request">${t.cta.details}</a></div></div></div>` : '';
  const body = `${productBar}<main id="main">
<section class="dark hero pad-s" style="padding-bottom:${p.cover ? 0 : 88}px">
${img('pattern-line', '', { cls: 'bg-img dim' })}
<div class="wrap over">
<span class="badge ${available ? 'badge-available' : 'badge-sold'}">${t.status[p.status]}</span>
<h1 class="h-xl" style="margin-top:18px">${name}</h1>
<p class="lead on-dark" style="margin-top:18px">${available ? c.availableLead(name) : c.soldLead(name)}</p>
<div class="btn-row" style="margin-top:32px">${available
    ? `<a class="btn btn-gold" href="#request">${t.cta.details}</a><a class="btn btn-outline" href="#request" data-pick="visit">${t.cta.visit}</a><a class="more" href="${wa(c.waText(name))}" data-loc="project">${t.cta.whatsapp}</a>`
    : `<a class="btn btn-gold" href="${href(lang, '/properties/')}">${t.cta.explore}</a><a class="more" href="${wa(t.waText)}" data-loc="project">${t.cta.whatsapp}</a>`}</div>
</div>
${p.cover ? `<div class="wide hero-media over">${img(p.cover, c.photoAlt(name), { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div>` : ''}
</section>
<section class="light pad-s"><div class="wrap"><dl class="facts" style="margin-top:0">${facts.map(([k, v]) => `<div class="fact"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div></section>
${available
    ? contactSection(lang, { kind: 'project', name: 'project', project: name, id: 'request', tone: 'mist', title: c.formTitle, lead: c.formLead, after: p.landing ? `<p class="muted waitlist">${c.waitlistText} <a class="more" href="${p.landing}">${t.cta.waitlist}</a></p>` : '' })
    : contactSection(lang, { name: 'project-sold', tone: 'mist', title: c.soldTitle, lead: c.soldText })}
<section class="gold pad center">${img('fabric', '', { cls: 'bg-img' })}<div class="wrap over"><h2 class="h-l">${t.home.statsTitle}</h2>${stats(lang)}</div></section>
</main>`;
  const residence = { '@context': 'https://schema.org', '@type': 'ApartmentComplex', name, url: SITE.url + projectUrl(lang, p), address: { '@type': 'PostalAddress', addressLocality: lang === 'ar' ? 'الرياض' : 'Riyadh', addressRegion: p.district[lang], addressCountry: 'SA' } };
  return { path: `/properties/${p.slug}/`, key: 'projects', title: `${name} | ${t.city(p.district[lang])} | ${t.brand}`, description: c.description(name, p.district[lang]), body, bodyClass: available ? 'has-subnav' : '', crumbs, jsonld: [breadcrumbLd(lang, crumbs), residence] };
}

function aboutPage(lang) {
  const t = T[lang];
  const a = t.about;
  const crumbs = [[t.nav.about, '/about/']];
  const body = `<main id="main">
<section class="dark hero center"><div class="wrap"><h1 class="h-xl">${a.h1}</h1><p class="lead on-dark">${a.lead}</p></div>
<div class="wide hero-media">${img('riyadh', lang === 'ar' ? 'أفق الرياض' : 'The Riyadh skyline', { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div></section>
<section class="gold pad center">${img('fabric', '', { cls: 'bg-img' })}<div class="wrap over">${stats(lang, 'margin-top:0')}</div></section>
<section class="light pad"><div class="wrap split">
<div><h2 class="h-l">${a.storyTitle}</h2></div>
<div class="stack-m lead">${a.story.map((x) => `<p>${x}</p>`).join('')}</div>
</div></section>
<section class="mist pad"><div class="wrap">
<div class="grid-2 vm"><div class="vm-card"><h2 class="h-s">${a.visionTitle}</h2><p class="lead">${a.vision}</p></div><div class="vm-card"><h2 class="h-s">${a.missionTitle}</h2><p class="lead">${a.mission}</p></div></div>
<h2 class="h-m center" style="margin-top:72px">${a.valuesTitle}</h2>
<div class="grid-3 features values" style="margin-top:40px">${a.values.map((v) => `<div class="feature value"><h3>${v.title}</h3><p>${v.text}</p></div>`).join('')}</div>
</div></section>
<section class="dark pad">${img('network', '', { cls: 'bg-img' })}<div class="wrap over"><h2 class="h-l center">${a.howTitle}</h2><div class="grid-4" style="margin-top:56px">${cards(t.method)}</div></div></section>
<section class="light pad"><div class="wrap">
<h2 class="h-l">${a.licenseTitle}</h2>
<dl class="facts"><div class="fact"><dt>${a.foundedTitle}</dt><dd>${SITE.founded}</dd></div><div class="fact"><dt>${a.licenseFal}</dt><dd class="ltr">${SITE.falLicense}</dd></div><div class="fact"><dt>${a.licenseUnified}</dt><dd class="ltr">${SITE.unifiedNumber}</dd></div><div class="fact"><dt>${a.officeTitle}</dt><dd>${a.office}</dd></div></dl>
<div class="center" style="margin-top:72px"><h2 class="h-m">${t.home.partnersTitle}</h2>${partnersBlock(lang)}</div>
</div></section>
${contactSection(lang, { name: 'about', tone: 'mist' })}
</main>`;
  return { path: '/about/', key: 'about', title: a.title, description: a.description, body, crumbs, jsonld: [breadcrumbLd(lang, crumbs)] };
}

function internationalPage(lang) {
  const t = T[lang];
  const i = t.international;
  const crumbs = [[t.nav.international, '/international/']];
  const body = `<main id="main">
<section class="dark hero center"><div class="wrap"><p class="eyebrow">${i.eyebrow}</p><h1 class="h-xl" style="margin-top:12px">${i.h1}</h1><p class="lead on-dark">${i.lead}</p>
<div class="btn-row"><a class="btn btn-gold" href="#contact">${i.cta}</a><a class="btn btn-outline" href="${wa(t.waText)}" data-loc="international">${t.cta.whatsapp}</a></div></div>
<div class="wide hero-media">${img(INTL.img, INTL.alt[lang], { sizes: '(max-width: 1400px) 100vw, 1400px', eager: true })}</div></section>
<section class="light pad"><div class="wrap"><h2 class="h-l center">${i.pointsTitle}</h2>
<div class="grid-3 features" style="margin-top:56px;gap:40px 28px">${cards(i.points, 'feature')}</div></div></section>
<section class="gold pad center">${img('fabric', '', { cls: 'bg-img' })}<div class="wrap over">${stats(lang, 'margin-top:0')}</div></section>
${contactSection(lang, { name: 'international', interest: 'international' })}
</main>`;
  return { path: '/international/', key: 'international', title: i.title, description: i.description, body, crumbs, jsonld: [breadcrumbLd(lang, crumbs)] };
}

function contactPage(lang) {
  const t = T[lang];
  const c = t.contactPage;
  const crumbs = [[t.nav.contact, '/contact/']];
  const body = `<main id="main">
<section class="dark hero center pad-s" style="padding-bottom:72px"><div class="wrap"><h1 class="h-xl">${c.h1}</h1><p class="lead on-dark">${c.lead}</p></div></section>
${contactSection(lang, { name: 'contact', title: null })}
</main>`;
  return { path: '/contact/', key: 'contact', title: c.title, description: c.description, body, crumbs, jsonld: [breadcrumbLd(lang, crumbs)] };
}

function legalPage(lang, key) {
  const t = T[lang];
  const l = t.legal[key];
  const crumbs = [[t.nav[key], `/${key}/`]];
  const body = `<main id="main">
<section class="dark hero pad-s" style="padding-bottom:64px"><div class="wrap"><h1 class="h-xl">${l.h1}</h1></div></section>
<section class="light pad"><div class="wrap prose">${l.sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}<p class="muted" style="margin-top:48px">${t.legal.updated}</p></div></section>
</main>`;
  return { path: `/${key}/`, key, title: l.title, description: l.description, body, crumbs };
}

function notFoundPage() {
  const a = T.ar.notFound;
  const e = T.en.notFound;
  const body = `<main id="main"><section class="dark hero center pad" style="min-height:70vh"><div class="wrap">
<h1 class="h-l">${a.h1}</h1><p class="lead on-dark">${a.text}</p>
<div class="btn-row"><a class="btn btn-gold" href="/">${a.home}</a><a class="more" href="/properties/">${T.ar.cta.explore}</a></div>
<p class="lead on-dark" lang="en" dir="ltr" style="margin-top:56px">${e.h1} ${e.text}</p>
<div class="btn-row"><a class="more" href="/en/" lang="en">${e.home}</a></div>
</div></section></main>`;
  return { path: '/404', key: '404', title: `${a.title} | ${T.ar.brand}`, description: a.text, body, noAlternate: true, noindex: true };
}

// ---------- write ----------
function writePage(lang, page) {
  const html = head(lang, page) + '\n' + header(lang, page) + '\n' + page.body + '\n' + footer(lang, page);
  const file = page.path === '/404' ? join(OUT, '404.html') : join(OUT, prefix(lang), page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html.replace(/\n{2,}/g, '\n'));
  return page;
}

cpSync(join(SRC, 'assets'), join(OUT, 'assets'), { recursive: true });
cpSync(join(SRC, 'styles.css'), join(OUT, 'assets/styles.css'));
cpSync(join(SRC, 'main.js'), join(OUT, 'assets/main.js'));
cpSync(join(SRC, 'assets/brand/favicon.ico'), join(OUT, 'favicon.ico'));
BUILD.css = hash(join(SRC, 'styles.css'));
BUILD.js = hash(join(SRC, 'main.js'));

// Existing campaign / QR landing pages and the careers form: copied unchanged
const LEGACY = join(ROOT, 'public');
for (const entry of readdirSync(LEGACY)) {
  if (entry === 'index.html') continue; // the old redirect stub is not part of the site
  cpSync(join(LEGACY, entry), join(OUT, entry), { recursive: true });
}

const written = [];
for (const lang of ['ar', 'en']) {
  const pages = [homePage(lang), developersPage(lang), projectsPage(lang), aboutPage(lang), internationalPage(lang), contactPage(lang), legalPage(lang, 'privacy'), legalPage(lang, 'terms'), ...PROJECTS.map((p) => projectPage(lang, p))];
  for (const page of pages) written.push({ lang, page: writePage(lang, page) });
}
writePage('ar', notFoundPage());

const paths = [...new Set(written.map((w) => w.page.path))];
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.flatMap((p) => ['ar', 'en'].map((lang) => `<url><loc>${SITE.url}${href(lang, p)}</loc><xhtml:link rel="alternate" hreflang="ar" href="${SITE.url}${p}"/><xhtml:link rel="alternate" hreflang="en" href="${SITE.url}/en${p}"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE.url}${p}"/></url>`)).join('\n')}
</urlset>
`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
writeFileSync(join(OUT, 'site.webmanifest'), JSON.stringify({ name: T.ar.brandFull, short_name: T.ar.brand, lang: 'ar', dir: 'rtl', start_url: '/', display: 'browser', background_color: '#121E3B', theme_color: '#121E3B', icons: [{ src: '/assets/brand/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/assets/brand/icon-512.png', sizes: '512x512', type: 'image/png' }] }, null, 2));

const count = (dir) => readdirSync(dir).reduce((n, f) => n + (statSync(join(dir, f)).isDirectory() ? count(join(dir, f)) : 1), 0);
console.log(`Built ${written.length + 1} pages, ${count(OUT)} files.${FORM_KEY ? '' : ' Warning: WEB3FORMS_KEY / VITE_WEB3FORMS_KEY is not set, so lead forms will show an error until it is.'}`);
for (const f of ['submitrequest.html', 'hoksen/submitrequest.html', 'newhires.html']) if (!existsSync(join(OUT, f))) throw new Error(`landing page ${f} missing from build`);
