self.addEventListener('push', (event) => {
  let data;
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'New notification', body: event.data.text() };
    }
  } else {
    data = { title: 'New notification', body: '' };
  }

  const { title, body, url, icon } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'New notification', {
      body: body || '',
      icon: icon || '/favicon.ico',
      data: { url: url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(self.location.origin));
      if (existing) {
        return existing.focus().then((client) => client.navigate(url));
      } else {
        return self.clients.openWindow(url);
      }
    }),
  );
});
