#!/usr/bin/env node
/**
 * build-artist-pages.mjs — generates static, crawlable artist pages.
 *
 * WHY THIS EXISTS
 * Instagram, iMessage, X, Discord, WhatsApp and Slack do NOT run JavaScript.
 * PHX renders artist pages client-side, so every link an artist puts in their
 * bio currently produces a blank preview card. This script emits one real
 * HTML file per artist with baked-in Open Graph tags, so the preview works.
 *
 * Output:  a/<slug>/index.html   →   https://phx.app/a/murkemz
 * Each page carries OG/Twitter meta + JSON-LD, shows real content to crawlers
 * and no-JS visitors, and bounces real browsers into /app?artist=<slug>.
 *
 * Run:     node scripts/build-artist-pages.mjs
 * Deploy:  Vercel runs this via the "buildCommand" in vercel.json, and a
 *          Supabase webhook → Vercel Deploy Hook regenerates on artist changes.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── config ────────────────────────────────────────────────────────────────
function readEnv() {
  const env = { ...process.env };
  const envPath = join(ROOT, '.env.local');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].trim();
    }
  }
  return env;
}

const env = readEnv();
const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY;
const SITE = (env.PHX_SITE_URL || 'https://phx-app.vercel.app').replace(/\/$/, '');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('✗ Missing SUPABASE_URL / SUPABASE_ANON_KEY (checked env and .env.local)');
  process.exit(1);
}

// ── helpers ───────────────────────────────────────────────────────────────
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const clip = (s, n) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s\S*$/, '') + '…';
};

// og:image MUST be absolute — relative paths silently fail on every crawler.
const absolute = (u) => {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  return SITE + (u.startsWith('/') ? u : '/' + u);
};

// ── fetch artists ─────────────────────────────────────────────────────────
async function fetchArtists() {
  const url =
    `${SUPABASE_URL}/rest/v1/artists` +
    `?select=name,slug,genre,bio,avatar_url,banner_url,city,verified,monthly_listeners,merch_enabled` +
    `&status=eq.active&slug=not.is.null`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── page template ─────────────────────────────────────────────────────────
function renderPage(a) {
  const url = `${SITE}/a/${a.slug}`;
  const appUrl = `${SITE}/app?artist=${encodeURIComponent(a.slug)}`;
  const title = `${a.name} on PHX`;

  const descBits = [];
  if (a.bio) descBits.push(clip(a.bio, 150));
  else {
    descBits.push(
      `${a.genre ? a.genre + ' from ' : ''}${a.city || 'Phoenix'}.`,
      'Stream on PHX — your pass pays the artists you actually play.'
    );
  }
  const description = clip(descBits.join(' '), 200);

  // Prefer the banner (wide, fills the 1200x630 card), fall back to avatar.
  // If the artist has NO artwork at all we fall back to the app icon — but that
  // icon is square, so we must not claim 1200x630 or the card renders wrong.
  const artwork = absolute(a.banner_url || a.avatar_url);
  const image = artwork || `${SITE}/icon-512.png`;
  const wideCard = Boolean(artwork);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: a.name,
    url,
    ...(a.genre ? { genre: a.genre } : {}),
    ...(a.bio ? { description: clip(a.bio, 300) } : {}),
    ...(image ? { image } : {}),
    ...(a.city ? { foundingLocation: { '@type': 'Place', name: a.city } } : {}),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">

<!-- Open Graph — this is the block Instagram/iMessage/Discord actually read -->
<meta property="og:type" content="profile">
<meta property="og:site_name" content="PHX">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="${wideCard ? 1200 : 512}">
<meta property="og:image:height" content="${wideCard ? 630 : 512}">
<meta property="og:image:alt" content="${esc(a.name)}">

<meta name="twitter:card" content="${wideCard ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">

<meta name="theme-color" content="#F97316">
<link rel="manifest" href="/manifest.json">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>

<style>
  :root{--bg:#07070F;--orange:#F97316;--white:#F1F1F8;--muted:#9CA3AF}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--white);font-family:'Space Grotesk',system-ui,-apple-system,sans-serif;
       min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center}
  .card{max-width:420px}
  .ava{width:104px;height:104px;border-radius:50%;margin:0 auto 1.2rem;background:linear-gradient(135deg,#EA580C,#7C3AED);
       display:flex;align-items:center;justify-content:center;font-size:2.4rem;font-weight:700;overflow:hidden}
  .ava img{width:100%;height:100%;object-fit:cover}
  h1{font-size:1.7rem;letter-spacing:-.02em;margin-bottom:.3rem}
  .meta{color:var(--orange);font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;margin-bottom:1rem}
  p{color:var(--muted);font-size:.92rem;line-height:1.6;margin-bottom:1.8rem}
  a.btn{display:inline-block;background:var(--orange);color:#07070F;font-weight:600;text-decoration:none;
        padding:.8rem 1.7rem;border-radius:10px;font-size:.95rem}
  .fine{margin-top:1.6rem;font-size:.75rem;color:#6B7280}
</style>
</head>
<body>
  <!-- Real content: crawlers, no-JS visitors, and the split-second before redirect -->
  <div class="card">
    <div class="ava">${a.avatar_url
      ? `<img src="${esc(absolute(a.avatar_url))}" alt="${esc(a.name)}">`
      : esc((a.name || '?').charAt(0).toUpperCase())}</div>
    <h1>${esc(a.name)}</h1>
    <div class="meta">${esc([a.genre, a.city || 'Phoenix'].filter(Boolean).join(' · '))}</div>
    <p>${esc(description)}</p>
    <a class="btn" href="${esc(appUrl)}">Listen on PHX</a>
    <div class="fine">Your pass pays the Phoenix artists you actually play.</div>
  </div>

<script>
  // Send real browsers into the app. Crawlers never run this, so they keep
  // the meta tags above. replace() keeps the back button sane.
  (function () {
    try {
      var ua = navigator.userAgent || '';
      if (/bot|crawl|spider|facebookexternalhit|Slackbot|Discordbot|WhatsApp|Twitterbot|LinkedInBot|TelegramBot|Preview/i.test(ua)) return;
      location.replace(${JSON.stringify(appUrl)});
    } catch (e) {}
  })();
</script>
</body>
</html>
`;
}

// ── run ───────────────────────────────────────────────────────────────────
const artists = await fetchArtists();

if (!artists.length) {
  console.log('· No active artists with a slug — nothing to generate.');
  process.exit(0);
}

let count = 0;
const missingArt = [];
for (const a of artists) {
  if (!a.slug) continue;
  const dir = join(ROOT, 'a', a.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderPage(a), 'utf8');
  const noArt = !a.banner_url && !a.avatar_url;
  console.log(`  ✓ /a/${a.slug}  (${a.name})${noArt ? '   ⚠ no artwork — preview falls back to the app icon' : ''}`);
  if (noArt) missingArt.push(a.name);
  count++;
}

// Directory index so /a/ isn't a 404
mkdirSync(join(ROOT, 'a'), { recursive: true });
writeFileSync(
  join(ROOT, 'a', 'index.html'),
  `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>Artists on PHX</title>
<meta name="description" content="Phoenix artists on PHX.">
<meta property="og:title" content="Artists on PHX">
<meta property="og:description" content="Phoenix artists on PHX.">
<meta property="og:image" content="${SITE}/icon-512.png">
<script>location.replace('/app');</script></head>
<body><ul>${artists
    .map((a) => `<li><a href="/a/${esc(a.slug)}">${esc(a.name)}</a></li>`)
    .join('')}</ul></body></html>`,
  'utf8'
);

console.log(`\n✓ Generated ${count} artist page${count === 1 ? '' : 's'} → ${SITE}/a/<slug>`);
if (missingArt.length) {
  console.log(
    `\n⚠ ${missingArt.length} artist(s) have no avatar_url or banner_url: ${missingArt.join(', ')}.` +
    `\n  Their link previews will show the PHX icon instead of the artist.` +
    `\n  Upload a wide image (1200x630) to artists.banner_url to fix.`
  );
}
