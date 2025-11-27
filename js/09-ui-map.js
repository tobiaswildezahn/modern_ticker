/**
 * 09-ui-map.js - Kartenvisualisierung
 *
 * Verwendet ArcGIS JavaScript API für die Einsatzkarte.
 * Basemap: OpenStreetMap (keine Authentifizierung erforderlich)
 */

/**
 * Initialisiert die Karte
 *
 * @returns {Promise} Promise das resolved wenn Karte fertig ist
 */
function initMap() {
    return new Promise((resolve, reject) => {
        require([
            'esri/Map',
            'esri/views/MapView',
            'esri/Graphic',
            'esri/layers/GraphicsLayer',
            'esri/symbols/SimpleMarkerSymbol',
            'esri/PopupTemplate',
            'esri/layers/WebTileLayer'
        ], function(Map, MapView, Graphic, GraphicsLayer, SimpleMarkerSymbol, PopupTemplate, WebTileLayer) {

            try {
                // OpenStreetMap als Basemap (keine ArcGIS-Authentifizierung nötig)
                const osmLayer = new WebTileLayer({
                    urlTemplate: 'https://{subDomain}.tile.openstreetmap.org/{level}/{col}/{row}.png',
                    subDomains: ['a', 'b', 'c'],
                    copyright: 'OpenStreetMap contributors'
                });

                // Karte erstellen mit OSM
                const map = new Map({
                    layers: [osmLayer]
                });

                // Graphics Layer für Einsatz-Marker
                const graphicsLayer = new GraphicsLayer();
                map.add(graphicsLayer);

                // MapView erstellen
                const view = new MapView({
                    container: 'map-view',
                    map: map,
                    center: [CONFIG.map.center.longitude, CONFIG.map.center.latitude],
                    zoom: CONFIG.map.zoom,
                    ui: {
                        components: [] // Keine Standard-Widgets
                    },
                    constraints: {
                        minZoom: 8,
                        maxZoom: 18
                    }
                });

                // Im State speichern
                state.map.view = view;
                state.map.graphicsLayer = graphicsLayer;

                // Speichere Module für späteren Zugriff
                window.esriModules = {
                    Graphic,
                    SimpleMarkerSymbol,
                    PopupTemplate
                };

                view.when(() => {
                    if (CONFIG.debug) {
                        console.log('Karte initialisiert');
                    }
                    resolve(view);
                }).catch(reject);

            } catch (error) {
                console.error('Fehler bei Map-Initialisierung:', error);
                reject(error);
            }
        });
    });
}

/**
 * Aktualisiert die Marker auf der Karte
 */
function updateMapMarkers() {
    if (!state.map.graphicsLayer || !window.esriModules) {
        return;
    }

    const { Graphic, SimpleMarkerSymbol, PopupTemplate } = window.esriModules;

    // Bestehende Marker entfernen
    state.map.graphicsLayer.removeAll();

    // Nur Events mit Geometrie
    const eventsWithGeometry = state.data.processedEvents.filter(e =>
        e.geometry && e.geometry.x && e.geometry.y
    );

    // Farben für Einsatztypen
    const colors = {
        fire: [220, 38, 38],      // Rot
        medical: [37, 99, 235],   // Blau
        technical: [202, 138, 4], // Gelb
        other: [107, 114, 128]    // Grau
    };

    for (const event of eventsWithGeometry) {
        const color = colors[event.typeCategory] || colors.other;
        const isActive = event.status === 'active';

        // Symbol erstellen
        const symbol = new SimpleMarkerSymbol({
            style: 'circle',
            color: [...color, isActive ? 1 : 0.6],
            size: isActive ? 14 : 10,
            outline: {
                color: [255, 255, 255, 0.8],
                width: isActive ? 2 : 1
            }
        });

        // Popup-Template
        const popupTemplate = new PopupTemplate({
            title: '{eventType}',
            content: `
                <div class="map-popup">
                    <p><strong>ID:</strong> {eventId}</p>
                    <p><strong>Adresse:</strong> {address}</p>
                    <p><strong>Status:</strong> {status}</p>
                    <p><strong>Ressourcen:</strong> {resourceCount}</p>
                </div>
            `
        });

        // Graphic erstellen
        // SICHERHEIT: Daten werden escaped
        const graphic = new Graphic({
            geometry: {
                type: 'point',
                x: event.geometry.x,
                y: event.geometry.y,
                spatialReference: event.geometry.spatialReference || { wkid: 4326 }
            },
            symbol: symbol,
            attributes: {
                eventId: escapeHtml(event.id),
                eventType: escapeHtml(event.nameeventtype || 'Unbekannt'),
                address: escapeHtml(event.address),
                status: getStatusLabel(event.status),
                resourceCount: event.resourceCount || 0
            },
            popupTemplate: popupTemplate
        });

        state.map.graphicsLayer.add(graphic);
    }

    if (CONFIG.debug) {
        console.log(`${eventsWithGeometry.length} Marker auf Karte aktualisiert`);
    }
}

/**
 * Zentriert die Karte auf einen bestimmten Einsatz
 *
 * @param {string} eventId - Einsatz-ID
 */
function centerMapOnEvent(eventId) {
    if (!state.map.view) return;

    const event = state.data.processedEvents.find(e => e.id === eventId);
    if (!event || !event.geometry) return;

    state.map.view.goTo({
        center: [event.geometry.x, event.geometry.y],
        zoom: 15
    }, {
        duration: 500
    });
}

/**
 * Zentriert die Karte auf Hamburg
 */
function centerMapOnHamburg() {
    if (!state.map.view) return;

    state.map.view.goTo({
        center: [CONFIG.map.center.longitude, CONFIG.map.center.latitude],
        zoom: CONFIG.map.zoom
    }, {
        duration: 500
    });
}

/**
 * Zoom-In
 */
function mapZoomIn() {
    if (!state.map.view) return;
    state.map.view.zoom++;
}

/**
 * Zoom-Out
 */
function mapZoomOut() {
    if (!state.map.view) return;
    state.map.view.zoom--;
}

/**
 * Initialisiert die Map-Control-Listener
 */
function initMapControls() {
    const zoomInBtn = document.getElementById('map-zoom-in');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', mapZoomIn);
    }

    const zoomOutBtn = document.getElementById('map-zoom-out');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', mapZoomOut);
    }

    const centerBtn = document.getElementById('map-center');
    if (centerBtn) {
        centerBtn.addEventListener('click', centerMapOnHamburg);
    }
}
