import React, { useState } from 'react';
import { ExternalLink, Check, Trash, Edit, Plus, X, Upload } from 'lucide-react';
import { db, doc, updateDoc, setDoc, addDoc, deleteDoc, collection } from '../firebase';
import { Modal } from './Modal';

// --- Sub-components for AdminDashboard ---

const ImageUploader = ({ value, onChange }) => {
    const compressImage = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleFile = async (files) => {
        const file = files[0];
        if (!file) return;
        try {
            const compressed = await compressImage(file);
            onChange(compressed);
        } catch (err) {
            alert('Error al procesar la imagen');
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex gap-2" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files); }}>
                <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} onPaste={e => { if (e.clipboardData.files.length) handleFile(e.clipboardData.files); }} placeholder="Imagen (URL, Pegar o Arrastrar)" className="flex-1 bg-black/40 p-3 rounded border border-white/10 text-white" />
                <label className="cursor-pointer bg-white/10 hover:bg-white/20 p-3 rounded border border-white/10 flex items-center justify-center"><Upload className="w-5 h-5" /><input type="file" className="hidden" accept="image/*" onChange={e => handleFile(e.target.files)} /></label>
            </div>
            {value && <img src={value} className="h-24 rounded object-contain border border-white/10 bg-black/40 w-full" />}
        </div>
    );
};

const CustomFormBuilder = ({ fields, onChange }) => {
    const addField = () => onChange([...fields, { id: Date.now(), label: '', type: 'text', options: '' }]);
    const addPreset = () => onChange([...fields,
    { id: Date.now(), label: 'Nombre Completo', type: 'text', options: '' },
    { id: Date.now() + 1, label: 'Email', type: 'text', options: '' },
    { id: Date.now() + 2, label: 'Comentarios', type: 'text', options: '' }
    ]);
    const updateField = (id, k, v) => onChange(fields.map(f => f.id === id ? { ...f, [k]: v } : f));
    return (
        <div className="space-y-4 border border-white/10 p-4 rounded bg-black/20">
            <div className="flex justify-between items-center"><h4 className="font-bold text-sm uppercase text-gray-400">Campos del Formulario</h4><div className="flex gap-2"><button type="button" onClick={addPreset} className="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">+ Presets</button><button type="button" onClick={addField} className="text-celestial text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> Añadir Campo</button></div></div>
            {fields.map(f => (
                <div key={f.id} className="grid grid-cols-12 gap-2 items-center bg-white/5 p-2 rounded">
                    <input value={f.label} onChange={e => updateField(f.id, 'label', e.target.value)} placeholder="Etiqueta" className="col-span-4 bg-black/40 p-2 rounded text-sm" />
                    <select value={f.type} onChange={e => updateField(f.id, 'type', e.target.value)} className="col-span-3 bg-black/40 p-2 rounded text-sm text-gray-300"><option value="text">Texto</option><option value="number">Número</option><option value="select">Desplegable</option></select>
                    <input value={f.options} onChange={e => updateField(f.id, 'options', e.target.value)} placeholder="Opciones" className="col-span-4 bg-black/40 p-2 rounded text-sm" disabled={f.type !== 'select'} />
                    <button type="button" onClick={() => onChange(fields.filter(x => x.id !== f.id))} className="col-span-1 text-red-400 flex justify-center"><X className="w-4 h-4" /></button>
                </div>
            ))}
            {fields.length === 0 && <p className="text-xs text-center text-gray-500">Añade campos para el formulario.</p>}
        </div>
    );
};

