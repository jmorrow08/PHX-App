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
