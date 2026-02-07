import React from 'react';
import { Bell, X, BellOff, ExternalLink } from 'lucide-react';
import Modal from '../UI/Modal';

export const NotificationButton = ({ onClick, hasUnread }) => (
    <button
        onClick={onClick}
        className="p-3 bg-white/5 text-gray-400 rounded-full shadow-lg hover:text-white transition-all relative border border-white/5 active:scale-95"
    >
        <Bell className="w-5 h-5" />
        {hasUnread && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#0a0a0f] animate-pulse"></span>
        )}
    </button>
);

export const AnnouncementsModal = ({ isOpen, onClose, announcements, permission, onRequestPermission }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-3xl font-bold flex items-center gap-3">
                        <span className="text-2xl">📢</span> Buzón de Avisos
                    </h2>
                </div>

                {permission !== 'granted' && (
                    <div className="bg-sky-400/10 border border-sky-400/20 p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1">
                            <h4 className="font-bold text-sky-400 text-sm">¿Quieres recibir avisos al móvil?</h4>
                            <p className="text-xs text-gray-400">Activa las notificaciones para no perderte ningún cambio de última hora.</p>
                        </div>
                        <button
                            onClick={onRequestPermission}
                            className="bg-sky-400 text-black px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap hover:scale-105 transition-transform"
                        >
                            Activar Notificaciones
                        </button>
                    </div>
                )}

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {announcements.map((a, i) => (
                        <div key={a.id || i} className="bg-white/5 p-6 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all border-l-4 border-l-sky-400">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-white">{a.title}</h3>
                                <span className="text-[10px] text-gray-500 font-mono">{new Date(a.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-4xl mb-4 opacity-20">📭</div>
                            <p className="text-gray-500 italic">No hay avisos nuevos por ahora.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
