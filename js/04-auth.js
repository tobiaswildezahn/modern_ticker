/**
 * 04-auth.js - IWA (Integrated Windows Authentication)
 *
 * Konfiguriert die automatische Windows-Authentifizierung für ArcGIS Feature Services.
 * Verwendet native fetch() mit credentials: 'include' für IWA.
 *
 * HINWEIS: IWA funktioniert nur im Intranet mit korrekt konfiguriertem ArcGIS Server.
 */

/**
 * Initialisiert die IWA-Authentifizierung
 *
 * Bei IWA ist keine spezielle Initialisierung nötig - der Browser sendet
 * automatisch Windows-Credentials wenn credentials: 'include' gesetzt ist.
 *
 * @returns {Promise} Resolved sofort
 */
function initAuth() {
    return new Promise((resolve) => {
        console.log('✅ IWA-Authentifizierung konfiguriert');
        console.log('   Server:', CONFIG.arcgisServer);
        console.log('   Methode: Native fetch() mit credentials: include');
        resolve();
    });
}

/**
 * Initialisiert Token-Dialog Event-Listener (Fallback, falls IWA nicht funktioniert)
 */
function initTokenDialogListeners() {
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

// Globale Variable für manuell eingegebenen Token (Fallback)
let manualToken = null;

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

    // Token speichern für manuelle Verwendung
    manualToken = token;

    hideTokenDialog();
    showToast('Token gespeichert, lade Daten...', 'info');
    refreshDashboard();
}

/**
 * Gibt den manuellen Token zurück (falls vorhanden)
 *
 * @returns {string|null} Token oder null
 */
function getManualToken() {
    return manualToken;
}

/**
 * Prüft ob Token benötigt wird (bei IWA immer true)
 *
 * @returns {boolean} Bei IWA immer true (kein manueller Token nötig)
 */
function hasValidToken() {
    return true;
}