const ButtonBuilder = ({ buttons, onChange }) => {
    const addBtn = () => onChange([...(buttons || []), { id: Date.now(), label: 'Botón', link: '', style: 'primary', type: 'link', customFields: [] }]);
    const updateBtn = (id, k, v) => onChange(buttons.map(b => b.id === id ? { ...b, [k]: v } : b));
    const removeBtn = (id) => onChange(buttons.filter(b => b.id !== id));
    return (
        <div className="space-y-3 bg-black/20 p-3 rounded border border-white/10">
            <div className="flex justify-between items-center"><label className="text-sm font-bold text-gray-400">Botones de Acción</label><button type="button" onClick={addBtn} className="text-xs bg-celestial text-black px-2 py-1 rounded font-bold">+ Añadir</button></div>
            {(buttons || []).map(b => (
                <div key={b.id} className="bg-white/5 p-2 rounded relative">
                    <button type="button" onClick={() => removeBtn(b.id)} className="absolute top-2 right-2 text-red-500"><X className="w-4 h-4" /></button>
                    <div className="grid grid-cols-2 gap-2 mb-2 pr-6">
                        <input value={b.label} onChange={e => updateBtn(b.id, 'label', e.target.value)} placeholder="Texto del Botón" className="bg-black/40 p-2 rounded text-sm w-full" />
                        <select value={b.type || 'link'} onChange={e => updateBtn(b.id, 'type', e.target.value)} className="bg-black/40 p-2 rounded text-sm w-full"><option value="link">Enlace</option><option value="form">Formulario</option></select>
                    </div>
                    <div className="mb-2">
                        <select value={b.style} onChange={e => updateBtn(b.id, 'style', e.target.value)} className="w-full bg-black/40 p-2 rounded text-sm"><option value="primary">Azul (Principal)</option><option value="secondary">Blanco (Secundario)</option><option value="outline">Borde (Discreto)</option><option value="gradient">Gradiente (Destacado)</option></select>
                    </div>
                    {b.type === 'link' && <input value={b.link} onChange={e => updateBtn(b.id, 'link', e.target.value)} placeholder="https://..." className="w-full bg-black/40 p-2 rounded text-sm" />}
                    {b.type === 'form' && (
                        <div className="mt-2 pl-2 border-l-2 border-celestial/30">
                            <CustomFormBuilder fields={b.customFields || []} onChange={f => updateBtn(b.id, 'customFields', f)} />
                        </div>
                    )}
                </div>
            ))}
            {(!buttons || buttons.length === 0) && <p className="text-xs text-center text-gray-600">Sin botones.</p>}
        </div>
    );
};

