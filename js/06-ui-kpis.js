/**
 * 06-ui-kpis.js - KPI-Karten UI
 *
 * Aktualisiert die KPI-Anzeigen im Dashboard.
 */

/**
 * Aktualisiert alle KPI-Karten
 *
 * @param {Object} kpis - KPI-Objekt von calculateKPIs()
 */
function updateKPIs(kpis) {
    if (!kpis) {
        kpis = calculateKPIs();
    }

    // Total Events
    const totalElement = document.getElementById('kpi-total-value');
    if (totalElement) {
        totalElement.textContent = kpis.totalEvents.toLocaleString('de-DE');
    }

    // Active Events
    const activeElement = document.getElementById('kpi-active-value');
    if (activeElement) {
        activeElement.textContent = kpis.activeEvents.toLocaleString('de-DE');

        // Highlight wenn aktive Einsätze vorhanden
        const card = document.getElementById('kpi-active');
        if (card) {
            card.classList.toggle('active', kpis.activeEvents > 0);
        }
    }

    // Resources in Use
    const resourcesElement = document.getElementById('kpi-resources-value');
    if (resourcesElement) {
        resourcesElement.textContent = kpis.resourcesInUse.toLocaleString('de-DE');
    }

    // Average Duration
    const avgTimeElement = document.getElementById('kpi-avg-time-value');
    if (avgTimeElement) {
        avgTimeElement.textContent = formatDuration(kpis.avgDuration);
    }
}

/**
 * Setzt KPIs auf Ladezustand
 */
function setKPIsLoading() {
    const elements = [
        'kpi-total-value',
        'kpi-active-value',
        'kpi-resources-value',
        'kpi-avg-time-value'
    ];

    for (const id of elements) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '...';
        }
    }
}
