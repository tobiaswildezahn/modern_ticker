/**
 * 11-ui-resources.js - Ressourcen-Übersicht
 *
 * Zeigt alle Fahrzeuge/Ressourcen mit ihrem aktuellen Status an.
 */

/**
 * Aktualisiert die Ressourcen-Übersicht
 */
function updateResourcesGrid() {
    const grid = document.getElementById('resources-grid');
    if (!grid) return;

    // Alle aktiven Ressourcen aus den Einsätzen extrahieren
    const activeResources = new Map();

    for (const event of state.data.processedEvents) {
        if (event.status !== 'active') continue;

        for (const resource of (event.resources || [])) {
            const callSign = resource.call_sign || resource.kennzeichen;
            if (!callSign) continue;

            if (!activeResources.has(callSign)) {
                activeResources.set(callSign, {
                    callSign,
                    type: resource.nameresourcetype || resource.typ || 'Unbekannt',
                    status: resource.status || resource.eventstatus || 'Unbekannt',
                    eventId: event.id,
                    eventType: event.nameeventtype
                });
            }
        }
    }

    // Ressourcen-Stammdaten hinzufügen
    const allResources = [];

    // Aktive Ressourcen zuerst
    for (const [callSign, data] of activeResources) {
        allResources.push({
            ...data,
            isActive: true
        });
    }

    // Sortieren nach Callsign
    allResources.sort((a, b) => a.callSign.localeCompare(b.callSign));

    // Grid rendern
    if (allResources.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🚒</div>
                <div>Keine aktiven Ressourcen</div>
            </div>
        `;
        return;
    }

    // Nur die ersten 20 Ressourcen anzeigen
    const displayResources = allResources.slice(0, 20);

    grid.innerHTML = displayResources.map(resource => createResourceCard(resource)).join('');
}

/**
 * Erstellt eine Ressourcen-Karte
 *
 * SICHERHEIT: Alle Daten werden durch escapeHtml() geschützt!
 *
 * @param {Object} resource - Ressourcen-Objekt
 * @returns {string} HTML-String
 */
function createResourceCard(resource) {
    const statusClass = resource.isActive ? 'busy' : 'active';
    const statusLabel = resource.isActive ? 'Im Einsatz' : 'Verfügbar';

    return `
        <div class="resource-card ${statusClass}">
            <div class="resource-header">
                <span class="resource-name">${escapeHtml(resource.callSign)}</span>
                <span class="resource-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="resource-type">${escapeHtml(resource.type)}</div>
            ${resource.isActive ? `
                <div class="resource-mission" title="${escapeHtml(resource.eventType || '')}">
                    📍 ${escapeHtml(resource.eventId || 'N/A')}
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Filtert Ressourcen nach Status
 *
 * @param {string} status - 'all', 'active', 'available'
 * @returns {Array} Gefilterte Ressourcen
 */
function filterResources(status) {
    // Kann später erweitert werden
    updateResourcesGrid();
}
