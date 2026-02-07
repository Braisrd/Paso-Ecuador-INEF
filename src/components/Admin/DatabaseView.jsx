import React, { useState, useEffect, useMemo } from 'react';
import { Upload, ChevronRight } from 'lucide-react';
import { db, collection, onSnapshot, query, where } from '../../services/firebase';

const DatabaseView = ({ onBack, events, specialSections }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [registrations, setRegistrations] = useState([]);

    const items = useMemo(() => {
        const evts = (events || []).map(e => ({ ...e, type: 'event', label: 'Evento' }));
        const sects = (specialSections || []).filter(s =>
            ((s.buttons || []).some(b => b.type === 'form')) ||
            ((s.pollOptions || []).length > 0)
        ).map(s => ({ ...s, type: 'section', label: 'Sección' }));
        return [...evts, ...sects];
    }, [events, specialSections]);

    const selectedItem = items.find(i => i.id === selectedId);

    useEffect(() => {
        if (!selectedId || !selectedItem) return;
        let u;
        if (selectedItem.type === 'event') {
            u = onSnapshot(query(collection(db, "event_registrations"), where("eventId", "==", selectedId)), s =>
                setRegistrations(s.docs.map(d => d.data()))
            );
        } else {
            u = onSnapshot(query(collection(db, "event_registrations"), where("eventId", ">=", `section_${selectedId}`), where("eventId", "<=", `section_${selectedId}\uf8ff`)), s =>
                setRegistrations(s.docs.map(d => d.data()))
            );
        }
        return () => u && u();
    }, [selectedId, selectedItem]);

    const exportToCSV = () => {
        if (!selectedItem || registrations.length === 0) return;
        const headers = ["ID Origen", "Nombre", "Email", ...Object.keys(registrations[0] || {}).filter(k => !['eventId', 'eventTitle', 'submittedAt', 'nombre', 'email'].includes(k)), "Fecha"];
        const rows = registrations.map(r => [
            r.eventTitle || '-',
            r.nombre || '-',
            r.email || '-',
            ...Object.keys(r).filter(k => !['eventId', 'eventTitle', 'submittedAt', 'nombre', 'email'].includes(k)).map(k => r[k]),
            r.submittedAt
        ].join("\t"));
        const csv = [headers.join("\t"), ...rows].join("\n");
        const blob = new Blob([csv], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedItem.title}_data.xls`;
        a.click();
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white p-8 flex flex-col animate-fade-in">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                <h1 className="text-3xl font-black text-sky-400">BASE DE DATOS</h1>
                <button onClick={onBack} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold transition-colors">Volver</button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
                <div className="w-full md:w-1/4 h-64 md:h-full overflow-y-auto pr-4 border-b md:border-b-0 md:border-r border-white/10 space-y-2 custom-scrollbar">
                    <h3 className="font-bold text-gray-400 mb-4 sticky top-0 bg-[#0a0a0f] py-2">Ítems</h3>
                    {items.map(e => (
                        <button
                            key={e.id}
                            onClick={() => setSelectedId(e.id)}
                            className={`w-full text-left p-3 rounded transition-all flex justify-between items-center ${selectedId === e.id ? 'bg-sky-400 text-black font-bold' : 'hover:bg-white/5 text-gray-300'}`}
                        >
                            <span className="truncate">{e.title}</span>
                            <span className="text-[10px] opacity-70 border px-1 rounded uppercase font-mono">{e.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto bg-black/20 rounded-2xl p-6 border border-white/5 custom-scrollbar">
                    {!selectedId && <div className="h-full flex items-center justify-center text-gray-500 italic">Selecciona un ítem de la izquierda para ver los registros.</div>}
                    {selectedItem && (
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h2 className="text-4xl font-bold mb-2">{selectedItem.title}</h2>
                                    <div className="text-gray-400 text-sm font-mono">ID: {selectedItem.id}</div>
                                </div>
                                <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-all">
                                    <Upload className="w-4 h-4 rotate-180" /> Exportar Excel
                                </button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div className="bg-white/5 p-4 rounded border border-white/10">
                                    <div className="text-sm text-gray-400">Tipo</div>
                                    <div className="text-2xl font-bold text-sky-400 uppercase">{selectedItem.type}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded border border-white/10">
                                    <div className="text-sm text-gray-400">Registros</div>
                                    <div className="text-2xl font-bold text-purple-400">{registrations.length}</div>
                                </div>
                            </div>

                            <h3 className="font-bold mb-4 text-sky-400">Registros Recibidos</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-400">
                                    <thead className="text-xs uppercase bg-white/5 text-gray-200">
                                        <tr>
                                            {["Origen", "Fecha", "Nombre", "Email", ...Object.keys(registrations[0] || {}).filter(k => !['eventId', 'eventTitle', 'submittedAt', 'nombre', 'email'].includes(k))].map(h => (
                                                <th key={h} className="px-4 py-3">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((r, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-2 text-xs text-gray-500">{r.eventTitle?.split('-')[1] || 'General'}</td>
                                                <td className="px-4 py-2">{new Date(r.submittedAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-2 font-bold text-white">{r.nombre || '-'}</td>
                                                <td className="px-4 py-2">{r.email || '-'}</td>
                                                {Object.keys(r).filter(k => !['eventId', 'eventTitle', 'submittedAt', 'nombre', 'email'].includes(k)).map(k => (
                                                    <td key={k} className="px-4 py-2">{typeof r[k] === 'object' ? JSON.stringify(r[k]) : r[k]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {registrations.length === 0 && <p className="text-center py-8 italic text-gray-600">No hay registros aún para este ítem.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DatabaseView;
