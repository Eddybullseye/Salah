import { getSupabase } from './supabase';

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('[SW Registration Error]:', err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

export async function subscribeToPush(
  vapidPublicKey?: string,
  userId?: string,
  deviceLabel = 'My Device'
): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'Service worker could not be registered' };
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was not granted' };
    }

    const key =
      vapidPublicKey ||
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      localStorage.getItem('salah_custom_vapid_public_key') ||
      '';

    let subscription = await reg.pushManager.getSubscription();

    if (!subscription && key) {
      const convertedVapidKey = urlBase64ToUint8Array(key);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    if (subscription) {
      const subJSON = subscription.toJSON();
      const p256dh = subJSON.keys?.p256dh || '';
      const auth = subJSON.keys?.auth || '';

      // Cache locally
      localStorage.setItem('salah_push_sub', JSON.stringify(subJSON));

      // If user is logged in with Supabase, sync to push_subscriptions table
      const supabase = getSupabase();
      if (supabase && userId && userId !== 'guest') {
        await supabase.from('push_subscriptions').upsert(
          {
            user_id: userId,
            endpoint: subscription.endpoint,
            p256dh,
            auth,
            device_label: deviceLabel,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
      }

      return { success: true, subscription };
    }

    return {
      success: true,
      error: key ? undefined : 'Permission granted. Add VAPID keys to enable remote server push.',
    };
  } catch (err: any) {
    console.error('Failed to subscribe to push:', err);
    return { success: false, error: err.message || 'Push subscription failed' };
  }
}

// Trigger an immediate test notification via Service Worker or API within 1 minute
export async function sendInstantTestNotification(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const reg = await registerServiceWorker();
  if (reg && 'showNotification' in reg) {
    await reg.showNotification("It's time for Asr 🤍", {
      body: 'Take a moment for Allah. (Test Reminder Successful)',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-reminder-' + Date.now(),
      vibrate: [200, 100, 200],
      actions: [
        { action: 'mark_prayed', title: '✓ I prayed' },
        { action: 'snooze_10', title: '⏰ Remind in 10m' },
      ],
      data: {
        url: '/?tab=home&prayer=asr&test=true',
        prayer: 'asr',
      },
    } as any);
    return true;
  }
  return false;
}