export const AdminDashboard = ({ isOpen, onClose, events, eventTypes, announcements, onSaveEvent, onDeleteEvent, onAddEventType, onDeleteEventType, specialSections, onUpdateSpecialSections, onOpenDB }) => {
    const [tab, setTab] = useState('events');
    const INITIAL_FORM = { title: '', date: '', time: '', location: '', typeId: 'party', description: '', imageUrl: '', actionType: 'none', actionLabel: '', actionLink: '', customFields: [], showSurveyCount: false, pollOptions: [] };
    const [formData, setFormData] = useState(INITIAL_FORM);
    const [editingId, setEditingId] = useState(null);
    const [newType, setNewType] = useState({ name: '', color: '#38bdf8', icon: '📌' });
    const safeUpdateSection = (newSections) => onUpdateSpecialSections(newSections.map(s => ({ ...s, buttons: s.buttons || [] })));

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold">Panel Admin</h2><div className="flex gap-4"><button onClick={onOpenDB} className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500">Ver Base de Datos</button><div className="flex bg-black/40 p-1 rounded-lg">{[{ id: 'events', l: 'Eventos' }, { id: 'types', l: 'Tipos' }, { id: 'special', l: 'Secciones' }, { id: 'inbox', l: 'Buzón' }].map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-md font-bold text-sm ${tab === t.id ? 'bg-celestial text-black' : 'text-gray-400'}`}>{t.l}</button>)}</div></div></div>
                {tab === 'events' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <form onSubmit={e => { e.preventDefault(); onSaveEvent(formData, editingId); setFormData(INITIAL_FORM); setEditingId(null); }} className="space-y-4">
                            <h3 className="font-bold text-celestial">{editingId ? 'Editando Evento' : 'Nuevo Evento'}</h3>
                            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Título" required className="w-full bg-black/40 p-3 rounded" />
                            <div className="grid grid-cols-3 gap-4"><input value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} type="date" required className="bg-black/40 p-3 rounded cursor-pointer" /><input value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} type="time" className="bg-black/40 p-3 rounded cursor-pointer text-white" /><select value={formData.typeId} onChange={e => setFormData({ ...formData, typeId: e.target.value })} className="bg-black/40 p-3 rounded">{eventTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}</select></div>
                            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ubicación" className="w-full bg-black/40 p-3 rounded" />
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción" className="w-full bg-black/40 p-3 rounded" rows="3" />
                            <ImageUploader value={formData.imageUrl} onChange={v => setFormData({ ...formData, imageUrl: v })} />
                            <div className="bg-white/5 p-4 rounded border border-white/10"><label className="block text-sm font-bold text-gray-400 mb-2">Acción Principal</label><select value={formData.actionType} onChange={e => setFormData({ ...formData, actionType: e.target.value })} className="w-full bg-black/40 p-3 rounded mb-3"><option value="none">Sin botón</option><option value="survey">Encuesta Rápida</option><option value="form">Formulario</option><option value="link">Enlace Externo</option><option value="poll">Votación</option></select>{['survey', 'form', 'link'].includes(formData.actionType) && <input value={formData.actionLabel} onChange={e => setFormData({ ...formData, actionLabel: e.target.value })} placeholder="Texto del botón" className="w-full bg-black/40 p-3 rounded mb-3" />}{formData.actionType === 'link' && <input value={formData.actionLink} onChange={e => setFormData({ ...formData, actionLink: e.target.value })} placeholder="Link" className="w-full bg-black/40 p-3 rounded" />}{formData.actionType === 'form' && <CustomFormBuilder fields={formData.customFields} onChange={f => setFormData({ ...formData, customFields: f })} />}{formData.actionType === 'survey' && <label className="flex items-center gap-2 mt-2 text-sm text-gray-400"><input type="checkbox" checked={formData.showSurveyCount || false} onChange={e => setFormData({ ...formData, showSurveyCount: e.target.checked })} /> Mostrar contador</label>}
                                {formData.actionType === 'poll' && <div className="bg-black/30 p-2 rounded mb-3 space-y-2"><label className="text-sm font-bold text-gray-400">Opciones</label>{(formData.pollOptions || []).map((opt, i) => <div key={i} className="flex gap-2"><input value={opt} onChange={e => { const u = [...formData.pollOptions]; u[i] = e.target.value; setFormData({ ...formData, pollOptions: u }) }} className="w-full bg-black/40 p-2 rounded" /><button type="button" onClick={() => setFormData({ ...formData, pollOptions: formData.pollOptions.filter((_, idx) => idx !== i) })} className="text-red-500">X</button></div>)}<button type="button" onClick={() => setFormData({ ...formData, pollOptions: [...(formData.pollOptions || []), ''] })} className="text-xs bg-white/10 px-2 py-1 rounded">+ Opción</button></div>}</div>
                            <button className="w-full bg-celestial text-black py-3 rounded font-bold">{editingId ? 'Guardar Cambios' : 'Crear Evento'}</button>
                        </form>
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">{events.map(e => <div key={e.id} className="flex justify-between items-center bg-white/5 p-3 rounded group hover:bg-white/10"><div><div className="font-bold">{e.title}</div><div className="text-xs text-gray-400">{e.date}</div></div><div className="flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => { setFormData({ ...e }); setEditingId(e.id); }} className="text-celestial p-2"><Edit className="w-4 h-4" /></button><button onClick={() => onDeleteEvent(e.id)} className="text-red-500 p-2"><Trash className="w-4 h-4" /></button></div></div>)}</div>
                    </div>
                )}

                {tab === 'types' && (<div className="grid grid-cols-4 gap-4"><input value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} placeholder="Nombre" className="col-span-2 bg-black/40 p-3 rounded" /><input value={newType.color} onChange={e => setNewType({ ...newType, color: e.target.value })} type="color" className="bg-black/40 p-2 h-full w-full rounded" /><input value={newType.icon} onChange={e => setNewType({ ...newType, icon: e.target.value })} placeholder="Emoji" className="bg-black/40 p-3 rounded text-center" /><button onClick={() => { onAddEventType({ ...newType, id: Date.now().toString() }); setNewType({ name: '', color: '#38bdf8', icon: '📌' }); }} className="col-span-4 bg-white/10 py-3 rounded font-bold">Añadir Tipo</button><div className="col-span-4 grid md:grid-cols-3 gap-4">{eventTypes.map(t => <div key={t.id} className="flex items-center justify-between p-4 rounded bg-[#0a0a0f] border border-white/10" style={{ borderLeft: `4px solid ${t.color}` }}><span>{t.icon} {t.name}</span>{!['party', 'tournament', 'tickets', 'special'].includes(t.id) && <button onClick={() => onDeleteEventType(t.id)} className="text-red-500"><Trash className="w-4 h-4" /></button>}</div>)}</div></div>)}

                {tab === 'special' && (<div className="space-y-6"><div className="flex justify-between"><h3 className="font-bold">Secciones</h3><button onClick={() => safeUpdateSection([...specialSections, { id: Date.now(), title: '', description: '', imageUrl: '', active: true, buttons: [], startDate: '', endDate: '', warningDays: '', link: '', linkText: '', pollOptions: [] }])} className="bg-white/10 px-4 py-2 rounded">+ Nueva</button></div>{specialSections.map(s => (<div key={s.id} className="bg-white/5 p-4 rounded border border-white/10 space-y-3 relative"><div className="flex justify-between"><label className="flex gap-2 font-bold"><input type="checkbox" checked={s.active} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, active: e.target.checked } : x))} /> Visible</label><button onClick={() => safeUpdateSection(specialSections.filter(x => x.id !== s.id))} className="text-red-400 text-xs">ELIMINAR</button></div><input value={s.title} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))} placeholder="Título" className="w-full bg-black/40 p-2 rounded" /><textarea value={s.description} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, description: e.target.value } : x))} placeholder="Descripción..." className="w-full bg-black/40 p-2 rounded" rows="2" /><div className="grid grid-cols-3 gap-2"><div className="space-y-1"><label className="text-xs text-gray-400">Fecha Inicio</label><input type="date" value={s.startDate || ''} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, startDate: e.target.value } : x))} className="w-full bg-black/40 p-2 rounded text-xs" /></div><div className="space-y-1"><label className="text-xs text-gray-400">Fecha Fin</label><input type="date" value={s.endDate || ''} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, endDate: e.target.value } : x))} className="w-full bg-black/40 p-2 rounded text-xs" /></div><div className="space-y-1"><label className="text-xs text-gray-400">Días Aviso</label><input type="number" placeholder="Ej: 5" value={s.warningDays || ''} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, warningDays: e.target.value } : x))} className="w-full bg-black/40 p-2 rounded text-xs" /></div></div>
                    <div className="grid grid-cols-2 gap-2"><input value={s.link || ''} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, link: e.target.value } : x))} placeholder="Enlace Principal (Opcional)" className="bg-black/40 p-2 rounded text-sm" /><input value={s.linkText || ''} onChange={e => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, linkText: e.target.value } : x))} placeholder="Texto Enlace (ej: Ver Más)" className="bg-black/40 p-2 rounded text-sm" /></div>
                    <ImageUploader value={s.imageUrl} onChange={v => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, imageUrl: v } : x))} />
                    <div className="bg-black/20 p-3 rounded"><label className="text-xs font-bold text-gray-400">Opciones para Votación (Poll)</label>{(s.pollOptions || []).map((opt, i) => <div key={i} className="flex gap-2 mt-1"><input value={opt} onChange={e => { const u = [...(s.pollOptions || [])]; u[i] = e.target.value; safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, pollOptions: u } : x)) }} className="w-full bg-black/40 p-1 rounded text-sm" /><button onClick={() => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, pollOptions: s.pollOptions.filter((_, idx) => idx !== i) } : x))} className="text-red-500">X</button></div>)}<button onClick={() => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, pollOptions: [...(s.pollOptions || []), ''] } : x))} className="text-xs mt-1 bg-white/10 px-2 py-1 rounded">+ Opción</button></div>
                    <ButtonBuilder buttons={s.buttons || []} onChange={btns => safeUpdateSection(specialSections.map(x => x.id === s.id ? { ...x, buttons: btns } : x))} /></div>))}<button onClick={() => { setDoc(doc(db, 'config', 'specialSections'), { sections: specialSections }); alert('Guardado'); }} className="w-full bg-celestial text-black py-3 rounded font-bold">GUARDAR CAMBIOS</button></div>)}

                {tab === 'inbox' && (
                    <div className="space-y-6 animate-fade-in-up">
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (!window.confirm('¿Publicar este aviso? Todos los usuarios verán el punto rojo.')) return;
                            const title = e.target.title.value;
                            const body = e.target.body.value;
                            try {
                                await addDoc(collection(db, "announcements"), {
                                    title,
                                    body,
                                    date: new Date().toISOString()
                                });
                                alert('Aviso publicado correctamente en el Buzón.');
                                e.target.reset();
                            } catch (err) {
                                console.error(err);
                                alert('Error al publicar: ' + err.message);
                            }
                        }} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                            <h3 className="font-bold text-xl text-celestial flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-celestial/20 flex items-center justify-center text-lg">📢</div> Nueva Notificación</h3>
                            <p className="text-sm text-gray-400">Esto añadirá el mensaje al "Buzón" de la app y activará el punto rojo 🔴 para todos.</p>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Título</label>
                                <input name="title" required placeholder="Ej: Cambio de hora en el Torneo" className="w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:border-celestial outline-none transition-colors" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase">Mensaje</label>
                                <textarea name="body" required rows="4" placeholder="Ej: Debido a la lluvia, los partidos de hoy se mueven al pabellón cubierto..." className="w-full bg-black/40 border border-white/10 p-3 rounded-lg focus:border-celestial outline-none transition-colors"></textarea>
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-celestial to-blue-600 text-white font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-celestial/20">
                                Publicar en la App
                            </button>
                        </form>

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                            <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">⚠️ Importante: Notificaciones Móvil</h4>
                            <p className="text-sm text-gray-300 leading-relaxed mb-4">
                                Publicar aquí <b>SOLO</b> actualiza la app (Buzón + Punto rojo).<br />
                                Para que le vibre el móvil a la gente (Notificación Push), debes ir a Firebase Console y enviarla manualmente.
                            </p>
                            <a href="https://console.firebase.google.com/u/0/project/liga-multisport/notification/compose" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs bg-yellow-500/20 text-yellow-200 px-3 py-2 rounded-lg hover:bg-yellow-500/30 transition-colors">
                                Ir a Firebase Console <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <h3 className="font-bold text-gray-400 mb-4">Historial de Notificaciones (Últimas 20)</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                            {(announcements || []).map(a => (
                                <div key={a.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                    <div>
                                        <div className="font-bold text-sm text-white">{a.title}</div>
                                        <div className="text-xs text-gray-500">{new Date(a.date).toLocaleString()}</div>
                                    </div>
                                    <button onClick={() => window.confirm('¿Borrar este mensaje? Desaparecerá del buzón de todos.') && deleteDoc(doc(db, "announcements", a.id))} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!announcements || announcements.length === 0) && <p className="text-gray-600 italic text-sm text-center">No hay mensajes publicados.</p>}
                        </div>


                    </div>
                )}
            </div>
        </Modal>
    );
};
