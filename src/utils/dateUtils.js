
/**
 * Safely parses a date string into a Date object.
 * Handles 'YYYY-MM-DD' strings by treating them as local dates (00:00:00)
 * instead of UTC, which fixes off-by-one day errors and Safari parsing issues.
 * 
 * @param {string|Date|number} dateInput - The date to parse
 * @returns {Date} A valid Date object
 */
export const parseDate = (dateInput) => {
    if (!dateInput) return new Date();

    if (dateInput instanceof Date) return dateInput;

    // Handle 'YYYY-MM-DD' strings specifically
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Handle 'YYYY-MM-DD HH:mm' or other potential string formats that Safari dislikes
    // Safari specifically dislikes dashes in ISO strings sometimes if not perfect ISO 8601
    // But usually specific replacement is safer:
    if (typeof dateInput === 'string' && dateInput.includes('-')) {
        // Try standard parsing first
        const d = new Date(dateInput);
        if (!isNaN(d.getTime())) return d;

        // If failed (Safari often fails on 'YYYY-MM-DD HH:mm:ss'), try replacing dashes with slashes
        // 'YYYY/MM/DD' is often more broadly supported in legacy/strict parsers
        const slashDate = dateInput.replace(/-/g, '/');
        const d2 = new Date(slashDate);
        if (!isNaN(d2.getTime())) return d2;
    }

    return new Date(dateInput);
};

/**
 * Formats a Date object to 'YYYY-MM-DD' string (Local time).
 */
export const formatDateToISO = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
