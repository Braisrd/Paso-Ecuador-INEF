import React from 'react';
import { X, Share, PlusCircle } from 'lucide-react';
import Modal from '../UI/Modal';

const InstallPrompt = ({ isOpen, onClose, onInstall, isIOS }) => {
    if (!isOpen) return null;

    if (isIOS) {
        return (
            <div className="fixed bottom-6 left-6 right-6 z-[100] animate-fade-in-up">
                <div className="bg-[#13131f] border border-sky-400/30 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 blur-3xl -mr-16 -mt-16 group-hover:bg-sky-400/10 transition-all"></div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-sky-400/10 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto border border-sky-400/20 shadow-inner">
                            📲
                        </div>
                        <h4 className="font-black text-white text-2xl mb-2">Descarga la App</h4>
                        <p className="text-gray-400 text-sm max-w-[250px] mx-auto leading-relaxed">
                            Instala la aplicación en tu iPhone para un acceso más rápido.
                        </p>
                    </div>

                    <div className="space-y-6 max-w-[280px] mx-auto">
                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 text-sky-400 font-bold">1</div>
                            <div className="text-left">
                                <p className="text-white font-bold text-sm flex items-center gap-2">
                                    Pulsa el botón "Compartir" <Share className="w-4 h-4 text-sky-400" />
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Ubicado en la barra inferior de Safari.</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 text-sky-400 font-bold">2</div>
                            <div className="text-left">
                                <p className="text-white font-bold text-sm flex items-center gap-2">
                                    "Añadir a pantalla de inicio" <PlusCircle className="w-4 h-4 text-sky-400" />
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Busca esta opción en el menú que aparece.</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-10 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/5 text-xs uppercase tracking-widest"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[100] animate-fade-in-up">
            <div className="bg-[#13131f] border border-sky-400/30 p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 relative overflow-hidden group">
                {/* Background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/5 blur-3xl -mr-16 -mt-16 group-hover:bg-sky-400/10 transition-all"></div>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0">
                    📲
                </div>

                <div className="flex-1">
                    <h4 className="font-extrabold text-white text-lg leading-tight mb-1">Instalar Aplicación</h4>
                    <p className="text-[10px] text-gray-400 leading-tight pr-4">Accede más rápido y disfruta de una mejor experiencia desde tu pantalla de inicio.</p>
                </div>

                <button
                    onClick={onInstall}
                    className="bg-sky-400 hover:bg-sky-300 text-black px-6 py-4 rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-400/20 uppercase tracking-widest shrink-0"
                >
                    Instalar
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
