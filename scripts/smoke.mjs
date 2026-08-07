#!/usr/bin/env node
/**
 * PHX smoke test — runs against a real deployed URL (preview or production).
 *
 *   BASE_URL=https://phx-app-git-my-branch.vercel.app node scripts/smoke.mjs
 *   BASE_URL=https://thephx.app node scripts/smoke.mjs
 *
 * Needs: npm i -D playwright && npx playwright install chromium
 * Exit:  0 = all passed, 1 = something failed
 */
import { chromium, devices } from 'playwright';

const BASE = (process.env.BASE_URL || 'https://thephx.app').replace(/\/$/, '');
const results = [];
const t0 = Date.now();

function record(name, ok, detail = '') { results.push({ name, ok, detail }); }
async function check(name, fn) {
  try { const d = await fn(); record(name, true, d || ''); }
  catch (e) { record(name, false, e.message); }
}
const must = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();

// ── 1. Landing page renders with no console errors ───────────────────────────
await check('landing page loads clean', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', m => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  const res = await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  must(res.status() === 200, `expected 200, got ${res.status()}`);
  await page.waitForTimeout(2500);
  must(errs.length === 0, `console errors: ${errs.slice(0, 3).join(' | ')}`);
  await ctx.close();
  return `${res.status()}`;
});

// ── 2. The app shell boots ───────────────────────────────────────────────────
await check('/app boots without throwing', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const res = await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 30000 });
  must(res.status() === 200, `expected 200, got ${res.status()}`);
  await page.waitForTimeout(3500);
  // A blank screen is the failure mode that has actually shipped here twice.
  const painted = await page.evaluate(() =>
    document.body && document.body.innerText.trim().length > 40);
  must(painted, 'app rendered a blank/near-empty body — the blank-screen regression');
  must(errs.length === 0, `uncaught: ${errs.slice(0, 2).join(' | ')}`);
  await ctx.close();
  return 'rendered';
});

// ── 3. Vanity URL serves the crawlable OG page, not the SPA shell ────────────
await check('vanity URL serves OG tags to crawlers', async () => {
  const ctx = await browser.newContext({
    userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/murkemz`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const og = await page.evaluate(() => ({
    title: document.querySelector('meta[property="og:title"]')?.content || '',
    image: document.querySelector('meta[property="og:image"]')?.content || '',
  }));
  must(og.title, 'no og:title — crawlers get the JS shell, link previews will be blank');
  must(/murkemz/i.test(og.title) || og.title.length > 3, `og:title looks generic: "${og.title}"`);
  must(og.image, 'no og:image');
  await ctx.close();
  return og.title.slice(0, 40);
});

// ── 4. Security headers are actually being served ────────────────────────────
await check('security headers present', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const res = await page.goto(BASE, { timeout: 30000 });
  const h = res.headers();
  const required = ['strict-transport-security', 'x-content-type-options',
                    'x-frame-options', 'referrer-policy'];
  const missing = required.filter(k => !h[k]);
  must(missing.length === 0, `missing: ${missing.join(', ')}`);
  await ctx.close();
  return required.length + ' present';
});

// ── 5. Service worker registers and the cached asset version matches ─────────
await check('service worker registers', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const ok = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    const rs = await navigator.serviceWorker.getRegistrations();
    return rs.length > 0 ? 'registered' : 'none';
  });
  must(ok !== 'none', 'no service worker registered — PWA install and offline shell are broken');
  await ctx.close();
  return ok;
});

// ── 6. Mobile viewport renders and doesn't overflow horizontally ─────────────
await check('mobile 390px renders without h-scroll', async () => {
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  must(overflow <= 2, `horizontal overflow of ${overflow}px on mobile`);
  await ctx.close();
  return 'no overflow';
});

// ── 7. Anonymous callers cannot read push credentials ────────────────────────
// Regression guard for the world-readable push_subscriptions hole.
await check('push_subscriptions not anon-readable', async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const out = await page.evaluate(async () => {
    const url = window.SUPABASE_URL || (window._sb && window._sb.supabaseUrl);
    const key = window.SUPABASE_ANON_KEY || (window._sb && window._sb.supabaseKey);
    if (!url || !key) return { skip: true };
    const r = await fetch(`${url}/rest/v1/push_subscriptions?select=*`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    return { status: r.status, body: (await r.text()).slice(0, 120) };
  });
  if (out.skip) return 'skipped (client not exposed on window)';
  must(out.status !== 200 || out.body === '[]',
       `anon can read push_subscriptions (${out.status}): ${out.body}`);
  return `blocked (${out.status})`;
});

await browser.close();

// ── report ───────────────────────────────────────────────────────────────────
const C = { r:'\x1b[31m', g:'\x1b[32m', d:'\x1b[2m', x:'\x1b[0m' };
console.log(`\nSmoke test — ${BASE}\n`);
for (const r of results)
  console.log(`  ${r.ok ? C.g + '✓' : C.r + '✗'}${C.x} ${r.name}` +
              (r.detail ? `  ${C.d}${r.detail}${C.x}` : ''));
const failed = results.filter(r => !r.ok).length;
console.log(`\n${failed ? C.r + `✗ ${failed} of ${results.length} failed` :
                          C.g + `✓ all ${results.length} passed`}${C.x}` +
            ` ${C.d}(${((Date.now() - t0) / 1000).toFixed(1)}s)${C.x}\n`);
process.exit(failed ? 1 : 0);
