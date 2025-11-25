document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'site-dark';

    // Apply saved state
    if (localStorage.getItem(STORAGE_KEY) === '1') {
        document.body.classList.add('dark-mode');
    }

    // Update toggle text for all toggles
    function updateToggles() {
        const isDark = document.body.classList.contains('dark-mode');
        document.querySelectorAll('.dark-toggle').forEach(el => {
            el.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
            el.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        });
    }

    updateToggles();

    // Delegate clicks from any element with .dark-toggle
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.dark-toggle');
        if (!btn) return;

        const isDarkNow = document.body.classList.toggle('dark-mode');
        localStorage.setItem(STORAGE_KEY, isDarkNow ? '1' : '0');
        updateToggles();
    });
});