/**
 * 01-config.js - Konfiguration
 *
 * Zentrale Konfigurationsdatei für das Einsatz-Dashboard.
 * Alle API-Endpunkte, Schwellenwerte und Konstanten werden hier definiert.
 *
 * SICHERHEIT: Keine sensiblen Daten (Passwörter, Tokens) in dieser Datei!
 * Tokens werden über sessionStorage oder zur Laufzeit gesetzt.
 */

const CONFIG = {
    // ArcGIS Server Basis-URL (für Token-Registrierung)
    arcgisServer: 'https://geoportal.feuerwehr.hamburg.de/ags',

    // ArcGIS Feature Service URLs
    // HINWEIS: Diese URLs sind nur im internen Netzwerk erreichbar
    api: {
        // Einsätze der letzten 7 Tage
        events: 'https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/EventsHist_Last_7_Days/FeatureServer/0',

        // Einsatzressourcen der letzten 7 Tage (Zuordnung Ressource <-> Einsatz)
        eventResources7Days: 'https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsatzresourcen_letzte_7_Tage/FeatureServer/0',

        // Aktuelle Einsatzressourcen (live)
        eventResourcesLive: 'https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsatzresourcen/FeatureServer/0',

        // Einsatzrückmeldungen der letzten 7 Tage
        feedback: 'https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Geoevent/Einsatzrueckmeldungen_letzte_7_Tage/FeatureServer/0',

        // Ressourcen-Stammdaten
        resources: 'https://geoportal.feuerwehr.hamburg.de/ags/rest/services/Ressources/FeatureServer/0'
    },

    // Authentifizierung
    auth: {
        // Token-Gültigkeit in Millisekunden (Standard: 2 Stunden)
        tokenExpiry: 7200000,
        // Token-Refresh-Intervall (110 Minuten, vor Ablauf)
        tokenRefreshInterval: 6600000,
        // SessionStorage Key für Token
        tokenStorageKey: 'arcgis_token'
    },

    // Karteneinstellungen
    map: {
        // Hamburg Zentrum
        center: {
            longitude: 10.0,
            latitude: 53.55
        },
        zoom: 11
    },

    // Zeitfilter-Standardwert (in Stunden)
    defaultTimeFilter: 24,

    // Auto-Refresh Intervall (in Millisekunden)
    refreshInterval: 30000, // 30 Sekunden

    // Pagination
    pagination: {
        pageSize: 20,
        maxPages: 10
    },

    // Einsatztyp-Kategorien für Farbkodierung
    eventTypeCategories: {
        // Brand-Einsätze (Rot)
        fire: [
            'Brand', 'Feuer', 'BMA', 'Brandmeldeanlage', 'Rauch',
            'Kleinbrand', 'Mittelbrand', 'Grossbrand'
        ],
        // Rettungsdienst (Blau)
        medical: [
            'Rettungsdienst', 'RTW', 'Notfall', 'Person',
            'Reanimation', 'Notarzt', 'NEF', 'NOTF'
        ],
        // Technische Hilfe (Gelb)
        technical: [
            'TH', 'Technische Hilfe', 'VU', 'Verkehrsunfall',
            'Türöffnung', 'Wasser', 'Sturm', 'Unwetter'
        ]
        // Alles andere: Sonstiges (Grau)
    },

    // Status-Mapping
    eventStatus: {
        active: ['offen', 'aktiv', 'laufend', 'disponiert'],
        completed: ['beendet', 'abgeschlossen', 'geschlossen']
    },

    // Ressourcen-Status
    resourceStatus: {
        alarmiert: ['alarmiert', 'ALARMIERT'],
        unterwegs: ['unterwegs', 'UNTERWEGS', 'auf Anfahrt'],
        eingetroffen: ['eingetroffen', 'EINGETROFFEN', 'vor Ort'],
        beendet: ['beendet', 'BEENDET', 'frei', 'FREI']
    },

    // Debug-Modus (für Console-Logs)
    debug: true
};

// Freeze CONFIG to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.api);
Object.freeze(CONFIG.auth);
Object.freeze(CONFIG.map);
Object.freeze(CONFIG.pagination);
Object.freeze(CONFIG.eventTypeCategories);
Object.freeze(CONFIG.eventStatus);
Object.freeze(CONFIG.resourceStatus);
