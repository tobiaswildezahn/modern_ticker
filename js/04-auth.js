/**
 * 04-auth.js - Token-basierte Authentifizierung
 *
 * Implementiert die ArcGIS Token-Authentifizierung gemäß DOCUMENTATION.md.
 * Verwendet den ArcGIS IdentityManager für automatisches Token-Management.
 */

// Globale Referenzen für ArcGIS Module
let esriId = null;
let esriRequest = null;

/**
 * Initialisiert die ArcGIS Authentifizierung
 *
 * Lädt den IdentityManager und esriRequest Module.
 *
 * @returns {Promise} Resolved wenn Module geladen sind
 */
function initAuth() {
    return new Promise((resolve, reject) => {
        require([
            'esri/request',
            'esri/identity/IdentityManager'
        ], function(request, identityManager) {
            esriRequest = request;
            esriId = identityManager;

            console.log('✅ ArcGIS Auth-Module geladen');

            // Prüfe ob Token in sessionStorage vorhanden
            const storedToken = getStoredToken();
            if (storedToken) {
                registerToken(storedToken);
                console.log('✅ Token aus sessionStorage geladen');
            }

            resolve();
        });
    });
}

/**
 * Registriert einen Token beim IdentityManager
 *
 * Der Token wird automatisch bei allen Anfragen an den ArcGIS Server verwendet.
 *
 * @param {string} token - ArcGIS Access Token
 * @param {number} [expires] - Token-Ablaufzeit (Unix timestamp in ms)
 */
function registerToken(token, expires) {
    if (!esriId) {
        console.error('IdentityManager nicht initialisiert');
        return;
    }

    const expiry = expires || (Date.now() + CONFIG.auth.tokenExpiry);

    esriId.registerToken({
        server: CONFIG.arcgisServer,
        token: token,
        expires: expiry
    });

    // Token im sessionStorage speichern
    saveToken(token, expiry);

    console.log('✅ Token registriert, gültig bis:', new Date(expiry).toLocaleString('de-DE'));
}

/**
 * Speichert den Token im sessionStorage
 *
 * @param {string} token - Token-String
 * @param {number} expires - Ablaufzeit
 */
function saveToken(token, expires) {
    try {
        const tokenData = {
            token: token,
            expires: expires
        };
        sessionStorage.setItem(CONFIG.auth.tokenStorageKey, JSON.stringify(tokenData));
    } catch (e) {
        console.warn('Token konnte nicht gespeichert werden:', e);
    }
}

/**
 * Lädt den Token aus dem sessionStorage
 *
 * @returns {string|null} Token oder null wenn nicht vorhanden/abgelaufen
 */
function getStoredToken() {
    try {
        const stored = sessionStorage.getItem(CONFIG.auth.tokenStorageKey);
        if (!stored) return null;

        const tokenData = JSON.parse(stored);

        // Prüfe ob Token abgelaufen
        if (tokenData.expires && tokenData.expires < Date.now()) {
            console.log('Gespeicherter Token ist abgelaufen');
            sessionStorage.removeItem(CONFIG.auth.tokenStorageKey);
            return null;
        }

        return tokenData.token;
    } catch (e) {
        return null;
    }
}

/**
 * Löscht den gespeicherten Token
 */
function clearToken() {
    sessionStorage.removeItem(CONFIG.auth.tokenStorageKey);
    if (esriId) {
        esriId.destroyCredentials();
    }
    console.log('Token gelöscht');
}

/**
 * Prüft ob ein gültiger Token vorhanden ist
 *
 * @returns {boolean} True wenn Token vorhanden und gültig
 */
function hasValidToken() {
    return getStoredToken() !== null;
}

/**
 * Zeigt den Token-Eingabe-Dialog
 */
function showTokenDialog() {
    const modal = document.getElementById('token-modal');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('visible'), 10);

        // Focus auf Input
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
 * Verarbeitet die Token-Eingabe aus dem Dialog
 */
function submitToken() {
    const input = document.getElementById('token-input');
    if (!input) return;

    const token = input.value.trim();
    if (!token) {
        showToast('Bitte Token eingeben', 'warning');
        return;
    }

    // Token registrieren
    registerToken(token);
    hideTokenDialog();

    // Dashboard neu laden
    showToast('Token registriert, lade Daten...', 'info');
    refreshDashboard();
}

/**
 * Initialisiert die Token-Dialog Event-Listener
 */
function initTokenDialogListeners() {
    // Submit Button
    const submitBtn = document.getElementById('token-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitToken);
    }

    // Enter-Taste im Input
    const input = document.getElementById('token-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitToken();
            }
        });
    }

    // Schließen-Button
    const closeBtn = document.getElementById('token-modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideTokenDialog);
    }
}
