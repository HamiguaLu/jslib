// ========== CONFIGURATION ==========
const WORKER_URL = 'https://trackerworkerv2.lugangxyz.workers.dev/verify';
const DEFAULT_REDIRECT_URL = 'https://glhpmr9.ladysearchs.com/xv7hcug';

// ========== AVATAR LIST (Rotated randomly on load) ==========
// Replace these with your public GitHub CDN URLs (e.g., via jsDelivr)
const AVATAR_LIST = [
    'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/avatar/1.webp',
    'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/avatar/2.webp',
    'https://cdn.jsdelivr.net/gh/HamiguaLu/jslib/bot.detect/avatar/3.webp',
];

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

// Extract camp code from fragment data if it matches MD5 + camp code format
// Format: 32 hex chars (MD5) + 2 hex chars (1 byte camp code) = 34 chars total
function extractCampCode(fragmentData) {
    if (!fragmentData || typeof fragmentData !== 'string') {
        console.log('[CampCode] No fragment data provided');
        return null;
    }
    
    // Check if length is exactly 34 characters (32 MD5 + 2 camp code)
    if (fragmentData.length === 34) {
        // Check if it's a valid hex string
        const hexRegex = /^[0-9a-fA-F]+$/;
        if (hexRegex.test(fragmentData)) {
            const md5Part = fragmentData.substring(0, 32);
            const campCodeHex = fragmentData.substring(32, 34);
            const campCodeValue = parseInt(campCodeHex, 16);
            
            console.log('[CampCode] Extracted successfully!');
            console.log(`  - Full Data: ${fragmentData}`);
            console.log(`  - MD5 Part (32 chars): ${md5Part}`);
            console.log(`  - Camp Code Hex (2 chars): ${campCodeHex}`);
            console.log(`  - Camp Code Decimal (0-255): ${campCodeValue}`);
            
            return {
                fullData: fragmentData,
                md5: md5Part,
                campCodeHex: campCodeHex,
                campCodeDecimal: campCodeValue,
                isValid: true
            };
        } else {
            console.log('[CampCode] Data is 34 chars but not valid hex');
            return { isValid: false, reason: 'Not valid hex' };
        }
    } else {
        console.log(`[CampCode] Data length is ${fragmentData.length}, expected 34 chars for MD5+camp format`);
        return { isValid: false, reason: `Invalid length: ${fragmentData.length}` };
    }
}

// Send data to Cloudflare Worker and redirect (only after real user click)
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
        // Fallback on error
        window.location.href = `${DEFAULT_REDIRECT_URL}?data=${encodeURIComponent(userData)}`;
    }
}

// Select a random avatar from the configuration array
function getRandomAvatarUrl() {
    if (!AVATAR_LIST || AVATAR_LIST.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * AVATAR_LIST.length);
    return AVATAR_LIST[randomIndex];
}

// Apply camp code specific styling (placeholder for future implementation)
function applyCampCodeStyling(campCodeData) {
    if (!campCodeData || !campCodeData.isValid) return;
    
    const campValue = campCodeData.campCodeDecimal;
    console.log(`[CampCode Styling] Would apply styles for camp code: ${campValue}`);
    
    // TODO: Future implementation for different styles based on camp code
    // Example:
    // if (campValue === 0) { /* style A */ }
    // if (campValue === 1) { /* style B */ }
    // if (campValue === 255) { /* style C */ }
}

// Main initialization: Build UI + create Shadow DOM button
function init() {
    const app = document.getElementById('app');
    if (!app) return;
    
    const fragmentData = getFragmentData();
    
    // Extract and log camp code from fragment data
    const campCodeData = extractCampCode(fragmentData);
    
    // Apply camp code styling (placeholder for future)
    applyCampCodeStyling(campCodeData);
    
    // 1. Create basic HTML framework (Card with headline, image placeholder, and footer)
    const cardHtml = `
        <div class="verification-card">
            <div class="brand-headline">
                <h2>Access Restricted to 18+ Only!</h2>
                <p>This website contains adult content. Please confirm your age to view and connect with profiles near you.</p>
            </div>
            
            <div id="button-mount"></div>
            
            <div class="footer-note">
                <span>✓ Over 18 Years Old</span>
                <span>✓ 100% Discreet</span>
                <span>✓ Real Profiles</span>
            </div>
        </div>
    `;
    
    app.innerHTML = cardHtml;
    
    // 2. Inject a random photo element dynamically ABOVE the button mount point
    const mountPoint = document.getElementById('button-mount');
    if (!mountPoint) return;
    
    const chosenAvatar = getRandomAvatarUrl();
    const avatarContainer = document.createElement('div');
    avatarContainer.className = 'avatar-container';
    avatarContainer.innerHTML = `
        <div class="avatar-wrapper">
            <img class="avatar-img" src="${chosenAvatar}" alt="Verified Profile">
        </div>
    `;
    mountPoint.parentNode.insertBefore(avatarContainer, mountPoint);
    
    // 3. Create Shadow DOM with elegant dark button
    const shadowHost = document.createElement('div');
    shadowHost.style.display = 'flex';
    shadowHost.style.alignItems = 'center';
    shadowHost.style.justifyContent = 'center';
    mountPoint.appendChild(shadowHost);
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    // Minimalist, modern dark button styles (Shadow DOM CSS)
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
        <span class="cf-text">I am 18+ · Confirm</span>
    `;
    
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(button);
    
    let clicked = false;
    
    // Event listener for user interaction
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
        if (textSpan) textSpan.textContent = 'Verification in progress...';
        
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.9';
        button.style.transform = 'none';
        
        const userData = getFragmentData();
        await sendToCloudflareAndRedirect(userData);
    });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);