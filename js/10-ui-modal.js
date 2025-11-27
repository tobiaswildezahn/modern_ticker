/**
 * 10-ui-modal.js - Einsatz-Detail Modal
 *
 * Zeigt detaillierte Informationen zu einem Einsatz an.
 */

/**
 * Öffnet das Modal für einen Einsatz
 *
 * @param {string} eventId - Einsatz-ID
 */
async function openEventModal(eventId) {
    if (!isValidEventId(eventId)) {
        showToast('Ungültige Einsatz-ID', 'error');
        return;
    }

    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');

    if (!modal || !modalBody || !modalTitle) return;

    // Loading State
    modalTitle.textContent = 'Lade Einsatz-Details...';
    modalBody.innerHTML = '<div class="loading-spinner"></div>';

    // Modal anzeigen
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('visible'), 10);

    state.ui.selectedEventId = eventId;

    try {
        const details = await fetchEventDetails(eventId);
        displayEventDetails(details);
    } catch (error) {
        console.error('Fehler beim Laden der Event-Details:', error);
        modalTitle.textContent = 'Fehler';
        modalBody.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div>Einsatz-Details konnten nicht geladen werden.</div>
            </div>
        `;
    }
}

/**
 * Zeigt die Einsatz-Details im Modal an
 *
 * SICHERHEIT: Alle Daten werden durch escapeHtml() geschützt!
 *
 * @param {Object} details - Einsatz-Details
 */
function displayEventDetails(details) {
    const modal = document.getElementById('detail-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');

    if (!modal || !modalBody || !modalTitle || !details) return;

    const event = details.event;
    const resources = details.resources || [];

    // Titel setzen (escaped!)
    modalTitle.textContent = `Einsatz ${escapeHtml(event.id || event.idevent)}`;

    // Typ-Kategorie bestimmen
    const typeCategory = getEventTypeCategory(event.nameeventtype);

    // HTML zusammenbauen - ALLE DATEN ESCAPED!
    let html = `
        <div class="modal-section">
            <div class="modal-section-title">Einsatz-Information</div>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <span class="modal-info-label">Einsatz-ID</span>
                    <span class="modal-info-value">${escapeHtml(event.id || event.idevent)}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Einsatztyp</span>
                    <span class="modal-info-value">
                        <span class="type-badge ${escapeHtml(typeCategory)}">
                            ${escapeHtml(event.nameeventtype || 'Unbekannt')}
                        </span>
                    </span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Stichwort</span>
                    <span class="modal-info-value">${escapeHtml(event.keyword || event.stichwort || 'N/A')}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Status</span>
                    <span class="modal-info-value">
                        <span class="status-badge ${escapeHtml(getEventStatus(event))}">
                            ${getStatusLabel(getEventStatus(event))}
                        </span>
                    </span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Adresse</div>
            <div class="modal-info-grid">
                <div class="modal-info-item">
                    <span class="modal-info-label">Straße</span>
                    <span class="modal-info-value">${escapeHtml(event.street1 || event.street || 'N/A')} ${escapeHtml(event.hausnr || event.housenumber || '')}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">PLZ / Ort</span>
                    <span class="modal-info-value">${escapeHtml(event.zipcode || event.plz || '')} ${escapeHtml(event.city || event.ort || 'Hamburg')}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Stadtteil</span>
                    <span class="modal-info-value">${escapeHtml(event.revier || event.stadtteil || 'N/A')}</span>
                </div>
                <div class="modal-info-item">
                    <span class="modal-info-label">Zusatz</span>
                    <span class="modal-info-value">${escapeHtml(event.street2 || event.zusatz || 'N/A')}</span>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Zeitverlauf</div>
            <div class="modal-timeline">
    `;

    // Timeline-Einträge
    const timelineEvents = [
        { label: 'Alarmzeit', time: event.time_alarm, status: 'completed' },
        { label: 'Erste Ausrückung', time: event.time_on_the_way || event.time_first_dispatch, status: event.time_on_the_way ? 'completed' : 'pending' },
        { label: 'Erste Ankunft', time: event.time_arrived || event.time_first_arrival, status: event.time_arrived ? 'completed' : 'pending' },
        { label: 'Einsatzende', time: event.time_finished || event.time_end, status: event.time_finished ? 'completed' : 'active' }
    ];

    for (const item of timelineEvents) {
        html += `
            <div class="timeline-item ${item.status}">
                <span class="timeline-time">${formatTimestamp(item.time)}</span>
                <span class="timeline-text">${escapeHtml(item.label)}</span>
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    // Ressourcen-Liste
    if (resources.length > 0) {
        html += `
            <div class="modal-section">
                <div class="modal-section-title">Eingesetzte Ressourcen (${resources.length})</div>
                <div class="modal-resource-list">
        `;

        for (const resource of resources) {
            const resourceStatus = getResourceStatusClass(resource);
            html += `
                <div class="modal-resource-item">
                    <span class="modal-resource-name">${escapeHtml(resource.call_sign || resource.kennzeichen || 'Unbekannt')}</span>
                    <span class="modal-resource-status ${resourceStatus}">
                        ${escapeHtml(resource.status || resource.eventstatus || 'N/A')}
                    </span>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="modal-section">
                <div class="modal-section-title">Eingesetzte Ressourcen</div>
                <div class="empty-state">
                    <div>Keine Ressourcen-Daten verfügbar</div>
                </div>
            </div>
        `;
    }

    modalBody.innerHTML = html;
}

/**
 * Bestimmt die CSS-Klasse für einen Ressourcen-Status
 *
 * @param {Object} resource - Ressourcen-Objekt
 * @returns {string} CSS-Klasse
 */
function getResourceStatusClass(resource) {
    const status = String(resource.status || resource.eventstatus || '').toLowerCase();

    for (const [key, values] of Object.entries(CONFIG.resourceStatus)) {
        for (const value of values) {
            if (status.includes(value.toLowerCase())) {
                return key;
            }
        }
    }

    return 'beendet';
}

/**
 * Schließt das Modal
 */
function closeEventModal() {
    const modal = document.getElementById('detail-modal');
    if (!modal) return;

    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 200);

    state.ui.selectedEventId = null;
}

/**
 * Initialisiert die Modal-Event-Listener
 */
function initModalListeners() {
    const modal = document.getElementById('detail-modal');
    const closeBtn = document.getElementById('modal-close');
    const closeFooterBtn = document.getElementById('modal-close-btn');

    // Schließen-Buttons
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEventModal);
    }

    if (closeFooterBtn) {
        closeFooterBtn.addEventListener('click', closeEventModal);
    }

    // Klick außerhalb des Modals
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEventModal();
            }
        });
    }

    // Escape-Taste
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEventModal();
        }
    });
}
