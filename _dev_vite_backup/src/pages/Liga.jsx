import React, { useState, useEffect, useMemo } from 'react';
import { PlusCircle, Search, Trophy, Medal, Crown, TrendingUp, Calendar, Trash2, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { db, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc, setDoc } from '../firebase';

const PlayerCard = ({ player, rank, onClick }) => (
    <div onClick={onClick} className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl ${rank === 1 ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30' : rank === 2 ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border border-gray-400/30' : rank === 3 ? 'bg-gradient-to-br from-orange-700/20 to-orange-800/20 border border-orange-700/30' : 'bg-[#13131f] border border-white/5 hover:border-white/10'}`}>
        <div className="absolute top-0 right-0 p-3 opacity-10"><Trophy className="w-16 h-16" /></div>
        <div className="relative z-10 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-lg ${rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black' : rank === 2 ? 'bg-gradient-to-br from-gray-100 to-gray-400 text-black' : rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-600 text-black' : 'bg-white/5 text-gray-400'}`}>
                {rank <= 3 ? rank : <span className="text-sm">#{rank}</span>}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-lg truncate ${rank === 1 ? 'text-yellow-400' : 'text-white'}`}>{player.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> {player.wins || 0} Victorias</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-2xl font-black text-white">{player.points}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Puntos</div>
            </div>
        </div>
    </div>
);

const AdminPanel = ({ isOpen, onClose, players, setPlayers }) => {
    const [tName, setTName] = useState('');
    const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);
    const [tFirst, setTFirst] = useState('');
    const [tSecond, setTSecond] = useState('');
    const [tOthers, setTOthers] = useState('');
    const [tab, setTab] = useState('tournament'); // 'tournament' | 'password'
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!confirm('¿Confirmar resultados? Esto actualizará los puntos.')) return;

        const parseNames = (str) => str.split('\n').map(n => n.trim()).filter(n => n);
        const first = parseNames(tFirst);
        const second = parseNames(tSecond);
        const others = parseNames(tOthers);
        const allNames = [...new Set([...first, ...second, ...others])];

        try {
            // Find existing players or create new ones
            const playerMap = {};
            // Using logic from snapshot current players list
            for (let name of allNames) {
                let p = players.find(pl => pl.name.toLowerCase() === name.toLowerCase());
                if (!p) {
                    const docRef = await addDoc(collection(db, "players"), { name, points: 0, wins: 0, history: [] });
                    p = { id: docRef.id, name, points: 0, wins: 0, history: [] };
                }
                playerMap[name] = p;
            }

            // Update points
            for (let name of first) {
                const p = playerMap[name];
                await updateDoc(doc(db, "players", p.id), {
                    points: (p.points || 0) + 5,
                    wins: (p.wins || 0) + 1,
                    history: [...(p.history || []), { date: tDate, event: tName, result: '1º Lugar', change: '+5' }]
                });
            }
            for (let name of second) {
                const p = playerMap[name];
                await updateDoc(doc(db, "players", p.id), {
                    points: (p.points || 0) + 3,
                    history: [...(p.history || []), { date: tDate, event: tName, result: '2º Lugar', change: '+3' }]
                });
            }
            for (let name of others) {
                if (first.includes(name) || second.includes(name)) continue;
                const p = playerMap[name];
                await updateDoc(doc(db, "players", p.id), {
                    points: (p.points || 0) + 1,
                    history: [...(p.history || []), { date: tDate, event: tName, result: 'Participación', change: '+1' }]
                });
            }

            // Save visual record
            await addDoc(collection(db, "local_tournaments"), {
                name: tName,
                date: tDate,
                winner: first[0] || 'Desconocido',
                participants: allNames.length
            });

            alert('Torneo registrado y puntos actualizados!');
            onClose();
            setTName(''); setTFirst(''); setTSecond(''); setTOthers('');
        } catch (err) {
            console.error(err);
            alert('Error: ' + err.message);
        }
    };

    const handlePassChange = async () => {
        try {
            const docRef = doc(db, 'config', 'settings');
            const docSnap = await getDoc(docRef);
            const current = docSnap.exists() ? docSnap.data().ligaAdminPassword || 'Liga2526' : 'Liga2526';
            if (oldPass !== current) return alert('Contraseña actual incorrecta');
            await setDoc(docRef, { ligaAdminPassword: newPass }, { merge: true });
            alert('Contraseña actualizada');
            setOldPass(''); setNewPass('');
        } catch (e) { alert('Error'); }
    };

    const manualUpdatePoints = async (id, delta) => {
        const p = players.find(x => x.id === id);
        if (!p) return;
        await updateDoc(doc(db, "players", id), { points: Math.max(0, (p.points || 0) + delta) });
    };

    const manualDelete = async (id) => {
        if (confirm('¿Eliminar jugador de la base de datos? Irreversible.')) {
            await deleteDoc(doc(db, "players", id));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex h-[800px]">
                <div className="w-1/3 border-r border-white/10 p-6 space-y-2">
                    <button onClick={() => setTab('tournament')} className={`w-full text-left p-3 rounded-xl font-bold ${tab === 'tournament' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}>Nuevo Torneo</button>
                    <button onClick={() => setTab('password')} className={`w-full text-left p-3 rounded-xl font-bold ${tab === 'password' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5'}`}>Contraseña</button>
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Jugadores</h4>
                        <div className="space-y-1 max-h-[500px] overflow-y-auto">
                            {players.sort((a, b) => b.points - a.points).map(p => (
                                <div key={p.id} className="flex justify-between items-center text-xs p-2 hover:bg-white/5 rounded">
                                    <span className="text-gray-300">{p.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white">{p.points}</span>
                                        <button onClick={() => manualUpdatePoints(p.id, 1)} className="text-green-400 hover:text-green-300">+</button>
                                        <button onClick={() => manualUpdatePoints(p.id, -1)} className="text-yellow-400 hover:text-yellow-300">-</button>
                                        <button onClick={() => manualDelete(p.id)} className="text-red-400 hover:text-red-300">x</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                    {tab === 'password' ? (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Cambiar Contraseña Admin</h3>
                            <input type="password" placeholder="Contraseña Actual" className="w-full bg-black/40 border border-white/10 rounded-xl p-3" value={oldPass} onChange={e => setOldPass(e.target.value)} />
                            <input type="password" placeholder="Nueva Contraseña" className="w-full bg-black/40 border border-white/10 rounded-xl p-3" value={newPass} onChange={e => setNewPass(e.target.value)} />
                            <button onClick={handlePassChange} className="px-4 py-2 bg-secondary/20 text-secondary rounded-lg font-bold">Actualizar</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2"><PlusCircle className="text-secondary" /> Nuevo Torneo</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" placeholder="Ej: Torneo FIFA" value={tName} onChange={e => setTName(e.target.value)} required />
                                <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white" value={tDate} onChange={e => setTDate(e.target.value)} />
                            </div>
                            <div className="space-y-4">
                                <div><label className="text-xs uppercase font-bold text-yellow-500 mb-2 block">🥇 1º Puesto (+5 pts)</label><textarea className="w-full h-24 bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-3 text-white" placeholder="Nombres (uno por línea)" value={tFirst} onChange={e => setTFirst(e.target.value)}></textarea></div>
                                <div><label className="text-xs uppercase font-bold text-gray-300 mb-2 block">🥈 2º Puesto (+3 pts)</label><textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-white" placeholder="Nombres (uno por línea)" value={tSecond} onChange={e => setTSecond(e.target.value)}></textarea></div>
                                <div><label className="text-xs uppercase font-bold text-primary mb-2 block">Participantes (+1 pt)</label><textarea className="w-full h-24 bg-primary/5 border border-primary/20 rounded-xl p-3 text-white" placeholder="Lista de nombres..." value={tOthers} onChange={e => setTOthers(e.target.value)}></textarea></div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold text-white shadow-lg">Guardar Resultados</button>
                        </form>
                    )}
                </div>
            </div>
        </Modal>
    );
};

const Liga = () => {
    const [view, setView] = useState('public');
    const [players, setPlayers] = useState([]);
    const [localTournaments, setLocalTournaments] = useState([]);
    const [search, setSearch] = useState('');
    const [showAdmin, setShowAdmin] = useState(false);
    const [pass, setPass] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    useEffect(() => {
        const u1 = onSnapshot(query(collection(db, "players"), orderBy("points", "desc")), s => setPlayers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const u2 = onSnapshot(query(collection(db, "local_tournaments"), orderBy("date", "desc")), s => setLocalTournaments(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => { u1(); u2(); };
    }, []);

    const filteredPlayers = useMemo(() => players.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [players, search]);
    const top3 = useMemo(() => players.slice(0, 3), [players]);

    const handleLogin = async (e) => {
        e.preventDefault();
        const docRef = doc(db, 'config', 'settings');
        const docSnap = await getDoc(docRef);
        const correct = docSnap.exists() ? (docSnap.data().ligaAdminPassword || 'Liga2526') : 'Liga2526';
        if (pass === correct) { setShowLogin(false); setShowAdmin(true); setPass(''); } else { alert('Incorrecto'); }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-pink-500/30">
            {showAdmin && <AdminPanel isOpen={true} onClose={() => setShowAdmin(false)} players={players} setPlayers={setPlayers} />}
            {showLogin && (
                <Modal isOpen={true} onClose={() => setShowLogin(false)} size="sm">
                    <div className="p-8 text-center">
                        <h3 className="text-xl font-bold mb-4">Acceso Admin Liga</h3>
                        <form onSubmit={handleLogin}><input type="password" autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-center text-white text-xl tracking-widest mb-4" value={pass} onChange={e => setPass(e.target.value)} /><button className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg">Entrar</button></form>
                    </div>
                </Modal>
            )}
            {selectedPlayer && (
                <Modal isOpen={true} onClose={() => setSelectedPlayer(null)}>
                    <div className="p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none"></div>
                        <div className="inline-block p-4 rounded-full bg-gradient-to-br from-primary to-secondary mb-4 shadow-xl"><Trophy className="w-8 h-8 text-white" /></div>
                        <h2 className="text-3xl font-black mb-2">{selectedPlayer.name}</h2>
                        <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-6">{selectedPlayer.points} PTS</div>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><div className="text-gray-400 text-xs uppercase font-bold">Victorias</div><div className="text-2xl font-bold">{selectedPlayer.wins || 0} 🏆</div></div>
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10"><div className="text-gray-400 text-xs uppercase font-bold">Torneos</div><div className="text-2xl font-bold">{selectedPlayer.history?.length || 0} 📅</div></div>
                        </div>
                        <div className="mt-6 text-left">
                            <h4 className="font-bold text-gray-500 uppercase text-xs mb-3">Historial Reciente</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {(selectedPlayer.history || []).slice().reverse().map((h, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded text-sm"><span className="text-gray-300">{h.event}</span><span className={`font-bold ${h.change.includes('+5') ? 'text-yellow-400' : h.change.includes('+3') ? 'text-gray-300' : 'text-primary'}`}>{h.change} pts</span></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-lg border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity"><HomeIcon className="w-5 h-5 text-gray-400" /><span className="font-bold text-gray-400">Volver al Paso</span></Link>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20"><Trophy className="w-5 h-5 text-yellow-400" /><span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">LIGA MULTISPORT</span></div>
                    <button onClick={() => setShowLogin(true)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400"><Medal className="w-5 h-5" /></button>
                </div>
            </nav>

            <main className="pt-28 pb-12 px-4 max-w-7xl mx-auto space-y-12">
                {/* Top 3 Podium */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-16 relative">
                    <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none"></div>
                    {/* 2nd Place */}
                    {top3[1] && <div className="order-2 md:order-1 flex flex-col items-center"><div className="relative w-full aspect-square max-w-[200px] mb-4 group cursor-pointer" onClick={() => setSelectedPlayer(top3[1])}><div className="absolute inset-0 bg-gray-400/20 rounded-full blur-xl animate-pulse"></div><div className="relative w-full h-full rounded-full border-4 border-gray-400 bg-[#13131f] flex items-center justify-center overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${top3[1].name}&background=random`} alt="" className="w-full h-full object-cover opacity-80" /></div><div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-400 text-black font-black px-4 py-1 rounded-full text-xl shadow-lg">#2</div></div><h3 className="text-2xl font-bold text-gray-300 mb-1">{top3[1].name}</h3><div className="text-gray-400 font-bold">{top3[1].points} pts</div></div>}
                    {/* 1st Place */}
                    {top3[0] && <div className="order-1 md:order-2 flex flex-col items-center z-10 transform -translate-y-8"><div className="relative w-full aspect-square max-w-[240px] mb-4 group cursor-pointer" onClick={() => setSelectedPlayer(top3[0])}><div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-2xl animate-pulse"></div><Crown className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 text-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" /><div className="relative w-full h-full rounded-full border-4 border-yellow-400 bg-[#13131f] flex items-center justify-center overflow-hidden ring-4 ring-yellow-400/20"><img src={`https://ui-avatars.com/api/?name=${top3[0].name}&background=random`} alt="" className="w-full h-full object-cover" /></div><div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black px-6 py-2 rounded-full text-2xl shadow-xl border-4 border-[#0a0a0f]">#1</div></div><h3 className="text-4xl font-black text-white mb-2">{top3[0].name}</h3><div className="text-yellow-400 font-bold text-xl">{top3[0].points} pts</div></div>}
                    {/* 3rd Place */}
                    {top3[2] && <div className="order-3 flex flex-col items-center"><div className="relative w-full aspect-square max-w-[200px] mb-4 group cursor-pointer" onClick={() => setSelectedPlayer(top3[2])}><div className="absolute inset-0 bg-orange-700/20 rounded-full blur-xl animate-pulse"></div><div className="relative w-full h-full rounded-full border-4 border-orange-700 bg-[#13131f] flex items-center justify-center overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${top3[2].name}&background=random`} alt="" className="w-full h-full object-cover opacity-80" /></div><div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-orange-700 text-white font-black px-4 py-1 rounded-full text-xl shadow-lg">#3</div></div><h3 className="text-2xl font-bold text-gray-300 mb-1">{top3[2].name}</h3><div className="text-gray-400 font-bold">{top3[2].points} pts</div></div>}
                </section>

                {/* Rankings List */}
                <section className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-3"><TrendingUp className="text-primary" /> Ranking General</h2>
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type="text" placeholder="Buscar jugador..." className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:border-primary focus:outline-none w-48 md:w-64" value={search} onChange={e => setSearch(e.target.value)} /></div>
                        </div>
                        <div className="grid gap-3">
                            {filteredPlayers.slice(3).map((p, i) => <PlayerCard key={p.id} player={p} rank={i + 4} onClick={() => setSelectedPlayer(p)} />)}
                        </div>
                    </div>
                    {/* Recent Tournaments Sidebar */}
                    <div className="w-full lg:w-1/3">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-secondary" /> Últimos Torneos</h2>
                        <div className="space-y-4">
                            {localTournaments.map(t => (
                                <div key={t.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-white/20 transition-colors">
                                    <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg">{t.name}</h3><span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{new Date(t.date).toLocaleDateString()}</span></div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400"><Trophy className="w-4 h-4 text-yellow-500" /> Ganador: <span className="text-white font-bold">{t.winner}</span></div>
                                    <div className="mt-2 text-xs text-gray-500">{t.participants} participantes</div>
                                </div>
                            ))}
                            {localTournaments.length === 0 && <p className="text-gray-500 italic">No hay torneos registrados.</p>}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Liga;
