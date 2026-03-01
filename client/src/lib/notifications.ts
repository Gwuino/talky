export function sendNotification(title: string, body: string) {
  // Use Electron native notifications if available
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    window.electronAPI.showNotification(title, body);
    return;
  }

  // Fallback to browser Notification API
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      });
    }
  }
}

export function setBadgeCount(count: number) {
  if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
    window.electronAPI.setBadgeCount(count);
  }
}
