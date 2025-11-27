/**
 * 04-auth.js - IWA (Integrated Windows Authentication)
 *
 * Konfiguriert die automatische Windows-Authentifizierung für ArcGIS Feature Services.
 * Der Browser übergibt automatisch die Windows-Anmeldedaten an den Server.
 *
 * HINWEIS: IWA funktioniert nur im Intranet mit korrekt konfiguriertem ArcGIS Server.
 */

// Globale Referenz für esriRequest
let esriRequest = null;

/**
 * Initialisiert die IWA-Authentifizierung
 *
 * Konfiguriert esriConfig um Windows-Credentials automatisch zu senden.
 *
 * @returns {Promise} Resolved wenn Konfiguration abgeschlossen
 */
function initAuth() {
    return new Promise((resolve, reject) => {
        require([
            'esri/config',
            'esri/request'
        ], function(esriConfig, request) {
            esriRequest = request;

            // Server als "trusted" markieren - Browser sendet automatisch Windows-Credentials
            // Dies aktiviert IWA (Integrated Windows Authentication)
            const serverUrl = CONFIG.arcgisServer;

            if (!esriConfig.request.trustedServers.includes(serverUrl)) {
                esriConfig.request.trustedServers.push(serverUrl);
            }

            // Zusätzlich: Erlaubt withCredentials für Cross-Origin Requests
            // Dies ist wichtig für IWA im Intranet
            esriConfig.request.httpsDomains = esriConfig.request.httpsDomains || [];

            // Server-Domain extrahieren und hinzufügen
            try {
                const url = new URL(serverUrl);
                if (!esriConfig.request.httpsDomains.includes(url.hostname)) {
                    esriConfig.request.httpsDomains.push(url.hostname);
                }
            } catch (e) {
                console.warn('URL-Parsing fehlgeschlagen:', e);
            }

            console.log('✅ IWA-Authentifizierung konfiguriert');
            console.log('   Trusted Server:', serverUrl);

            resolve();
        });
    });
}

/**
 * Prüft ob die Authentifizierung funktioniert
 *
 * Führt eine Test-Anfrage durch um zu prüfen ob IWA korrekt konfiguriert ist.
 *
 * @returns {Promise<boolean>} True wenn Authentifizierung erfolgreich
 */
async function testAuthentication() {
    if (!esriRequest) {
        console.error('esriRequest nicht initialisiert');
        return false;
    }

    try {
        // Einfache Metadaten-Abfrage zum Testen
        const testUrl = CONFIG.api.events;
        const response = await esriRequest(testUrl, {
            query: { f: 'json' },
            responseType: 'json'
        });

        if (response.data && !response.data.error) {
            console.log('✅ IWA-Authentifizierung erfolgreich');
            return true;
        }

        console.warn('⚠️ Server-Antwort enthält Fehler:', response.data?.error);
        return false;
    } catch (error) {
        console.error('❌ IWA-Authentifizierung fehlgeschlagen:', error);
        return false;
    }
}

/**
 * Initialisiert Token-Dialog Event-Listener (Fallback, falls IWA nicht funktioniert)
 *
 * Diese Funktion bleibt für Kompatibilität, wird aber bei IWA nicht benötigt.
 */
function initTokenDialogListeners() {
    // Bei IWA nicht benötigt, aber für Kompatibilität beibehalten
    const submitBtn = document.getElementById('token-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitToken);
    }

    const input = document.getElementById('token-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitToken();
            }
        });
    }

    const closeBtn = document.getElementById('token-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideTokenDialog);
    }
}

/**
 * Zeigt den Token-Dialog (Fallback für manuellen Token)
 */
function showTokenDialog() {
    const modal = document.getElementById('token-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);

        const input = document.getElementById('token-input');
        if (input) {
            input.focus();
        }
    }
}

/**
 * Schließt den Token-Dialog
 */
function hideTokenDialog() {
    const modal = document.getElementById('token-modal');
    if (modal) {
        modal.classList.remove('visible');
        setTimeout(() => modal.style.display = 'none', 200);
    }
}

/**
 * Verarbeitet die Token-Eingabe (Fallback)
 */
function submitToken() {
    const input = document.getElementById('token-input');
    if (!input) return;

    const token = input.value.trim();
    if (!token) {
        showToast('Bitte Token eingeben', 'warning');
        return;
    }

    // Token manuell registrieren (Fallback wenn IWA nicht funktioniert)
    require(['esri/identity/IdentityManager'], function(esriId) {
        esriId.registerToken({
            server: CONFIG.arcgisServer,
            token: token,
            expires: Date.now() + CONFIG.auth.tokenExpiry
        });

        hideTokenDialog();
        showToast('Token registriert, lade Daten...', 'info');
        refreshDashboard();
    });
}

/**
 * Prüft ob Token benötigt wird (bei IWA immer false)
 *
 * @returns {boolean} Bei IWA immer true (kein manueller Token nötig)
 */
function hasValidToken() {
    // Bei IWA ist kein manueller Token erforderlich
    // Windows-Credentials werden automatisch gesendet
    return true;
}
