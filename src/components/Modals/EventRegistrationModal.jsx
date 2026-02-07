import React, { useState } from 'react';
import Modal from '../UI/Modal';
import { db, collection, addDoc } from '../../services/firebase';

const EventRegistrationModal = ({ event, onClose }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addDoc(collection(db, "event_registrations"), {
                eventId: event.id,
                eventTitle: event.title,
                submittedAt: new Date().toISOString(),
                ...formData
            });
            alert('¡Inscripción Enviada con éxito!');
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al enviar la inscripción. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose}>
            <div className="p-8">
                <h2 className="text-2xl font-bold mb-2">Inscripción</h2>
                <h3 className="text-xl text-sky-400 mb-6">{event.title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {event.customFields?.map(f => (
                        <div key={f.id}>
                            <label className="block text-sm font-bold text-gray-400 mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                                <select
                                    required
                                    className="w-full bg-black/40 p-3 rounded border border-white/10 text-white focus:border-sky-400 outline-none"
                                    onChange={e => setFormData({ ...formData, [f.label]: e.target.value })}
                                >
                                    <option value="">Selecciona...</option>
                                    {f.options.split(',').map(o => (
                                        <option key={o} value={o.trim()}>{o.trim()}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    required
                                    type={f.type}
                                    className="w-full bg-black/40 p-3 rounded border border-white/10 text-white focus:border-sky-400 outline-none"
                                    placeholder={f.label}
                                    onChange={e => setFormData({ ...formData, [f.label]: e.target.value })}
                                />
                            )}
                        </div>
                    ))}
                    <button
                        disabled={loading}
                        className="w-full bg-sky-400 text-black font-bold py-3 rounded-xl mt-4 hover:bg-sky-500 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Enviando...' : 'Confirmar Inscripción'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-2">
                        Al inscribirte, aceptas que tus datos sean compartidos con la organización.
                    </p>
                </form>
            </div>
        </Modal>
    );
};

export default EventRegistrationModal;
