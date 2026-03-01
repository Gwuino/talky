interface ElectronAPI {
  showNotification: (title: string, body: string) => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
  platform: string;
  isElectron: boolean;
}

interface Window {
  electronAPI?: ElectronAPI;
}
