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
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
export const messaging = getMessaging(app);

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
    onMessage
};
