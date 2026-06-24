# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Marketing landing page + lightweight backend for a pool/spa care business. The brand is **"Water Cycle System"** (domain `watercyclesystem.gr`, contact `info@watercyclesystem.gr`) — use it everywhere in user-facing copy. The only remaining "Noustelos" references are the **web developer's attribution credit** in the footer and privacy modal (`Website by Noustelos Studio`, `noustelos.gr`) — a different entity (the studio that built the site); leave those intact. The internal element IDs / localStorage key still use a `noustelos-` prefix (`noustelos-contact-form`, `noustelos-lang`) — purely internal, not worth renaming (changing `noustelos-lang` would reset existing visitors' saved language).

Single-page site (`public/index.html`) is fully **bilingual (English / Greek)**, with a contact form backed by Resend email and an embedded Gradio AI chat widget.

## Commands

```bash
npm run dev        # nodemon server.js (auto-reload) — local dev on http://localhost:3000
npm start          # node server.js — production start
npm run build:css  # compile src/tailwind.css -> public/css/tailwind.css (minified)
```

There is **no test suite** and no JS build script in package.json. See the asset pipeline below — the minified assets that the site actually loads are produced manually with the `terser` and `clean-css-cli` devDependencies.

## Asset pipeline (important — easy to get wrong)

`public/index.html` does **not** load the source files. It loads minified bundles with a cache-busting query string:

```html
<link rel="stylesheet" href="./css/styles.min.css?v=<short-commit>">
<script src="./js/script.min.js?v=<short-commit>"></script>
```

So after editing source, you must regenerate the minified file **and** bump the `?v=` query, or changes won't appear in production. The actual commands (no npm script wraps them):

```bash
npx terser public/js/main.js -c -m -o public/js/script.min.js
npx cleancss -o public/css/styles.min.css public/css/tailwind.css public/css/style.css   # tailwind FIRST, then custom
```

- The CSS bundle is `tailwind.css` + `style.css` concatenated — **order matters** (tailwind first so custom CSS can override).
- `?v=` is bumped on every asset change (recent commits like `cache-bust` exist solely to bump it). Update **both** occurrences in `index.html` (the CSS `<link>` and the JS `<script>`) to the same value.

**Fonts:** Inter/Manrope are loaded via a `<link rel="stylesheet">` in `index.html <head>`. Do **not** move them back into a CSS `@import` — because the bundle concatenates tailwind first, a `@import` in `style.css` is no longer at the top of the stylesheet and clean-css silently drops it (this previously meant the custom fonts never loaded at all).

## Deployment

**Production = GitHub Pages.** `.github/workflows/deploy-pages.yml` publishes `./public` as a static site on every push to `main` (free, auto-HTTPS). This is the live target — there is no backend here, so `POST /api/contact` 404s and the contact form falls back to a prefilled `mailto:` (see `openEmailFallback` in `main.js`).

**`server.js` + `deploy.sh` are currently NOT in use.** They implement an alternative Node/VPS host (PM2 process `water-cycle-system-server`, Nginx → port 3000) where the Resend `/api/contact` backend *would* run. Kept for reference / a possible future move (note: `deploy.sh` sets up nginx on port 80 only — no SSL/certbot). Don't assume the email backend is live; on the current Pages host it never executes.

When changing the contact flow, it must keep working with **no backend** (the mailto fallback is the real path in production).

## Backend (`server.js`)

Express static server + one API route. Key behaviors:

- `POST /api/contact` sends a lead email via **Resend** to `info@watercyclesystem.gr`. All user input is passed through `escapeHtml()` before being interpolated into the email HTML.
- **Honeypot**: a `website` field in the body that, if filled, returns a fake success (`200`) without sending — silently drops bots.
- **Rate limiting**: in-memory `Map` keyed by IP, 5 requests / 10 min, with a periodic sweep to evict stale buckets. Resets on restart (not distributed). Relies on `app.set('trust proxy', 1)` so `req.ip` is the real client behind Nginx — without it, every visitor shares one bucket.
- **Email-config gating**: in production a missing/dummy `RESEND_API_KEY` returns `503`; in development it returns a fake success so the form is testable without sending real mail.
- `app.get('*')` falls back to `index.html`.

Env vars (`.env`, see `.env.example`): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `PORT`, `NODE_ENV`. Production behavior keys off `NODE_ENV === 'production'` (enables HSTS, asset caching, stricter email gating).

## Frontend (`public/js/main.js`)

Everything is in this one file (the `.min.js` is generated from it):

- **i18n**: a `translations` object holds `en`/`el` strings keyed by `data-translate` attributes on DOM elements. `setLanguage(lang)` rewrites each matching element's `innerHTML` and persists choice to `localStorage['noustelos-lang']` (default `en`). When adding any user-facing text, add **both** an `en` and `el` entry and a `data-translate` key — don't hardcode copy. **Everything** visible is translated this way, including the cookie banner and the full GDPR privacy modal; keep the static HTML (the Greek fallback) and the dict entry in sync. For blocks with nested markup (links, `<li>`s), the dict value carries the full inner HTML.
- **Greek uppercase accent rule**: `applyGreekUppercaseAccentRule()` / `normalizeUppercaseGreekAccentsInText()` strip tonos marks from all-caps Greek words (Greek typographic convention). Runs over rendered text after translation.
- **Chat widget**: lazy-loads a Gradio app from the Hugging Face Space `HF_SPACE_URL` (`https://nik-greek-water.hf.space`). The script pre-warms the Space (`pingHfSpace`) and preloads `gradio.js` in the background to hide cold-start latency on mobile; the `<gradio-app>` element is only mounted when the user opens the chat. The Gradio JS version is pinned in the S3 URL.
- Other self-initializing IIFEs handle scroll-spy, cookie-consent banner, privacy modal + focus trap, and a toast system.

## Static discovery files

Served at the site root from `public/` (by both deploy targets), so no cache-busting/minify applies: `robots.txt`, `sitemap.xml`, `site.webmanifest`, and `llms.txt` (an [llmstxt.org](https://llmstxt.org) business summary for LLM crawlers; `robots.txt` points to it). Keep these in sync with the live content (URL, services, contact) when it changes.

## Styling

Tailwind (`tailwind.config.js`) scans `public/**/*.{html,js}`. Custom `primary` color scale is a cyan palette (`#06b6d4` = primary-500, the brand theme color). `src/tailwind.css` is the Tailwind entry compiled into `public/css/tailwind.css`; `public/css/style.css` holds additional hand-written CSS.
