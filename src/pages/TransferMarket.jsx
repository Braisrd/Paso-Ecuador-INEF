import React, { useState } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/TransferMarket/PlayerCard';
import Modal from '../components/UI/Modal';
import Toast from '../components/UI/Toast';
import { optimizeImage } from '../utils/imageOptimizer';

import { db, storage, collection, addDoc, onSnapshot, query, orderBy, ref, uploadBytes, getDownloadURL } from '../services/firebase';

const TransferMarket = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showPubModal, setShowPubModal] = useState(false);
    const [pubStep, setPubStep] = useState('choice'); // 'choice' or 'form'
    const [pubType, setPubType] = useState(null); // 'player' or 'team'
    const [teamName, setTeamName] = useState('');
    const [members, setMembers] = useState([{ id: 'init-1', name: '', level: 'Amateur', photo: null }]);



    const [contactInfo, setContactInfo] = useState('');

    // Real-time listener for Free Agents
    React.useEffect(() => {
        console.log("Initializing TransferMarket listener...");
        let unsubscribe = () => { };

        try {
            const q = query(collection(db, "free_agents"), orderBy("createdAt", "desc"));
            unsubscribe = onSnapshot(q, (snapshot) => {
                console.log("Snapshot received! Docs count:", snapshot.docs.length);
                const agentsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setPlayers(agentsData);
                setLoading(false);
            }, (error) => {
                console.error("Critical Firestore Error in listener:", error);
                setLoading(false);
                setToast({ message: 'Error de Firebase: ' + error.message, type: 'error' });
            });
        } catch (err) {
            console.error("Sync error setting up onSnapshot:", err);
            setLoading(false);
        }

        return () => {
            console.log("Unsubscribing from listener");
            unsubscribe();
        };
    }, []);

    // Timeout safety for initial load
    React.useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                if (loading) {
                    console.warn("Loading timeout reached. Stopping spinner.");
                    setLoading(false);
                    setToast({ message: 'La conexión está tardando mucho. Revisa tu conexión o bloqueadores.', type: 'info' });
                }
            }, 8000); // 8 seconds timeout
            return () => clearTimeout(timer);
        }
    }, [loading]);



    const addMember = () => {
        setMembers([...members, { id: Date.now(), name: '', level: 'Amateur', photoFile: null, photoPreview: null }]);
    };

    const updateMember = (id, field, value) => {
        setMembers(members.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const handleMemberPhoto = async (id, file) => {
        if (file) {
            try {
                setToast({ message: 'Optimizando imagen...', type: 'loading' });
                const optimizedFile = await optimizeImage(file);

                const reader = new FileReader();
                reader.onloadend = () => {
                    setMembers(members.map(m => m.id === id ? { ...m, photoFile: optimizedFile, photoPreview: reader.result } : m));
                    setToast({ message: '¡Imagen lista!', type: 'success' });
                };
                reader.readAsDataURL(optimizedFile);
            } catch (error) {
                console.error("Error optimizing image:", error);
                setToast({ message: 'Error al procesar imagen', type: 'error' });
            }
        }
    };

    const removeMember = (id) => {
        if (members.length > 1) {
            setMembers(members.filter(m => m.id !== id));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        console.log("Starting save process...");
        setSubmitting(true);

        try {
            setToast({ message: 'Subiendo imágenes y perfil...', type: 'loading' });

            // Upload photos and get URLs
            console.log("Processing members images...");
            const processedMembers = await Promise.all(members.map(async (member, idx) => {
                let photoUrl = null;
                if (member.photoFile) {
                    try {
                        console.log(`Uploading photo for member ${idx}...`);
                        const storageRef = ref(storage, `fichajes-photos/${Date.now()}_${member.photoFile.name}`);
                        const uploadResult = await uploadBytes(storageRef, member.photoFile);
                        console.log(`Upload successful for member ${idx}`, uploadResult);
                        photoUrl = await getDownloadURL(storageRef);
                    } catch (err) {
                        console.error(`Error uploading photo ${idx}:`, err);
                        setToast({ message: `Aviso: No se pudo subir la foto ${idx + 1}`, type: 'error' });
                        // We continue without photo if it fails
                    }
                }
                return {
                    name: member.name,
                    level: member.level,
                    image: photoUrl
                };
            }));

            console.log("Preparing Firestore document...");
            setToast({ message: 'Guardando en base de datos...', type: 'loading' });

            // Prepare main document data
            const mainData = {
                type: pubType,
                contact: contactInfo,
                createdAt: new Date(),
                name: pubType === 'team' ? teamName : (processedMembers[0]?.name || 'Sin nombre'),
                level: pubType === 'team' ? 'Varios' : (processedMembers[0]?.level || 'Amateur'),
                image: processedMembers[0]?.image || null,
                isGroup: pubType === 'team',
                course: 'N/A',
                members: processedMembers
            };

            const docRef = await addDoc(collection(db, "free_agents"), mainData);
            console.log("Document saved successfully with ID:", docRef.id);

            setToast({ message: '¡Fichaje publicado con éxito!', type: 'success' });
            setShowPubModal(false);

            // Reset form
            setMembers([{ id: 'init-1', name: '', level: 'Amateur', photoFile: null, photoPreview: null }]);
            setTeamName('');
            setContactInfo('');
        } catch (error) {
            console.error("CRITICAL ERROR in handleSave:", error);
            setToast({ message: 'Error crítico: ' + error.message, type: 'error' });
        } finally {
            console.log("Finishing save process (submitting = false)");
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-x-hidden font-sans">
            {/* Original Landing Effect */}
            <div className="absolute inset-0 bg-sky-400/5 blur-[120px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 p-6 flex items-center justify-between">
                <Link to="/" className="bg-white/5 text-white p-3 rounded-full shadow-lg border border-white/10 hover:bg-white/10 transition-all">
                    <ChevronLeft size={24} />
                </Link>
                <div className="bg-primary px-6 py-2 transform rotate-1 shadow-[4px_4px_0px_black] border-2 border-black">
                    <h1 className="text-3xl font-black uppercase text-black">Mercado de Fichajes</h1>
                </div>
                <button
                    onClick={() => { setShowPubModal(true); setPubStep('choice'); setMembers([{ id: 'init-1', name: '', level: 'Amateur', photoFile: null, photoPreview: null }]); setTeamName(''); setContactInfo(''); }}
                    className="bg-sky-400 text-black p-3 rounded-full shadow-lg transform hover:rotate-6 transition-all border-2 border-black"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Central Corkboard Container */}
            <div className="relative z-10 max-w-6xl mx-auto my-12 p-2 md:p-12 rounded-[2.5rem] border-[12px] border-[#5d4037]/60 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden bg-[#d8b08c]">
                {/* Corkboard Interior Texture */}
                <div className="absolute inset-0 opacity-100 pointer-events-none"
                    style={{
                        backgroundImage: `url("https://www.transparenttextures.com/patterns/cork-board.png")`,
                    }}>
                </div>

                <div className="relative z-20 pt-8 pb-16">
                    {/* Note pinned */}
                    <div className="max-w-md mx-auto mb-16 bg-yellow-100 p-6 shadow-xl transform -rotate-2 border border-yellow-200/50 relative font-['Patrick_Hand'] text-black">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-lg z-20 border border-red-800"></div>
                        <h2 className="text-2xl font-bold text-center mb-2">¡Busca tu equipo ideal!</h2>
                        <p className="text-center text-lg leading-tight uppercase opacity-90">
                            Aquí encontrarás jugadores buscando equipo y equipos buscando jugadores. ¡Contacta y completa tu team!
                        </p>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 px-4">
                        {loading ? (
                            <div className="col-span-full text-center py-20">
                                <p className="text-xl font-['Patrick_Hand'] animate-pulse text-black">Cargando fichajes...</p>
                            </div>
                        ) : players.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 opacity-90 text-black">
                                <div className="text-7xl mb-6 animate-bounce">👻</div>
                                <h3 className="text-3xl font-black uppercase mb-2 text-center transform -rotate-2">¡El mercado está vacío!</h3>
                                <p className="text-xl font-['Patrick_Hand'] text-center max-w-md leading-relaxed mb-8">
                                    No hay nadie por aquí...
                                    <br />
                                    <span className="font-bold text-red-700 bg-yellow-200 px-2 transform rotate-1 inline-block">¡Sé el primer fichaje disponible!</span>
                                </p>
                                <div className="text-5xl animate-pulse">☝️</div>
                            </div>
                        ) : (
                            players.map(player => (
                                <div key={player.id} className="flex justify-center">
                                    <PlayerCard player={player} onClick={() => setSelectedPlayer(player)} />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            <Modal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)}>
                {selectedPlayer && (
                    <div className="text-center p-8 text-black font-sans">
                        <h2 className="text-4xl font-black mb-4 uppercase italic transform -skew-x-6 leading-none">{selectedPlayer.name}</h2>
                        <p className="text-xl mb-8">¿Quieres contactar con {selectedPlayer.isGroup ? 'este equipo' : 'este jugador'}?</p>
                        <p className="text-xl mb-8">¿Quieres contactar con {selectedPlayer.isGroup ? 'este equipo' : 'este jugador'}?</p>
                        <a
                            href={`mailto:braisrd11@gmail.com?subject=Interés en Fichaje: ${selectedPlayer.name} (ID: ${selectedPlayer.id})&body=Hola, estoy interesado en contactar con ${selectedPlayer.name}. Mi contacto es...`}
                            className="bg-green-500 text-black font-black text-2xl py-4 px-8 rounded-xl shadow-[4px_4px_0px_black] border-2 border-black hover:translate-y-1 hover:shadow-[2px_2px_0px_black] transition-all inline-block"
                        >
                            💬 CONTACTAR (vía Admin)
                        </a>
                    </div>
                )}
            </Modal>

            {/* Publication Modal (+) */}
            <Modal isOpen={showPubModal} onClose={() => setShowPubModal(false)}>
                <div className="p-8 text-black font-sans">
                    {pubStep === 'choice' ? (
                        <div className="text-center">
                            <h2 className="text-4xl font-black mb-8 uppercase italic transform -skew-x-6 leading-none">¿Qué quieres publicar?</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <button
                                    onClick={() => { setPubType('player'); setPubStep('form'); }}
                                    className="p-8 border-4 border-black shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_black] transition-all bg-sky-400 group"
                                >
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👤</div>
                                    <span className="text-2xl font-black uppercase">Soy Jugador</span>
                                </button>
                                <button
                                    onClick={() => { setPubType('team'); setPubStep('form'); }}
                                    className="p-8 border-4 border-black shadow-[8px_8px_0px_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_black] transition-all bg-purple-400 group"
                                >
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🏘️</div>
                                    <span className="text-2xl font-black uppercase">Somos un Equipo</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSave}>
                            {submitting && (
                                <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center backdrop-blur-sm">
                                    <p className="text-2xl font-black animate-bounce">Subiendo ficha...</p>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-black uppercase tracking-tighter">
                                    {pubType === 'player' ? 'REGISTRO JUGADOR' : 'REGISTRO EQUIPO'}
                                </h3>
                                <button type="button" onClick={() => setPubStep('choice')} className="text-xs font-bold underline opacity-50 hover:opacity-100">VOLVER</button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {pubType === 'team' && (
                                    <div className="mb-8">
                                        <label className="block font-black text-xs uppercase mb-1">Nombre del Equipo</label>
                                        <input
                                            required
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            className="w-full border-2 border-black p-3 outline-none focus:bg-sky-50 shadow-[4px_4px_0px_black]"
                                            placeholder="Ej: Los Galácticos de INEF"
                                        />
                                    </div>
                                )}

                                <div className="space-y-8">
                                    {members.map((member, index) => (
                                        <div key={member.id} className="p-4 border-2 border-dashed border-gray-300 relative bg-gray-50/50">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="font-black text-[10px] bg-black text-white px-2 py-0.5 uppercase tracking-widest">
                                                    {pubType === 'team' ? `MIEMBRO #${index + 1}` : 'TUS DATOS'}
                                                </span>
                                                {pubType === 'team' && members.length > 1 && (
                                                    <button type="button" onClick={() => removeMember(member.id)} className="text-red-500 font-bold text-xs uppercase hover:underline">Eliminar</button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block font-black text-[10px] uppercase mb-1">Nombre / Nickname</label>
                                                    <input
                                                        required
                                                        value={member.name}
                                                        onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                                                        className="w-full border-2 border-black p-2 text-sm outline-none focus:bg-white"
                                                        placeholder="Ej: SuperKiller7"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block font-black text-[10px] uppercase mb-1">Nivel Subjetivo</label>
                                                    <select
                                                        value={member.level}
                                                        onChange={(e) => updateMember(member.id, 'level', e.target.value)}
                                                        className="w-full border-2 border-black p-2 text-sm outline-none bg-white"
                                                    >
                                                        <option>Amateur</option>
                                                        <option>Pachanga</option>
                                                        <option>Competitivo</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block font-black text-[10px] uppercase mb-1">Foto (Opcional)</label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 border-2 border-black bg-gray-200 flex items-center justify-center overflow-hidden">
                                                            {member.photoPreview ? <img src={member.photoPreview} className="w-full h-full object-cover" /> : <Plus size={16} className="text-gray-400" />}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                handleMemberPhoto(member.id, file);
                                                            }}
                                                            className="text-xs file:hidden text-gray-500 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {pubType === 'team' && (
                                    <button
                                        type="button"
                                        onClick={addMember}
                                        className="w-full border-2 border-black border-dashed py-3 text-xs font-black uppercase hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Añadir Miembro
                                    </button>
                                )}

                                <div className="pt-4">
                                    <label className="block font-black text-xs uppercase mb-1">Contacto General (IG / WhatsApp)</label>
                                    <input
                                        required
                                        value={contactInfo}
                                        onChange={(e) => setContactInfo(e.target.value)}
                                        className="w-full border-2 border-black p-3 outline-none focus:bg-sky-50 shadow-[4px_4px_0px_black]"
                                        placeholder="@tuusuario o teléfono"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-black text-white font-black py-4 uppercase tracking-[0.2em] shadow-[4px_4px_0px_#38bdf8] hover:scale-[1.02] transition-all">
                                {pubType === 'team' ? 'PUBLICAR EQUIPO' : 'PUBLICAR PERFIL'}
                            </button>
                        </form>
                    )}
                </div>
            </Modal>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default TransferMarket;
