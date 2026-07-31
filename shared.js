/* ================================================================
   PHX APP — shared.js
   Mobile Sidebar Toggle
   ================================================================ */
(function () {
  'use strict';

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
