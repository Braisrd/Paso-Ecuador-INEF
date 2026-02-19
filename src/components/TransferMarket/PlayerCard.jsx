import React from 'react';
import { User, Users } from 'lucide-react';

const PlayerCard = ({ player, onClick }) => {
    // Stable rotation based on ID to avoid impurity/flicker
    const rotation = React.useMemo(() => {
        const id = typeof player.id === 'string' ? player.id.length : (player.id || 0);
        return (id % 6) - 3; // Deterministic between -3 and 3
    }, [player.id]);

    return (
        <div
            className="group relative cursor-pointer transform transition-all duration-300 hover:z-10 hover:scale-105 hover:rotate-0 w-64 h-80"
            style={{ transform: `rotate(${rotation}deg)` }}
            onClick={onClick}
        >
            {/* Stacked effect for groups - background cards */}
            {player.isGroup && (
                <>
                    <div className="absolute inset-0 bg-white shadow-xl rounded-sm transform rotate-[-5deg] translate-x-[-4px] translate-y-[2px] z-0"></div>
                    <div className="absolute inset-0 bg-white shadow-xl rounded-sm transform rotate-[3deg] translate-x-[3px] translate-y-[-2px] z-0"></div>
                </>
            )}

            {/* Main Polaroid Card */}
            <div className={`relative bg-white p-3 pb-6 shadow-xl rounded-sm z-10 w-full h-full flex flex-col transition-transform duration-300 ${player.isGroup ? 'rotate-0' : ''}`}>

                {/* Image Area - Smaller (Aspect Video) for privacy and uniformity */}
                <div className="w-full aspect-video bg-gray-200 mb-4 overflow-hidden relative border border-gray-100 filter sepia-[0.2]">
                    {player.image ? (
                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                            {player.isGroup ? <Users size={32} /> : <User size={32} />}
                        </div>
                    )}

                    {/* Badge */}
                    <div className={`absolute top-2 right-2 px-3 py-1 transform rotate-12 font-black text-[10px] uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] ${getBadgeColor(player.level)} text-black whitespace-nowrap`}>
                        {player.level}
                    </div>
                </div>

                {/* Handwritten Text Area */}
                <div className="text-center font-['Patrick_Hand'] flex-1 flex flex-col justify-center">
                    <h3 className="text-2xl text-gray-800 leading-none mb-1">{player.name}</h3>
                    <p className="text-gray-500 text-lg leading-tight">{player.course}</p>
                </div>

                {/* Pin element (visual) */}
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-md border border-red-700 z-20"></div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-white/50 z-30 ml-[1px] mt-[1px]"></div>

                {/* "Fichame" Overlay Button */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all rounded-sm opacity-0 group-hover:opacity-100">
                    <button className="bg-primary text-black font-black text-xl px-6 py-3 rounded-full transform scale-0 group-hover:scale-110 transition-transform duration-200 shadow-[4px_4px_0px_black] border-2 border-black rotate-[-12deg] uppercase">
                        {player.isGroup ? '¡UNIRSE!' : '¡FÍCHAME!'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper for badge colors
const getBadgeColor = (level) => {
    switch (level?.toLowerCase()) {
        case 'competitivo': return 'bg-yellow-400';
        case 'pachanga': return 'bg-purple-400';
        case 'amateur': return 'bg-green-400';
        default: return 'bg-gray-300';
    }
};

export default PlayerCard;
