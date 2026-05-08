type ToastType = 'success' | 'error' | 'info';

export type AppToast = {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useToast() {
  const toasts = useState<AppToast[]>('app-toasts', () => []);

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function pushToast(message: string, type: ToastType = 'info', durationMs = 3500) {
    const id = createId();
    toasts.value.push({ id, message, type, durationMs });
    if (durationMs > 0) {
      setTimeout(() => removeToast(id), durationMs);
    }
    return id;
  }

  return {
    toasts,
    removeToast,
    pushToast,
    success: (message: string, durationMs?: number) => pushToast(message, 'success', durationMs),
    error: (message: string, durationMs?: number) => pushToast(message, 'error', durationMs),
    info: (message: string, durationMs?: number) => pushToast(message, 'info', durationMs),
  };
}
