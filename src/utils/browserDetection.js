
/**
 * Detects if the current browser is the Instagram in-app browser.
 * @returns {boolean} True if the user agent matches Instagram's pattern.
 */
export const isInstagramBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    return (ua.indexOf('Instagram') > -1);
};
