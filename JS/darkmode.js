// js/darkmode.js
export function initDarkMode() {
    // Determine the initial state
    const stored = localStorage.getItem('darkMode') || localStorage.getItem('theme');
    let isDark = false;
    if (stored === 'dark') {
        isDark = true;
    } else if (stored === 'light') {
        isDark = false;
    } else {
        // Fallback to system preference
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Apply the class
    applyDarkMode(isDark);

    // Set up the toggle button if it exists
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        // Remove any existing listeners to avoid duplicates
        const newToggle = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggle, toggleBtn);
        newToggle.addEventListener('click', () => {
            const current = document.documentElement.classList.contains('dark');
            applyDarkMode(!current);
            localStorage.setItem('darkMode', !current ? 'dark' : 'light');
        });
    }
}

function applyDarkMode(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Update the toggle icon if present
    const icon = document.getElementById('theme-icon');
    if (icon) {
        if (isDark) {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    }
}