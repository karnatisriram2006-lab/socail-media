// Service Worker for VibeSnaps PWA

const CACHE_NAME = 'vibesnaps-v1';
const RUNTIME_CACHE = 'vibesnaps-runtime-v1';
const ASSETS_CACHE = 'vibesnaps-assets-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/index.css',
  '/src/main.jsx'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching essential assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== ASSETS_CACHE
            );
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      self.clients.claim(); // Claim all clients
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Image requests - Cache first, fall back to network
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)
  ) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  // CSS, JS, fonts - Cache first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, ASSETS_CACHE));
    return;
  }

  // HTML documents - Network first
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Cache-first strategy
async function cacheFirst(request, cacheName = RUNTIME_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    // Update cache in background
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // Offline - use cached version
      });
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    return new Response('Offline - Resource not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    console.error('[ServiceWorker] Network request failed:', error);
    return new Response('Offline - Unable to load resource', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    return cached || new Response('Offline', { status: 503 });
  });

  return cached || fetchPromise;
}

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() || {};
  const { title = 'VibeSnaps', body, icon, badge, tag } = data;

  const options = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/icon-96x96.png',
    tag: tag || 'notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-posts') {
    event.waitUntil(
      (async () => {
        try {
          // Sync pending posts
          const db = await openIndexedDB();
          const pendingPosts = await getPendingPosts(db);
          
          for (const post of pendingPosts) {
            await fetch('/api/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(post)
            });
          }
          
          // Clear pending posts after successful sync
          await clearPendingPosts(db);
        } catch (error) {
          console.error('[ServiceWorker] Background sync failed:', error);
          throw error; // Retry sync
        }
      })()
    );
  }
});

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-notifications') {
      event.waitUntil(
        fetch('/api/notifications')
          .then((response) => response.json())
          .then((data) => {
            // Show notification if there are new notifications
            if (data.count > 0) {
              self.registration.showNotification('New notifications!', {
                body: `You have ${data.count} new notifications`,
                icon: '/icons/icon-192x192.png',
                tag: 'notification-update',
                data: '/notifications'
              });
            }
          })
          .catch((error) => {
            console.error('[ServiceWorker] Periodic sync failed:', error);
          })
      );
    }
  });
}

// Helper functions for IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VibeSnapsDB', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-posts')) {
        db.createObjectStore('pending-posts', { keyPath: 'id' });
      }
    };
  });
}

function getPendingPosts(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-posts'], 'readonly');
    const store = transaction.objectStore('pending-posts');
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function clearPendingPosts(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-posts'], 'readwrite');
    const store = transaction.objectStore('pending-posts');
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
