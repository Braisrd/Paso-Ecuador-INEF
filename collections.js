
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function findCollections() {
    // Note: listCollections is not for Web SDK, but we'll try something else
    // We can't really list collections from Web SDK without knowing names.
    // Try common names
    const names = ['players', 'tournaments', 'announcements', 'backups', 'deleted_players'];
    for (const name of names) {
        const snap = await getDocs(collection(db, name));
        console.log(`Collection '${name}': ${snap.size} docs`);
    }
}
findCollections().catch(console.error);
