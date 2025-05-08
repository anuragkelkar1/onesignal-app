// src/onesignal-setup.js

// Ensure the OneSignal SDK global is available
if (typeof window !== "undefined") {
  window.OneSignal = window.OneSignal || [];

  // Prevent multiple initializations (e.g., HMR)
  if (!window._oneSignalInitialized) {
    window.OneSignal.push(() => {
      // Initialize the OneSignal Web SDK
      OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
        allowLocalhostAsSecureOrigin: true, // enable for local dev
        notifyButton: {
          enable: false, // show the subscription bell
        },
      });
    });

    window._oneSignalInitialized = true;
  }
}
