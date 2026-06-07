// PWA Installation and Prompt Utilities

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isIOS = false;
    this.isAndroid = false;
    this.isStandalone = false;
    this.listeners = [];
  }

  // Initialize PWA detection
  async init() {
    this.detectPlatform();
    this.detectInstallation();
    this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupVisibilityChange();
  }

  // Detect if running on iOS, Android, or Standalone
  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    this.isIOS = /iphone|ipad|ipod/.test(ua);
    this.isAndroid = /android/.test(ua);
    this.isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  }

  // Detect if app is already installed
  detectInstallation() {
    this.isInstalled =
      this.isStandalone ||
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      document.referrer === 'android-app://';
  }

  // Register Service Worker
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        console.log('[PWA] Service Worker registered successfully:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.notifyListeners('update-available', {
                registration,
                newWorker
              });
            }
          });
        });

        return registration;
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  // Setup install prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.notifyListeners('install-prompt-available', { prompt: event });
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.notifyListeners('app-installed');
    });
  }

  // Show install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      return false;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    console.log(`[PWA] User response to install prompt: ${outcome}`);
    
    if (outcome === 'accepted') {
      this.isInstalled = true;
      this.notifyListeners('install-accepted');
    }
    
    this.deferredPrompt = null;
    return outcome === 'accepted';
  }

  // Check if install prompt is available
  isInstallPromptAvailable() {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  // Setup visibility change detection for update checks
  setupVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({ type: 'CHECK_UPDATE' });
      }
    });
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return 'denied';
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(vapidKey) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[PWA] Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      console.log('[PWA] Subscribed to push notifications');
      return subscription;
    } catch (error) {
      console.error('[PWA] Push subscription failed:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[PWA] Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Push unsubscription failed:', error);
      return false;
    }
  }

  // Get current subscription
  async getPushSubscription() {
    if (!('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error('[PWA] Failed to get push subscription:', error);
      return null;
    }
  }

  // Convert VAPID key from base64 to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Add event listener
  addEventListener(event, callback) {
    this.listeners.push({ event, callback });
  }

  // Remove event listener
  removeEventListener(event, callback) {
    this.listeners = this.listeners.filter(
      (listener) => !(listener.event === event && listener.callback === callback)
    );
  }

  // Notify listeners
  notifyListeners(event, data) {
    this.listeners
      .filter((listener) => listener.event === event)
      .forEach((listener) => listener.callback(data));
  }

  // Check for dark mode preference
  prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Request fullscreen
  async requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      await elem.webkitRequestFullscreen();
    }
  }

  // Exit fullscreen
  async exitFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (document.webkitFullscreenElement) {
      await document.webkitExitFullscreen();
    }
  }

  // Lock screen orientation
  async lockScreenOrientation(orientation = 'portrait-primary') {
    if ('orientation' in screen && 'lock' in screen.orientation) {
      try {
        await screen.orientation.lock(orientation);
        console.log(`[PWA] Screen locked to ${orientation}`);
      } catch (error) {
        console.error('[PWA] Screen lock failed:', error);
      }
    }
  }

  // Unlock screen orientation
  async unlockScreenOrientation() {
    if ('orientation' in screen && 'unlock' in screen.orientation) {
      screen.orientation.unlock();
      console.log('[PWA] Screen orientation unlocked');
    }
  }

  // Get safe area insets
  getSafeAreaInsets() {
    const root = document.documentElement;
    return {
      top: parseInt(
        getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)') || '0'
      ),
      right: parseInt(
        getComputedStyle(root).getPropertyValue('env(safe-area-inset-right)') || '0'
      ),
      bottom: parseInt(
        getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)') || '0'
      ),
      left: parseInt(
        getComputedStyle(root).getPropertyValue('env(safe-area-inset-left)') || '0'
      )
    };
  }

  // Check if device has notch
  hasNotch() {
    const insets = this.getSafeAreaInsets();
    return insets.top > 20 || insets.bottom > 20;
  }
}

export const pwaInstaller = new PWAInstaller();
