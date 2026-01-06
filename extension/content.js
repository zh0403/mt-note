// content.js
// Inject scripts in order: abi.js -> ethers.js -> inpage.js
function injectScript(src, callback) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(src);
    script.onload = function() {
        if (callback) callback();
        this.remove(); // Clean up tag after injection
    };
    script.onerror = function() {
        console.error(`Failed to load script: ${src}`);
    };
    (document.head || document.documentElement).appendChild(script);
}

// Inject scripts in sequence
injectScript('abi.js', () => {
    injectScript('ethers.js', () => {
        injectScript('inpage.js');
    });
});