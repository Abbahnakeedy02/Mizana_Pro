// js/theme.js
(function() {
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }

    function getCurrentTheme() {
        const settings = localStorage.getItem('mizana_settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                const theme = parsed.display?.darkMode;
                if (theme === 'dark' || theme === 'light' || theme === 'system') {
                    return theme;
                }
            } catch(e) {}
        }
        // Default to system
        return 'system';
    }

    // Initial application
    applyTheme(getCurrentTheme());

    // Listen for changes (from settings page or other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'mizana_settings') {
            applyTheme(getCurrentTheme());
        }
    });

    // Also watch for system preference changes if theme is 'system'
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (getCurrentTheme() === 'system') {
            applyTheme('system');
        }
    });
})();