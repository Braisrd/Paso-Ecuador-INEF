import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for PWA and Firebase Messaging
// Senior Blindage: Defensive feature detection for iOS/Safari WebViews
if (
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window
) {
  window.addEventListener('load', () => {
    try {
      // Explicitly scope to the repo name for GitHub Pages
      const swUrl = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;
      navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL })
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    } catch (e) {
      console.warn("Failed to register SW (webview block):", e);
    }
  });
} else {
  console.warn("Push/SW APIs not fully supported or blocked. Skiping registration.");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
