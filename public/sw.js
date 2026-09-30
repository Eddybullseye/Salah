// Salah Companion - Custom Progressive Web App Service Worker
const CACHE_NAME = 'salah-companion-v1';
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-badge-96.png',
  '/apple-touch-icon.png',
  '/offline.html'
];

// Install: Pre-cache app shell assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching some assets failed:', err);
      });
    })
  );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

const ADHAN_CACHE_NAME = 'salah-adhan-cache-v1';

// Fetch: Audio Cache-First, Stale-while-revalidate for static assets, network-first for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);

  // Audio files (Supabase Storage public adhan bucket or local /audio/ directory)
  const isAudioRequest =
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.ogg') ||
    url.pathname.endsWith('.m4a') ||
    url.pathname.startsWith('/audio/') ||
    url.pathname.includes('/storage/v1/object/public/adhan/');

  if (isAudioRequest) {
    event.respondWith(
      caches.open(ADHAN_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // For navigation (HTML), try network first, then cache, then offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const rootCached = await caches.match('/');
        if (rootCached) return rootCached;
        const offlinePage = await caches.match('/offline.html');
        return offlinePage || Response.error();
      })
    );
    return;
  }

  // For static assets, serve from cache if available, updating cache in background
  if (
    url.origin === location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.json') ||
     url.pathname.endsWith('.css') ||
     url.pathname.endsWith('.js'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'Salah Reminder',
    body: 'Time for prayer. Pause for Allah 🤍',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'salah-notification',
    prayer: 'asr',
    sound_mode: 'adhan',
    data: { url: '/adhan?prayer=asr' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const prayerName = data.prayer || (data.data && data.data.prayer) || '';
  const soundMode = data.sound_mode || data.soundMode || (data.data && data.data.sound_mode) || 'adhan';
  const isSilent = soundMode === 'silent';

  // Build deep link for prayer if not explicitly provided
  let destinationUrl = data.data?.url || (prayerName ? `/adhan?prayer=${prayerName}&sound=${soundMode}` : '/');

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-badge-96.png',
    tag: data.tag || (prayerName ? `salah-prayer-${prayerName}` : `salah-reminder-${Date.now()}`),
    renotify: true,
    requireInteraction: true,
    silent: isSilent,
    vibrate: isSilent ? [] : [200, 100, 200],
    data: {
      url: destinationUrl,
      prayer: prayerName,
      sound_mode: soundMode,
      date: new Date().toISOString().split('T')[0]
    },
    actions: data.actions || [
      { action: 'mark_prayed', title: '✓ I prayed' },
      { action: 'snooze_10', title: '⏰ Remind in 10m' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// Notification Click Handler (Open app, focus client, or execute background action)
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data || {};
  const targetUrl = notificationData.url || '/';

  notification.close();

  if (action === 'mark_prayed') {
    // Action 1: "I prayed" - Broadcast to open clients or sync
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Send message to open tabs to mark prayer completed
        clientList.forEach((client) => {
          client.postMessage({
            type: 'SALAH_ACTION_PRAYED',
            prayer: notificationData.prayer,
            date: notificationData.date
          });
        });
        // If no clients open, open the app
        if (clientList.length === 0) {
          return self.clients.openWindow(targetUrl + '&action=prayed');
        } else {
          return clientList[0].focus();
        }
      })
    );
    return;
  }

  if (action === 'snooze_10') {
    // Action 2: "Remind me in 10 min"
    // Re-schedule notification in 10 minutes
    const snoozeTitle = 'Snooze: ' + (notification.title || 'Prayer Reminder');
    const snoozeBody = 'Gentle reminder: Did you get a chance to pray? 🤍';
    
    // Attempt local timeout or broadcast
    event.waitUntil(
      new Promise((resolve) => {
        // Broadcast snooze acknowledgement
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
          clients.forEach((c) => c.postMessage({ type: 'SALAH_SNOOZE_REGISTERED', minutes: 10 }));
        });
        resolve();
      })
    );
    return;
  }

  // Default tap: Open / focus the app window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
