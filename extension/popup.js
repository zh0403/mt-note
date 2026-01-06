// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('open-dash');
    if (btn) {
        btn.addEventListener('click', () => {
            // Open the dashboard in a new tab
            chrome.tabs.create({ url: 'dashboard.html' });
        });
    }
});