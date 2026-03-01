import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  showNotification: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  setBadgeCount: (count: number) =>
    ipcRenderer.invoke('set-badge-count', count),

  platform: process.platform,
  isElectron: true,
});
