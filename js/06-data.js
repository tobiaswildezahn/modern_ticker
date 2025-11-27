/**
 * 06-data.js - Datenabfrage und -verarbeitung
 *
 * Enthält alle Funktionen für die Kommunikation mit den ArcGIS Feature Services.
 * Verwendet esriRequest mit IdentityManager für automatisches Token-Management.
 */

/**
 * Führt eine ArcGIS Feature Query durch
 *
 * Verwendet esriRequest, das automatisch den Token vom IdentityManager verwendet.
 *
 * @param {string} url - Feature Service URL
 * @param {Object} params - Query-Parameter
 * @returns {Promise<Array>} Array von Features
 */
async function queryFeatureService(url, params = {}) {
    // Prüfe ob esriRequest verfügbar ist
    if (!esriRequest) {
        throw new Error('esriRequest nicht initialisiert. Bitte Auth-Modul laden.');
    }

    const defaultParams = {
        where: '1=1',
        outFields: '*',
        returnGeometry: true,
        f: 'json'
    };

    const queryParams = { ...defaultParams, ...params };

    try {
        const response = await esriRequest(url + '/query', {
            query: queryParams,
            responseType: 'json'
        });

        // Fehlerprüfung für ArcGIS Fehlerantworten
        if (response.data && response.data.error) {
            const errorMsg = response.data.error.message || JSON.stringify(response.data.error);

            // Spezielle Behandlung für Token-Fehler
            if (errorMsg.includes('Token') || response.data.error.code === 499) {
                showTokenDialog();
                throw new Error('Token erforderlich oder abgelaufen');
            }

            throw new Error(`ArcGIS Error: ${errorMsg}`);
        }

        if (response.data && response.data.features) {
            return response.data.features.map(f => ({
                ...f.attributes,
                geometry: f.geometry
            }));
        }

        return [];
    } catch (error) {
        console.error('Feature Service Query Fehler:', error);

        // Bei 401/403 Token-Dialog zeigen
        if (error.details && (error.details.httpStatus === 401 || error.details.httpStatus === 403)) {
            showTokenDialog();
        }

        throw error;
    }
}

/**
 * Lädt alle Einsätze im angegebenen Zeitraum
 *
 * @param {number} hours - Zeitraum in Stunden
 * @returns {Promise<Array>} Array von Einsätzen
 */
async function fetchEvents(hours = 24) {
    const timestamp = getFilterTimestamp(hours);
    const sqlDate = formatDateForSQL(timestamp);

    // Sanitize für SQL-Sicherheit
    const whereClause = `time_alarm >= '${sanitizeForSQL(sqlDate)}'`;

    if (CONFIG.debug) {
        console.log('Lade Einsätze mit WHERE:', whereClause);
    }

    try {
        const events = await queryFeatureService(CONFIG.api.events, {
            where: whereClause,
            orderByFields: 'time_alarm DESC'
        });

        if (CONFIG.debug) {
            console.log(`${events.length} Einsätze geladen`);
        }

        return events;
    } catch (error) {
        console.error('Fehler beim Laden der Einsätze:', error);
        throw error;
    }
}

/**
 * Lädt Einsatzressourcen für einen Zeitraum
 *
 * @param {number} hours - Zeitraum in Stunden
 * @returns {Promise<Array>} Array von Einsatzressourcen
 */
async function fetchEventResources(hours = 24) {
    const timestamp = getFilterTimestamp(hours);
    const sqlDate = formatDateForSQL(timestamp);

    const whereClause = `time_alarm >= '${sanitizeForSQL(sqlDate)}'`;

    try {
        const resources = await queryFeatureService(CONFIG.api.eventResources7Days, {
            where: whereClause
        });

        if (CONFIG.debug) {
            console.log(`${resources.length} Einsatzressourcen geladen`);
        }

        return resources;
    } catch (error) {
        console.error('Fehler beim Laden der Einsatzressourcen:', error);
        throw error;
    }
}

/**
 * Lädt Ressourcen-Stammdaten
 *
 * @returns {Promise<Array>} Array von Ressourcen
 */
async function fetchResources() {
    try {
        const resources = await queryFeatureService(CONFIG.api.resources, {
            where: '1=1'
        });

        if (CONFIG.debug) {
            console.log(`${resources.length} Ressourcen geladen`);
        }

        return resources;
    } catch (error) {
        console.error('Fehler beim Laden der Ressourcen:', error);
        throw error;
    }
}

/**
 * Lädt alle benötigten Daten
 *
 * @param {Object} options - Optionen
 * @param {number} options.hours - Zeitraum in Stunden
 * @returns {Promise<Object>} Objekt mit allen Daten
 */
async function fetchAllData(options = {}) {
    const hours = options.hours || state.filters.timeRange;

    setConnectionStatus('connecting');

    try {
        // Parallele Abfragen für bessere Performance
        const [events, eventResources, resources] = await Promise.all([
            fetchEvents(hours),
            fetchEventResources(hours),
            fetchResources()
        ]);

        // Daten verarbeiten und anreichern
        const processedEvents = processEventData(events, eventResources);

        // State aktualisieren
        state.data.events = events;
        state.data.eventResources = eventResources;
        state.data.resources = resources;
        state.data.processedEvents = processedEvents;

        setConnectionStatus('connected');
        updateLastUpdate();

        return {
            events: processedEvents,
            eventResources,
            resources
        };
    } catch (error) {
        setConnectionStatus('disconnected');

        // Bei Token-Fehler Dialog zeigen
        if (error.message && error.message.includes('Token')) {
            showTokenDialog();
        } else {
            showToast('Fehler beim Laden der Daten', 'error');
        }

        throw error;
    }
}

