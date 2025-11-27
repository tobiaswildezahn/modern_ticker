/**
 * 10-ui-charts.js - Chart-Visualisierungen
 *
 * Verwendet Chart.js für Einsatzstatistiken.
 */

/**
 * Initialisiert alle Charts
 */
function initCharts() {
    initTypeChart();
    initTimelineChart();
}

/**
 * Initialisiert das Einsatztyp-Diagramm (Doughnut)
 */
function initTypeChart() {
    const canvas = document.getElementById('chart-by-type');
    if (!canvas) return;

    // Bestehenden Chart zerstören
    if (state.charts.byType) {
        state.charts.byType.destroy();
    }

    const ctx = canvas.getContext('2d');

    state.charts.byType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Brand', 'Rettungsdienst', 'Technische Hilfe', 'Sonstiges'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: [
                    'rgba(220, 38, 38, 0.8)',   // fire
                    'rgba(37, 99, 235, 0.8)',   // medical
                    'rgba(202, 138, 4, 0.8)',   // technical
                    'rgba(107, 114, 128, 0.8)'  // other
                ],
                borderColor: [
                    'rgba(220, 38, 38, 1)',
                    'rgba(37, 99, 235, 1)',
                    'rgba(202, 138, 4, 1)',
                    'rgba(107, 114, 128, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#d1d5db',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialisiert das Zeitverlauf-Diagramm (Line)
 */
function initTimelineChart() {
    const canvas = document.getElementById('chart-timeline');
    if (!canvas) return;

    // Bestehenden Chart zerstören
    if (state.charts.timeline) {
        state.charts.timeline.destroy();
    }

    const ctx = canvas.getContext('2d');

    state.charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Einsätze',
                data: [],
                borderColor: 'rgba(220, 38, 38, 1)',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        maxRotation: 45
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    },
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    titleColor: '#f9fafb',
                    bodyColor: '#d1d5db',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

/**
 * Aktualisiert alle Charts mit neuen Daten
 */
function updateCharts() {
    updateTypeChart();
    updateTimelineChart();
}

/**
 * Aktualisiert das Einsatztyp-Diagramm
 */
function updateTypeChart() {
    if (!state.charts.byType) return;

    const events = state.data.processedEvents;

    // Nach Typ gruppieren
    const typeCounts = {
        fire: 0,
        medical: 0,
        technical: 0,
        other: 0
    };

    for (const event of events) {
        const category = event.typeCategory || 'other';
        typeCounts[category]++;
    }

    // Chart aktualisieren
    state.charts.byType.data.datasets[0].data = [
        typeCounts.fire,
        typeCounts.medical,
        typeCounts.technical,
        typeCounts.other
    ];

    state.charts.byType.update('none');
}

/**
 * Aktualisiert das Zeitverlauf-Diagramm
 */
function updateTimelineChart() {
    if (!state.charts.timeline) return;

    const events = state.data.processedEvents;

    // Nach Stunden gruppieren (letzte 24h)
    const now = Date.now();
    const hourCounts = new Map();

    // Letzte 24 Stunden initialisieren
    for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now - i * 60 * 60 * 1000);
        hourStart.setMinutes(0, 0, 0);
        const label = `${String(hourStart.getHours()).padStart(2, '0')}:00`;
        hourCounts.set(label, 0);
    }

    // Events zählen
    for (const event of events) {
        if (!event.time_alarm) continue;

        const eventTime = new Date(event.time_alarm);
        const hoursSince = (now - eventTime.getTime()) / (60 * 60 * 1000);

        if (hoursSince <= 24) {
            const label = `${String(eventTime.getHours()).padStart(2, '0')}:00`;
            if (hourCounts.has(label)) {
                hourCounts.set(label, hourCounts.get(label) + 1);
            }
        }
    }

    // Chart aktualisieren
    state.charts.timeline.data.labels = Array.from(hourCounts.keys());
    state.charts.timeline.data.datasets[0].data = Array.from(hourCounts.values());

    state.charts.timeline.update('none');
}
