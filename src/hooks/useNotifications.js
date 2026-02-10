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
                // Get Token
                // TODO: Replace with user's VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push Certificates
                const currentToken = await getToken(messaging, {
                    vapidKey: "BJZr34oV68SKsSBbxY-rB7xzbcKQ4DjIIsgtW-y8SW5I-4dGHIpeHsmIo7mQEMMXNK8ov5RqMRKw7-IWD1_Oa4M"
                });

                if (currentToken) {
                    setFcmToken(currentToken);
                    // Save token to Firestore for targeting
                    await setDoc(doc(db, "fcm_tokens", currentToken), {
                        token: currentToken,
                        lastSeen: new Date(),
                        userAgent: navigator.userAgent
                    }, { merge: true });
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            }
        } catch (error) {
            console.error("An error occurred while retrieving token. ", error);
        }
    };

    // Listen for foreground messages
    useEffect(() => {
        if (permission === 'granted' && messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                // Customize notification handling here if needed
                console.log('Message received. ', payload);
                // System notification for foreground if desired, or custom UI toast
                // Using standard Notification API for consistency
                if (Notification.permission === 'granted') {
                    new Notification(payload.notification.title, {
                        body: payload.notification.body,
                        icon: '/logo.png' // Ensure correct path
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [permission]);

    return { permission, requestPermission, fcmToken };
};
