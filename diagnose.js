
import { db, collection, getDocs } from './src/services/firebase.js';

async function diagnose() {
    console.log("Starting diagnosis...");
    const querySnapshot = await getDocs(collection(db, "tournaments"));
    const keys = new Set();
    querySnapshot.forEach((doc) => {
        Object.keys(doc.data()).forEach(k => keys.add(k));
    });
    console.log("Unique keys in tournaments collection:", Array.from(keys));
    
    // Check one doc
    if (!querySnapshot.empty) {
        console.log("Sample doc data:", JSON.stringify(querySnapshot.docs[0].data(), null, 2));
    }
}

diagnose().catch(console.error);
