# JEDRA website (jedra.properties)

Static, bilingual (Arabic at `/`, English at `/en/`) website for JEDRA Real Estate Brokerage.
No frameworks and no npm dependencies: one Node script builds plain HTML pages into `dist/`.

## Edit content
Everything a non-developer changes lives in **`site/content.mjs`**:
- `SITE`: phone, WhatsApp, email, FAL license, unified number, GTM id, copyright year
- `PARTNERS`: developer names (add a logo later by placing it in `site/assets/partners/`)
- `PROJECTS`: name, district, status (`available` / `sold`), developer, landing page link, and optional
  unit type, approved price, REGA ad license number, map link and images (shown only when filled in)
- `T.ar` / `T.en`: all page text in Arabic and English, including the privacy policy and terms
  (have them reviewed by your legal advisor before launch)
- International section image: drop `makkah-1600.webp` and `makkah-800.webp` into `site/assets/img/` and it replaces the Riyadh image automatically

## Pages
`/` home, `/developers/`, `/properties/` and `/properties/<project>/`, `/about/`, `/international/`, `/contact/`,
`/privacy/`, `/terms/`; English under `/en/...`. Old `/projects/...` and `/ar/...` links redirect.

## Build and preview
```bash
node scripts/build.mjs            # writes dist/
python3 -m http.server 8080 --directory dist   # open http://localhost:8080
```
Lead forms post to Web3Forms using the `VITE_WEB3FORMS_KEY` (or `WEB3FORMS_KEY`) environment variable set in Vercel.

## Structure
- `site/styles.css`, `site/main.js`: design system and the small script (menu, rail, forms, tracking)
- `site/assets/`: images (WebP, two sizes each), logos, favicons, social sharing images
- `public/`: existing campaign / QR landing pages and the careers form, **copied unchanged** so printed QR codes keep working
  (`/submitrequest.html`, `/hoksen/submitrequest.html`, `/newhires.html`)
- `vercel.json`: build settings, redirects and short project links (`/bonsai`, `/hoksen`), security and caching headers

## Tracking (Google Tag Manager GTM-PVGMFHCS)
The site pushes these `dataLayer` events for ad conversion tags:
`generate_lead` (form sent, with `form_name`, `request_type` and `project`), `click_call`, `click_whatsapp` (with `link_location`).
Campaign parameters (`utm_*`, `gclid`, `fbclid`, `ttclid`, `sccid`) are kept for the visit and sent with every lead.
