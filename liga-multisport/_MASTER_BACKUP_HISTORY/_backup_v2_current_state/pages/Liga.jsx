import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Search,
    Shield,
    Ghost,
    PlusCircle,
    Trash2 as Trash,
    Info,
    ChevronDown,
    Save,
    Share2 as ShareIcon
} from 'lucide-react';
import {
    db,
    collection,
    onSnapshot,
    query,
    doc,
    updateDoc,
    addDoc,
    deleteDoc
} from '../services/firebase';

// --- UTILS ---
const normalizeName = (name) => {
    if (!name) return "";
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
};

const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', ...(includeTime && { hour: '2-digit', minute: '2-digit' }) });
};

const INITIAL_DESCRIPTION = `Se trata de una liga individual en la que daremos 100€ a la persona ganadora al final del curso.
Los puntos se obtienen participando en torneos y ganándolos, siendo los puntos obtenidos:

• **+1 punto** por participar
• **+3 puntos** por quedar segundo/a
• **+5 puntos** por quedar primero/a`;

// --- COMPONENTS ---

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative z-10 w-full max-w-2xl bg-[#0f0f16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-20">
                    <X className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    );
};

const PlayerCard = ({ player, rank, onClick }) => {
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'text-gray-500';
    const bgClass = rank === 1 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-[#1c1c2e]/50 hover:bg-[#1c1c2e] border-white/5';

    return (
        <div
            onClick={onClick}
            className={`group relative flex items-center p-4 rounded-xl border transition-all duration-300 cursor-pointer ${bgClass}`}
        >
            <div className={`w-12 h-12 flex items-center justify-center text-2xl font-black mr-4 ${rankClass}`}>
                {rank <= 3 ? '#' + rank : rank}
            </div>

            <div className="flex-1">
                <h3 className={`font-bold text-lg ${rank === 1 ? 'text-white' : 'text-gray-200'} group-hover:text-primary transition-colors`}>
                    {player.name}
                </h3>
                {rank === 1 && <span className="text-xs text-yellow-500 font-medium tracking-wider">LÍDER ACTUAL</span>}
            </div>

            <div className="text-right">
                <div className="text-2xl font-bold text-white tracking-tight">{player.displayPoints !== undefined ? player.displayPoints : player.points}</div>
                <div className="text-xs text-gray-500 font-medium">PUNTOS</div>
            </div>

            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 to-secondary/0 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"></div>
        </div>
    );
};

const AdminPanel = ({ players, processTournament, goBack, manualDelete, manualUpdatePoints, password, setPassword, description, setDescription }) => {
    const [tName, setTName] = useState('');
    const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

    const [tFirst, setTFirst] = useState('');
    const [tSecond, setTSecond] = useState('');
    const [tOthers, setTOthers] = useState('');

    const [showSettings, setShowSettings] = useState(false);
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [descInput, setDescInput] = useState(description);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!tName) return alert("Ponle nombre al torneo");
        processTournament(tName, tDate, tFirst, tSecond, tOthers);
        setTFirst(''); setTSecond(''); setTOthers(''); setTName('');
    };

    const handlePassChange = () => {
        if (oldPass !== password) {
            alert("La contraseña actual no es correcta.");
            return;
        }
        if (!newPass) {
            alert("Escribe una nueva contraseña");
            return;
        }
        setPassword(newPass);
        alert("Contraseña cambiada exitosamente");
        setNewPass('');
        setOldPass('');
    }

    return (
        <div className="min-h-screen p-4 md:p-8 pb-32 bg-liga">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-8">
                    <div className="flex gap-4">
                        <button onClick={() => setShowSettings(!showSettings)} className="flex-1 glass-panel p-4 rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-white/5 transition-colors text-gray-300">
                            <Shield className="w-5 h-5" /> {showSettings ? 'Volver a Torneos' : 'Configuración'}
                        </button>
                        <button onClick={goBack} className="glass-panel px-6 rounded-2xl text-red-400 hover:bg-white/5 transition-colors font-bold">
                            Salir
                        </button>
                    </div>

                    {showSettings ? (
                        <div className="glass-panel p-6 md:p-8 rounded-3xl h-fit space-y-8 animate-fade-in-up">
                            <h2 className="text-2xl font-bold text-white">Configuración</h2>
                            <div className="space-y-4">
                                <h3 className="text-gray-400 uppercase text-xs font-bold">Descripción de la Liga</h3>
                                <textarea className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary focus:outline-none"
                                    value={descInput} onChange={e => setDescInput(e.target.value)} />
                                <button onClick={() => { setDescription(descInput); alert("Descripción actualizada"); }} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Save className="w-4 h-4" /> Guardar Texto
                                </button>
                            </div>
                            <div className="space-y-4 border-t border-white/10 pt-4">
                                <h3 className="text-gray-400 uppercase text-xs font-bold">Seguridad</h3>
                                <input type="password" placeholder="Contraseña Actual" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-secondary focus:outline-none mb-2"
                                    value={oldPass} onChange={e => setOldPass(e.target.value)} />
                                <input type="password" placeholder="Nueva Contraseña" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-secondary focus:outline-none"
                                    value={newPass} onChange={e => setNewPass(e.target.value)} />
                                <button onClick={handlePassChange} className="px-4 py-2 bg-secondary/20 hover:bg-secondary/30 text-secondary rounded-lg text-sm font-bold">
                                    Actualizar Contraseña
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-6 md:p-8 rounded-3xl h-fit animate-fade-in-up">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <PlusCircle className="text-secondary w-6 h-6" /> Nuevo Torneo
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Nombre Torneo</label>
                                        <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:border-secondary focus:outline-none text-white" placeholder="Ej: Torneo FIFA" value={tName} onChange={e => setTName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-500 mb-2 block">Fecha</label>
                                        <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 focus:border-secondary focus:outline-none text-white" value={tDate} onChange={e => setTDate(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex justify-between text-xs uppercase font-bold text-yellow-500 mb-2">
                                            <span>🥇 1º Puesto (+5 pts)</span>
                                        </label>
                                        <textarea className="w-full h-24 bg-yellow-900/10 border border-yellow-500/20 rounded-xl p-3 text-sm text-white focus:border-yellow-500 focus:outline-none transition-colors" placeholder="Nombres..." value={tFirst} onChange={e => setTFirst(e.target.value)}></textarea>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-gray-300 mb-2 block">🥈 2º Puesto (+3 pts)</label>
                                        <textarea className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-gray-500 focus:outline-none" placeholder="Nombres..." value={tSecond} onChange={e => setTSecond(e.target.value)}></textarea>
                                    </div>
                                    <div>
                                        <label className="text-xs uppercase font-bold text-primary mb-2 block">Participantes (+1 pt)</label>
                                        <textarea className="w-full h-32 bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-white focus:border-primary focus:outline-none" placeholder="Lista de nombres..." value={tOthers} onChange={e => setTOthers(e.target.value)}></textarea>
                                        <p className="text-[10px] text-gray-500 mt-1">* El sistema evitará duplicar puntos si alguien ya está en 1º o 2º puesto.</p>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-primary to-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-primary/25 transition-all transform hover:scale-[1.02]">
                                    Guardar Resultados
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-3xl h-[800px] flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-6">Base de Datos ({players.length})</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {players.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                <span className="font-medium text-gray-300">{p.name}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-white">{p.points} pts</span>
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => manualUpdatePoints(p.id, 1)} className="text-green-400 hover:bg-green-500/20 p-2 rounded" title="+1">
                                            <PlusCircle className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => manualUpdatePoints(p.id, -1)} className="text-yellow-400 hover:bg-yellow-500/20 p-2 rounded" title="-1">
                                            <div className="w-4 h-4 flex items-center justify-center font-bold text-xs">-</div>
                                        </button>
                                        <button onClick={() => manualDelete(p.id)} className="text-red-500 hover:bg-red-500/20 p-2 rounded" title="Eliminar">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Liga = () => {
    const [view, setView] = useState('public');
    const [players, setPlayers] = useState([]);
    const [tournaments, setTournaments] = useState([]);
    const [description, setDescription] = useState(() => localStorage.getItem('liga_description') || INITIAL_DESCRIPTION);
    const [password, setPassword] = useState(() => localStorage.getItem('liga_password') || "4321");

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState('ALL');
    const [showInfo, setShowInfo] = useState(false);

    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassInput, setAdminPassInput] = useState('');

    useEffect(() => {
        const u1 = onSnapshot(query(collection(db, "players")), (snapshot) => {
            setPlayers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const u2 = onSnapshot(query(collection(db, "tournaments")), (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            loaded.sort((a, b) => new Date(b.date) - new Date(a.date));
            setTournaments(loaded);
        });
        return () => { u1(); u2(); };
    }, []);

    useEffect(() => { localStorage.setItem('liga_description', description); }, [description]);
    useEffect(() => { localStorage.setItem('liga_password', password); }, [password]);

    const processTournament = async (tName, tDate, rawFirst, rawSecond, rawParticipants) => {
        const parse = (txt) => txt.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const listFirst = parse(rawFirst);
        const listSecond = parse(rawSecond);
        const listOthers = parse(rawParticipants);

        const processedNames = new Set();
        const updateOperations = [];

        const queueUpdate = (name, points, type) => {
            const norm = normalizeName(name);
            if (processedNames.has(norm)) return;
            processedNames.add(norm);
            updateOperations.push({ name, points, type });
        };

        listFirst.forEach(n => queueUpdate(n, 5, '1º Puesto'));
        listSecond.forEach(n => queueUpdate(n, 3, '2º Puesto'));
        listOthers.forEach(n => queueUpdate(n, 1, 'Participación'));

        for (const op of updateOperations) {
            let existing = players.find(p => normalizeName(p.name) === normalizeName(op.name));
            if (existing) {
                const newHistory = [...(existing.history || []), { tournament: tName, points: op.points, date: tDate, type: op.type }];
                const newPoints = existing.points + op.points;
                const newWins = [...(existing.wins || [])];
                if (op.type === '1º Puesto') newWins.push(new Date(tDate).getTime());

                try {
                    await updateDoc(doc(db, "players", existing.id), {
                        history: newHistory,
                        points: newPoints,
                        wins: newWins
                    });
                } catch (e) {
                    console.error("Error updating player", op.name, e);
                }
            } else {
                const newPlayer = {
                    name: op.name,
                    points: op.points,
                    wins: op.type === '1º Puesto' ? [new Date(tDate).getTime()] : [],
                    history: [{ tournament: tName, points: op.points, date: tDate, type: op.type }]
                };
                try {
                    await addDoc(collection(db, "players"), newPlayer);
                } catch (e) {
                    console.error("Error creating player", op.name, e);
                }
            }
        }

        const newTourney = { name: tName, date: tDate, winners: listFirst };
        try {
            await addDoc(collection(db, "tournaments"), newTourney);
            alert("Torneo guardado y sincronizado.");
        } catch (e) {
            alert("Error guardando torneo: " + e.message);
        }
    };

    const manualDelete = async (id) => {
        if (confirm("¿Seguro que quieres borrar a este jugador?")) {
            try {
                await deleteDoc(doc(db, "players", id));
            } catch (e) {
                alert("Error eliminando: " + e.message);
            }
        }
    };

    const manualUpdatePoints = async (id, delta) => {
        const p = players.find(player => player.id === id);
        if (p) {
            try {
                await updateDoc(doc(db, "players", id), {
                    points: Math.max(0, p.points + delta)
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    const sortedPlayers = useMemo(() => {
        let list = [...players];
        if (selectedTournament !== 'ALL') {
            const tourneyObj = tournaments.find(t => t.id === selectedTournament);
            if (tourneyObj) {
                list = list.map(p => {
                    const tourneyPoints = p.history
                        ? p.history.filter(h => h.tournament === tourneyObj.name)
                            .reduce((sum, h) => sum + h.points, 0)
                        : 0;
                    return { ...p, displayPoints: tourneyPoints };
                }).filter(p => p.displayPoints > 0);
            }
        } else {
            list = list.map(p => ({ ...p, displayPoints: p.points }));
        }

        list.sort((a, b) => {
            const pointsA = a.displayPoints;
            const pointsB = b.displayPoints;
            if (pointsB !== pointsA) return pointsB - pointsA;
            const lastWinA = a.wins && a.wins.length > 0 ? Math.max(...a.wins) : 0;
            const lastWinB = b.wins && b.wins.length > 0 ? Math.max(...b.wins) : 0;
            return lastWinB - lastWinA;
        });

        for (let i = 0; i < list.length; i++) {
            if (i > 0) {
                if (list[i].displayPoints === list[i - 1].displayPoints) {
                    list[i].realRank = list[i - 1].realRank;
                } else {
                    list[i].realRank = i + 1;
                }
            } else {
                list[i].realRank = 1;
            }
        }

        if (searchTerm) {
            list = list.filter(p => normalizeName(p.name).includes(normalizeName(searchTerm)));
        }
        return list;
    }, [players, searchTerm, selectedTournament, tournaments]);

    const topPlayer = sortedPlayers.length > 0 ? sortedPlayers[0] : null;

    if (view === 'public') {
        return (
            <div className="min-h-screen bg-[#0a0a0f] text-white p-4 selection:bg-primary selection:text-white">
                <div className="relative py-12 px-4 overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute top-6 right-6 z-20 flex gap-2">
                        <button onClick={() => setShowInfo(true)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group">
                            <Info className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                    </div>

                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h1 className="text-4xl md:text-7xl font-black mb-2 tracking-tighter">
                            <span className="bg-gradient-to-r from-white via-blue-100 to-gray-400 bg-clip-text text-transparent">LIGA</span>
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-glow ml-2 md:ml-4 tracking-[0.05em] drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">MULTISPORT</span>
                        </h1>
                        <p className="text-blue-200/60 uppercase tracking-[0.3em] font-bold text-sm mb-12">Paso de Ecuador 25/26</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
                            <div className="glass p-4 rounded-2xl">
                                <div className="text-xs text-gray-500 uppercase font-bold text-center">{selectedTournament === 'ALL' ? 'Líder Actual' : 'Ganador Torneo'}</div>
                                <div className="text-xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-600 bg-clip-text text-transparent text-center truncate">
                                    {topPlayer ? topPlayer.name : '-'}
                                </div>
                            </div>
                            <div className="glass p-4 rounded-2xl">
                                <div className="text-xs text-gray-500 uppercase font-bold text-center">Jugadores</div>
                                <div className="text-2xl font-bold text-white text-center">{players.length}</div>
                            </div>
                            <div className="glass p-4 rounded-2xl hidden md:block">
                                <div className="text-xs text-gray-500 uppercase font-bold text-center">Torneos</div>
                                <div className="text-2xl font-bold text-white text-center">{tournaments.length}</div>
                            </div>
                        </div>

                        <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4 mb-8">
                            <div className="relative flex-1 group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                    <Search className="text-gray-500 w-5 h-5 group-focus-within:text-primary transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Buscar jugador..."
                                    className="w-full bg-[#13131f] border border-white/10 rounded-xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-xl"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="relative md:w-64">
                                <select
                                    className="w-full h-full bg-[#13131f] border border-white/10 rounded-xl py-4 pl-4 pr-10 text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                    value={selectedTournament}
                                    onChange={e => setSelectedTournament(e.target.value)}
                                >
                                    <option value="ALL">Clasificación Global</option>
                                    {tournaments.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                    <ChevronDown className="text-gray-500 w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 pb-20 space-y-3">
                    {sortedPlayers.map((player) => (
                        <PlayerCard
                            key={player.id}
                            player={player}
                            rank={player.realRank}
                            onClick={() => setSelectedPlayer(player)}
                        />
                    ))}
                    {sortedPlayers.length === 0 && (
                        <div className="text-center py-20 text-gray-600">
                            <Ghost className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No se encontraron jugadores</p>
                        </div>
                    )}
                </div>

                <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
                    <button
                        onClick={async () => {
                            const url = window.location.href;
                            const title = 'Liga Multisport - Clasificación';
                            if (navigator.share) {
                                try { await navigator.share({ title, text: '¡Mira la clasificación en directo!', url }); } catch (e) { }
                            } else {
                                navigator.clipboard.writeText(url);
                                alert('Enlace copiado al portapapeles');
                            }
                        }}
                        className="w-12 h-12 rounded-full bg-primary hover:bg-primary/80 text-white flex items-center justify-center transition-all shadow-lg shadow-primary/30 transform hover:scale-110"
                        title="Compartir Web"
                    >
                        <ShareIcon className="w-5 h-5" />
                    </button>

                    <button
                        onClick={() => setView('login')}
                        className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 border border-white/10 text-white flex items-center justify-center transition-all shadow-lg transform hover:scale-110"
                    >
                        <Shield className="w-5 h-5" />
                    </button>
                </div>

                {showInfo && (
                    <Modal isOpen={showInfo} onClose={() => setShowInfo(false)}>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                <Info className="w-6 h-6 text-primary" /> ¿Qué es Liga Multisport?
                            </h2>
                            <div className="prose prose-invert text-gray-300 whitespace-pre-line leading-relaxed">
                                {description}
                            </div>
                        </div>
                    </Modal>
                )}

                {selectedPlayer && (
                    <Modal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)}>
                        <div className="p-8 flex-1 overflow-auto custom-scrollbar">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                        {selectedPlayer.name}
                                        <button
                                            onClick={() => {
                                                const txt = `¡Voy #${selectedPlayer.realRank} en la Liga Multisport con ${selectedPlayer.points} puntos! ¿Me superas?`;
                                                if (navigator.share) navigator.share({ text: txt, url: window.location.href });
                                                else { navigator.clipboard.writeText(txt + ' ' + window.location.href); alert('Texto copiado'); }
                                            }}
                                            className="p-2 bg-primary/20 text-primary hover:text-white hover:bg-primary rounded-full transition-all"
                                            title="Compartir mi puesto"
                                        >
                                            <ShareIcon className="w-4 h-4" />
                                        </button>
                                    </h2>
                                    <p className="text-primary font-bold text-xl">{selectedPlayer.points} Puntos Totales</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs uppercase font-bold text-gray-500 tracking-wider">Historial de Torneos</h3>
                                {selectedPlayer.history && selectedPlayer.history.slice().reverse().map((entry, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                        <div>
                                            <div className="font-bold text-white">{entry.tournament || 'Torneo Desconocido'}</div>
                                            <div className="text-xs text-gray-500">{formatDate(entry.date)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${['1º Puesto', '2º Puesto'].includes(entry.type) ? 'text-yellow-500' : 'text-gray-300'}`}>
                                                {entry.type}
                                            </div>
                                            <div className="text-sm font-mono text-primary">+{entry.points} pts</div>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedPlayer.history || selectedPlayer.history.length === 0) && (
                                    <p className="text-gray-600 text-center py-8">Sin historial detallado</p>
                                )}
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    if (view === 'login') {
        return (
            <div className="min-h-screen transition-all duration-700 bg-liga">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-[#0a0a0f]"></div>
                <div className="glass-panel p-10 rounded-3xl w-full max-w-md relative z-10 text-center space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Acceso Administrador</h2>
                        <p className="text-gray-400 text-sm">Introduce la clave de seguridad</p>
                    </div>
                    <input
                        type="password"
                        autoFocus
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-center text-3xl tracking-[1em] text-white focus:outline-none focus:border-secondary transition-colors"
                        value={adminPassInput}
                        onChange={e => {
                            setAdminPassInput(e.target.value);
                            if (e.target.value === password) {
                                setView('admin');
                                setIsAdmin(true);
                            }
                        }}
                    />
                    <button onClick={() => { setView('public'); setAdminPassInput(''); }} className="text-gray-500 hover:text-white text-sm">Cancelar</button>
                </div>
            </div>
        );
    }

    return (
        <AdminPanel
            players={players}
            processTournament={processTournament}
            goBack={() => { setView('public'); setAdminPassInput(''); }}
            manualDelete={manualDelete}
            manualUpdatePoints={manualUpdatePoints}
            password={password}
            setPassword={setPassword}
            description={description}
            setDescription={setDescription}
        />
    );
};

export default Liga;
