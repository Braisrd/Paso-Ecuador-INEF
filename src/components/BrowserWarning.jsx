
import React, { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';

const BrowserWarning = () => {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 border rounded-2xl bg-gray-900/90 border-white/10 shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 rounded-full bg-pink-500/10 text-pink-500">
                        <ExternalLink size={48} />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-white">
                            Estás navegando desde Instagram
                        </h2>
                        <p className="text-gray-300">
                            Para asegurar que todas las funciones de la web funcionen correctamente, por favor abre la página en tu navegador predeterminado.
                        </p>
                    </div>

                    <div className="w-full space-y-4">
                        <div className="p-4 text-sm text-left rounded-lg bg-white/5 border border-white/10">
                            <p className="font-semibold text-white mb-2">Cómo hacerlo:</p>
                            <ol className="list-decimal list-inside space-y-1 text-gray-300">
                                <li>Toca los tres puntos <span className="inline-block px-1.5 py-0.5 mx-1 font-mono text-xs bg-gray-700 rounded">...</span> arriba a la derecha</li>
                                <li>Selecciona <span className="font-medium text-white">"Abrir en el navegador"</span></li>
                            </ol>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-2 text-gray-500 bg-gray-900/90">O copia el enlace</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCopyLink}
                            className="flex items-center justify-center w-full px-4 py-3 space-x-2 font-medium transition-colors rounded-lg bg-pink-600 hover:bg-pink-700 text-white active:bg-pink-800"
                        >
                            {copied ? (
                                <>
                                    <Check size={20} />
                                    <span>¡Enlace copiado!</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={20} />
                                    <span>Copiar enlace de la web</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrowserWarning;
