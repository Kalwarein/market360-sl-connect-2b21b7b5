/**
 * Detects the notification environment (web browser vs native app)
 */
export const isNativeApp = (): boolean => {
  return !!(window as any).Capacitor;
};

export const isPWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export const getNotificationEnvironment = (): 'native' | 'pwa' | 'web' => {
  if (isNativeApp()) return 'native';
  if (isPWA()) return 'pwa';
  return 'web';
};
