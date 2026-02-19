import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    limit,
    getDoc,
    setDoc,
    where
} from "firebase/firestore";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCmuNrhWE8Aw24_qUK23Qo4u_W5M6cAFN4",
    authDomain: "liga-multisport.firebaseapp.com",
    projectId: "liga-multisport",
    storageBucket: "liga-multisport.firebasestorage.app",
    messagingSenderId: "983340811794",
    appId: "1:983340811794:web:a86d9e3dbb620accebbacb",
    measurementId: "G-TPNXY1LNX9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Defensive Messaging Initialization (Instruction 1)
let messaging = null;

const initializeMessaging = async () => {
    try {
        const supported = await isSupported();
        if (supported && 'serviceWorker' in navigator && 'PushManager' in window) {
            messaging = getMessaging(app);
            console.log("Firebase Messaging initialized successfully.");
        } else {
            console.warn("Firebase Messaging not supported in this environment.");
        }
    } catch (e) {
        console.error("Critical error during Messaging initialization:", e);
    }
};

initializeMessaging();

export { messaging };

// Export firestore functions for convenience
export {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    limit,
    getDoc,
    setDoc,
    where,
    getToken,
    onMessage,
    ref,
    uploadBytes,
    getDownloadURL
};
