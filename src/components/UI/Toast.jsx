import React, { useEffect } from 'react';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        if (type !== 'loading') {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [type, onClose]);

    const icons = {
        success: <CheckCircle className="text-green-500" size={24} />,
        error: <XCircle className="text-red-500" size={24} />,
        loading: <Loader2 className="text-blue-500 animate-spin" size={24} />,
        info: <div className="w-6 h-6 rounded-full bg-blue-500" />
    };

    const bgColors = {
        success: 'bg-white border-green-500',
        error: 'bg-white border-red-500',
        loading: 'bg-white border-blue-500',
        info: 'bg-white border-gray-500'
    };

    return (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] border-2 ${bgColors[type]} animate-in slide-in-from-bottom-5 fade-in duration-300`}>
            {icons[type]}
            <span className="font-black text-black uppercase tracking-wide">{message}</span>
        </div>
    );
};

export default Toast;
