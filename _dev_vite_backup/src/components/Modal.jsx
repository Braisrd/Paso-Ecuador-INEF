import React from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizeClass = size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-6xl' : 'max-w-2xl';
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
            <div className={`bg-[#13131f] border border-white/10 rounded-2xl w-full ${sizeClass} my-8 max-h-[90vh] overflow-y-auto relative shadow-2xl`} onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2 bg-black/20 rounded-full hover:bg-black/50 transition-colors">
                    <X className="w-5 h-5" />
                </button>
                {children}
            </div>
        </div>
    );
};
