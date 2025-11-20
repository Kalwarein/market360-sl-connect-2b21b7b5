// Service Worker for Market360 PWA
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push notification handler with rich styling
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Market360';
  
  // Rich notification options with image, actions, and styling
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    image: data.image, // Large image for rich notifications
    data: {
      url: data.url || '/',
      clickAction: data.clickAction || 'open_app'
    },
    tag: data.tag || 'market360-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200], // Vibration pattern
    actions: data.actions || [],
    // Styling
    timestamp: Date.now(),
    dir: 'auto',
    lang: 'en'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification action clicks
self.addEventListener('notificationactionclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const url = event.notification.data?.url || '/';
  
  if (action === 'view') {
    event.waitUntil(clients.openWindow(url));
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  }
});
