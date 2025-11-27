/**
 * 07-ui-table.js - Einsatz-Tabelle UI
 *
 * Rendert und verwaltet die Einsatz-Tabelle mit Sortierung,
 * Pagination und Suchfunktion.
 */

/**
 * Aktualisiert die Einsatz-Tabelle
 */
function updateTable() {
    const tbody = document.getElementById('einsatz-tbody');
    if (!tbody) return;

    const filteredEvents = getFilteredEvents();

    // Pagination berechnen
    const totalItems = filteredEvents.length;
    const pageSize = CONFIG.pagination.pageSize;
    const totalPages = Math.ceil(totalItems / pageSize);
    const currentPage = Math.min(state.ui.currentPage, Math.max(1, totalPages));
    state.ui.currentPage = currentPage;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const pageEvents = filteredEvents.slice(startIndex, endIndex);

    // Tabelle leeren
    tbody.innerHTML = '';

    if (pageEvents.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div>Keine Einsätze gefunden</div>
                </td>
            </tr>
        `;
    } else {
        // Zeilen generieren
        for (const event of pageEvents) {
            const row = createTableRow(event);
            tbody.appendChild(row);
        }
    }

    // Pagination aktualisieren
    updatePagination(currentPage, totalPages, totalItems, startIndex, endIndex);

    // Sort-Indikatoren aktualisieren
    updateSortIndicators();
}

/**
 * Erstellt eine Tabellenzeile für einen Einsatz
 *
 * SICHERHEIT: Alle Daten werden durch escapeHtml() geschützt!
 *
 * @param {Object} event - Einsatz-Objekt
 * @returns {HTMLTableRowElement} Tabellenzeile
 */
function createTableRow(event) {
    const row = document.createElement('tr');

    // Active-Status Highlight
    if (event.status === 'active') {
        row.classList.add('active');
    }

    // WICHTIG: escapeHtml() für alle externen Daten!
    row.innerHTML = `
        <td>
            <span class="event-link" data-event-id="${escapeHtml(event.id)}">
                ${escapeHtml(event.id)}
            </span>
        </td>
        <td>
            <span class="type-badge ${escapeHtml(event.typeCategory)}">
                ${escapeHtml(event.nameeventtype || event.eventtype || 'Unbekannt')}
            </span>
        </td>
        <td>${escapeHtml(event.address)}</td>
        <td>${formatTimestampCompact(event.time_alarm)}</td>
        <td>
            <span class="status-badge ${escapeHtml(event.status)}">
                ${getStatusLabel(event.status)}
            </span>
        </td>
        <td>${escapeHtml(event.resourceCount)}</td>
        <td>
            <button class="action-btn" data-event-id="${escapeHtml(event.id)}" title="Details anzeigen">
                📋 Details
            </button>
        </td>
    `;

    return row;
}

/**
 * Gibt das Label für einen Status zurück
 *
 * @param {string} status - Status-String
 * @returns {string} Deutsches Label
 */
function getStatusLabel(status) {
    switch (status) {
        case 'active': return 'Aktiv';
        case 'completed': return 'Beendet';
        case 'pending': return 'Wartend';
        default: return 'Unbekannt';
    }
}

/**
 * Aktualisiert die Pagination-Anzeige
 */
function updatePagination(currentPage, totalPages, totalItems, startIndex, endIndex) {
    const infoElement = document.getElementById('pagination-info');
    if (infoElement) {
        if (totalItems === 0) {
            infoElement.textContent = 'Keine Einträge';
        } else {
            infoElement.textContent = `Zeige ${startIndex + 1}-${endIndex} von ${totalItems} Einträgen`;
        }
    }

    const pageIndicator = document.getElementById('page-indicator');
    if (pageIndicator) {
        pageIndicator.textContent = `Seite ${currentPage} von ${Math.max(1, totalPages)}`;
    }

    const prevButton = document.getElementById('prev-page');
    if (prevButton) {
        prevButton.disabled = currentPage <= 1;
    }

    const nextButton = document.getElementById('next-page');
    if (nextButton) {
        nextButton.disabled = currentPage >= totalPages;
    }
}

/**
 * Aktualisiert die Sort-Indikatoren in den Spaltenheadern
 */
function updateSortIndicators() {
    const headers = document.querySelectorAll('.data-table th.sortable');

    for (const header of headers) {
        const column = header.getAttribute('data-sort');
        header.classList.remove('asc', 'desc');

        if (column === state.ui.sortColumn) {
            header.classList.add(state.ui.sortDirection);
        }
    }
}

/**
 * Sortiert die Tabelle nach einer Spalte
 *
 * @param {string} column - Spaltenname
 */
function sortTable(column) {
    if (state.ui.sortColumn === column) {
        // Toggle direction
        state.ui.sortDirection = state.ui.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        state.ui.sortColumn = column;
        state.ui.sortDirection = 'desc';
    }

    updateTable();
}

/**
 * Navigiert zur vorherigen Seite
 */
function previousPage() {
    if (state.ui.currentPage > 1) {
        state.ui.currentPage--;
        updateTable();
    }
}

/**
 * Navigiert zur nächsten Seite
 */
function nextPage() {
    const totalItems = getFilteredEvents().length;
    const totalPages = Math.ceil(totalItems / CONFIG.pagination.pageSize);

    if (state.ui.currentPage < totalPages) {
        state.ui.currentPage++;
        updateTable();
    }
}

/**
 * Führt eine Suche durch
 *
 * @param {string} query - Suchbegriff
 */
function searchTable(query) {
    state.ui.searchQuery = sanitizeSearchQuery(query);
    state.ui.currentPage = 1;
    updateTable();
}

/**
 * Exportiert die Tabellendaten als CSV
 */
function exportTableCSV() {
    const events = getFilteredEvents();

    if (events.length === 0) {
        showToast('Keine Daten zum Exportieren', 'warning');
        return;
    }

    // CSV-Header
    const headers = ['Einsatz-ID', 'Typ', 'Adresse', 'Alarmzeit', 'Status', 'Ressourcen'];

    // CSV-Zeilen
    const rows = events.map(e => [
        e.id || '',
        e.nameeventtype || '',
        e.address || '',
        formatTimestamp(e.time_alarm),
        getStatusLabel(e.status),
        e.resourceCount || 0
    ]);

    // CSV zusammenbauen
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell =>
            // Escaping für CSV (Semikolon und Anführungszeichen)
            `"${String(cell).replace(/"/g, '""')}"`
        ).join(';'))
    ].join('\r\n');

    // BOM für Excel-Kompatibilität
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });

    // Download auslösen
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `einsaetze_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('Export erfolgreich', 'success');
}

/**
 * Initialisiert die Tabellen-Event-Listener
 */
function initTableListeners() {
    // Sortierung per Klick auf Header
    document.querySelectorAll('.data-table th.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            if (column) {
                sortTable(column);
            }
        });
    });

    // Pagination Buttons
    const prevButton = document.getElementById('prev-page');
    if (prevButton) {
        prevButton.addEventListener('click', previousPage);
    }

    const nextButton = document.getElementById('next-page');
    if (nextButton) {
        nextButton.addEventListener('click', nextPage);
    }

    // Suche mit Debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            searchTable(e.target.value);
        }, 300));
    }

    // Event Delegation für Event-Links und Action-Buttons
    const tbody = document.getElementById('einsatz-tbody');
    if (tbody) {
        tbody.addEventListener('click', (e) => {
            const eventLink = e.target.closest('.event-link');
            const actionBtn = e.target.closest('.action-btn');

            if (eventLink) {
                const eventId = eventLink.getAttribute('data-event-id');
                if (eventId) {
                    openEventModal(eventId);
                }
            } else if (actionBtn) {
                const eventId = actionBtn.getAttribute('data-event-id');
                if (eventId) {
                    openEventModal(eventId);
                }
            }
        });
    }

    // Export Button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTableCSV);
    }
}
