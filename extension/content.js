// content.js

// 1. Define the order of scripts
const scripts = ['ethers.js', 'crypto-js.js', 'abi.js', 'inpage.js'];

// 2. Recursive function to load them one by one
function loadScript(index) {
    if (index >= scripts.length) return; // Done

    const file = scripts[index];
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(file);
    script.async = false; // Important

    // WAIT for this script to finish loading before starting the next one
    script.onload = function() {
        console.log(`[mt_note] Loaded: ${file}`);
        loadScript(index + 1); // Load next
        this.remove(); // Clean up the tag (optional)
    };
    
    script.onerror = function() {
        console.error(`[mt_note] Failed to load: ${file}`);
    };

    (document.head || document.documentElement).appendChild(script);
}

// Start the chain
loadScript(0);