import React from 'react';
import { ExternalLink } from 'lucide-react';

const SpecialSections = ({ sections, onOpenSection, onOpenForm }) => {
    const activeSections = sections.filter(s => {
        if (!s.active) return false;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        if (s.startDate && new Date(s.startDate) > now) return false;
        if (s.endDate && new Date(s.endDate) < now) return false;
        return true;
    });

    if (activeSections.length === 0) return null;

    return (
        <>
            {activeSections.map(s => {
                const now = new Date(); now.setHours(0, 0, 0, 0);
                const end = s.endDate ? new Date(s.endDate) : null;
                const isLastDays = end && s.warningDays && (end - now) / (1000 * 60 * 60 * 24) <= s.warningDays && (end - now) >= 0;

                return (
                    <section key={s.id} className="py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
                        <div
                            className="glass-panel p-8 md:p-12 rounded-3xl border-l-4 border-sky-400 relative overflow-hidden group cursor-pointer"
                            onClick={() => onOpenSection(s)}
                        >
                            {isLastDays && (
                                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse z-20 shadow-lg border border-red-400">
                                    ⚠️ Últimos Días
                                </div>
                            )}
                            {s.imageUrl && (
                                <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/3 opacity-20">
                                    <img src={s.imageUrl} className="w-full h-full object-cover" alt="" />
                                </div>
                            )}
                            <div className="relative z-10 max-w-3xl">
                                <h2 className="text-4xl font-bold mb-4">{s.title}</h2>
                                <p className="text-lg text-gray-300 mb-6 whitespace-pre-line line-clamp-3">{s.description}</p>
                                <div className="flex flex-wrap gap-4">
                                    <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-sky-400 text-black hover:bg-sky-500 transition-colors">
                                        Ver Completo <ExternalLink className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}
        </>
    );
};

export default SpecialSections;
