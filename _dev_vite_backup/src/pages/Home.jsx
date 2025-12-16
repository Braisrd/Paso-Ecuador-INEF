import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Settings, Lock, X, MapPin, ExternalLink, Calendar, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { AdminDashboard } from '../components/AdminDashboard';
import { DatabaseView } from '../components/DatabaseView';
import { EventDetailModal, SectionDetailModal, EventRegistrationModal, AnnouncementsModal, ActionButton } from '../components/EventModals';
import {
    collection,
    db,
    onSnapshot,
    query,
    orderBy,
    limit,
    getDoc,
    setDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    messaging,
    getToken,
    onMessage
} from '../firebase';

const HOLIDAYS = [{ date: '2025-01-01', name: 'Año Nuevo' }, { date: '2025-01-06', name: 'Reyes' }, { date: '2025-04-18', name: 'Viernes Santo' }, { date: '2025-05-01', name: 'Día del Trabajo' }, { date: '2025-08-15', name: 'Asunción' }, { date: '2025-10-12', name: 'Fiesta Nacional' }, { date: '2025-11-01', name: 'Todos los Santos' }, { date: '2025-12-06', name: 'Constitución' }, { date: '2025-12-08', name: 'Inmaculada' }, { date: '2025-12-25', name: 'Navidad' }];
const DEFAULT_EVENT_TYPES = [{ id: 'party', name: 'Fiesta', color: '#ec4899', icon: '🎉' }, { id: 'tournament', name: 'Torneo', color: '#f59e0b', icon: '🏆' }, { id: 'tickets', name: 'Entradas', color: '#8b5cf6', icon: '🎫' }, { id: 'special', name: 'Evento Especial', color: '#10b981', icon: '⭐' }];

const usePWAInstall = () => {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);

    useEffect(() => {
        // Check if already captured (global var check is tricky in React modules, but we can try attaching to window)
        // In this architecture, it's better to just listen.
        const handler = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowInstall(true);
            console.log('Install prompt captured in hook');
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowInstall(false);
        }
        setInstallPrompt(null);
    };

    return { showInstall, install };
};

const AdminLogin = ({ onClose, onSuccess }) => {
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const docRef = doc(db, 'config', 'settings');
            const docSnap = await getDoc(docRef);
            let correctPass = 'PasoWeb2526';
            if (docSnap.exists()) {
                correctPass = docSnap.data().adminPassword || 'PasoWeb2526';
            } else {
                await setDoc(docRef, { adminPassword: 'PasoWeb2526' });
            }

            if (pass === correctPass) {
                onSuccess();
            } else {
                alert('Contraseña incorrecta');
            }
        } catch (err) {
            console.error(err);
            alert('Error de verificación');
        } finally {
            setLoading(false);
        }
    };
    return <Modal isOpen={true} onClose={onClose}><div className="p-8 text-center"><h2 className="text-2xl font-bold mb-4">Acceso Admin</h2><form onSubmit={handleLogin}><input type="password" autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-center text-white text-xl tracking-widest mb-4 placeholder-gray-600" placeholder="••••" value={pass} onChange={e => setPass(e.target.value)} /><div className="flex gap-2 justify-center"><button type="button" onClick={onClose} className="px-4 py-2 text-gray-400">Cancelar</button><button disabled={loading} className="px-6 py-2 bg-celestial text-black font-bold rounded-lg hover:opacity-90">{loading ? '...' : 'Entrar'}</button></div></form></div></Modal>;
};

const NotificationButton = ({ onClick, hasUnread }) => (
    <button onClick={onClick} className="relative p-3 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
        <Bell className="w-5 h-5" />
        {hasUnread && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0f]"></span>}
    </button>
);

