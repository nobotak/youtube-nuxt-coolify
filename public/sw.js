self.addEventListener('push', (event) => {
  let payload = { title: 'YouTube Manager', body: 'Nowe powiadomienie', url: '/' };
  try {
    payload = JSON.parse(event.data?.text() || '{}');
  } catch {
    // keep fallback payload
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'YouTube Manager', {
      body: payload.body || '',
      data: { url: payload.url || '/' },
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
