/**
 * 04-helpers.js - Hilfsfunktionen
 *
 * Allgemeine Utility-Funktionen für das Dashboard.
 * Formatierung, UI-Feedback, Berechnungen.
 */

/**
 * Zeigt das Loading-Overlay an
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

/**
 * Versteckt das Loading-Overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

/**
 * Zeigt eine Toast-Nachricht an
 *
 * @param {string} message - Nachrichtentext
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Anzeigedauer in ms (Standard: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Automatisch entfernen
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Formatiert einen Timestamp für die Anzeige
 *
 * @param {number|string|Date} timestamp - Unix-Timestamp (ms) oder Date
 * @returns {string} Formatiertes Datum "DD.MM.YYYY HH:mm:ss"
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'N/A';

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Formatiert einen Timestamp kompakt (nur Uhrzeit, wenn heute)
 *
 * @param {number|string|Date} timestamp - Unix-Timestamp (ms) oder Date
 * @returns {string} Formatiertes Datum
 */
function formatTimestampCompact(timestamp) {
    if (!timestamp) return 'N/A';

    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return 'N/A';

        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        if (isToday) {
            return `${hours}:${minutes}`;
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}.${month}. ${hours}:${minutes}`;
    } catch (e) {
        return 'N/A';
    }
}

/**
 * Formatiert eine Dauer in Minuten
 *
 * @param {number} ms - Dauer in Millisekunden
 * @returns {string} Formatierte Dauer "Xh Ym" oder "X min"
 */
function formatDuration(ms) {
    if (!ms || ms < 0) return 'N/A';

    const minutes = Math.floor(ms / 60000);

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Aktualisiert die "Letzte Aktualisierung"-Anzeige
 */
function updateLastUpdate() {
    const element = document.getElementById('last-update');
    if (element) {
        const now = new Date();
        const time = formatTimestamp(now);
        element.textContent = `Letzte Aktualisierung: ${time}`;
    }
}

/**
 * Berechnet den Zeitstempel für den Filter
 *
 * @param {number} hours - Stunden zurück
 * @returns {number} Unix-Timestamp in Millisekunden
 */
function getFilterTimestamp(hours) {
    return Date.now() - (hours * 60 * 60 * 1000);
}

/**
 * Formatiert ein Datum für ArcGIS WHERE-Klauseln
 *
 * @param {Date|number} date - Datum
 * @returns {string} Formatierter String für SQL
 */
function formatDateForSQL(date) {
    const d = new Date(date);
    return d.toISOString().replace('T', ' ').slice(0, 19);
}

/**
 * Bestimmt die Einsatztyp-Kategorie
 *
 * @param {string} eventType - Einsatztyp-Name
 * @returns {string} 'fire', 'medical', 'technical', 'other'
 */
function getEventTypeCategory(eventType) {
    if (!eventType) return 'other';

    const type = String(eventType).toLowerCase();

    // Brand-Einsätze
    for (const keyword of CONFIG.eventTypeCategories.fire) {
        if (type.includes(keyword.toLowerCase())) {
            return 'fire';
        }
    }

    // Rettungsdienst
    for (const keyword of CONFIG.eventTypeCategories.medical) {
        if (type.includes(keyword.toLowerCase())) {
            return 'medical';
        }
    }

    // Technische Hilfe
    for (const keyword of CONFIG.eventTypeCategories.technical) {
        if (type.includes(keyword.toLowerCase())) {
            return 'technical';
        }
    }

    return 'other';
}

/**
 * Bestimmt den Einsatz-Status
 *
 * @param {Object} event - Einsatz-Objekt
 * @returns {string} 'active', 'completed', 'pending'
 */
function getEventStatus(event) {
    if (!event) return 'pending';

    // Prüfe auf expliziten Status
    const status = String(event.status || event.eventstatus || '').toLowerCase();

    for (const activeStatus of CONFIG.eventStatus.active) {
        if (status.includes(activeStatus.toLowerCase())) {
            return 'active';
        }
    }

    for (const completedStatus of CONFIG.eventStatus.completed) {
        if (status.includes(completedStatus.toLowerCase())) {
            return 'completed';
        }
    }

    // Fallback: Wenn Ende-Zeit vorhanden -> abgeschlossen
    if (event.time_finished || event.time_end) {
        return 'completed';
    }

    return 'active';
}

/**
 * Erstellt eine Adresse aus Event-Daten
 *
 * @param {Object} event - Einsatz-Objekt
 * @returns {string} Formatierte Adresse
 */
function formatAddress(event) {
    if (!event) return 'N/A';

    const parts = [];

    if (event.street1 || event.street) {
        parts.push(event.street1 || event.street);
    }

    if (event.hausnr || event.housenumber) {
        parts.push(event.hausnr || event.housenumber);
    }

    if (event.zipcode || event.plz) {
        parts.push(event.zipcode || event.plz);
    }

    if (event.city || event.ort) {
        parts.push(event.city || event.ort);
    }

    return parts.length > 0 ? parts.join(' ') : 'N/A';
}

/**
 * Debounce-Funktion für Eingabefelder
 *
 * @param {Function} func - Auszuführende Funktion
 * @param {number} wait - Wartezeit in ms
 * @returns {Function} Debounced Function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
