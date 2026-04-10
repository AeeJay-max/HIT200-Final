import { VITE_BACKEND_URL } from "../config/config";

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const subscribeToPush = async (token: string, role: string) => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const registration = await navigator.serviceWorker.ready;
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });

        const endpoint = role === "admin" ? "admin/notifications/subscribe" : "citizen/notifications/subscribe";

        await fetch(`${VITE_BACKEND_URL}/api/v1/${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (e) {
        console.error("Push subscription failed", e);
    }
};
