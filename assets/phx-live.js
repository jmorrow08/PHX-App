/* ═══════════════════════════════════════════════════════════════════════════
   PHX landing — live data + access requests.

   Rule for everything in this file: FAIL OPEN. The page ships with real,
   honest static copy. A failed fetch must never downgrade it — never render
   "0 / 1,000", never empty the roster. We only touch the DOM after a
   successful response carrying a sane value.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var SUPABASE_URL = 'https://dnzvtathfpjelffjnqrc.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuenZ0YXRoZnBqZWxmZmpucXJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MTMyODksImV4cCI6MjA5ODE4OTI4OX0.0X7C5UYnQCAB__opnWTCUC1uoAt5AZcmbmfNXpvlnQg';
  var GOAL = 1000;

  var ready = !!(window.supabase && window.supabase.createClient);
  var _sb = ready ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
  if (ready) {
    window._sb = _sb;
    window.SUPABASE_URL = SUPABASE_URL;
    window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Access request ─────────────────────────────────────────────────────── */
  window.submitRequest = async function (e) {
    e.preventDefault();
    var btn = document.getElementById('req-btn');
    var msg = document.getElementById('req-msg');
    if (!_sb) {                       // CDN blocked — say so instead of throwing
      msg.style.color = 'var(--bad)';
      msg.innerHTML = 'Signup is temporarily unavailable. Email ' +
        '<a href="mailto:hey@thephx.app" style="color:var(--ember)">hey@thephx.app</a> and we\'ll add you.';
      return false;
    }
    btn.disabled = true;
    msg.style.color = 'var(--ink-mute)';
    msg.textContent = 'Sending…';
    try {
      var res = await _sb.rpc('request_access', {
        p_email:      document.getElementById('req-email').value,
        p_name:       document.getElementById('req-name').value || null,
        p_instagram:  document.getElementById('req-ig').value || null,
        p_role:       document.getElementById('req-role').value,
        p_note:       document.getElementById('req-note').value || null,
        p_heard_from: document.referrer || null,
        p_device_fp:  null
      });
      var d = res.data || {};
      if (d.ok) {
        document.getElementById('req-form').innerHTML =
          '<div style="text-align:center;padding:2rem 0">' +
            '<div style="font-family:var(--display);font-size:1.35rem;font-weight:700;margin-bottom:.5rem">' +
              "You're on the list." +
            '</div>' +
            '<div style="color:var(--ink-soft);font-size:.95rem;max-width:38ch;margin:0 auto">' +
              "We'll email your number as spots open. The fastest way in is an artist's code — " +
              'ask the one who sent you here.' +
            '</div>' +
          '</div>';
      } else {
        msg.style.color = 'var(--bad)';
        msg.textContent = d.reason === 'rate_limited'
          ? 'Too many requests — try again in a bit.'
          : 'Check your email address and try again.';
        btn.disabled = false;
      }
    } catch (err) {
      msg.style.color = 'var(--bad)';
      msg.textContent = 'Could not send — try again.';
      btn.disabled = false;
    }
    return false;
  };

  /* ── Founding counter ───────────────────────────────────────────────────── */
  (async function wireFoundingCount() {
    if (!_sb) return;
    try {
      var res = await _sb.from('profiles')
        .select('id', { count: 'exact', head: true })
        .not('founding_number', 'is', null);
      var n = res.count;
      if (res.error || typeof n !== 'number' || n <= 0) return;   // static copy stands

      var numEl = document.getElementById('f-num');
      var fill  = document.getElementById('f-fill');
      var label = document.getElementById('f-label');
      if (!numEl || !fill) return;

      numEl.innerHTML = n.toLocaleString('en-US') +
        '<span style="color:var(--ink-faint);-webkit-text-fill-color:currentColor"> / ' +
        GOAL.toLocaleString('en-US') + '</span>';
      if (label) label.textContent = 'Founding passes claimed';
      // Floor at 2% so a genuine early number never reads as an empty bar.
      requestAnimationFrame(function () {
        fill.style.width = Math.max((n / GOAL) * 100, 2).toFixed(1) + '%';
      });
    } catch (e) { /* static markup stands */ }
  })();

  /* ── Roster ─────────────────────────────────────────────────────────────── */
  (async function wireRoster() {
    if (!_sb) return;
    try {
      var res = await _sb.from('artists')
        .select('name,slug,genre,city,avatar_url')
        .eq('status', 'active')
        .not('slug', 'is', null)
        .order('monthly_listeners', { ascending: false })
        .limit(7);
      var artists = res.data;
      if (res.error || !artists || !artists.length) return;       // hardcoded roster stands

      var cards = artists.map(function (a, i) {
        var meta = [a.genre, a.city || 'Phoenix'].filter(Boolean).join(' · ');
        var art = a.avatar_url
          ? '<div class="artist-art" style="padding:0;overflow:hidden"><img src="' + esc(a.avatar_url) +
            '" alt="' + esc(a.name) + '" style="width:100%;height:100%;object-fit:cover" loading="lazy"></div>'
          : '<div class="artist-art">' + esc((a.name || '?').charAt(0).toUpperCase()) + '</div>';
        return '<a class="artist reveal on" href="/' + encodeURIComponent(a.slug) + '">' + art +
          '<div class="artist-meta"><strong>' + esc(a.name) + '</strong>' +
          '<span>' + esc(meta) + '</span></div></a>';
      });
      cards.push(
        '<div class="artist reveal on"><div class="artist-art">+</div>' +
        '<div class="artist-meta"><strong>Your name here</strong>' +
        '<span>Artists list free — apply in the app</span></div></div>'
      );
      document.getElementById('roster-grid').innerHTML = cards.join('');
    } catch (e) { /* hardcoded roster stands */ }
  })();

  /* ── Video: only autoplay where it's free ───────────────────────────────── */
  (function wireVideo() {
    var reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small    = matchMedia('(max-width: 820px)').matches;
    var saveData = navigator.connection && navigator.connection.saveData;

    // Phones and metered connections get the poster frame only — never a
    // multi-megabyte autoplay. The section still looks finished.
    if (reduced || small || saveData) return;

    document.querySelectorAll('.vslot video').forEach(function (v) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.15 }).observe(v);
    });

    var wipe = document.querySelector('.vwipe video');
    if (wipe) {
      new IntersectionObserver(function (es, o) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          wipe.preload = 'auto';
          wipe.play().catch(function () {});
          o.unobserve(e.target);          // plays once, holds on its black last frame
        });
      }, { threshold: 0.4 }).observe(wipe);
    }
  })();
})();
