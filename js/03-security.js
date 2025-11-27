/**
 * 03-security.js - Sicherheitsfunktionen
 *
 * Enthält alle sicherheitsrelevanten Funktionen zum Schutz gegen:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection
 *
 * KRITISCH: Diese Funktionen MÜSSEN bei JEDER Ausgabe von externen Daten verwendet werden!
 */

/**
 * SICHERHEITSFUNKTION: HTML-Escaping
 *
 * Schützt vor XSS-Angriffen (Cross-Site Scripting), indem gefährliche
 * Zeichen in HTML-Code durch sichere Alternativen ersetzt werden.
 *
 * BEISPIEL ANGRIFF (ohne Escaping):
 * - Eingabe: <script>alert('Hack!')</script>
 * - Wird ausgeführt und öffnet Alert-Box
 *
 * BEISPIEL SCHUTZ (mit Escaping):
 * - Eingabe: <script>alert('Hack!')</script>
 * - Wird zu: &lt;script&gt;alert('Hack!')&lt;/script&gt;
 * - Wird als Text angezeigt, nicht ausgeführt
 *
 * @param {string|number|null|undefined} unsafe - Potenziell gefährlicher Text
 * @returns {string} Sicherer Text für HTML-Ausgabe
 */
function escapeHtml(unsafe) {
    // Null, undefined oder leere Strings -> 'N/A' zurückgeben
    if (unsafe === null || unsafe === undefined || unsafe === '') {
        return 'N/A';
    }

    // In String konvertieren und gefährliche Zeichen escapen
    // WICHTIG: & muss ZUERST ersetzt werden!
    return String(unsafe)
        .replace(/&/g, '&amp;')   // & -> &amp; (MUSS ZUERST sein!)
        .replace(/</g, '&lt;')    // < -> &lt;
        .replace(/>/g, '&gt;')    // > -> &gt;
        .replace(/"/g, '&quot;')  // " -> &quot;
        .replace(/'/g, '&#039;'); // ' -> &#039;
}

/**
 * SICHERHEITSFUNKTION: SQL-Sanitisierung
 *
 * Schützt vor SQL-Injection-Angriffen in ArcGIS WHERE-Klauseln.
 *
 * BEISPIEL ANGRIFF (ohne Sanitisierung):
 * - Eingabe: RTW' OR '1'='1
 * - WHERE-Klausel: nameresourcetype = 'RTW' OR '1'='1'
 * - Ergebnis: ALLE Datensätze werden zurückgegeben!
 *
 * BEISPIEL SCHUTZ (mit Sanitisierung):
 * - Eingabe: RTW' OR '1'='1
 * - WHERE-Klausel: nameresourcetype = 'RTW'' OR ''1''=''1'
 * - Ergebnis: Kein Treffer, Angriff blockiert
 *
 * @param {string|number|null|undefined} value - Potenziell gefährlicher Wert
 * @returns {string} Sicherer Wert für SQL WHERE-Klauseln
 */
function sanitizeForSQL(value) {
    // Null/undefined -> leerer String
    if (value === null || value === undefined) {
        return '';
    }

    const str = String(value);

    // Warnung bei verdächtigen Zeichen (für Debugging)
    if (/[;'"\\]/.test(str)) {
        console.warn('⚠️ SECURITY WARNING: Verdächtige Zeichen in SQL-Parameter:', str);
    }

    // SQL-Standard: Single Quotes durch Verdopplung escapen
    return str.replace(/'/g, "''");
}

/**
 * Validiert eine Event-ID
 *
 * @param {string|number} eventId - Zu validierende ID
 * @returns {boolean} True wenn gültig
 */
function isValidEventId(eventId) {
    if (eventId === null || eventId === undefined) {
        return false;
    }

    // Nur alphanumerische Zeichen und Bindestriche erlaubt
    const str = String(eventId);
    return /^[a-zA-Z0-9\-_]+$/.test(str) && str.length > 0 && str.length < 100;
}

/**
 * Bereinigt einen Suchstring
 *
 * @param {string} query - Suchbegriff
 * @returns {string} Bereinigter Suchbegriff
 */
function sanitizeSearchQuery(query) {
    if (!query) return '';

    return String(query)
        .trim()
        .slice(0, 100)  // Max 100 Zeichen
        .toLowerCase();
}
