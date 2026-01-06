// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('open-dash');
    if (btn) {
        btn.addEventListener('click', () => {
            // For dev: Point to your Live Server URL
            // For production: You will change this to "https://your-username.github.io/mt-note/..."
            chrome.tabs.create({ url: 'https://zh0403.github.io/mt-note/dashboard.html' });
        });
    }
});