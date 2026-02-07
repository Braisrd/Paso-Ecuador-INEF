import React, { useState } from 'react';
import {
    Edit,
    Trash2 as Trash,
    Plus,
    ExternalLink,
    Bell,
    Settings,
    Database,
    Image as ImageIcon,
    PlusCircle
} from 'lucide-react';
import Modal from '../UI/Modal';
import { ImageUploader, CustomFormBuilder, ButtonBuilder } from './AdminHelpers';
import {
    db,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    orderBy,
    limit,
    onSnapshot
} from '../../services/firebase';

const AdminDashboard = ({
    isOpen,
    onClose,
    events,
    eventTypes,
    announcements,
    specialSections,
    onOpenDB,
    onOpenStats
}) => {
    const [tab, setTab] = useState('events');
    const INITIAL_EVENT_FORM = {
        title: '',
        date: '',
        time: '',
        location: '',
        typeId: 'tournament',
        description: '',
        imageUrl: '',
        actionType: 'none',
        actionLabel: '',
        actionLink: '',
        customFields: [],
        pollOptions: []
    };

    const [eventForm, setEventForm] = useState(INITIAL_EVENT_FORM);
    const [editingEventId, setEditingEventId] = useState(null);
    const [newType, setNewType] = useState({ name: '', color: '#6366f1', icon: '📌' });
    const [localSpecialSections, setLocalSpecialSections] = useState(specialSections || []);

    // Sync localSpecialSections when specialSections prop changes
    React.useEffect(() => {
        setLocalSpecialSections(specialSections || []);
    }, [specialSections]);

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        try {
            const et = eventTypes.find(t => t.id === eventForm.typeId);
            const data = {
                ...eventForm,
                typeColor: et?.color || '#6366f1',
                typeIcon: et?.icon || '📌',
                typeName: et?.name || 'Evento'
            };

            if (editingEventId) {
                await updateDoc(doc(db, "events", editingEventId), data);
            } else {
                await addDoc(collection(db, "events"), { ...data, surveyCount: 0 });
            }
            alert('Evento guardado con éxito');
            setEventForm(INITIAL_EVENT_FORM);
            setEditingEventId(null);
        } catch (err) {
            console.error(err);
            alert('Error al guardar evento');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
            await deleteDoc(doc(db, "events", id));
        }
    };

    const handleAddType = async () => {
        if (!newType.name) return;
        const updatedTypes = [...eventTypes, { ...newType, id: Date.now().toString() }];
        await setDoc(doc(db, "config", "eventTypes"), { types: updatedTypes });
        setNewType({ name: '', color: '#6366f1', icon: '📌' });
    };

    const handleDeleteType = async (id) => {
        if (['party', 'tournament', 'tickets', 'special'].includes(id)) {
            alert('Este tipo base no se puede eliminar.');
            return;
        }
        const updatedTypes = eventTypes.filter(t => t.id !== id);
        await setDoc(doc(db, "config", "eventTypes"), { types: updatedTypes });
    };

    const handleUpdateSpecialSections = (updatedSections) => {
        setLocalSpecialSections(updatedSections.map(s => ({ ...s, buttons: s.buttons || [] })));
    };

    const saveSpecialSections = async () => {
        try {
            await setDoc(doc(db, 'config', 'specialSections'), { sections: localSpecialSections });
            alert('Secciones especiales guardadas con éxito');
        } catch (err) {
            alert('Error al guardar las secciones');
        }
    };

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        const title = e.target.title.value;
        const body = e.target.body.value;
        if (!confirm('¿Deseas publicar este aviso? Todos los usuarios verán una notificación.')) return;

        try {
            await addDoc(collection(db, "announcements"), {
                title,
                body,
                date: new Date().toISOString()
            });
            alert('Anuncio publicado');
            e.target.reset();
        } catch (err) {
            alert('Error al publicar anuncio');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold">Panel de Administración</h2>
                    <div className="flex gap-4">
                        <button onClick={onOpenDB} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-500 transition-colors flex items-center gap-2">
                            <Database className="w-4 h-4" /> Base de Datos
                        </button>
                        <div className="flex bg-black/40 p-1 rounded-xl">
                            {[
                                { id: 'events', l: 'Eventos' },
                                { id: 'types', l: 'Categorías' },
                                { id: 'special', l: 'Landing' },
                                { id: 'inbox', l: 'Buzón' }
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${tab === t.id ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {t.l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="custom-scrollbar overflow-y-auto max-h-[70vh] pr-2">
                    {tab === 'events' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                            <form onSubmit={handleSaveEvent} className="space-y-4">
                                <h3 className="font-bold text-primary flex items-center gap-2">
                                    {editingEventId ? <Edit className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                    {editingEventId ? 'Editando Evento' : 'Nuevo Evento'}
                                </h3>
                                <input value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Título del Evento" required className="w-full bg-black/40 p-3 rounded-xl border border-white/5 focus:border-primary outline-none" />
                                <div className="grid grid-cols-3 gap-4">
                                    <input value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} type="date" required className="bg-black/40 p-3 rounded-xl border border-white/5 text-white" />
                                    <input value={eventForm.time} onChange={e => setEventForm({ ...eventForm, time: e.target.value })} type="time" className="bg-black/40 p-3 rounded-xl border border-white/5 text-white" />
                                    <select value={eventForm.typeId} onChange={e => setEventForm({ ...eventForm, typeId: e.target.value })} className="bg-black/40 p-3 rounded-xl border border-white/5">
                                        {eventTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                                    </select>
                                </div>
                                <input value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Ubicación" className="w-full bg-black/40 p-3 rounded-xl border border-white/5" />
                                <textarea value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Descripción" className="w-full bg-black/40 p-3 rounded-xl border border-white/5" rows="3" />
                                <ImageUploader value={eventForm.imageUrl} onChange={v => setEventForm({ ...eventForm, imageUrl: v })} />

                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-3 tracking-widest">Acción Interactiva</label>
                                    <select value={eventForm.actionType} onChange={e => setEventForm({ ...eventForm, actionType: e.target.value })} className="w-full bg-black/40 p-3 rounded-xl border border-white/5 mb-3">
                                        <option value="none">Sin botón adicional</option>
                                        <option value="form">Formulario de registro personalizado</option>
                                        <option value="link">Enlace externo</option>
                                    </select>
                                    {['link', 'form'].includes(eventForm.actionType) && (
                                        <input value={eventForm.actionLabel} onChange={e => setEventForm({ ...eventForm, actionLabel: e.target.value })} placeholder="Texto del botón" className="w-full bg-black/40 p-3 rounded-xl border border-white/5 mb-3" />
                                    )}
                                    {eventForm.actionType === 'link' && (
                                        <input value={eventForm.actionLink} onChange={e => setEventForm({ ...eventForm, actionLink: e.target.value })} placeholder="URL del enlace (https://...)" className="w-full bg-black/40 p-3 rounded-xl border border-white/5" />
                                    )}
                                    {eventForm.actionType === 'form' && (
                                        <CustomFormBuilder fields={eventForm.customFields || []} onChange={f => setEventForm({ ...eventForm, customFields: f })} />
                                    )}
                                </div>
                                <button className="w-full bg-primary text-black py-4 rounded-xl font-bold hover:bg-sky-500 transition-all shadow-lg shadow-primary/20">
                                    {editingEventId ? 'Actualizar Evento' : 'Crear Evento'}
                                </button>
                                {editingEventId && (
                                    <button type="button" onClick={() => { setEditingEventId(null); setEventForm(INITIAL_EVENT_FORM); }} className="w-full text-gray-500 text-xs mt-2 uppercase font-bold tracking-widest hover:text-white transition-colors">
                                        Cancelar Edición
                                    </button>
                                )}
                            </form>

                            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Eventos Existentes</h3>
                                {events.map(e => (
                                    <div key={e.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl group hover:bg-white/10 border border-white/5 transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{e.typeIcon}</span>
                                            <div>
                                                <div className="font-bold text-sm">{e.title}</div>
                                                <div className="text-[10px] text-gray-500 font-mono uppercase">{new Date(e.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => onOpenStats(e)} className="bg-green-500/20 text-green-400 p-2 text-[10px] font-bold rounded-lg border border-green-500/30 hover:bg-green-500/40">DATA</button>
                                            <button onClick={() => { setEventForm({ ...e }); setEditingEventId(e.id); }} className="text-primary p-2 hover:bg-primary/10 rounded-lg"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteEvent(e.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-lg"><Trash className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {events.length === 0 && <p className="text-center py-8 text-gray-600 italic">No hay eventos creados.</p>}
                            </div>
                        </div>
                    )}

                    {tab === 'types' && (
                        <div className="animate-fade-in space-y-8">
                            <div className="grid grid-cols-4 gap-4 bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Nombre Categoría</label>
                                    <input value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} placeholder="Ej: Cena" className="w-full bg-black/40 p-3 rounded-xl border border-white/5" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Color</label>
                                    <input value={newType.color} onChange={e => setNewType({ ...newType, color: e.target.value })} type="color" className="bg-black/40 p-2 h-12 w-full rounded-xl cursor-pointer" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Icono/Emoji</label>
                                    <input value={newType.icon} onChange={e => setNewType({ ...newType, icon: e.target.value })} placeholder="🍷" className="w-full bg-black/40 p-3 rounded-xl border border-white/5 text-center text-xl" />
                                </div>
                                <button onClick={handleAddType} className="col-span-4 bg-primary text-black py-3 rounded-xl font-bold hover:bg-sky-500 transition-all">
                                    Añadir Nueva Categoría
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {eventTypes.map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10" style={{ borderLeft: `6px solid ${t.color}` }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{t.icon}</span>
                                            <span className="font-bold">{t.name}</span>
                                        </div>
                                        {!['party', 'tournament', 'tickets', 'special'].includes(t.id) && (
                                            <button onClick={() => handleDeleteType(t.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-colors">
                                                <Trash className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {tab === 'special' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Secciones Especiales (Polls & Landing)</h3>
                                <button onClick={() => handleUpdateSpecialSections([...localSpecialSections, { id: Date.now(), title: '', description: '', imageUrl: '', active: true, buttons: [], startDate: '', endDate: '', warningDays: '', link: '', linkText: '', pollOptions: [], pollCounts: {} }])} className="bg-white/10 px-4 py-2 rounded-lg font-bold hover:bg-white/20 transition-all text-xs">
                                    + Añadir Sección
                                </button>
                            </div>

                            <div className="space-y-6">
                                {localSpecialSections.map(s => (
                                    <div key={s.id} className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 relative group">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <input type="checkbox" className="w-5 h-5 rounded-lg border-white/10 bg-black/40 text-primary" checked={s.active} onChange={e => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, active: e.target.checked } : x))} />
                                                <span className={`font-bold text-sm ${s.active ? 'text-green-400' : 'text-gray-500'}`}>{s.active ? 'Visible en Landing' : 'Oculta'}</span>
                                            </label>
                                            <button onClick={() => handleUpdateSpecialSections(localSpecialSections.filter(x => x.id !== s.id))} className="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/10 px-3 py-1 rounded-lg">Eliminar</button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <input value={s.title} onChange={e => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))} placeholder="Título de la Sección" className="w-full bg-black/40 p-3 rounded-xl border border-white/5 outline-none focus:border-primary" />
                                                <textarea value={s.description} onChange={e => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, description: e.target.value } : x))} placeholder="Breve descripción para la landing..." className="w-full bg-black/40 p-3 rounded-xl border border-white/5 outline-none focus:border-primary" rows="3" />
                                            </div>
                                            <div className="space-y-4">
                                                <ImageUploader value={s.imageUrl} onChange={v => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, imageUrl: v } : x))} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 bg-black/20 p-4 rounded-2xl">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-1">Fecha Inicio</label>
                                                <input type="date" value={s.startDate || ''} onChange={e => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, startDate: e.target.value } : x))} className="w-full bg-black/40 p-2 rounded-lg text-xs border border-white/5" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-1">Fecha Fin</label>
                                                <input type="date" value={s.endDate || ''} onChange={e => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, endDate: e.target.value } : x))} className="w-full bg-black/40 p-2 rounded-lg text-xs border border-white/5" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest pl-1">Aviso "Cierre"</label>
                                                <input type="number" placeholder="Días restantes" value={s.warningDays || ''} onChange={e => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, warningDays: e.target.value } : x))} className="w-full bg-black/40 p-2 rounded-lg text-xs border border-white/5" />
                                            </div>
                                        </div>
                                        <ButtonBuilder buttons={s.buttons || []} onChange={btns => handleUpdateSpecialSections(localSpecialSections.map(x => x.id === s.id ? { ...x, buttons: btns } : x))} />
                                    </div>
                                ))}
                            </div>
                            <button onClick={saveSpecialSections} className="w-full bg-primary text-black py-4 rounded-2xl font-black text-lg hover:bg-sky-500 transition-all shadow-xl shadow-primary/20">
                                GUARDAR CAMBIOS EN LA WEB
                            </button>
                        </div>
                    )}

                    {tab === 'inbox' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <form onSubmit={handleAddAnnouncement} className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-6">
                                <h3 className="text-xl font-bold text-primary flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">📢</div>
                                    Enviar Notificación / Aviso
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Asunto</label>
                                        <input name="title" required placeholder="Ej: Nueva fiesta confirmada" className="w-full bg-black/40 border border-white/10 p-4 rounded-xl focus:border-primary outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Mensaje Completo</label>
                                        <textarea name="body" required rows="4" placeholder="Describe los detalles aquí..." className="w-full bg-black/40 border border-white/10 p-4 rounded-xl focus:border-primary outline-none transition-all"></textarea>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-black font-black py-4 rounded-2xl hover:scale-[1.01] transition-all shadow-lg shadow-primary/20 uppercase tracking-widest">
                                    Publicar Aviso Global
                                </button>
                            </form>

                            <div className="bg-yellow-500/5 border border-yellow-500/20 p-6 rounded-2xl">
                                <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">⚠️ Notificaciones Push</h4>
                                <p className="text-xs text-gray-400 leading-relaxed mb-4">
                                    Este panel añade mensajes al Buzón interno de la App. Para enviar notificaciones que hagan vibrar el móvil (Push), utiliza el panel de Firebase Messaging.
                                </p>
                                <a href="https://console.firebase.google.com/" target="_blank" className="text-[10px] bg-yellow-500/20 text-yellow-200 px-4 py-2 rounded-lg hover:bg-yellow-500/30 font-bold transition-all uppercase tracking-tighter">
                                    Ir a Consola Firebase
                                </a>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Historial Reciente</h3>
                                {announcements.map(a => (
                                    <div key={a.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                        <div>
                                            <div className="font-bold text-sm">{a.title}</div>
                                            <div className="text-[10px] text-gray-500 font-mono italic">{new Date(a.date).toLocaleString()}</div>
                                        </div>
                                        <button onClick={() => confirm('¿Borrar aviso?') && deleteDoc(doc(db, "announcements", a.id))} className="text-red-500 hover:bg-red-500/10 p-3 rounded-full transition-all">
                                            <Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {announcements.length === 0 && <p className="text-center text-gray-600 italic py-8 text-sm">No hay avisos anteriores.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default AdminDashboard;
