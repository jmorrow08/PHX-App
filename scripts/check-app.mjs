#!/usr/bin/env node
/**
 * PHX static checks — the pre-flight that runs before anything deploys.
 *
 * Every rule here exists because this repo actually shipped that bug:
 *   - undefined onclick handler ....... "define missing showToast" (8810195)
 *   - ReferenceError blanked a page ... "Fix ReferenceError that blanked the artist page" (7103d33)
 *   - duplicate declaration ........... dead approveTrack/rejectTrack pair
 *   - cache version drift ............. sw.js is cache-first keyed on ?v=
 *
 * Usage:  node scripts/check-app.mjs [--json]
 * Exit:   0 = clean, 1 = errors found
 */
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();
const errors = [], warns = [];
const err  = (rule, msg, loc) => errors.push({ rule, msg, loc });
const warn = (rule, msg, loc) => warns.push({ rule, msg, loc });

const read = f => existsSync(`${ROOT}/${f}`) ? readFileSync(`${ROOT}/${f}`, 'utf8') : null;
const lineOf = (s, i) => s.slice(0, i).split('\n').length;

const HTML_FILES = ['app.html', 'index.html', 'legal.html'].filter(f => existsSync(`${ROOT}/${f}`));

// ── JS extraction ────────────────────────────────────────────────────────────
function scripts(html) {
  const out = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) out.push({ code: m[1], offset: m.index + m[0].indexOf(m[1]) });
  return out;
}

