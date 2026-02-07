import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        // If iOS and not standalone, show install button permanently
        if (iOS && !isStandalone) {
            setShowInstall(true);
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const install = () => {
        if (isIOS) return;
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                setShowInstall(false);
            }
            setDeferredPrompt(null);
        });
    };

    return { showInstall, setShowInstall, install, isIOS };
};
