
import { db, collection, getDocs } from './src/services/firebase.js';

async function audit() {
    console.log("--- TOURNAMENT DATA AUDIT ---");
    const tourneys = await getDocs(collection(db, "tournaments"));
    tourneys.forEach(doc => {
        const d = doc.data();
        const total = (d.winners?.length || 0) + (d.secondPlace?.length || 0) + (d.participants?.length || 0);
        console.log(`[Tourney] ${d.name} (${d.date}): ${total} people recorded. ID: ${doc.id}`);
        if (total === 0) {
            console.log("  WARNING: This tournament is EMPTY. Keys present:", Object.keys(d));
        }
    });

    console.log("\n--- PLAYER DATA AUDIT (Specific Examples) ---");
    const players = await getDocs(collection(db, "players"));
    players.forEach(doc => {
        const d = doc.data();
        if (d.name.includes("Antonio Iglesias") || d.name.includes("Noé Souto")) {
            console.log(`[Player] ${d.name}: ${d.points} pts. History Items: ${d.history?.length || 0}`);
            d.history?.forEach(h => console.log(`  - ${h.tournament}: ${h.points} pts`));
        }
    });
}

audit().catch(e => console.error("Audit failed:", e));
