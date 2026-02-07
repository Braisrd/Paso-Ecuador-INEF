import React from 'react';
import { Calendar as CalendarIcon, MapPin, ExternalLink } from 'lucide-react';
import Modal from '../UI/Modal';

const ActionButton = ({ event, onOpenForm }) => {
    if (event.actionType === 'none') return null;

    const baseClass = "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ";

    if (event.actionType === 'link' && event.actionLink) {
        return (
            <a
                href={event.actionLink}
                target="_blank"
                rel="noopener noreferrer"
                className={baseClass + "bg-sky-400 text-black shadow-lg shadow-sky-400/20"}
            >
                {event.actionLabel || 'Más Información'} <ExternalLink className="w-5 h-5" />
            </a>
        );
    }

    if (event.actionType === 'form') {
        return (
            <button
                onClick={() => onOpenForm(event)}
                className={baseClass + "bg-sky-400 text-black shadow-lg shadow-sky-400/20"}
            >
                {event.actionLabel || 'Inscribirse'}
            </button>
        );
    }

    return null;
};

const EventDetailModal = ({ event, onClose, onOpenForm }) => {
    const handleGoogleCalendar = () => {
        const title = encodeURIComponent(event.title);
        const description = encodeURIComponent(event.description || '');
        const location = encodeURIComponent(event.location || '');
        const date = event.date.replace(/-/g, '');
        const time = event.time ? event.time.replace(/:/g, '') + '00' : '000000';

        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${date}T${time}/${date}T235959&details=${description}&location=${location}`;
        window.open(url, '_blank');
    };

    return (
        <Modal isOpen={true} onClose={onClose} size="lg">
            <div className="relative animate-fade-in">
                {event.imageUrl && (
                    <div className="w-full h-64 md:h-80 overflow-hidden">
                        <img src={event.imageUrl} className="w-full h-full object-cover" alt={event.title} />
                    </div>
                )}
                <div className="p-8">
                    <div
                        className="inline-block px-3 py-1 mb-4 rounded-full text-xs font-bold uppercase border"
                        style={{
                            color: event.typeColor,
                            borderColor: event.typeColor,
                            backgroundColor: `${event.typeColor}20`
                        }}
                    >
                        {event.typeIcon} {event.typeName}
                    </div>

                    <h2 className="text-4xl font-black mb-2 text-white leading-tight">{event.title}</h2>

                    <div className="flex items-center gap-2 text-sky-400 font-bold mb-4">
                        <CalendarIcon className="w-5 h-5" />
                        {new Date(event.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                        {event.time && <span className="ml-1">| {event.time}</span>}
                    </div>

                    {event.location && (
                        <div className="flex items-center gap-2 text-gray-400 mb-6 font-medium">
                            <MapPin className="w-5 h-5" /> {event.location}
                        </div>
                    )}

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-6">
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <ActionButton event={event} onOpenForm={onOpenForm} />
                        <button
                            onClick={handleGoogleCalendar}
                            className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 flex items-center justify-center gap-2 text-gray-300 transition-all font-bold"
                        >
                            <CalendarIcon className="w-5 h-5" /> Añadir a Google Calendar
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default EventDetailModal;
export { ActionButton };