/**
 * Verarbeitet und reichert Einsatzdaten an
 *
 * @param {Array} events - Rohe Einsätze
 * @param {Array} eventResources - Einsatzressourcen
 * @returns {Array} Verarbeitete Einsätze
 */
function processEventData(events, eventResources) {
    // Gruppiere Ressourcen nach Einsatz-ID
    const resourcesByEvent = new Map();

    for (const resource of eventResources) {
        const eventId = resource.idevent || resource.event_id;
        if (!eventId) continue;

        if (!resourcesByEvent.has(eventId)) {
            resourcesByEvent.set(eventId, []);
        }
        resourcesByEvent.get(eventId).push(resource);
    }

    // Einsätze anreichern
    return events.map(event => {
        const eventId = event.id || event.idevent;
        const eventResources = resourcesByEvent.get(eventId) || [];

        // Status bestimmen
        const status = getEventStatus(event);

        // Typ-Kategorie bestimmen
        const typeCategory = getEventTypeCategory(event.nameeventtype || event.eventtype);

        // Dauer berechnen
        let duration = null;
        if (event.time_alarm) {
            const endTime = event.time_finished || event.time_end || Date.now();
            duration = endTime - event.time_alarm;
        }

        return {
            ...event,
            id: eventId,
            status,
            typeCategory,
            duration,
            resourceCount: eventResources.length,
            resources: eventResources,
            address: formatAddress(event)
        };
    });
}

/**
 * Lädt Details zu einem einzelnen Einsatz
 *
 * @param {string} eventId - Einsatz-ID
 * @returns {Promise<Object>} Einsatz-Details
 */
async function fetchEventDetails(eventId) {
    if (!isValidEventId(eventId)) {
        throw new Error('Ungültige Event-ID');
    }

    // Cache prüfen
    const cached = getCachedEventDetails(eventId);
    if (cached) {
        if (CONFIG.debug) {
            console.log('Event-Details aus Cache:', eventId);
        }
        return cached;
    }

    const whereClause = `id = '${sanitizeForSQL(eventId)}' OR idevent = '${sanitizeForSQL(eventId)}'`;

    try {
        // Event-Daten laden
        const events = await queryFeatureService(CONFIG.api.events, {
            where: whereClause
        });

        if (events.length === 0) {
            throw new Error('Einsatz nicht gefunden');
        }

        const event = events[0];

        // Zugehörige Ressourcen laden
        const resourceWhere = `idevent = '${sanitizeForSQL(eventId)}' OR event_id = '${sanitizeForSQL(eventId)}'`;
        const resources = await queryFeatureService(CONFIG.api.eventResources7Days, {
            where: resourceWhere
        });

        const details = {
            event,
            resources,
            loadedAt: Date.now()
        };

        // Im Cache speichern
        cacheEventDetails(eventId, details);

        return details;
    } catch (error) {
        console.error('Fehler beim Laden der Event-Details:', error);
        throw error;
    }
}

/**
 * Filtert die verarbeiteten Einsätze
 *
 * @returns {Array} Gefilterte Einsätze
 */
function getFilteredEvents() {
    let events = [...state.data.processedEvents];

    // Status-Filter
    if (state.filters.status !== 'all') {
        events = events.filter(e => e.status === state.filters.status);
    }

    // Typ-Filter
    if (state.filters.eventType !== 'all') {
        events = events.filter(e => e.typeCategory === state.filters.eventType);
    }

    // Suchfilter
    if (state.ui.searchQuery) {
        const query = state.ui.searchQuery.toLowerCase();
        events = events.filter(e =>
            (e.id && String(e.id).toLowerCase().includes(query)) ||
            (e.nameeventtype && e.nameeventtype.toLowerCase().includes(query)) ||
            (e.address && e.address.toLowerCase().includes(query))
        );
    }

    // Sortierung
    events.sort((a, b) => {
        let aVal = a[state.ui.sortColumn];
        let bVal = b[state.ui.sortColumn];

        // Spezielle Sortierung für bestimmte Spalten
        if (state.ui.sortColumn === 'time') {
            aVal = a.time_alarm || 0;
            bVal = b.time_alarm || 0;
        } else if (state.ui.sortColumn === 'resources') {
            aVal = a.resourceCount || 0;
            bVal = b.resourceCount || 0;
        }

        if (aVal < bVal) return state.ui.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return state.ui.sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    return events;
}

/**
 * Berechnet KPIs aus den aktuellen Daten
 *
 * @returns {Object} KPI-Objekt
 */
function calculateKPIs() {
    const events = state.data.processedEvents;
    const activeEvents = events.filter(e => e.status === 'active');

    // Durchschnittliche Dauer berechnen (nur abgeschlossene)
    const completedEvents = events.filter(e => e.status === 'completed' && e.duration > 0);
    let avgDuration = 0;
    if (completedEvents.length > 0) {
        const totalDuration = completedEvents.reduce((sum, e) => sum + e.duration, 0);
        avgDuration = totalDuration / completedEvents.length;
    }

    // Ressourcen im Einsatz zählen
    const activeResourceIds = new Set();
    for (const event of activeEvents) {
        for (const resource of (event.resources || [])) {
            if (resource.call_sign) {
                activeResourceIds.add(resource.call_sign);
            }
        }
    }

    return {
        totalEvents: events.length,
        activeEvents: activeEvents.length,
        resourcesInUse: activeResourceIds.size,
        avgDuration: avgDuration
    };
}