// ── 1. Does the JS even parse? ───────────────────────────────────────────────
for (const f of HTML_FILES) {
  const html = read(f);
  scripts(html).forEach((s, i) => {
    if (/<script[^>]*type=["']importmap["']/.test(html) && /^\s*\{/.test(s.code)) return;
    try {
      new (async function () {}.constructor)(s.code);
    } catch (e) {
      err('parse', `${f} inline script #${i + 1} fails to parse: ${e.message}`,
          `${f}:${lineOf(html, s.offset)}`);
    }
  });
}

// ── 2. Inline handlers that call functions nobody defined ────────────────────
// This is the single highest-value check in the file. `onclick="save()"` with no
// `function save` parses perfectly and dies the moment a user clicks it.
for (const f of HTML_FILES) {
  const html = read(f);
  // Handlers can be defined in a local external script too — follow those,
  // otherwise every `window.foo = ...` in a sibling .js reads as undefined.
  const localSrc = [...html.matchAll(/<script[^>]*\bsrc\s*=\s*["'](?!https?:)([^"'?]+)/g)]
    .map(m => m[1].replace(/^\.?\//, ''));
  const js = scripts(html).map(s => s.code).join('\n;\n')
           + '\n;\n' + (read('shared.js') || '')
           + '\n;\n' + localSrc.map(f => read(f) || '').join('\n;\n');

  const defined = new Set();
  for (const re of [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g,
    /\bwindow\.([A-Za-z_$][\w$]*)\s*=/g,
    /\b([A-Za-z_$][\w$]*)\s*:\s*function\b/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
  ]) { let m; while ((m = re.exec(js))) defined.add(m[1]); }

  const KEYWORD = new Set(['if','for','while','switch','catch','return','typeof','function',
    'new','delete','void','in','of','do','else','try','throw','await','yield','case','instanceof']);
  const BUILTIN = new Set(['alert','confirm','prompt','open','close','print','fetch','event',
    'setTimeout','setInterval','encodeURIComponent','decodeURIComponent','JSON','Math','Date',
    'String','Number','Boolean','Array','Object','parseInt','parseFloat','history','location',
    'scrollTo','requestAnimationFrame','matchMedia','navigator','document','window','console','this']);

  const hre = /\son[a-z]+\s*=\s*(["'])([\s\S]*?)\1/gi;
  let h;
  while ((h = hre.exec(html))) {
    const body = h[2];
    const cre = /(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g;
    let c;
    while ((c = cre.exec(body))) {
      const name = c[1];
      if (KEYWORD.has(name) || BUILTIN.has(name) || defined.has(name)) continue;
      err('undefined-handler',
          `${f}: inline handler calls ${name}() which is never defined — this throws on click`,
          `${f}:${lineOf(html, h.index)}`);
    }
  }
}

// ── 3. Duplicate top-level function declarations ─────────────────────────────
// The later one silently wins, so editing the earlier one is a no-op.
// ONLY column-0 declarations collide — a `function row()` nested inside two
// different parents is two separate scopes and perfectly legal.
for (const f of HTML_FILES) {
  const html = read(f);
  const seen = new Map();
  for (const s of scripts(html)) {
    const re = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm;   // no leading whitespace
    let m;
    while ((m = re.exec(s.code))) {
      const name = m[1];
      const line = lineOf(html, s.offset + m.index);
      seen.set(name, [...(seen.get(name) || []), line]);
    }
  }
  for (const [name, lines] of seen)
    if (lines.length > 1)
      err('duplicate-fn',
          `${f}: top-level function ${name}() declared ${lines.length}× (lines ${lines.join(', ')}) — only the last one runs`,
          `${f}:${lines[0]}`);
}

// ── 4. getElementById targets that don't exist in the markup ─────────────────
for (const f of HTML_FILES) {
  const html = read(f);
  const ids = new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map(m => m[1]));
  const localSrc = [...html.matchAll(/<script[^>]*\bsrc\s*=\s*["'](?!https?:)([^"'?]+)/g)]
    .map(m => m[1].replace(/^\.?\//, ''));
  const js = scripts(html).map(s => s.code).join('\n')
           + '\n' + localSrc.map(f => read(f) || '').join('\n');
  const re = /getElementById\(\s*(["'])([^"']+)\1\s*\)/g;
  let m; const missing = new Set();
  while ((m = re.exec(js))) if (!ids.has(m[2])) missing.add(m[2]);
  for (const id of missing)
    warn('missing-id',
         `${f}: getElementById('${id}') but no element has that id (may be created at runtime)`, f);
}

// ── 5. Service-worker cache version drift ────────────────────────────────────
// sw.js is cache-first on static assets keyed by the full URL including ?v=.
// Bump one side and not the other and installed PWA users are stuck forever.
{
  const sw = read('sw.js');
  if (sw) {
    const vers = new Map();
    for (const f of [...HTML_FILES, 'sw.js']) {
      const t = read(f); if (!t) continue;
      for (const m of t.matchAll(/(shared\.(?:css|js))\?v=(\d+)/g)) {
        const key = m[1];
        vers.set(key, vers.get(key) || new Map());
        const per = vers.get(key);
        per.set(m[2], [...(per.get(m[2]) || []), f]);
      }
    }
    for (const [asset, per] of vers)
      if (per.size > 1) {
        const detail = [...per].map(([v, fs]) => `v=${v} in ${[...new Set(fs)].join(', ')}`).join(' vs ');
        err('cache-drift',
            `${asset} has mismatched cache versions — ${detail}. Installed PWA users will get a stale file.`,
            'sw.js');
      }
  }
}

// ── 6. Secrets ───────────────────────────────────────────────────────────────
{
  const PATTERNS = [
    [/\bsk_live_[A-Za-z0-9]{10,}/,               'Stripe live secret key'],
    [/\bsk_test_[A-Za-z0-9]{10,}/,               'Stripe test secret key'],
    [/\bgh[pousr]_[A-Za-z0-9]{30,}/,             'GitHub token'],
    [/-----BEGIN [A-Z ]*PRIVATE KEY-----/,       'private key'],
    [/\bVAPID_PRIVATE_KEY\s*[:=]\s*["'][^"']{20,}/i, 'VAPID private key'],
    [/\bPUSH_INTERNAL_SECRET\s*[:=]\s*["'][^"']{16,}/i, 'push internal secret'],
  ];
  let files = [];
  try {
    files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch { files = HTML_FILES.concat(['shared.js', 'sw.js']); }

  for (const f of files) {
    if (/\.(png|jpe?g|gif|ico|woff2?|mp4|webm|pptx|zip)$/i.test(f)) continue;
    const t = read(f); if (!t) continue;
    for (const [re, label] of PATTERNS) {
      const m = t.match(re);
      if (m) err('secret', `${f}: possible ${label} committed — "${m[0].slice(0, 18)}…"`, f);
    }
    // A real Supabase service_role key is a JWT carrying that role in its payload.
    // The bare words "service_role" in a security doc are not a leak.
    for (const j of t.matchAll(/\beyJ[\w-]{8,}\.(eyJ[\w-]{8,})\.[\w-]{8,}/g)) {
      let payload = '';
      try { payload = Buffer.from(j[1], 'base64url').toString('utf8'); } catch { continue; }
      if (/"role"\s*:\s*"service_role"/.test(payload))
        err('secret', `${f}: Supabase SERVICE_ROLE key committed — this bypasses all RLS. Rotate it now.`, f);
    }
  }
}

// ── 7. Silent-failure regression guard ───────────────────────────────────────
// Error visibility was just won. Don't let it erode one commit at a time.
{
  // Two different things get written the same way. Only one of them is a bug.
  //   BENIGN: `.play().catch(function(){})` — autoplay/share rejections are expected,
  //           and the empty catches inside reportFailure() itself (it can't report
  //           its own failure without recursing).
  //   REAL:   `try { ...work... } catch (e) {}` — a swallowed failure with no trace.
  const BENIGN = /\.(play|share)\s*\([^)]*\)\s*\.catch\s*\(\s*(?:function\s*\(\s*\)|\(\s*\)\s*=>)\s*\{\s*\}\s*\)/;
  let real = 0;
  for (const f of HTML_FILES) {
    const t = read(f);
    for (const m of t.matchAll(/catch\s*(?:\([^)]*\))?\s*\{\s*\}/g)) {
      const around = t.slice(Math.max(0, m.index - 90), m.index + m[0].length + 10);
      if (BENIGN.test(around)) continue;                 // expected promise rejection
      if (/function\s+reportFailure/.test(t.slice(Math.max(0, m.index - 400), m.index))) continue;
      if (/\/\*\s*silent-ok/.test(around)) continue;      // explicitly annotated
      real++;
      warn('silent-catch',
           `${f}: empty catch at line ${lineOf(t, m.index)} swallows a failure silently — ` +
           `use reportFailure(), or annotate /* silent-ok: why */ if it's genuinely fine`, f);
    }
  }
  if (real > 0)
    err('silent-catch',
        `${real} unexplained empty catch block(s). Error visibility was just won back — don't let it erode.`,
        'app.html');
}

// ── report ───────────────────────────────────────────────────────────────────
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ errors, warns }, null, 2));
} else {
  const C = { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', x: '\x1b[0m' };
  for (const w of warns) console.log(`${C.y}warn${C.x}  ${C.d}[${w.rule}]${C.x} ${w.msg}`);
  for (const e of errors) console.log(`${C.r}ERROR${C.x} ${C.d}[${e.rule}]${C.x} ${e.msg}`);
  console.log('');
  console.log(errors.length
    ? `${C.r}✗ ${errors.length} error(s), ${warns.length} warning(s) — not safe to deploy${C.x}`
    : `${C.g}✓ static checks passed${C.x} (${warns.length} warning(s))`);
}
process.exit(errors.length ? 1 : 0);
