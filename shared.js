/* ================================================================
   PHX APP — shared.js
   Demo Navigation Bar + Mobile Sidebar Toggle
   ================================================================ */
(function () {
  'use strict';

  var rawPage = window.location.pathname.split('/').pop().split('?')[0];
  var page = rawPage || 'index.html';
  // Normalize: serve strips .html in dev, Vercel does the same
  var pageBase = page.replace(/\.html$/, '') || 'index';

  // ── Build Demo Nav Bar ────────────────────────────────────────
  var nav = document.createElement('div');
  nav.id = 'demo-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Demo navigation');

  var inner = '';

  if (pageBase === 'app') {
    // Role-switching chips — no page navigation, just JS calls
    var roles = [
      { id: 'explorer', label: 'Explorer',  color: '#6B7280' },
      { id: 'native',   label: '🔥 Native', color: '#F97316' },
      { id: 'insider',  label: '⭐ Insider', color: '#EAB308' },
      { id: 'artist',   label: '🎵 Artist',  color: '#059669' },
      { id: 'admin',    label: '⚙️ Admin',   color: '#2563EB' },
      { id: 'super',    label: '⚡ Super',   color: '#7C3AED' },
    ];

    inner =
      '<div class="demo-nav-inner">' +
        '<a href="./" class="demo-nav-btn">🏙️ Landing</a>' +
        '<div class="demo-nav-pages">' +
          roles.map(function(r) {
            var cls = 'demo-nav-btn demo-role-btn' + (r.id === 'native' ? ' active' : '');
            return '<button class="' + cls + '" data-role="' + r.id + '" ' +
              'onclick="setRole(\'' + r.id + '\')">' + r.label + '</button>';
          }).join('') +
        '</div>' +
        '<button class="demo-nav-close" aria-label="Close demo bar" ' +
          'onclick="document.getElementById(\'demo-nav\').style.display=\'none\'">✕</button>' +
      '</div>';

  } else {
    // Other pages — standard page links
    var pages = [
      { id: './',      label: '🏙️ Landing' },
      { id: './app',   label: '👤 Member'  },
    ];

    inner =
      '<div class="demo-nav-inner">' +
        '<span class="demo-nav-label">PHX App</span>' +
        '<div class="demo-nav-pages">' +
          pages.map(function(p) {
            var cls = 'demo-nav-btn' + (p.id === page ? ' active' : '');
            return '<a href="' + p.id + '" class="' + cls + '">' + p.label + '</a>';
          }).join('') +
        '</div>' +
        '<button class="demo-nav-close" aria-label="Close demo bar" ' +
          'onclick="document.getElementById(\'demo-nav\').style.display=\'none\'">✕</button>' +
      '</div>';
  }

  nav.innerHTML = inner;
  document.body.appendChild(nav);

  // ── Mobile Sidebar Toggle ─────────────────────────────────────
  var sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  var ham = document.createElement('button');
  ham.className = 'hamburger';
  ham.id = 'hamburger-btn';
  ham.setAttribute('aria-label', 'Open navigation menu');
  ham.setAttribute('aria-expanded', 'false');
  ham.innerHTML = '<span></span><span></span><span></span>';
  document.body.appendChild(ham);

  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  function openSidebar() {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
    ham.setAttribute('aria-expanded', 'true');
    ham.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    ham.setAttribute('aria-expanded', 'false');
    ham.classList.remove('open');
    document.body.style.overflow = '';
  }

  ham.addEventListener('click', function() {
    sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  });

  overlay.addEventListener('click', closeSidebar);

  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() {
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSidebar();
  });

}());
