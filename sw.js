// PHX App — service worker
// 1) PWA install eligibility → standalone mode keeps audio alive when the
//    phone locks (browser tabs get suspended much more aggressively).
// 2) App-shell precache → the app opens offline and static assets load
//    instantly from cache.
var CACHE_NAME = 'phx-shell-v8';
var SHELL = [
  './',
  'app',
  'app.html',
  'index.html',
  'shared.css?v=11',
  'shared.js?v=12',
  'manifest.json'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Best-effort: one missing asset must not block install
      return Promise.allSettled(SHELL.map(function(u) { return cache.add(u); }));
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; })
        .map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var req = e.request;
  // Only same-origin GETs — never intercept Supabase API calls or
  // audio range requests (range through a cache breaks seeking).
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.headers.has('range')) return;

  if (req.mode === 'navigate') {
    // Documents: network-first so deploys show up, cache fallback offline
    e.respondWith(
      fetch(req).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
        return res;
      }).catch(function() {
        return caches.match(req).then(function(hit) {
          return hit || caches.match('app.html');
        });
      })
    );
    return;
  }

  // Static assets: cache-first (they're content-versioned via ?v=)
  e.respondWith(
    caches.match(req).then(function(hit) {
      return hit || fetch(req).then(function(res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});

// ── WEB PUSH ─────────────────────────────────────────────────────────
// Payloads come from the send-push edge function (title/body/url JSON).
self.addEventListener('push', function(e) {
  var data = { title: 'PHX App', body: 'You have a new notification', url: '/app' };
  try { data = Object.assign(data, e.data.json()); } catch (err) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://murkmerch.com/cdn/shop/files/AAB814A5-32E3-4FF1-A00C-0DF47B57E8DA.png',
      badge: 'https://murkmerch.com/cdn/shop/files/AAB814A5-32E3-4FF1-A00C-0DF47B57E8DA.png',
      data: { url: data.url }
    })
  );
});

// Tap a push → focus the app (or open it) at the deep-linked post
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/app';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf('/app') !== -1) {
          list[i].navigate(url);
          return list[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
