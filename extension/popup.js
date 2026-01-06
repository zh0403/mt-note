// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('open-dash');
    if (btn) {
        btn.addEventListener('click', () => {
            // For dev: Point to your Live Server URL
            // For production: You will change this to "https://your-username.github.io/mt-note/..."
            chrome.tabs.create({ url: 'http://127.0.0.1:5500/extension/dashboard.html' });
        });
    }
});