function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const isSupported = computed(
    () =>
      process.client &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
  );
  const permission = ref<NotificationPermission>('default');
  const isSubscribed = ref(false);
  const busy = ref(false);

  async function ensureServiceWorker() {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return navigator.serviceWorker.ready || reg;
  }

  async function syncStatus() {
    if (!isSupported.value) return;
    permission.value = Notification.permission;
    const reg = await ensureServiceWorker();
    const existing = await reg.pushManager.getSubscription();
    isSubscribed.value = !!existing;
  }

  async function subscribe() {
    if (!isSupported.value) {
      throw new Error('Push notifications nie są wspierane w tej przeglądarce.');
    }
    busy.value = true;
    try {
      permission.value = Notification.permission;
      if (permission.value !== 'granted') {
        const nextPermission = await Notification.requestPermission();
        permission.value = nextPermission;
      }
      if (permission.value !== 'granted') {
        throw new Error('Brak zgody na powiadomienia.');
      }

      const reg = await ensureServiceWorker();
      const { publicKey } = await $fetch<{ publicKey: string }>('/api/notifications/vapid-public-key');
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const subscription =
        (await reg.pushManager.getSubscription()) ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        }));

      await $fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: {
          subscription: subscription.toJSON(),
        },
      });

      isSubscribed.value = true;
    } finally {
      busy.value = false;
    }
  }

  async function unsubscribe() {
    if (!isSupported.value) return;
    busy.value = true;
    try {
      const reg = await ensureServiceWorker();
      const existing = await reg.pushManager.getSubscription();
      const endpoint = existing?.endpoint;
      if (existing) {
        await existing.unsubscribe();
      }
      if (endpoint) {
        await $fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          body: { endpoint },
        });
      }
      isSubscribed.value = false;
    } finally {
      busy.value = false;
    }
  }

  async function sendTest() {
    await $fetch('/api/notifications/test', { method: 'POST' });
  }

  onMounted(() => {
    if (!isSupported.value) return;
    syncStatus().catch(() => {
      // Ignore status sync errors.
    });
  });

  return {
    isSupported,
    permission,
    isSubscribed,
    busy,
    syncStatus,
    subscribe,
    unsubscribe,
    sendTest,
  };
}