const Home = () => {
    const [view, setView] = useState('app'); // 'app' | 'database'
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [regFormEvent, setRegFormEvent] = useState(null);
    // const [statsEvent, setStatsEvent] = useState(null); // Not used in ported code yet
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [events, setEvents] = useState([]);
    const [eventTypes, setEventTypes] = useState(DEFAULT_EVENT_TYPES);
    const [specialSections, setSpecialSections] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDay, setSelectedDay] = useState(null);

    const { showInstall, install } = usePWAInstall();

    // Inbox State
    const [showInbox, setShowInbox] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [permission, setPermission] = useState(Notification.permission);

    const toggleInbox = () => {
        setShowInbox(!showInbox);
        if (!showInbox && announcements.length > 0) {
            setHasUnread(false);
            localStorage.setItem('lastReadAnnouncement', new Date().toISOString());
        }
    };

    const subscribeUser = async (silent = false) => {
        try {
            if (!silent) alert('Activa las notificaciones para estar al tanto de los eventos, torneos y avisos importantes del Paso. ¡No te pierdas nada!');
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm === 'granted') {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
                const token = await getToken(messaging, {
                    vapidKey: 'BJZr34oV68SKsSBbxY-rB7xzbcKQ4DjIIsgtW-y8SW5I-4dGHIpeHsmIo7mQEMMXNK8ov5RqMRKw7-IWD1_Oa4M',
                    serviceWorkerRegistration: registration
                });

                if (token) {
                    console.log('Token:', token);
                    const tokenRef = doc(db, "fcm_tokens", token);
                    await setDoc(tokenRef, {
                        token: token,
                        date: new Date().toISOString(),
                        userAgent: navigator.userAgent
                    });
                    if (!silent) alert('¡Genial! Has activado los avisos para no perderte nada del Paso.');
                    return true;
                }
            } else {
                if (!silent) alert('Has bloqueado las notificaciones. Actívalas en la configuración del navegador.');
            }
        } catch (e) {
            console.error(e);
            if (!silent) alert('Error al suscribir: ' + e.message);
        }
        return false;
    };

    // Auto subscribe helper
    useEffect(() => {
        window.subscribeUser = subscribeUser; // Attach to window for compatibility if needed
    }, []);

    useEffect(() => {
        if (!db) return;
        const u1 = onSnapshot(query(collection(db, "events"), orderBy("date", "asc")), s => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const u2 = onSnapshot(doc(db, "config", "eventTypes"), d => setEventTypes(d.exists() ? (d.data().types || DEFAULT_EVENT_TYPES) : DEFAULT_EVENT_TYPES));
        const u3 = onSnapshot(doc(db, "config", "specialSections"), d => setSpecialSections(d.exists() ? (d.data().sections || []) : []));

        // Announcements Logic
        const u4 = onSnapshot(query(collection(db, "announcements"), orderBy("date", "desc"), limit(20)), s => {
            const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
            setAnnouncements(data);
            const lastRead = localStorage.getItem('lastReadAnnouncement');
            if (data.length > 0 && (!lastRead || new Date(data[0].date) > new Date(lastRead))) {
                setHasUnread(true);
            }
        });

        return () => { u1(); u2(); u3(); u4(); };
    }, []);

    // Messaging Logic
    useEffect(() => {
        if (permission === 'granted' && messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received. ', payload);
                const title = payload.notification?.title || 'Nuevo Mensaje';
                const body = payload.notification?.body || '';
                setHasUnread(true);
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-[#13131f] border border-celestial text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-fade-in-up flex items-center gap-4';
                toast.innerHTML = `<div class="text-2xl">🔔</div><div><div class="font-bold">${title}</div><div class="text-sm text-gray-400">${body}</div></div>`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 5000);
            });
        }
    }, [permission]);

    const monthData = useMemo(() => {
        const dt = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const startOff = dt.getDay() === 0 ? 6 : dt.getDay() - 1;
        return { days: Array(startOff).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1)), name: dt.toLocaleString('es-ES', { month: 'long' }).toUpperCase() };
    }, [currentMonth, currentYear]);

    const upcoming = events.filter(e => new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
    const handleDayNav = (dir) => {
        if (!selectedDay) return;
        const curr = new Date(selectedDay.date);
        curr.setDate(curr.getDate() + dir);
        const dateStr = curr.toISOString().split('T')[0];
        setSelectedDay({ date: dateStr, events: events.filter(e => e.date === dateStr), holiday: HOLIDAYS.find(h => h.date === dateStr) });
    };

    if (view === 'database') return <DatabaseView events={events} specialSections={specialSections} onBack={() => setView('app')} />;

    return (
        <div className="min-h-screen flex flex-col relative font-sans bg-dark text-white">
            {selectedDay && (
                <Modal isOpen={true} onClose={() => setSelectedDay(null)}>
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-6"><button onClick={() => handleDayNav(-1)} className="p-3 bg-white/5 rounded-full hover:bg-white/20"><ChevronLeft className="w-6 h-6" /></button><div className="text-center"><h2 className="text-3xl font-black capitalize">{new Date(selectedDay.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>{selectedDay.holiday && <div className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm font-bold">{selectedDay.holiday.name}</div>}</div><button onClick={() => handleDayNav(1)} className="p-3 bg-white/5 rounded-full hover:bg-white/20"><ChevronRight className="w-6 h-6" /></button></div>
                        <div className="space-y-4">{selectedDay.events.map(evt => (<div key={evt.id} onClick={() => setExpandedEvent(evt)} className="bg-white/5 p-5 rounded-2xl border-l-4 space-y-2 cursor-pointer hover:bg-white/10 transition-colors" style={{ borderColor: evt.typeColor }}><div className="flex justify-between items-start"><div><div className="font-bold text-xl">{evt.title}</div><div className="text-sm opacity-70 flex items-center gap-2">{evt.typeIcon} {evt.typeName}</div></div><button className="text-xs text-celestial border border-celestial px-2 py-1 rounded-full uppercase">Ver Detalle</button></div></div>))}{selectedDay.events.length === 0 && !selectedDay.holiday && <p className="text-center text-gray-500 py-8 italic">No hay eventos.</p>}</div>
                    </div>
                </Modal>
            )}
            {expandedSection && <SectionDetailModal section={expandedSection} onClose={() => setExpandedSection(null)} onOpenForm={(e) => { setExpandedSection(null); setRegFormEvent(e); }} />}
            {expandedEvent && <EventDetailModal event={expandedEvent} onClose={() => setExpandedEvent(null)} onOpenForm={(e) => { setExpandedEvent(null); setRegFormEvent(e); }} />}
            {regFormEvent && <EventRegistrationModal event={regFormEvent} onClose={() => setRegFormEvent(null)} />}

            {showLogin && <AdminLogin onClose={() => setShowLogin(false)} onSuccess={() => { setIsAdmin(true); setShowLogin(false); setShowAdminPanel(true); }} />}
            {showAdminPanel && <AdminDashboard isOpen={true} onClose={() => setShowAdminPanel(false)} events={events} eventTypes={eventTypes} announcements={announcements} onOpenDB={() => { setShowAdminPanel(false); setView('database'); }} onSaveEvent={async (data, id) => { const et = eventTypes.find(t => t.id === data.typeId); const ed = { ...data, typeColor: et?.color || '#38bdf8', typeIcon: et?.icon || '📌', typeName: et?.name || 'Evento' }; if (id) await updateDoc(doc(db, "events", id), ed); else await addDoc(collection(db, "events"), { ...ed, surveyCount: 0 }); alert('Guardado'); }} onDeleteEvent={id => confirm('¿Eliminar?') && deleteDoc(doc(db, "events", id))} onAddEventType={t => { const u = [...eventTypes, t]; setEventTypes(u); setDoc(doc(db, "config", "eventTypes"), { types: u }) }} onDeleteEventType={id => { const u = eventTypes.filter(t => t.id !== id); setEventTypes(u); setDoc(doc(db, "config", "eventTypes"), { types: u }) }} specialSections={specialSections} onUpdateSpecialSections={setSpecialSections} />}

            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <button onClick={() => subscribeUser()} className="flex items-center gap-2 px-3 py-2 bg-white/5 text-celestial rounded-full shadow-lg hover:bg-white/10 transition-colors border border-celestial/30 text-xs font-bold uppercase"><span className="text-lg">📡</span> Activar Avisos</button>
                <NotificationButton onClick={toggleInbox} hasUnread={hasUnread} />
                {isAdmin && <button onClick={() => setShowAdminPanel(true)} className="p-3 bg-celestial text-black rounded-full shadow-lg hover:bg-celestialDark transition-colors"><Settings className="w-5 h-5" /></button>}
                <button onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)} className={`p-3 rounded-full shadow-lg transition-colors ${isAdmin ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}><Lock className="w-5 h-5" /></button>
            </div>

            {showInbox && <AnnouncementsModal isOpen={true} onClose={() => setShowInbox(false)} announcements={announcements} permission={permission} onRequestPermission={subscribeUser} />}

            {showInstall && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-fade-in-up flex justify-center">
                    <div className="bg-[#13131f] border border-white/10 p-4 rounded-2xl shadow-2xl max-w-md w-full flex items-center gap-4 relative">
                        <button onClick={() => setShowInstall(false)} className="absolute top-2 right-2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                        <div className="w-12 h-12 bg-celestial/20 rounded-xl flex items-center justify-center text-2xl">📲</div>
                        <div className="flex-1">
                            <h4 className="font-bold text-white">Instalar App</h4>
                            <p className="text-xs text-gray-400">Añade a inicio para acceso rápido y sin conexión.</p>
                        </div>
                        <button onClick={install} className="bg-celestial text-black px-4 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-transform">
                            Instalar
                        </button>
                    </div>
                </div>
            )}

            <section className="min-h-[85vh] flex flex-col items-center justify-center p-6 relative clip-diagonal bg-[#0a0a0f]">
                <div className="absolute inset-0 bg-celestial/10 blur-[100px] pointer-events-none"></div>
                <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 animate-float"><img src="/liga-multisport/logo.png" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]" alt="Logo" /></div>
                <h1 className="text-5xl md:text-8xl font-black text-center tracking-tighter mb-4"><span className="text-white">PASO DE </span><span className="text-celestial text-glow">ECUADOR</span></h1>
                <p className="text-xl md:text-2xl text-gray-400 font-light tracking-wide mb-12">INEF 25/26</p>
                <a href="#events" onClick={() => subscribeUser(true)} className="px-8 py-3 rounded-full bg-celestial text-black font-bold text-lg hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all">Próximos Eventos</a>
            </section>

            {specialSections.filter(s => {
                if (!s.active) return false;
                const now = new Date(); now.setHours(0, 0, 0, 0);
                if (s.startDate && new Date(s.startDate) > now) return false;
                if (s.endDate && new Date(s.endDate) < now) return false;
                return true;
            }).map(s => {
                const now = new Date(); now.setHours(0, 0, 0, 0);
                const end = s.endDate ? new Date(s.endDate) : null;
                const isLastDays = end && s.warningDays && (end - now) / (1000 * 60 * 60 * 24) <= s.warningDays && (end - now) >= 0;
                const renderMainButtonStyle = (b) => {
                    // Duplicate logic or export helper? I'll re-inline for simplicity or use helper if I exported it
                    // Creating inline simplified since I didn't export it from EventModals
                    return "inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all hover:scale-105 bg-white/10 text-white";
                }
                return (
                    <section key={s.id} className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
                        <div className="glass-panel p-8 md:p-12 rounded-3xl border-l-4 border-celestial relative overflow-hidden group cursor-pointer" onClick={() => setExpandedSection(s)}>
                            {isLastDays && <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse z-20 shadow-lg border border-red-400">⚠️ Últimos Días</div>}
                            {s.imageUrl && <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/3 opacity-20"><img src={s.imageUrl} className="w-full h-full object-cover" /></div>}
                            <div className="relative z-10 max-w-3xl">
                                <h2 className="text-4xl font-bold mb-4">{s.title}</h2>
                                <p className="text-lg text-gray-300 mb-6 whitespace-pre-line line-clamp-3">{s.description}</p>
                                <div className="flex flex-wrap gap-4">
                                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-celestial text-black hover:bg-celestialDark transition-colors">Ver Completo <ExternalLink className="w-5 h-5" /></button>
                                    {(s.buttons || []).map(b => (
                                        <button key={b.id} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all hover:scale-105 bg-white/10 text-white" onClick={e => {
                                            e.stopPropagation();
                                            if (b.type === 'form') {
                                                setRegFormEvent({ id: `section_${s.id}_${b.id}`, title: `${s.title} - ${b.label}`, customFields: b.customFields || [] });
                                            } else if (b.link) {
                                                window.open(b.link, '_blank');
                                            }
                                        }}>{b.label}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                )
            })}

            <section id="events" className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
                <h2 className="text-4xl font-bold mb-12 flex items-center gap-4"><span className="w-2 h-12 bg-celestial rounded-full"></span>Próximamente</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map(evt => (
                        <div key={evt.id} onClick={() => setExpandedEvent(evt)} className="glass-panel p-6 rounded-3xl hover:bg-[#1c1c2e] transition-all group relative overflow-hidden flex flex-col cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-celestial/10">
                            <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase border bg-black/50 backdrop-blur-md z-10" style={{ color: evt.typeColor, borderColor: evt.typeColor }}>{evt.typeIcon} {evt.typeName}</div>
                            {evt.imageUrl && <div className="w-full h-48 mb-4 rounded-xl overflow-hidden"><img src={evt.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>}
                            <div className="text-celestial font-bold tracking-wider text-sm mb-2">{new Date(evt.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} {evt.time && <span>• {evt.time}</span>}</div>
                            <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{evt.title}</h3>
                            {evt.location && <div className="flex items-center gap-2 text-gray-400 text-sm mb-3"><MapPin className="w-4 h-4" /> {evt.location}</div>}
                            {evt.description && <p className="text-gray-400 text-sm mb-4 line-clamp-3">{evt.description}</p>}
                            <div className="mt-auto" onClick={e => e.stopPropagation()}><ActionButton event={evt} onOpenForm={setRegFormEvent} /></div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="relative py-32 bg-[#050507]">
                <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0a0a0f] to-[#050507]"></div>
                <section className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center"><div><h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter"><span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">LIGA</span><br /><span className="bg-gradient-to-r from-ligaPrimary to-ligaSecondary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">MULTISPORT</span></h2><p className="text-gray-400 text-lg mb-8 leading-relaxed max-w-md">Compite en torneos, acumula puntos y lidera el ranking anual.</p><Link to="/liga" className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-ligaPrimary to-ligaSecondary text-white font-black text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(236,72,153,0.4)]">VER CLASIFICACIÓN <ExternalLink className="w-6 h-6" /></Link></div><div className="relative group"><div className="absolute inset-0 bg-gradient-to-r from-ligaPrimary to-ligaSecondary blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div><div className="glass-panel p-6 rounded-3xl border-t border-white/10 transform rotate-[-3deg] group-hover:rotate-0 transition-all duration-500 md:translate-x-12"><div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center font-bold text-black border-2 border-yellow-200">#1</div><div><div className="text-sm text-gray-400">Líder Actual</div><div className="font-bold text-xl">Tu Nombre Aquí</div></div></div><div className="space-y-3 opacity-50"><div className="h-4 bg-white/20 rounded w-3/4"></div><div className="h-4 bg-white/20 rounded w-full"></div></div></div></div></section><div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-[#050507]"></div>
            </div>

            <section className="py-20 px-4 md:px-8 max-w-5xl mx-auto w-full">
                <div className="glass-panel p-8 rounded-[2.5rem]">
                    <div className="flex justify-between items-center mb-8"><h2 className="text-3xl font-bold uppercase tracking-widest text-celestial">{monthData.name} <span className="text-white/30">{currentYear}</span></h2><div className="flex gap-2"><button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else { setCurrentMonth(currentMonth - 1); } }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-6 h-6" /></button><button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else { setCurrentMonth(currentMonth + 1); } }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-6 h-6" /></button></div></div>
                    <div className="grid grid-cols-7 gap-2 md:gap-4 text-center">
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} className="font-bold text-gray-500 py-2">{d}</div>)}
                        {monthData.days.map((d, i) => {
                            if (!d) return <div key={i}></div>;
                            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            const dayEvents = events.filter(e => e.date === dateStr);
                            const holiday = HOLIDAYS.find(h => h.date === dateStr);
                            const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth, d).getDay());
                            const uniqueIcons = [...new Set(dayEvents.map(e => e.typeIcon))].slice(0, 3);

                            return (
                                <div key={i} onClick={() => setSelectedDay({ date: dateStr, events: dayEvents, holiday })} className={`aspect-square flex flex-col items-center justify-start pt-2 rounded-xl text-lg font-bold relative group transition-all cursor-pointer border border-transparent ${holiday ? 'bg-red-500/10 text-red-400 border-red-500/20' : isWeekend ? 'bg-blue-500/10 text-blue-300' : 'hover:bg-white/5 text-gray-300'} ${dayEvents.length > 0 ? 'ring-1 ring-celestial/50 bg-celestial/5' : ''}`}>
                                    {d}
                                    <div className="absolute top-1 right-1 flex gap-0.5">{uniqueIcons.map((ic, ix) => <span key={ix} className="text-[10px] leading-none">{ic}</span>)}</div>
                                    <div className="flex flex-col gap-1 w-full px-1 mt-auto pb-1">{dayEvents.slice(0, 3).map((evt, idx) => (<div key={idx} className="h-1.5 md:h-5 md:px-2 md:py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold truncate w-full text-left flex items-center" style={{ backgroundColor: evt.typeColor, color: '#000' }} title={evt.title}><span className="hidden md:inline">{evt.title}</span></div>))}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <footer className="mt-auto py-12 border-t border-white/5 bg-[#050507]"><div className="flex flex-col items-center gap-8"><div className="flex gap-6"><a href="https://www.instagram.com/pasoecuadorinef26/" target="_blank" className="p-4 bg-white/5 rounded-full hover:bg-gradient-to-br hover:from-purple-600 hover:to-orange-500 transition-all hover:scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg></a><a href="https://www.tiktok.com/@pasoecuadorinef26" target="_blank" className="p-4 bg-white/5 rounded-full hover:bg-black hover:border hover:border-celestial hover:text-celestial transition-all hover:scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg></a></div><div className="text-gray-600 text-sm">© 2025 Paso de Ecuador INEF 25/26</div></div></footer>
        </div>
    );
};

export default Home;
