/**
 * 13-main.js - Hauptmodul
 *
 * Orchestriert die Initialisierung und das Zusammenspiel aller Module.
 * Enthält die init()-Funktion, die beim Laden der Seite ausgeführt wird.
 */

/**
 * Aktualisiert die gesamte UI
 */
function updateUI() {
    updateKPIs();
    updateTable();
    updateMapMarkers();
    updateCharts();
    updateResourcesGrid();
}

/**
 * Lädt Daten neu und aktualisiert die UI
 */
async function refreshDashboard() {
    showLoading();
    setKPIsLoading();

    try {
        await fetchAllData({
            hours: state.filters.timeRange
        });

        updateTypeFilterOptions();
        updateUI();

        showToast('Daten aktualisiert', 'success');
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        showToast('Fehler beim Laden der Daten', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Startet den Auto-Refresh Timer
 */
function startAutoRefresh() {
    // Bestehenden Timer stoppen
    if (state.refreshTimer) {
        clearInterval(state.refreshTimer);
    }

    // Neuen Timer starten
    state.refreshTimer = setInterval(async () => {
        if (CONFIG.debug) {
            console.log('Auto-Refresh...');
        }

        try {
            await fetchAllData({
                hours: state.filters.timeRange
            });
            updateUI();
        } catch (error) {
            console.error('Auto-Refresh Fehler:', error);
        }
    }, CONFIG.refreshInterval);
}

/**
 * Stoppt den Auto-Refresh Timer
 */
function stopAutoRefresh() {
    if (state.refreshTimer) {
        clearInterval(state.refreshTimer);
        state.refreshTimer = null;
    }
}

/**
 * Hauptinitialisierung
 *
 * Wird aufgerufen sobald die ArcGIS API geladen ist.
 */
async function init() {
    console.log('🚒 Einsatz-Dashboard wird initialisiert...');

    try {
        showLoading();

        // 1. ArcGIS Request-Modul initialisieren
        await initEsriRequest();

        if (!esriRequest) {
            throw new Error('ArcGIS API nicht verfügbar');
        }

        console.log('✅ ArcGIS API geladen');

        // 2. Karte initialisieren
        try {
            await initMap();
            console.log('✅ Karte initialisiert');
        } catch (mapError) {
            console.warn('⚠️ Karte konnte nicht initialisiert werden:', mapError);
            // Dashboard kann auch ohne Karte funktionieren
        }

        // 3. Charts initialisieren
        initCharts();
        console.log('✅ Charts initialisiert');

        // 4. Event-Listener initialisieren
        initTableListeners();
        initModalListeners();
        initFilterListeners();
        initMapControls();
        console.log('✅ Event-Listener initialisiert');

        // 5. Initiale Daten laden
        await fetchAllData({
            hours: state.filters.timeRange
        });
        console.log('✅ Initiale Daten geladen');

        // 6. UI aktualisieren
        updateTypeFilterOptions();
        updateUI();

        // 7. Auto-Refresh starten
        startAutoRefresh();
        console.log('✅ Auto-Refresh gestartet');

        // 8. Cache-Cleanup planen
        setInterval(cleanCache, 60000); // Jede Minute

        console.log('🚒 Dashboard bereit!');
        showToast('Dashboard bereit', 'success');

    } catch (error) {
        console.error('❌ Initialisierungsfehler:', error);
        showToast('Fehler bei der Initialisierung', 'error');

        // Verbindungsstatus aktualisieren
        setConnectionStatus('disconnected');
    } finally {
        hideLoading();
    }
}

/**
 * Startet die Initialisierung wenn die ArcGIS API geladen ist
 */
require(['esri/request'], function() {
    // Warten auf DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
});

// Aufräumen beim Schließen
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();

    // Charts zerstören
    if (state.charts.byType) {
        state.charts.byType.destroy();
    }
    if (state.charts.timeline) {
        state.charts.timeline.destroy();
    }

    // Map zerstören
    if (state.map.view) {
        state.map.view.destroy();
    }
});

// Sichtbarkeitsänderung behandeln (Tab-Wechsel)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Tab nicht sichtbar -> Refresh pausieren
        stopAutoRefresh();
    } else {
        // Tab wieder sichtbar -> Refresh starten und sofort aktualisieren
        refreshDashboard();
        startAutoRefresh();
    }
});
