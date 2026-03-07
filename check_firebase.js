
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCmuNrhWE8Aw24_qUK23Qo4u_W5M6cAFN4",
    authDomain: "liga-multisport.firebaseapp.com",
    projectId: "liga-multisport",
    storageBucket: "liga-multisport.firebasestorage.app",
    messagingSenderId: "983340811794",
    appId: "1:983340811794:web:a86d9e3dbb620accebbacb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdmin() {
    console.log("Checking 'admin' collection...");
    try {
        const snap = await getDocs(collection(db, "admin"));
        snap.forEach(d => {
            console.log(`Document ${d.id}:`, d.data());
        });
    } catch (e) {
        console.log("Error reading 'admin':", e.message);
    }

    console.log("\nChecking 'settings' collection (another common name)...");
    try {
        const snap = await getDocs(collection(db, "settings"));
        snap.forEach(d => {
            console.log(`Document ${d.id}:`, d.data());
        });
    } catch (e) {
        console.log("Error reading 'settings':", e.message);
    }
}
checkAdmin().catch(console.error);
