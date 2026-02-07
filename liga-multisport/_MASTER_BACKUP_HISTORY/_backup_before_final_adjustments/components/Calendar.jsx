import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HOLIDAYS = [{ date: '2025-01-01', name: 'Año Nuevo' }, { date: '2025-01-06', name: 'Reyes' }, { date: '2025-04-18', name: 'Viernes Santo' }, { date: '2025-05-01', name: 'Día del Trabajo' }, { date: '2025-08-15', name: 'Asunción' }, { date: '2025-10-12', name: 'Fiesta Nacional' }, { date: '2025-11-01', name: 'Todos los Santos' }, { date: '2025-12-06', name: 'Constitución' }, { date: '2025-12-08', name: 'Inmaculada' }, { date: '2025-12-25', name: 'Navidad' }];

const Calendar = ({ events, currentMonth, setCurrentMonth, currentYear, setCurrentYear, onSelectDay }) => {
    const monthData = useMemo(() => {
        const dt = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const startOff = dt.getDay() === 0 ? 6 : dt.getDay() - 1;
        return {
            days: Array(startOff).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1)),
            name: dt.toLocaleString('es-ES', { month: 'long' }).toUpperCase()
        };
    }, [currentMonth, currentYear]);

    const handlePrev = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNext = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <div className="glass-panel p-8 rounded-[2.5rem] w-full max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold uppercase tracking-widest text-celestial">
                    {monthData.name} <span className="text-white/30">{currentYear}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={handlePrev} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={handleNext} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2 md:gap-4 text-center">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <div key={d} className="font-bold text-gray-500 py-2">{d}</div>
                ))}
                {monthData.days.map((d, i) => {
                    if (!d) return <div key={i}></div>;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const dayEvents = events.filter(e => e.date === dateStr);
                    const holiday = HOLIDAYS.find(h => h.date === dateStr);
                    const isWeekend = [0, 6].includes(new Date(currentYear, currentMonth, d).getDay());
                    const uniqueIcons = [...new Set(dayEvents.map(e => e.typeIcon))].slice(0, 3);

                    return (
                        <div
                            key={i}
                            onClick={() => onSelectDay({ date: dateStr, events: dayEvents, holiday })}
                            className={`aspect-square flex flex-col items-center justify-start pt-2 rounded-xl text-lg font-bold relative group transition-all cursor-pointer border border-transparent 
                                ${holiday ? 'bg-red-500/10 text-red-400 border-red-500/20' : isWeekend ? 'bg-blue-500/10 text-blue-300' : 'hover:bg-white/5 text-gray-300'} 
                                ${dayEvents.length > 0 ? 'ring-1 ring-celestial/50 bg-celestial/5' : ''}`}
                        >
                            {d}
                            <div className="absolute top-1 right-1 flex gap-0.5">
                                {uniqueIcons.map((ic, ix) => <span key={ix} className="text-[10px] leading-none">{ic}</span>)}
                            </div>
                            <div className="flex flex-col gap-1 w-full px-1 mt-auto pb-1">
                                {dayEvents.slice(0, 3).map((evt, idx) => (
                                    <div
                                        key={idx}
                                        className="h-1.5 md:h-5 md:px-2 md:py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold truncate w-full text-left flex items-center"
                                        style={{ backgroundColor: evt.typeColor, color: '#000' }}
                                        title={evt.title}
                                    >
                                        <span className="hidden md:inline">{evt.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
