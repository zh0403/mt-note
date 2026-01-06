// ethers.js - Lazy loader for ethers library
// Loads ethers only when needed to reduce initial page load time
// Optimized: Reduced from ~129KB bundled to ~1KB loader

async function loadEthers() {
    if (window.ethers) {
        return window.ethers;
    }

    return new Promise((resolve, reject) => {
        // Try CDN first (smaller extension size, faster updates)
        const script = document.createElement('script');
        script.src = 'https://cdn.ethers.io/lib/ethers-6.15.0.umd.min.js';
        script.async = true;
        
        const timeout = setTimeout(() => {
            script.remove();
            // Fallback: Try loading from extension bundle if CDN fails
            loadEthersFromBundle().then(resolve).catch(reject);
        }, 3000); // 3 second timeout
        
        script.onload = () => {
            clearTimeout(timeout);
            if (window.ethers) {
                resolve(window.ethers);
            } else {
                loadEthersFromBundle().then(resolve).catch(reject);
            }
        };
        
        script.onerror = () => {
            clearTimeout(timeout);
            loadEthersFromBundle().then(resolve).catch(reject);
        };
        
        document.head.appendChild(script);
    });
}

// Fallback: Load from local bundle if CDN is blocked (CSP) or unavailable
function loadEthersFromBundle() {
    return new Promise((resolve, reject) => {
        if (window.ethers) {
            resolve(window.ethers);
            return;
        }
        
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('ethers-bundle.js');
        script.async = true;
        script.onload = () => {
            if (window.ethers) {
                resolve(window.ethers);
            } else {
                reject(new Error('Failed to load ethers from bundle'));
            }
        };
        script.onerror = () => reject(new Error('Ethers bundle not found. Please download ethers-6.15.0.umd.min.js and save as ethers-bundle.js'));
        document.head.appendChild(script);
    });
}

// Export for use in inpage.js
window.loadEthers = loadEthers;
