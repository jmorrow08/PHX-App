// PHX App — minimal service worker
// Required for Chrome/Android PWA install eligibility, which is what lets
// the app run in "standalone" mode. Standalone mode is what keeps audio
// alive when the phone locks or the user switches apps — a plain browser
// tab gets suspended by the OS much more aggressively than an installed app.
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(e) {
  e.respondWith(
    fetch(e.request).catch(function() {
      return caches.match(e.request);
    })
  );
});
