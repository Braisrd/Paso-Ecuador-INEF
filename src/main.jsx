import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for PWA and Firebase Messaging
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Explicitly scope to the repo name for GitHub Pages
    // This matches the file location in /Paso-Ecuador-INEF/firebase-messaging-sw.js
    const swUrl = `${import.meta.env.BASE_URL}firebase-messaging-sw.js`;
    navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL })
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
