// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
    apiKey: "AIzaSyCmuNrhWE8Aw24_qUK23Qo4u_W5M6cAFN4",
    authDomain: "liga-multisport.firebaseapp.com",
    projectId: "liga-multisport",
    storageBucket: "liga-multisport.firebasestorage.app",
    messagingSenderId: "983340811794",
    appId: "1:983340811794:web:a86d9e3dbb620accebbacb",
    measurementId: "G-TPNXY1LNX9"
});

// Force immediate activation of the new Service Worker to replace old cached versions
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // User requested to restore this manual notification as it was the "working" one.
    // We removed the 'tag' because it caused the "bad" (system) notification to override this one on mobile.
    // This implies duplicates will return, but at least the functioning one will be present.
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png',
        data: payload.data // Important: pass data for click handling
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    event.notification.close();

    // Fix for 404: Explicitly define the GitHub Pages subdirectory root
    const PROJECT_ROOT = 'https://braisrd.github.io/Paso-Ecuador-INEF/';
    let urlToOpen = (event.notification.data && event.notification.data.url) ? event.notification.data.url : PROJECT_ROOT;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // Match broadly to the project path
                if (client.url.includes("Paso-Ecuador-INEF") && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});


// --- PWA Caching Logic (Merged from service-worker.js) ---
const CACHE_NAME = 'paso-ecuador-v5'; // Bumped version
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './logo.png',
    './manifest.json',
    './robots.txt',
    './sitemap.xml'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline page');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
    // Navigate requests -> Network first, then fallback to cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }
    // Other requests -> Cache first, then network
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[ServiceWorker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});
