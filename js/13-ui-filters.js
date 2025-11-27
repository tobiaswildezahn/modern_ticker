/**
 * 13-ui-filters.js - Filter-Steuerung
 *
 * Verwaltet alle Filter und deren UI-Elemente.
 */

/**
 * Initialisiert die Filter-Event-Listener
 */
function initFilterListeners() {
    // Zeitfilter
    const timeFilter = document.getElementById('time-filter');
    if (timeFilter) {
        timeFilter.addEventListener('change', (e) => {
            state.filters.timeRange = parseInt(e.target.value, 10);
            refreshDashboard();
        });
    }

    // Status-Filter
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            state.filters.status = e.target.value;
            state.ui.currentPage = 1;
            updateUI();
        });
    }

    // Typ-Filter
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            state.filters.eventType = e.target.value;
            state.ui.currentPage = 1;
            updateUI();
        });
    }

    // Aktualisieren-Button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            refreshDashboard();
        });
    }
}

/**
 * Aktualisiert die Typ-Filter-Optionen basierend auf den Daten
 */
function updateTypeFilterOptions() {
    const typeFilter = document.getElementById('type-filter');
    if (!typeFilter) return;

    // Behalte "Alle Arten" bei, füge die 4 Kategorien hinzu
    const options = [
        { value: 'all', label: 'Alle Arten' },
        { value: 'fire', label: 'Brand' },
        { value: 'medical', label: 'Rettungsdienst' },
        { value: 'technical', label: 'Technische Hilfe' },
        { value: 'other', label: 'Sonstiges' }
    ];

    typeFilter.innerHTML = options.map(opt =>
        `<option value="${opt.value}">${escapeHtml(opt.label)}</option>`
    ).join('');

    // Aktuellen Wert wiederherstellen
    typeFilter.value = state.filters.eventType;
}

/**
 * Setzt alle Filter zurück
 */
function resetFilters() {
    state.filters.timeRange = CONFIG.defaultTimeFilter;
    state.filters.status = 'all';
    state.filters.eventType = 'all';
    state.ui.currentPage = 1;
    state.ui.searchQuery = '';

    // UI aktualisieren
    const timeFilter = document.getElementById('time-filter');
    if (timeFilter) timeFilter.value = CONFIG.defaultTimeFilter;

    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) statusFilter.value = 'all';

    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) typeFilter.value = 'all';

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    refreshDashboard();
}
