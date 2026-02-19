import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage, db, doc, setDoc } from '../services/firebase';

export const useNotifications = () => {
    const [permission, setPermission] = useState(Notification.permission);
    const [fcmToken, setFcmToken] = useState(null);

    const requestPermission = async () => {
        if (!messaging) {
            console.warn("Messaging not supported or failed to initialize.");
            return;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                console.log('Permission granted. retrieving token...');

                let registration;
                try {
                    registration = await navigator.serviceWorker.ready;
                    console.log('Service Worker ready:', registration);
                } catch (e) {
                    console.error('Error waiting for SW ready:', e);
                }

                // Get Token
                const currentToken = await getToken(messaging, {
                    vapidKey: "BJZr34oV68SKsSBbxY-rB7xzbcKQ4DjIIsgtW-y8SW5I-4dGHIpeHsmIo7mQEMMXNK8ov5RqMRKw7-IWD1_Oa4M",
                    serviceWorkerRegistration: registration
                });

                if (currentToken) {
                    console.log('Token retrieved:', currentToken);
                    setFcmToken(currentToken);
                    // Save token to Firestore for targeting
                    try {
                        await setDoc(doc(db, "fcm_tokens", currentToken), {
                            token: currentToken,
                            lastSeen: new Date(),
                            userAgent: navigator.userAgent
                        }, { merge: true });
                        console.log('Token saved to Firestore');
                    } catch (dbError) {
                        console.error('Error saving to DB:', dbError);
                        alert('Error guardando token: ' + dbError.message);
                    }
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            }
        } catch (error) {
            console.error("An error occurred while retrieving token. ", error);
            alert("Error token: " + error.message);
        }
    };

    // Listen for foreground messages
    useEffect(() => {
        if (permission === 'granted' && messaging) {
            try {
                const unsubscribe = onMessage(messaging, (payload) => {
                    // Customize notification handling here if needed
                    console.log('Message received. ', payload);
                    // System notification for foreground if desired, or custom UI toast
                    // Using standard Notification API for consistency
                    if (Notification.permission === 'granted') {
                        new Notification(payload.notification.title, {
                            body: payload.notification.body,
                            icon: '/logo.png'
                        });
                    }
                });
                return () => unsubscribe();
            } catch (err) {
                console.warn("Error setting up onMessage listener:", err);
            }
        }
    }, [permission]);

    return { permission, requestPermission, fcmToken };
};
