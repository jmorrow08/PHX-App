/* ================================================================
   PHX APP — shared.js
   Mobile app bar (hamburger · logo · search · bell) + sidebar toggle.
   The bar hides on scroll-down and slides back on any scroll-up —
   an opaque line item, never floating over content (FB pattern).
   ================================================================ */
(function () {
  'use strict';

  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // ── The app bar ────────────────────────────────────────────────
  var bar = document.createElement('div');
  bar.className = 'mob-appbar';
  bar.id = 'mob-appbar';
  document.body.appendChild(bar);

  var ham = document.createElement('button');
  ham.className = 'hamburger';
  ham.id = 'hamburger-btn';
  ham.setAttribute('aria-label', 'Open navigation menu');
  ham.setAttribute('aria-expanded', 'false');
  ham.innerHTML = '<span></span><span></span><span></span>';
  bar.appendChild(ham);

  var logo = document.createElement('a');
  logo.className = 'mob-logo';
  logo.setAttribute('aria-label', 'PHX home');
  logo.href = '#';
  logo.innerHTML = '<img src="/assets/logo-wordmark.png" alt="the PHX app">';
  logo.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof window.showView === 'function') window.showView('home');
  });
  bar.appendChild(logo);

  var spacer = document.createElement('div');
  spacer.style.flex = '1';
  bar.appendChild(spacer);

  // Search — the universal one (Discover searches artists, songs, albums,
  // genres, people, pages)
  var search = document.createElement('button');
  search.className = 'appbar-btn';
  search.setAttribute('aria-label', 'Search PHX');
  search.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.8-3.8"/></svg>';
  search.addEventListener('click', function () {
    if (typeof window.openGlobalSearch === 'function') window.openGlobalSearch();
    else if (typeof window.showView === 'function') window.showView('discover');
  });
  bar.appendChild(search);

  // Bell — proxies the app's notification panel, badge mirrored live
  var bell = document.createElement('button');
  bell.className = 'appbar-btn';
  bell.setAttribute('aria-label', 'Notifications');
  bell.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 15 18 9z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/></svg>' +
    '<span class="appbar-badge" id="appbar-notif-badge" style="display:none">0</span>';
  bell.addEventListener('click', function () {
    if (typeof window.toggleNotifPanel === 'function') window.toggleNotifPanel();
  });
  bar.appendChild(bell);

  function syncBadge() {
    var real = document.getElementById('notif-badge');
    var mine = document.getElementById('appbar-notif-badge');
    if (!real || !mine) return;
    mine.textContent = real.textContent;
    mine.style.display = real.style.display === 'none' ? 'none' : '';
  }
  var realBadge = document.getElementById('notif-badge');
  if (realBadge && 'MutationObserver' in window) {
    new MutationObserver(syncBadge).observe(realBadge, { childList: true, attributes: true, characterData: true, subtree: true });
  }
  setTimeout(syncBadge, 2500);

  // ── Hide on scroll down, return on any scroll up ───────────────
  var lastY = 0, ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    setTimeout(function () {
      ticking = false;
      var y = window.scrollY || 0;
      // Top bar, bottom tabs and the mini player move together: out of the
      // way while reading down, back the moment you scroll up.
      var bottoms = [document.querySelector('.bottom-tabs'), document.querySelector('.mini-player')];
      var setHidden = function (h) {
        bar.classList.toggle('hidden', h);
        bottoms.forEach(function (el) { if (el) el.classList.toggle('hidden', h); });
      };
      if (y < 48) setHidden(false);
      else if (y > lastY + 6 && !sidebar.classList.contains('mobile-open')) setHidden(true);
      else if (y < lastY - 6) setHidden(false);
      lastY = y;
    }, 80);
  }, { passive: true });

  // ── Sidebar toggle ─────────────────────────────────────────────
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  function openSidebar() {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    ham.setAttribute('aria-expanded', 'true');
    ham.classList.add('open');
    bar.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    ham.setAttribute('aria-expanded', 'false');
    ham.classList.remove('open');
    document.body.style.overflow = '';
  }

  ham.addEventListener('click', function () {
    sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.addEventListener('click', function () {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });

}());
