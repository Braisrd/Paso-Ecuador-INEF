
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

async function inspect() {
    const querySnapshot = await getDocs(collection(db, "tournaments"));
    console.log(`Found ${querySnapshot.size} tournaments.`);
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ${data.name}: Keys: [${Object.keys(data).join(', ')}]`);
        console.log(`  Winners: ${data.winners?.length || 0}`);
        console.log(`  Second: ${data.secondPlace?.length || 0}`);
        console.log(`  Participants: ${data.participants?.length || 0}`);
        // Log "participantes" or other common Spanish names
        if (data.participantes) console.log(`  FOUND 'participantes' field!`);
        if (data.otros) console.log(`  FOUND 'otros' field!`);
    });
}

inspect().catch(console.error);
