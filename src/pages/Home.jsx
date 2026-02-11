import React, { useState, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    MapPin,
    ExternalLink,
    Settings,
    Lock,
    X,
    Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    db,
    collection,
    onSnapshot,
    query,
    orderBy,
    limit,
    doc,
    getDoc,
    setDoc
} from '../services/firebase';

// UI Components
import Modal from '../components/UI/Modal';
import Calendar from '../components/Calendar';
import SpecialSections from '../components/SpecialSections';
import { ScrollToTop } from '../components/Layout';

// Modal Components
import EventDetailModal, { ActionButton } from '../components/Modals/EventDetailModal';
import EventRegistrationModal from '../components/Modals/EventRegistrationModal';
import { AnnouncementsModal, NotificationButton } from '../components/Modals/AnnouncementsModal';

// Admin Components
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminLogin from '../components/Admin/AdminLogin';
import DatabaseView from '../components/Admin/DatabaseView';

import { usePWAInstall } from '../hooks/usePWA';
import { useNotifications } from '../hooks/useNotifications';

const Home = () => {
    // Data State
    const [events, setEvents] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [specialSections, setSpecialSections] = useState([]);

    // UI State
    const [view, setView] = useState('app'); // 'app' or 'database'
    const [selectedDay, setSelectedDay] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [expandedSection, setExpandedSection] = useState(null);
    const [regFormEvent, setRegFormEvent] = useState(null);
    const [statsEvent, setStatsEvent] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [showInbox, setShowInbox] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const { showInstall, isIOS, install, setShowInstall } = usePWAInstall();
    const { permission, requestPermission, fcmToken } = useNotifications();

    // Firebase Data Sync
    useEffect(() => {
        const qEvents = query(collection(db, "events"), orderBy("date", "asc"));
        const unsubEvents = onSnapshot(qEvents, (snapshot) => {
            setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubTypes = onSnapshot(doc(db, "config", "eventTypes"), (doc) => {
            if (doc.exists()) setEventTypes(doc.data().types || []);
        });

        const qAnnouncements = query(collection(db, "announcements"), orderBy("date", "desc"), limit(20));
        const unsubAnnouncements = onSnapshot(qAnnouncements, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAnnouncements(data);

            // Unread logic
            const lastViewed = localStorage.getItem('last_inbox_view');
            if (data.length > 0 && (!lastViewed || new Date(data[0].date) > new Date(lastViewed))) {
                setHasUnread(true);
            }
        });

        const unsubSpecial = onSnapshot(doc(db, "config", "specialSections"), (doc) => {
            if (doc.exists()) setSpecialSections(doc.data().sections || []);
        });

        return () => {
            unsubEvents();
            unsubTypes();
            unsubAnnouncements();
            unsubSpecial();
        };
    }, []);

    // Auto-prompt notifications for new users after delay
    useEffect(() => {
        if (permission === 'default') {
            const timer = setTimeout(() => {
                const lastPrompt = localStorage.getItem('last_notification_prompt');
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                if (!lastPrompt || (now - parseInt(lastPrompt)) > oneDay) {
                    setShowInbox(true);
                    localStorage.setItem('last_notification_prompt', now.toString());
                    console.log('Smart Onboarding: Triggering notification prompt');
                }
            }, 10000); // 10 second delay

            return () => clearTimeout(timer);
        }
    }, [permission]);

    const toggleInbox = () => {
        setShowInbox(true);
        setHasUnread(false);
        localStorage.setItem('last_inbox_view', new Date().toISOString());
    };

    const handleOpenStats = (event) => {
        // In the new unified view, stats are usually viewed in the DatabaseView
        // But we keep the pattern if needed for specific event stats modals
        setStatsEvent(event);
    };

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date().setHours(0, 0, 0, 0));

    if (view === 'database') {
        return (
            <DatabaseView
                events={events}
                specialSections={specialSections}
                onBack={() => setView('app')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-sky-500/30">
            <ScrollToTop />
            {/* Header / Top Actions */}
            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <NotificationButton onClick={toggleInbox} hasUnread={hasUnread} />
                {isAdmin && (
                    <button
                        onClick={() => setShowAdminPanel(true)}
                        className="p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/80 transition-all border border-primary/30"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={() => isAdmin ? setIsAdmin(false) : setShowLogin(true)}
                    className={`p-3 rounded-full shadow-lg transition-all ${isAdmin ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                >
                    <Lock className="w-5 h-5" />
                </button>
            </div>

            {/* Hero Section */}
            <section className="min-h-[90vh] flex flex-col items-center justify-center p-6 relative overflow-hidden bg-celestial">
                <div className="absolute inset-0 bg-sky-400/5 blur-[120px] pointer-events-none"></div>
                <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 animate-float">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(56,189,248,0.5)]" alt="Logo" />
                </div>
                <h1 className="text-6xl md:text-9xl font-black text-center tracking-tighter mb-4">
                    <span className="text-white">PASO DE </span>
                    <span className="text-sky-400 text-glow">ECUADOR</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 font-light tracking-[0.2em] mb-12 uppercase">INEF 25/26</p>
                <a href="#events" className="px-10 py-4 rounded-full bg-sky-400 text-black font-black text-lg hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all transform hover:scale-105">
                    PRÓXIMOS EVENTOS
                </a>
            </section>

            {/* Special Sections (Landing Content) */}
            <SpecialSections
                sections={specialSections}
                onOpenSection={setExpandedSection}
                onOpenForm={(sectionBtnEvent) => setRegFormEvent(sectionBtnEvent)}
            />

            {/* Events Horizontal Grid */}
            <section id="events" className="py-24 px-4 md:px-8 bg-celestial-gradient border-y border-white/5">
                <div className="max-w-7xl mx-auto w-full">
                    <h2 className="text-4xl font-bold mb-16 flex items-center gap-4">
                        <span className="w-2 h-12 bg-sky-400 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]"></span>
                        Próximamente
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {upcomingEvents.map(evt => (
                            <div
                                key={evt.id}
                                onClick={() => setExpandedEvent(evt)}
                                className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all group relative overflow-hidden flex flex-col cursor-pointer transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-sky-400/5"
                            >
                                <div
                                    className="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-black uppercase border bg-black/50 backdrop-blur-md z-10 tracking-widest"
                                    style={{ color: evt.typeColor, borderColor: evt.typeColor }}
                                >
                                    {evt.typeIcon} {evt.typeName}
                                </div>
                                {evt.imageUrl && (
                                    <div className="w-full h-56 mb-6 rounded-3xl overflow-hidden relative">
                                        <img src={evt.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={evt.title} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                            <span className="text-white font-bold text-sm">Ver Detalles</span>
                                        </div>
                                    </div>
                                )}
                                <div className="text-sky-400 font-black tracking-widest text-xs mb-3 uppercase">
                                    {new Date(evt.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    {evt.time && <span className="ml-2">• {evt.time}</span>}
                                </div>
                                <h3 className="text-3xl font-black text-white mb-3 leading-tight group-hover:text-sky-400 transition-colors">
                                    {evt.title}
                                </h3>
                                {evt.location && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                        <MapPin className="w-4 h-4 text-sky-400" /> {evt.location}
                                    </div>
                                )}
                                <div className="mt-auto" onClick={e => e.stopPropagation()}>
                                    <ActionButton event={evt} onOpenForm={setRegFormEvent} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Liga Multisport Teaser */}
            <section className="relative py-40 overflow-hidden bg-deep">
                <div className="absolute inset-0 bg-transparent"></div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="animate-fade-in-left">
                        <h2 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-none">
                            <span className="bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">LIGA</span><br />
                            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]">MULTISPORT</span>
                        </h2>
                        <p className="text-gray-400 text-xl mb-12 leading-relaxed max-w-md font-medium">
                            Compite en torneos exclusivos, acumula puntos para el ranking anual y conviértete en la leyenda de INEF.
                        </p>
                        <Link
                            to="/liga"
                            className="inline-flex items-center gap-4 px-10 py-5 rounded-full bg-gradient-to-r from-primary to-secondary text-white font-black text-xl hover:scale-105 transition-all shadow-[0_10px_40px_rgba(79,70,229,0.3)] active:scale-95"
                        >
                            VER CLASIFICACIÓN <ExternalLink className="w-6 h-6" />
                        </Link>
                    </div>
                    <div className="relative group animate-fade-in-right">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity duration-1000"></div>
                        <div className="glass-panel p-8 rounded-[3rem] border border-white/10 transform rotate-[-3deg] group-hover:rotate-1 transition-all duration-700 shadow-2xl bg-black/40 backdrop-blur-xl">
                            <div className="flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center font-black text-black text-2xl border-2 border-yellow-200 outline outline-4 outline-yellow-400/20">#1</div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Top Ranking</div>
                                    <div className="font-black text-2xl text-white">LÍDER</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 bg-white/5 rounded-full w-full overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-indigo-500/50 w-3/4"></div>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full w-5/6 overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-purple-500/50 w-1/2"></div>
                                </div>
                                <div className="h-4 bg-white/5 rounded-full w-2/3 overflow-hidden relative">
                                    <div className="absolute inset-y-0 left-0 bg-indigo-500/50 w-2/3"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Calendar Section */}
            <section className="py-24 px-4 md:px-8 bg-celestial-gradient">
                <div className="max-w-6xl mx-auto w-full">
                    <Calendar
                        events={events}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        currentYear={currentYear}
                        setCurrentYear={setCurrentYear}
                        onSelectDay={setSelectedDay}
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-white/5 bg-deep">
                <div className="flex flex-col items-center gap-8">
                    <div className="flex gap-8">
                        <a
                            href="https://www.instagram.com/pasoecuadorinef26/"
                            target="_blank"
                            className="p-5 bg-white/5 rounded-full hover:bg-gradient-to-br hover:from-purple-600 hover:to-orange-500 transition-all hover:scale-110 border border-white/5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                        </a>
                        <a
                            href="https://www.tiktok.com/@pasoecuadorinef26"
                            target="_blank"
                            className="p-5 bg-white/5 rounded-full hover:bg-black hover:border hover:border-sky-400 hover:text-sky-400 transition-all hover:scale-110 border border-white/5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                        </a>
                    </div>
                    <p className="text-gray-600 text-xs font-bold tracking-widest uppercase">
                        © 2025 Paso de Ecuador INEF 25/26
                    </p>
                </div>
            </footer >

            {/* MODALS LAYER */}

            {/* Day detail (from calendar) */}
            <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)}>
                {selectedDay && (
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-3xl font-black capitalize">
                                {new Date(selectedDay.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {selectedDay.events.map(evt => (
                                <div
                                    key={evt.id}
                                    onClick={() => { setExpandedEvent(evt); setSelectedDay(null); }}
                                    className="bg-white/5 p-6 rounded-3xl border-l-4 cursor-pointer hover:bg-white/10 transition-all group"
                                    style={{ borderColor: evt.typeColor }}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-xl group-hover:text-sky-400 transition-colors">{evt.title}</div>
                                            <div className="text-xs opacity-50 flex items-center gap-2 mt-1 uppercase tracking-widest">{evt.typeIcon} {evt.typeName}</div>
                                        </div>
                                        <div className="text-xs text-sky-400 font-bold uppercase border border-sky-400/30 px-3 py-1 rounded-full group-hover:bg-sky-400 group-hover:text-black transition-all">Ver Más</div>
                                    </div>
                                </div>
                            ))}
                            {selectedDay.events.length === 0 && (
                                <p className="text-center text-gray-500 py-12 italic">No hay eventos programados para este día.</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Main Event Detail */}
            {
                expandedEvent && (
                    <EventDetailModal
                        event={expandedEvent}
                        onClose={() => setExpandedEvent(null)}
                        onOpenForm={(e) => { setExpandedEvent(null); setRegFormEvent(e); }}
                    />
                )
            }

            {/* Section Detail (Landing) */}
            <Modal isOpen={!!expandedSection} onClose={() => setExpandedSection(null)}>
                {expandedSection && (
                    <div className="relative">
                        {expandedSection.imageUrl && (
                            <div className="w-full h-80">
                                <img src={expandedSection.imageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                        )}
                        <div className="p-8">
                            <h2 className="text-4xl font-black mb-4 text-white">{expandedSection.title}</h2>
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/10 mb-8">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">{expandedSection.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {(expandedSection.buttons || []).map(b => (
                                    <button
                                        key={b.id}
                                        className="px-8 py-3 rounded-xl font-bold bg-sky-400 text-black hover:bg-sky-500 transition-all shadow-lg"
                                        onClick={() => {
                                            if (b.type === 'form') {
                                                setRegFormEvent({
                                                    id: `section_${expandedSection.id}_${b.id}`,
                                                    title: `${expandedSection.title} - ${b.label}`,
                                                    customFields: b.customFields || []
                                                });
                                                setExpandedSection(null);
                                            } else if (b.link) {
                                                window.open(b.link, '_blank');
                                            }
                                        }}
                                    >
                                        {b.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Registration Form */}
            {
                regFormEvent && (
                    <EventRegistrationModal
                        event={regFormEvent}
                        onClose={() => setRegFormEvent(null)}
                    />
                )
            }

            {/* Announcements / Inbox */}
            <AnnouncementsModal
                isOpen={showInbox}
                onClose={() => setShowInbox(false)}
                announcements={announcements}
                permission={permission}
                onRequestPermission={requestPermission}
            />

            {/* Admin Login */}
            {
                showLogin && (
                    <AdminLogin
                        onClose={() => setShowLogin(false)}
                        onSuccess={() => { setIsAdmin(true); setShowLogin(false); setShowAdminPanel(true); }}
                    />
                )
            }

            {/* Admin Dashboard */}
            <AdminDashboard
                isOpen={showAdminPanel}
                onClose={() => setShowAdminPanel(false)}
                events={events}
                eventTypes={eventTypes}
                announcements={announcements}
                specialSections={specialSections}
                onOpenDB={() => { setShowAdminPanel(false); setView('database'); }}
                onOpenStats={handleOpenStats}
                fcmToken={fcmToken}
            />

            {/* Install Prompt Overlay (Mobile) */}
            {
                showInstall && !isIOS && (
                    <div className="fixed bottom-6 left-6 right-6 z-[100] animate-fade-in-up">
                        <div className="bg-[#13131f] border border-sky-400/30 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 relative">
                            <button onClick={() => setShowInstall(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                            <div className="w-14 h-14 bg-sky-400/10 rounded-2xl flex items-center justify-center text-3xl">📲</div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-lg">Instalar App</h4>
                                <p className="text-xs text-gray-400">Accede más rápido y sin conexión desde tu pantalla de inicio.</p>
                            </div>
                            <button onClick={install} className="bg-sky-400 text-black px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all">
                                Instalar
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Home;
