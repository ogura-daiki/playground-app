
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const { path, options } =
        isLocalhost ? {
          path: "/sw.js",
          options: {
          }
        }
        /*else*/ : {
          path: "/playground-app/sw.js",
          options: {
            scope: "/playground-app/"
          }
        };
      const registration = await navigator.serviceWorker.register(path, options);
      if (registration.installing) {
        console.log('Service worker installing');
      } else if (registration.waiting) {
        console.log('Service worker installed');
      } else if (registration.active) {
        console.log('Service worker active');
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerServiceWorker();