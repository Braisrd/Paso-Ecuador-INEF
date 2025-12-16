import React, { useState, useEffect, useMemo } from 'react';
import { ExternalLink, Check, Bell, Upload, Calendar, MapPin, X, Plus } from 'lucide-react';
import { Modal } from './Modal';
import { addDoc, collection, db, doc, updateDoc, getDoc } from '../firebase';

// Helper for generic action buttons
export const ActionButton = ({ event, onOpenForm }) => {
    const [loading, setLoading] = useState(false);
    const [voted, setVoted] = useState(() => localStorage.getItem(`voted_${event.id}`) === 'true');
    const [pollVote, setPollVote] = useState(() => localStorage.getItem(`poll_vote_${event.id}`));

    const handleSurveyClick = async (e) => {
        e.preventDefault(); e.stopPropagation(); if (loading) return; setLoading(true); const isVoted = voted; setVoted(!isVoted);
        try { if (isVoted) { if (confirm('¿Retirar tu voto?')) { await updateDoc(doc(db, "events", event.id), { surveyCount: Math.max(0, (event.surveyCount || 0) - 1) }); localStorage.removeItem(`voted_${event.id}`); } else { setVoted(true); } } else { await updateDoc(doc(db, "events", event.id), { surveyCount: (event.surveyCount || 0) + 1 }); localStorage.setItem(`voted_${event.id}`, 'true'); alert('Has confirmado tu asistencia.'); } } catch (err) { alert('Error de conexión'); setVoted(isVoted); } finally { setTimeout(() => setLoading(false), 500); }
    };
    const handlePollVote = async (opt) => {
        if (loading) return; setLoading(true); const key = `poll_vote_${event.id}`; const current = localStorage.getItem(key); const counts = { ...(event.pollCounts || {}) };
        try {
            if (current === opt) { counts[opt] = Math.max(0, (counts[opt] || 0) - 1); await updateDoc(doc(db, "events", event.id), { pollCounts: counts }); localStorage.removeItem(key); setPollVote(null); }
            else { if (current) counts[current] = Math.max(0, (counts[current] || 0) - 1); counts[opt] = (counts[opt] || 0) + 1; await updateDoc(doc(db, "events", event.id), { pollCounts: counts }); localStorage.setItem(key, opt); setPollVote(opt); }
        } catch (e) { alert('Error'); } finally { setLoading(false); }
    };
    const cls = "mt-4 w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg";
    if (event.actionType === 'link') return <a href={event.actionLink} target="_blank" onClick={e => e.stopPropagation()} className={`${cls} bg-white/5 border border-white/10 hover:bg-white/10 text-white`}><ExternalLink className="w-5 h-5" /> {event.actionLabel || 'Ver Más'}</a>;
    if (event.actionType === 'survey') return <button onClick={handleSurveyClick} disabled={loading} className={`${cls} ${voted ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-celestial text-black hover:bg-celestialDark'} ${loading ? 'opacity-50 cursor-wait' : ''}`}><Check className="w-5 h-5" /> {voted ? 'Asistencia Confirmada' : (event.actionLabel || 'Asistiré')} {event.showSurveyCount && <span className="ml-2 bg-black/20 px-2 rounded-full text-xs">{(event.surveyCount || 0) + (voted && !event.surveyCount ? 1 : 0)}</span>}</button>;
    if (event.actionType === 'form') return <button onClick={(e) => { e.stopPropagation(); onOpenForm(event); }} className={`${cls} bg-gradient-to-r from-ligaPrimary to-ligaSecondary text-white hover:opacity-90`}>{event.actionLabel || 'Inscribirse'}</button>;
    if (event.actionType === 'poll') return <div className="grid grid-cols-2 gap-2 mt-4 w-full">{event.pollOptions?.map(opt => <button key={opt} onClick={(e) => { e.stopPropagation(); handlePollVote(opt); }} disabled={loading} className={`p-3 rounded-xl font-bold border transition-all ${pollVote === opt ? 'bg-celestial text-black border-celestial scale-95' : 'bg-white/5 border-white/10 hover:bg-white/10'} ${loading ? 'opacity-50' : ''}`}>{opt}</button>)}</div>;
    return null;
};

export const EventRegistrationModal = ({ event, onClose }) => {
    const [formData, setFormData] = useState({});
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "event_registrations"), { eventId: event.id, eventTitle: event.title, submittedAt: new Date().toISOString(), ...formData });
            alert('¡Inscripción Enviada!');
            onClose();
        } catch (err) { alert('Error al enviar.'); }
    };
    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="p-8">
                <h2 className="text-2xl font-bold mb-4">Inscripción: {event.title}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {event.customFields?.map(f => (
                        <div key={f.id}>
                            <label className="block text-sm font-bold text-gray-400 mb-1">{f.label}</label>
                            {f.type === 'select' ?
                                <select required className="w-full bg-black/40 p-3 rounded text-white" onChange={e => setFormData({ ...formData, [f.label]: e.target.value })}>
                                    <option value="">Selecciona...</option>
                                    {f.options.split(',').map(o => <option key={o} value={o.trim()}>{o.trim()}</option>)}
                                </select> :
                                <input required type={f.type} className="w-full bg-black/40 p-3 rounded text-white" onChange={e => setFormData({ ...formData, [f.label]: e.target.value })} />
                            }
                        </div>
                    ))}
                    <button className="w-full bg-celestial text-black font-bold py-3 rounded mt-4 hover:bg-celestialDark transition-colors">Confirmar Inscripción</button>
                </form>
            </div>
        </Modal>
    );
};

export const EventDetailModal = ({ event, onClose, onOpenForm }) => (
    <Modal isOpen={true} onClose={onClose} size="lg">
        <div className="relative">
            {event.imageUrl && <div className="w-full h-64 md:h-80"><img src={event.imageUrl} className="w-full h-full object-cover" /></div>}
            <div className="p-8">
                <div className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase border" style={{ color: event.typeColor, borderColor: event.typeColor, backgroundColor: `${event.typeColor}20` }}>{event.typeIcon} {event.typeName}</div>
                <h2 className="text-4xl font-black mb-2 text-white leading-tight">{event.title}</h2>
                <div className="flex items-center gap-2 text-celestial font-bold mb-4"><Calendar className="w-5 h-5" /> {new Date(event.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {event.time && <span> | {event.time}</span>}</div>
                {event.location && <div className="flex items-center gap-2 text-gray-400 mb-6"><MapPin className="w-5 h-5" /> {event.location}</div>}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6"><p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p></div>
                <div className="flex flex-col gap-3">
                    <ActionButton event={event} onOpenForm={onOpenForm} />
                    <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.date.replace(/-/g, '')}T${event.time ? event.time.replace(':', '') + '00' : '000000'}/${event.date.replace(/-/g, '')}T${event.time ? event.time.replace(':', '') + '00' : '235959'}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`} target="_blank" className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 flex items-center justify-center gap-2 text-gray-300 transition-colors"><Calendar className="w-5 h-5" /> Añadir a Google Calendar</a>
                </div>
            </div>
        </div>
    </Modal>
);

export const SectionDetailModal = ({ section, onClose, onOpenForm }) => {
    const renderButtonStyle = (b) => {
        const base = "inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all hover:scale-105 ";
        if (b.style === 'primary') return base + "bg-celestial text-black hover:shadow-[0_0_20px_rgba(56,189,248,0.4)]";
        if (b.style === 'secondary') return base + "bg-white text-black hover:bg-gray-200";
        if (b.style === 'outline') return base + "border border-white/20 text-white hover:bg-white/10";
        if (b.style === 'gradient') return base + "bg-gradient-to-r from-ligaPrimary to-ligaSecondary text-white shadow-lg";
        return base + "bg-white/10 text-white";
    };

    const SectionPoll = ({ options, id }) => {
        const [voted, setVoted] = useState(() => localStorage.getItem(`section_poll_${id}`));
        const [loading, setLoading] = useState(false);

        const handleVote = async (opt) => {
            if (loading) return;
            setLoading(true);
            try {
                const docRef = doc(db, 'config', 'specialSections');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const sections = data.sections || [];
                    const sectionIdx = sections.findIndex(s => s.id === id);

                    if (sectionIdx !== -1) {
                        const section = sections[sectionIdx];
                        const counts = section.pollCounts || {};

                        if (voted === opt) {
                            counts[opt] = Math.max(0, (counts[opt] || 0) - 1);
                            localStorage.removeItem(`section_poll_${id}`);
                            setVoted(null);
                        } else {
                            if (voted) {
                                counts[voted] = Math.max(0, (counts[voted] || 0) - 1);
                            }
                            counts[opt] = (counts[opt] || 0) + 1;
                            localStorage.setItem(`section_poll_${id}`, opt);
                            setVoted(opt);
                        }

                        sections[sectionIdx] = { ...section, pollCounts: counts };
                        await updateDoc(docRef, { sections });
                    }
                }
            } catch (err) {
                console.error(err);
                alert('Error al guardar voto');
            } finally {
                setLoading(false);
            }
        };
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 w-full">
                {options.map(opt => (
                    <button key={opt} onClick={(e) => { e.stopPropagation(); handleVote(opt); }} disabled={loading} className={`p-4 rounded-xl font-bold border transition-all flex items-center justify-between group ${voted === opt ? 'bg-celestial text-black border-celestial shadow-[0_0_15px_rgba(56,189,248,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'} ${loading ? 'opacity-50' : ''}`}>
                        <span>{opt}</span>
                        {voted === opt && <Check className="w-5 h-5" />}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <Modal isOpen={true} onClose={onClose} size="lg">
            <div className="relative">
                {section.imageUrl && <div className="w-full h-64 md:h-80"><img src={section.imageUrl} className="w-full h-full object-cover" /></div>}
                <div className="p-8">
                    <h2 className="text-4xl font-black mb-4 text-white">{section.title}</h2>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6"><p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{section.description}</p></div>

                    {section.pollOptions && section.pollOptions.length > 0 && (
                        <div className="mb-6 p-4 bg-white/5 rounded border border-white/10">
                            <h3 className="font-bold text-celestial mb-2">Votación</h3>
                            <SectionPoll options={section.pollOptions} id={section.id} />
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {section.buttons?.map(b => {
                            const click = (e) => {
                                e.stopPropagation();
                                if (b.type === 'form') {
                                    onOpenForm({ id: `section_${section.id}_${b.id}`, title: `${section.title} - ${b.label}`, customFields: b.customFields || [] });
                                } else {
                                    if (b.link) window.open(b.link, '_blank');
                                }
                            };
                            return <button key={b.id} onClick={click} className={renderButtonStyle(b) + " justify-center w-full"}>{b.label} {b.type === 'link' && <ExternalLink className="w-5 h-5" />}</button>
                        })}
                        {!section.buttons?.length && section.link && <a href={section.link} target="_blank" className="w-full py-3 rounded-xl bg-celestial text-black font-bold flex items-center justify-center gap-2 hover:bg-celestialDark">{section.linkText || 'Ver Más'} <ExternalLink className="w-5 h-5" /></a>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export const AnnouncementsModal = ({ isOpen, onClose, announcements, permission, onRequestPermission }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-celestial to-purple-400 bg-clip-text text-transparent">Buzón</h2>
                    {permission !== 'granted' && (
                        <button onClick={onRequestPermission} className="text-xs bg-celestial text-black px-3 py-1 rounded-full font-bold flex items-center gap-1 hover:scale-105 transition-transform">
                            <Bell className="w-3 h-3" /> Activar Avisos
                        </button>
                    )}
                </div>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {announcements.length === 0 && <p className="text-center text-gray-500 py-8 italic">No hay mensajes aún.</p>}
                    {announcements.map(a => (
                        <div key={a.id} className="bg-white/5 p-4 rounded-xl border-l-4 border-celestial relative overflow-hidden group">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg">{a.title}</h3>
                                <span className="text-[10px] text-gray-400 bg-black/30 px-2 py-1 rounded">{new Date(a.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{a.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
};
