import React, { useState, useEffect, useMemo } from 'react';
import {
    X,
    Search,
    Shield,
    Ghost,
    PlusCircle,
    Trash2 as Trash,
    Edit,
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

const AdminPanel = ({ players, tournaments, processTournament, mergePlayers, deleteTournament, goBack, manualDelete, manualUpdatePoints, password, setPassword, description, setDescription }) => {
    const [tName, setTName] = useState('');
    const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);

    const [tFirst, setTFirst] = useState('');
    const [tSecond, setTSecond] = useState('');
    const [tOthers, setTOthers] = useState('');

    const [activeTab, setActiveTab] = useState('new'); // 'new', 'manage', 'settings'
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [descInput, setDescInput] = useState(description);

    const [editingTournamentId, setEditingTournamentId] = useState(null);

    // Player Database State
    const [playerSortOrder, setPlayerSortOrder] = useState('points'); // 'name', 'points'
    const [playerSearch, setPlayerSearch] = useState('');
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [selectedTournamentForPlayer, setSelectedTournamentForPlayer] = useState('');
    const [playerRankInTournament, setPlayerRankInTournament] = useState('participation');
    const [repairing, setRepairing] = useState(false);
    const [auditLog, setAuditLog] = useState([]);

    const repairDatabase = async () => {
        if (!confirm("Esto recalculará TODOS los puntos de todos los jugadores basándose en los torneos guardados. Los puntos actuales se borrarán y se reconstruirán desde los registros de torneos. ¿Continuar?")) return;
        setRepairing(true);
        setAuditLog(["Iniciando reconstrucción total..."]);
        try {
            const playerMap = {};
            
            // 1. Initialize map with existing players
            players.forEach(p => {
                playerMap[normalizeName(p.name)] = { 
                    id: p.id, 
                    name: p.name, 
                    points: 0, 
                    history: [], 
                    wins: [], 
                    aliases: p.aliases || [] 
                };
            });

            const resolveFromMap = (name) => {
                const norm = normalizeName(name);
                for (const key in playerMap) {
                    if (key === norm || playerMap[key].aliases.some(a => normalizeName(a) === norm)) return key;
                }
                return null;
            };

            // 2. Process tournaments
            for (const t of tournaments) {
                // Heurística de campos (por si hay nombres antiguos en la BD)
                const first = t.winners || t.ganadores || t.top1 || [];
                const second = t.secondPlace || t.segundos || t.top2 || [];
                const others = t.participants || t.others || t.participantes || [];

                setAuditLog(prev => [...prev, `Procesando: ${t.name} (${first.length + second.length + others.length} personas)`]);

                const processList = (names, pts, type) => {
                    names.forEach(n => {
                        let principalKey = resolveFromMap(n);
                        if (!principalKey) {
                            principalKey = normalizeName(n);
                            playerMap[principalKey] = { name: n, points: 0, history: [], wins: [], aliases: [] };
                        }
                        const p = playerMap[principalKey];
                        p.points += pts;
                        p.history.push({ tournament: t.name, tournamentId: t.id, points: pts, date: t.date, type });
                        if (type === '1º Puesto') {
                            const winDate = new Date(t.date).getTime();
                            if (!p.wins.includes(winDate)) p.wins.push(winDate);
                        }
                    });
                };

                processList(first, 5, '1º Puesto');
                processList(second, 3, '2º Puesto');
                processList(others, 1, 'Participación');
            }

            // 3. Commit
            setAuditLog(prev => [...prev, `Actualizando ${Object.keys(playerMap).length} perfiles en Firebase...`]);
            for (const key in playerMap) {
                const p = playerMap[key];
                if (p.id) {
                    await updateDoc(doc(db, "players", p.id), {
                        points: p.points,
                        history: p.history,
                        wins: p.wins
                    });
                } else {
                    await addDoc(collection(db, "players"), {
                        name: p.name,
                        points: p.points,
                        history: p.history,
                        wins: p.wins,
                        aliases: p.aliases
                    });
                }
            }
            setAuditLog(prev => [...prev, "¡ÉXITO! Base de datos sincronizada."]);
            alert("Clasificación reconstruida correctamente.");
        } catch (e) {
            console.error(e);
            setAuditLog(prev => [...prev, `ERROR: ${e.message}`]);
            alert("Error: " + e.message);
        }
        setRepairing(false);
    };

    // Alias Management
    const [mergingPlayer, setMergingPlayer] = useState(null);
    const [selectedDuplicates, setSelectedDuplicates] = useState([]);
    const [aliasSearch, setAliasSearch] = useState('');

    const handleUpdateHistoryEntry = async (player, index, newType) => {
        const entry = player.history[index];
        const oldPoints = entry.points;
        const newPoints = newType === '1º Puesto' ? 5 : newType === '2º Puesto' ? 3 : 1;
        
        const newHistory = [...player.history];
        newHistory[index] = { ...entry, type: newType, points: newPoints };
        
        const pointsDelta = newPoints - oldPoints;
        
        let newWins = player.wins ? [...player.wins] : [];
        if (entry.type === '1º Puesto' && newType !== '1º Puesto') {
            const winDate = new Date(entry.date).getTime();
            const winIdx = newWins.indexOf(winDate);
            if (winIdx > -1) newWins.splice(winIdx, 1);
        } else if (entry.type !== '1º Puesto' && newType === '1º Puesto') {
            newWins.push(new Date(entry.date).getTime());
        }

        try {
            await updateDoc(doc(db, "players", player.id), {
                history: newHistory,
                points: Math.max(0, player.points + pointsDelta),
                wins: newWins
            });
            setEditingPlayer({ ...player, history: newHistory, points: player.points + pointsDelta, wins: newWins });
        } catch (e) { console.error(e); }
    };

    const handleDeleteHistoryEntry = async (player, index) => {
        if (!confirm("¿Seguro que quieres eliminar esta participación? Se restarán los puntos correspondientes.")) return;
        
        const entry = player.history[index];
        const newHistory = player.history.filter((_, i) => i !== index);
        const pointsToSubtract = entry.points;
        
        let newWins = player.wins ? [...player.wins] : [];
        if (entry.type === '1º Puesto') {
            const winDate = new Date(entry.date).getTime();
            const winIdx = newWins.indexOf(winDate);
            if (winIdx > -1) newWins.splice(winIdx, 1);
        }

        try {
            await updateDoc(doc(db, "players", player.id), {
                history: newHistory,
                points: Math.max(0, player.points - pointsToSubtract),
                wins: newWins
            });
            setEditingPlayer({ ...player, history: newHistory, points: Math.max(0, player.points - pointsToSubtract), wins: newWins });
        } catch (e) { console.error(e); }
    };

    const handleRemoveAlias = async (player, aliasToRemove) => {
        if (!confirm(`¿Desvincular "${aliasToRemove}"? El nombre dejará de ser detectado como un alias de este perfil.`)) return;
        const newAliases = (player.aliases || []).filter(a => a !== aliasToRemove);
        try {
            await updateDoc(doc(db, "players", player.id), {
                aliases: newAliases
            });
            setEditingPlayer({ ...player, aliases: newAliases });
        } catch (e) { console.error(e); }
    };

    const mergeablePlayers = useMemo(() => {
        let list = players.filter(p => p.id !== mergingPlayer?.id);
        if (aliasSearch) {
            const norm = normalizeName(aliasSearch);
            list = list.filter(p => normalizeName(p.name).includes(norm));
        }
        list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [players, mergingPlayer, aliasSearch]);

    const filteredAndSortedPlayers = useMemo(() => {
        let list = [...players];
        if (playerSearch) {
            const normSearch = normalizeName(playerSearch);
            list = list.filter(p =>
                normalizeName(p.name).includes(normSearch) ||
                (p.aliases && p.aliases.some(a => normalizeName(a).includes(normSearch)))
            );
        }
        list.sort((a, b) => {
            if (playerSortOrder === 'name') return a.name.localeCompare(b.name);
            return b.points - a.points;
        });
        return list;
    }, [players, playerSearch, playerSortOrder]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!tName) return alert("Ponle nombre al torneo");
        processTournament(tName, tDate, tFirst, tSecond, tOthers, editingTournamentId);
        setTFirst(''); setTSecond(''); setTOthers(''); setTName('');
        setEditingTournamentId(null);
        setActiveTab('manage');
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

    const handlePlayerToTournament = (player, tournamentId, rank) => {
        const t = tournaments.find(tour => tour.id === tournamentId);
        if (!t) return;

        // Check if player is already in this tournament to avoid duplicates
        const allNames = [...(t.winners || []), ...(t.secondPlace || []), ...(t.participants || [])];
        const normPlayer = normalizeName(player.name);
        const normAliases = (player.aliases || []).map(normalizeName);

        const isDuplicate = allNames.some(n => {
            const normN = normalizeName(n);
            return normN === normPlayer || normAliases.includes(normN);
        });

        if (isDuplicate) {
            if (!confirm(`${player.name} ya parece estar en este torneo. ¿Añadir de todos modos?`)) return;
        }

        const winners = [...(t.winners || [])];
        const second = [...(t.secondPlace || [])];
        const participants = [...(t.participants || [])];

        if (rank === '1º Puesto') winners.push(player.name);
        else if (rank === '2º Puesto') second.push(player.name);
        else participants.push(player.name);

        processTournament(t.name, t.date, winners.join('\n'), second.join('\n'), participants.join('\n'), t.id);
        setEditingPlayer(null);
        setSelectedTournamentForPlayer('');
        alert(`¡Participación de ${player.name} registrada en "${t.name}"!`);
    };

    return (
        <div className="min-h-screen p-4 md:p-8 pb-32 bg-liga">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8">
                <div className="flex flex-col gap-8">
                    <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5">
                        <button onClick={() => setActiveTab('new')} className={`flex-1 p-3 rounded-xl font-bold transition-all ${activeTab === 'new' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}>
                            Nuevo
                        </button>
                        <button onClick={() => setActiveTab('manage')} className={`flex-1 p-3 rounded-xl font-bold transition-all ${activeTab === 'manage' ? 'bg-secondary text-white' : 'text-gray-400 hover:text-white'}`}>
                            Torneos
                        </button>
                        <button onClick={() => setActiveTab('settings')} className={`flex-1 p-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
                            Ajustes
                        </button>
                    </div>
                    <button onClick={goBack} className="glass-panel px-6 py-4 rounded-2xl text-red-400 hover:bg-white/5 transition-colors font-bold w-full">
                        Salir del Panel
                    </button>

                    {activeTab === 'settings' ? (
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
                            
                            <div className="space-y-4 border-t border-white/10 pt-4">
                                <h3 className="text-red-500 uppercase text-xs font-bold">Zona de Recuperación</h3>
                                <p className="text-[10px] text-gray-500 italic">Si notas que faltan puntos o hay errores tras una edición, este botón reconstruye la clasificación analizando todos los torneos.</p>
                                <button 
                                    onClick={repairDatabase} 
                                    disabled={repairing}
                                    className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {repairing ? 'Reparando...' : '🔥 RECONSTRUIR PUNTOS Y CLASIFICACIÓN'}
                                </button>
                                
                                {tournaments.length > 0 && (
                                    <div className="bg-white/5 p-3 rounded-lg text-[9px] font-mono text-gray-500 overflow-hidden">
                                        Campos detectados en DB: {Object.keys(tournaments[0]).filter(k => !['id','name','date'].includes(k)).join(', ')}
                                    </div>
                                )}
                                
                                {auditLog.length > 0 && (
                                    <div className="bg-black/60 p-4 rounded-xl border border-white/5 max-h-40 overflow-y-auto custom-scrollbar text-[10px] font-mono space-y-1">
                                        {auditLog.map((log, i) => (
                                            <div key={i} className={log.startsWith('ERROR') ? 'text-red-400' : log.startsWith('PROCESANDO') ? 'text-blue-300' : 'text-gray-400'}>
                                                {log}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'manage' ? (
                        <div className="glass-panel p-6 md:p-8 rounded-3xl h-fit max-h-[700px] overflow-hidden flex flex-col animate-fade-in-up">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Modificar Torneos</h2>
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                                Total: {tournaments.length}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                            {tournaments.map(t => (
                                <div key={t.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-primary/30 transition-all">
                                    <div className="space-y-1">
                                        <div className="font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                            {t.name}
                                            <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-gray-500 font-normal">
                                                {(t.winners?.length || 0) + (t.secondPlace?.length || 0) + (t.participants?.length || 0)} pers.
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                            <Info className="w-3 h-3" /> {new Date(t.date).toLocaleDateString('es-ES')}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingTournamentId(t.id);
                                                setTName(t.name);
                                                setTDate(t.date);
                                                setTFirst(t.winners ? t.winners.join('\n') : '');
                                                setTSecond(t.secondPlace ? t.secondPlace.join('\n') : '');
                                                setTOthers(t.participants ? t.participants.join('\n') : '');
                                                setActiveTab('new');
                                            }}
                                            className="p-3 bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-black transition-all flex items-center gap-2 font-bold text-xs"
                                            title="Modificar Torneo"
                                        >
                                            <Edit className="w-4 h-4" /> MODIFICAR
                                        </button>
                                        <button
                                            onClick={() => { if(confirm(`¿Eliminar "${t.name}"? Los puntos de los jugadores NO se restarán automáticamente si lo borras directamente aquí. Es mejor modificarlo y quitar a los participantes.`)) deleteTournament(t.id); }}
                                            className="p-3 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/0 hover:shadow-red-500/20"
                                            title="Eliminar"
                                        >
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                                {tournaments.length === 0 && <p className="text-center py-8 text-gray-500 italic">No hay torneos registrados.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-6 md:p-8 rounded-3xl h-fit animate-fade-in-up">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    {editingTournamentId ? <Edit className="text-secondary w-6 h-6" /> : <PlusCircle className="text-secondary w-6 h-6" />}
                                    {editingTournamentId ? `Editando: ${tName}` : 'Nuevo Torneo'}
                                </h2>
                                {editingTournamentId && (
                                    <button type="button" onClick={() => { setEditingTournamentId(null); setTFirst(''); setTSecond(''); setTOthers(''); setTName(''); setActiveTab('manage'); }} className="text-xs text-red-400 hover:text-red-300 font-bold">Cancelar Edición</button>
                                )}
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
                                    {editingTournamentId ? 'Confirmar Cambios y Recalcular Puntos' : 'Guardar Resultados'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="glass-panel p-6 rounded-3xl h-[800px] flex flex-col relative overflow-hidden">
                    <div className="mb-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Base de Datos ({players.length})</h3>
                            <div className="flex bg-white/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setPlayerSortOrder('points')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded ${playerSortOrder === 'points' ? 'bg-primary text-black' : 'text-gray-400'}`}
                                >PUNTOS</button>
                                <button
                                    onClick={() => setPlayerSortOrder('name')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded ${playerSortOrder === 'name' ? 'bg-primary text-black' : 'text-gray-400'}`}
                                >NOMBRE</button>
                            </div>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar participante..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary transition-all"
                                value={playerSearch}
                                onChange={e => setPlayerSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {filteredAndSortedPlayers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-300">{p.name}</span>
                                    {p.aliases && p.aliases.length > 0 && (
                                        <span className="text-[9px] text-gray-500 italic truncate max-w-[140px]">Alias: {p.aliases.join(', ')}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{p.points} pts</span>
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingPlayer(p)}
                                            className="text-primary hover:bg-primary/20 p-2 rounded"
                                            title="Editar Participante"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => manualUpdatePoints(p.id, 1)} className="text-green-400 hover:bg-green-500/20 p-2 rounded" title="+1">
                                            <PlusCircle className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => manualDelete(p.id)} className="text-red-500 hover:bg-red-500/20 p-2 rounded" title="Eliminar">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Advanced Player Editor Modal */}
                    {editingPlayer && (
                        <div className="absolute inset-0 bg-black/95 z-20 p-6 flex flex-col animate-fade-in-up border border-primary/20 rounded-3xl">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-white">{editingPlayer.name}</h3>
                                    <p className="text-primary font-bold">{editingPlayer.points} puntos actuales</p>
                                </div>
                                <button onClick={() => setEditingPlayer(null)} className="p-2 text-gray-500 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
                                {/* Section: Manual Points Adjustment */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Ajuste Rápido de Puntos</h4>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => manualUpdatePoints(editingPlayer.id, -1)}
                                            className="flex-1 py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-bold hover:bg-red-500/20 transition-all"
                                        >-1 Pto</button>
                                        <button 
                                            onClick={() => manualUpdatePoints(editingPlayer.id, 1)}
                                            className="flex-1 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl font-bold hover:bg-green-500/20 transition-all"
                                        >+1 Pto</button>
                                    </div>
                                </div>

                                {/* Section: Participation History Management */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Historial y Participaciones</h4>
                                    <div className="space-y-3">
                                        {editingPlayer.history && editingPlayer.history.slice().reverse().map((entry, revIdx) => {
                                            const realIdx = editingPlayer.history.length - 1 - revIdx;
                                            return (
                                                <div key={realIdx} className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="font-bold text-white text-sm">{entry.tournament}</div>
                                                            <div className="text-[10px] text-gray-500">{new Date(entry.date).toLocaleDateString()}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleDeleteHistoryEntry(editingPlayer, realIdx)}
                                                            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                                            title="Eliminar Participación"
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        {[
                                                            { label: '🥇 1º', type: '1º Puesto' },
                                                            { label: '🥈 2º', type: '2º Puesto' },
                                                            { label: '🥉 Part.', type: 'Participación' }
                                                        ].map(rank => (
                                                            <button 
                                                                key={rank.type}
                                                                onClick={() => handleUpdateHistoryEntry(editingPlayer, realIdx, rank.type)}
                                                                className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all ${entry.type === rank.type ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:border-white/30'}`}
                                                            >
                                                                {rank.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!editingPlayer.history || editingPlayer.history.length === 0) && (
                                            <p className="text-[10px] text-gray-600 italic text-center py-4">Sin participaciones registradas.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Section: Current Aliases Management */}
                                {editingPlayer.aliases && editingPlayer.aliases.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Nombres Unificados actualmente</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {editingPlayer.aliases.map(alias => (
                                                <div key={alias} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
                                                    <span className="text-xs text-blue-400 font-medium">{alias}</span>
                                                    <button 
                                                        onClick={() => handleRemoveAlias(editingPlayer, alias)}
                                                        className="hover:text-red-500 text-blue-400 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Section: Add new Unification */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Unificar Nombres (Duplicados)</h4>
                                    <p className="text-[10px] text-gray-500 leading-relaxed italic">
                                        Usa esta opción si esta persona aparece en la base de datos con otros nombres (ej: "Miguel" y "Miguel López").
                                    </p>
                                    <button
                                        onClick={() => {
                                            setMergingPlayer(editingPlayer);
                                            setEditingPlayer(null);
                                        }}
                                        className="w-full py-3 bg-secondary/10 border border-secondary/20 text-secondary font-bold rounded-xl text-sm hover:bg-secondary/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Shield className="w-4 h-4" /> Buscar Duplicados para Unificar
                                    </button>
                                </div>

                                {/* Section: Add to Tournament (Manual) */}
                                <div className="space-y-4 opacity-70">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/5 pb-2">Registrar en Torneo Manualmente</h4>
                                    <div className="space-y-3">
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
                                            value={selectedTournamentForPlayer}
                                            onChange={e => setSelectedTournamentForPlayer(e.target.value)}
                                        >
                                            <option value="">Seleccionar Torneo...</option>
                                            {tournaments.map(t => (
                                                <option key={t.id} value={t.id}>{t.name} ({new Date(t.date).toLocaleDateString()})</option>
                                            ))}
                                        </select>

                                        {selectedTournamentForPlayer && (
                                            <>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => setPlayerRankInTournament('1º Puesto')}
                                                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${playerRankInTournament === '1º Puesto' ? 'bg-yellow-500 border-yellow-500 text-black' : 'border-white/10 text-gray-400'}`}
                                                    >🥇 1º (+5)</button>
                                                    <button
                                                        onClick={() => setPlayerRankInTournament('2º Puesto')}
                                                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${playerRankInTournament === '2º Puesto' ? 'bg-gray-300 border-gray-300 text-black' : 'border-white/10 text-gray-400'}`}
                                                    >🥈 2º (+3)</button>
                                                    <button
                                                        onClick={() => setPlayerRankInTournament('participation')}
                                                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${playerRankInTournament === 'participation' ? 'bg-primary border-primary text-black' : 'border-white/10 text-gray-400'}`}
                                                    >🥉 Par. (+1)</button>
                                                </div>
                                                <button
                                                    onClick={() => handlePlayerToTournament(editingPlayer, selectedTournamentForPlayer, playerRankInTournament)}
                                                    className="w-full py-3 bg-white text-black font-bold rounded-xl text-sm hover:bg-primary transition-colors"
                                                >
                                                    Registrar Nueva Participación
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alias Merge Modal */}
                    {mergingPlayer && (
                        <div className="absolute inset-0 bg-black/90 rounded-3xl p-6 flex flex-col z-10 animate-fade-in-up border border-blue-500/30 shadow-2xl shadow-blue-500/20">
                            <h3 className="text-xl font-bold text-white mb-2">Unificar Jugador</h3>
                            <p className="text-sm text-gray-400 mb-4">Selecciona los perfiles duplicados a fusionar dentro de <strong className="text-primary">{mergingPlayer.name}</strong>.</p>

                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    placeholder="Buscar por nombre..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary"
                                    value={aliasSearch}
                                    onChange={e => setAliasSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto mb-4 border border-white/5 rounded-xl p-2 bg-white/5 custom-scrollbar">
                                {mergeablePlayers.map(p => (
                                    <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer transition-colors border-b border-white/5 last:border-0">
                                        <input
                                            type="checkbox"
                                            checked={selectedDuplicates.includes(p.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedDuplicates(prev => [...prev, p.id]);
                                                else setSelectedDuplicates(prev => prev.filter(id => id !== p.id));
                                            }}
                                            className="w-4 h-4 accent-primary"
                                        />
                                        <div className="flex-1">
                                            <div className="text-white font-medium">{p.name}</div>
                                            <div className="text-[10px] text-primary">{p.points} pts</div>
                                        </div>
                                    </label>
                                ))}
                                {mergeablePlayers.length === 0 && (
                                    <div className="text-center py-8 text-gray-600 italic text-sm">No se encontraron jugadores.</div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => { setMergingPlayer(null); setSelectedDuplicates([]); }} className="flex-1 py-3 glass-panel rounded-xl text-gray-400 font-bold hover:text-white transition-colors">Cancelar</button>
                                <button
                                    onClick={() => {
                                        if (selectedDuplicates.length > 0) {
                                            mergePlayers(mergingPlayer, selectedDuplicates);
                                            setMergingPlayer(null);
                                            setSelectedDuplicates([]);
                                        }
                                    }}
                                    disabled={selectedDuplicates.length === 0}
                                    className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold transition-colors"
                                >
                                    Fusión (+{selectedDuplicates.length})
                                </button>
                            </div>
                        </div>
                    )}
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
    const [password, setPassword] = useState(() => {
        const saved = localStorage.getItem('liga_password');
        return (saved && saved !== "4321") ? saved : "PasoWeb2526";
    });
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTournament, setSelectedTournament] = useState('ALL');
    const [showInfo, setShowInfo] = useState(false);

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

    const processTournament = async (tName, tDate, rawFirst, rawSecond, rawParticipants, editId = null) => {
        const parse = (txt) => txt.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
        const listFirst = parse(rawFirst);
        const listSecond = parse(rawSecond);
        const listOthers = parse(rawParticipants);

        const resolvePlayer = (name) => {
            const norm = normalizeName(name);
            const existing = players.find(p =>
                normalizeName(p.name) === norm ||
                (p.aliases && p.aliases.some(a => normalizeName(a) === norm))
            );
            return existing ? existing.name : name;
        };

        // Create a local map of all players to safely modify their state without race conditions
        const localPlayers = {};
        players.forEach(p => {
            localPlayers[normalizeName(p.name)] = {
                id: p.id,
                name: p.name,
                points: p.points,
                history: p.history ? [...p.history] : [],
                wins: p.wins ? [...p.wins] : [],
                aliases: p.aliases || [],
                isModified: false,
                isNew: false
            };
        });

        const getLocalPlayer = (name) => {
             const norm = normalizeName(name);
             const existingKey = Object.keys(localPlayers).find(k => 
                k === norm || localPlayers[k].aliases.some(a => normalizeName(a) === norm)
             );
             if (existingKey) return localPlayers[existingKey];

             const newPlayer = { name: name, points: 0, history: [], wins: [], aliases: [], isModified: false, isNew: true };
             localPlayers[norm] = newPlayer;
             return newPlayer;
        };

        // 1. "Deshacer" (Undo) old tournament points locally
        if (editId) {
            const oldTourney = tournaments.find(t => t.id === editId);
            if (oldTourney) {
                Object.values(localPlayers).forEach(p => {
                    const oldEntries = p.history.filter(h => h.tournamentId === editId || (h.tournament === oldTourney.name && !h.tournamentId));
                    if (oldEntries.length > 0) {
                        let pointsToDeduct = oldEntries.reduce((acc, curr) => acc + curr.points, 0);
                        p.history = p.history.filter(h => h.tournamentId !== editId && (h.tournament !== oldTourney.name || h.tournamentId));
                        p.points = Math.max(0, p.points - pointsToDeduct);
                        
                        oldEntries.forEach(oe => {
                            if (oe.type === '1º Puesto') {
                                const winDate = new Date(oe.date).getTime();
                                const index = p.wins.indexOf(winDate);
                                if (index > -1) p.wins.splice(index, 1);
                            }
                        });
                        p.isModified = true;
                    }
                });
            }
        } // Fin de Deshacer

        // 2. Apply new tournament results
        const processedNames = new Set();
        
        const queueUpdate = (rawName, points, type) => {
            const resolvedName = resolvePlayer(rawName);
            const p = getLocalPlayer(resolvedName);
            const normKey = normalizeName(p.name);
            
            // Best Result Policy: si ya ha puntuado en este torneo por encima, no se le suman más puntos
            if (processedNames.has(normKey)) return; 
            processedNames.add(normKey);
            
            p.points += points;
            p.history.push({ 
                tournament: tName, 
                tournamentId: editId || 'pending', // Temporal ID si es nuevo
                points: points, 
                date: tDate, 
                type: type 
            });
            if (type === '1º Puesto') {
                const winDate = new Date(tDate).getTime();
                if (!p.wins.includes(winDate)) p.wins.push(winDate);
            }
            p.isModified = true;
        };

        listFirst.forEach(n => queueUpdate(n, 5, '1º Puesto'));
        listSecond.forEach(n => queueUpdate(n, 3, '2º Puesto'));
        listOthers.forEach(n => queueUpdate(n, 1, 'Participación'));

        // 3. Save Tournament to DB
        let finalTournamentId = editId;
        const newTourneyData = { name: tName, date: tDate, winners: listFirst, secondPlace: listSecond, participants: listOthers };
        try {
            if (editId) {
                await updateDoc(doc(db, "tournaments", editId), newTourneyData);
            } else {
                const newTourneyRef = await addDoc(collection(db, "tournaments"), newTourneyData);
                finalTournamentId = newTourneyRef.id;
            }
        } catch (e) {
            alert("Error guardando torneo: " + e.message);
            return;
        }

        // 4. Update modified players
        for (const p of Object.values(localPlayers)) {
            if (p.isModified) {
                p.history.forEach(h => {
                     if (h.tournament === tName && h.date === tDate && h.tournamentId === 'pending') {
                         h.tournamentId = finalTournamentId;
                     }
                });

                try {
                    if (p.isNew) {
                         await addDoc(collection(db, "players"), {
                             name: p.name,
                             points: p.points,
                             history: p.history,
                             wins: p.wins,
                             aliases: p.aliases
                         });
                    } else {
                         await updateDoc(doc(db, "players", p.id), {
                             points: p.points,
                             history: p.history,
                             wins: p.wins
                         });
                    }
                } catch (e) {
                     console.error("Error updating player", p.name, e);
                }
            }
        }
        
        alert(`Torneo ${editId ? 'actualizado' : 'guardado'} y puntos recalculados.`);
    };

    const deleteTournament = async (id) => {
        if (confirm("¿Seguro que quieres eliminar este registro de torneo? Nota: Los puntos ya asignados a los jugadores no se verán afectados.")) {
            try {
                await deleteDoc(doc(db, "tournaments", id));
            } catch (e) {
                alert("Error eliminando torneo: " + e.message);
            }
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

    const mergePlayers = async (mainPlayer, duplicateIds) => {
        if (!confirm(`¿Seguro que quieres fusionar a ${duplicateIds.length} perfil(es) dentro de ${mainPlayer.name}? Ellos desaparecerán como perfiles separados y se sumarán sus puntos/historial sin duplicados.`)) return;

        try {
            let totalPoints = mainPlayer.points;
            let mergedHistory = mainPlayer.history ? [...mainPlayer.history] : [];
            let mergedWins = mainPlayer.wins ? [...mainPlayer.wins] : [];
            let newAliases = mainPlayer.aliases ? [...mainPlayer.aliases] : [];

            // Helper para comprobar historiales
            const historyContainsTournament = (historyArr, tourneyName) => {
                return historyArr.some(h => String(h.tournament).toLowerCase() === String(tourneyName).toLowerCase());
            };

            for (const dupId of duplicateIds) {
                const dupPlayer = players.find(p => p.id === dupId);
                if (!dupPlayer) continue;

                newAliases.push(dupPlayer.name);
                if (dupPlayer.aliases) {
                    newAliases.push(...dupPlayer.aliases);
                }

                if (dupPlayer.history) {
                    dupPlayer.history.forEach(h => {
                        // Evitar sumar puntos si "Miguel" y "Miguel A" ya puntuaron en el MISMO torneo individualmente por error
                        if (!historyContainsTournament(mergedHistory, h.tournament)) {
                            mergedHistory.push(h);
                            totalPoints += h.points;
                            if (h.type === '1º Puesto') {
                                mergedWins.push(new Date(h.date).getTime());
                            }
                        }
                    });
                }

                // Borrar perfil duplicado
                await deleteDoc(doc(db, "players", dupId));
            }

            // Actualizar jugador principal
            await updateDoc(doc(db, "players", mainPlayer.id), {
                points: totalPoints,
                history: mergedHistory,
                wins: mergedWins,
                aliases: [...new Set(newAliases)] // Deduplicate aliases
            });

            alert(`Fusión completada. El jugador ahora tiene ${totalPoints} puntos.`);
        } catch (error) {
            alert("Error general durante la fusión: " + error.message);
        }
    };

    const sortedPlayers = useMemo(() => {
        let list = [...players];
        if (selectedTournament !== 'ALL') {
            list = list.map(p => {
                const tourneyPoints = p.history
                    ? p.history.filter(h => h.tournament === selectedTournament)
                        .reduce((sum, h) => sum + h.points, 0)
                    : 0;
                return { ...p, displayPoints: tourneyPoints };
            }).filter(p => p.displayPoints > 0);
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

        let currentRank = 1;
        for (let i = 0; i < list.length; i++) {
            if (i > 0 && list[i].displayPoints < list[i - 1].displayPoints) {
                currentRank++;
            }
            list[i].realRank = currentRank;
        }

        if (searchTerm) {
            list = list.filter(p => normalizeName(p.name).includes(normalizeName(searchTerm)));
        }
        return list;
    }, [players, searchTerm, selectedTournament]);

    const topPlayer = sortedPlayers.length > 0 ? sortedPlayers[0] : null;

    if (view === 'public') {
        return (
            <div className="min-h-screen bg-liga text-white p-4 selection:bg-primary selection:text-white">
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
                                    {[...new Set(tournaments.map(t => t.name))].map(name => (
                                        <option key={name} value={name}>{name}</option>
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
                                try { await navigator.share({ title, text: '¡Mira la clasificación en directo!', url }); } catch { /* user cancelled share */ }
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
                        onClick={() => isLoggedIn ? setView('admin') : setView('login')}
                        className={`w-12 h-12 rounded-full border border-white/10 text-white flex items-center justify-center transition-all shadow-lg transform hover:scale-110 ${isLoggedIn ? 'bg-primary' : 'bg-gray-800 hover:bg-gray-700'}`}
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
            <div className="min-h-screen transition-all duration-700 bg-liga flex items-center justify-center px-4 relative">
                <div className="absolute inset-0 bg-primary/5"></div>
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
                                setIsLoggedIn(true);
                                setView('admin');
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
            tournaments={tournaments}
            processTournament={processTournament}
            deleteTournament={deleteTournament}
            mergePlayers={mergePlayers}
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
