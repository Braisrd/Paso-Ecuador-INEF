import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstall, setShowInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const iOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(iOS);

        const checkStandalone = () => {
            const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            setIsStandalone(standalone);
            return standalone;
        };

        const standalone = checkStandalone();

        // If iOS and not standalone, show install guide (usually manual trigger or timed)
        if (iOS && !standalone) {
            // We check localStorage to see if they dismissed it recently
            const dismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!dismissed) {
                setShowInstall(true);
            }
        }

        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            const dismissed = localStorage.getItem('pwa_prompt_dismissed');
            if (!standalone && !dismissed) {
                setShowInstall(true);
            }
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
                localStorage.setItem('pwa_installed', 'true');
            }
            setDeferredPrompt(null);
        });
    };

    const dismiss = () => {
        setShowInstall(false);
        // Save dismissal for 7 days
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    return { showInstall, setShowInstall, install, dismiss, isIOS, isStandalone };
};
