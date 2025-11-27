/**
 * 02-state.js - Globaler Zustand
 *
 * Verwaltet den globalen Anwendungszustand.
 * Alle Daten und UI-Referenzen werden hier zentral gespeichert.
 *
 * WICHTIG: Direktes Modifizieren des States nur über definierte Funktionen!
 */

const state = {
    // Geladene Daten
    data: {
        events: [],           // Alle Einsätze
        resources: [],        // Alle Ressourcen
        eventResources: [],   // Zuordnung Einsatz <-> Ressource
        feedback: [],         // Rückmeldungen
        processedEvents: []   // Verarbeitete/gefilterte Einsätze
    },

    // UI-Zustand
    ui: {
        currentPage: 1,
        sortColumn: 'time',
        sortDirection: 'desc',
        searchQuery: '',
        selectedEventId: null
    },

    // Filter-Zustand
    filters: {
        timeRange: 24,        // Stunden
        status: 'all',
        eventType: 'all'
    },

    // Chart-Instanzen (für Destroy/Update)
    charts: {
        byType: null,
        timeline: null
    },

    // Map-Instanz
    map: {
        view: null,
        graphicsLayer: null
    },

    // Auto-Refresh Timer
    refreshTimer: null,

    // Verbindungsstatus
    connectionStatus: 'connecting', // 'connected', 'disconnected', 'connecting'

    // Cache für Event-Details (vermeidet wiederholte API-Calls)
    cache: {
        eventDetails: new Map(),
        maxAge: 5 * 60 * 1000  // 5 Minuten Cache
    }
};

/**
 * Setzt den Verbindungsstatus und aktualisiert die UI
 *
 * @param {string} status - 'connected', 'disconnected', 'connecting'
 */
function setConnectionStatus(status) {
    state.connectionStatus = status;
    const indicator = document.getElementById('connection-status');
    if (indicator) {
        indicator.className = 'status-indicator';
        if (status === 'disconnected') {
            indicator.classList.add('disconnected');
        } else if (status === 'connecting') {
            indicator.classList.add('connecting');
        }
    }
}

/**
 * Speichert Event-Details im Cache
 *
 * @param {string} eventId - Einsatz-ID
 * @param {Object} data - Event-Daten
 */
function cacheEventDetails(eventId, data) {
    state.cache.eventDetails.set(eventId, {
        data: data,
        timestamp: Date.now()
    });
}

/**
 * Holt Event-Details aus dem Cache (falls vorhanden und nicht abgelaufen)
 *
 * @param {string} eventId - Einsatz-ID
 * @returns {Object|null} - Gecachte Daten oder null
 */
function getCachedEventDetails(eventId) {
    const cached = state.cache.eventDetails.get(eventId);
    if (cached && (Date.now() - cached.timestamp) < state.cache.maxAge) {
        return cached.data;
    }
    return null;
}

/**
 * Löscht abgelaufene Cache-Einträge
 */
function cleanCache() {
    const now = Date.now();
    for (const [key, value] of state.cache.eventDetails) {
        if (now - value.timestamp > state.cache.maxAge) {
            state.cache.eventDetails.delete(key);
        }
    }
}
