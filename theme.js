/**
 * ZENITH GLOBAL THEME MANAGER
 * Persistent Light / Dark Mode with System Preference fallback & Anti-Flash
 */
(function () {
    const THEME_KEY = 'zenith-theme';

    function getInitialTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
        } catch (e) {}

        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    function applyTheme(theme, persist) {
        document.documentElement.setAttribute('data-theme', theme);
        if (persist) {
            try {
                localStorage.setItem(THEME_KEY, theme);
            } catch (e) {}
        }
        updateToggleButtons(theme);
        updateFavicon(theme);
    }

    function updateFavicon(theme) {
        const svgIcon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
        if (svgIcon) {
            svgIcon.href = theme === 'dark' ? 'assets/favicon-dark.svg?v=2' : 'assets/favicon-light.svg?v=2';
        }
    }

    function updateToggleButtons(theme) {
        const isDark = theme === 'dark';
        const toggles = document.querySelectorAll('.theme-toggle-btn');

        toggles.forEach(function (btn) {
            btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
            btn.setAttribute('data-current-theme', theme);

            const label = btn.querySelector('.theme-toggle-label');
            if (label) {
                label.textContent = isDark ? 'Light' : 'Dark';
            }

            const moonIcon = btn.querySelector('.theme-icon-moon');
            const sunIcon = btn.querySelector('.theme-icon-sun');

            if (moonIcon && sunIcon) {
                if (isDark) {
                    moonIcon.style.display = 'none';
                    sunIcon.style.display = 'block';
                } else {
                    moonIcon.style.display = 'block';
                    sunIcon.style.display = 'none';
                }
            }
        });
    }

    window.toggleZenithTheme = function () {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next, true);
    };

    // System preference change listener (only active if user has not set explicit preference)
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            try {
                if (!localStorage.getItem(THEME_KEY)) {
                    applyTheme(e.matches ? 'dark' : 'light', false);
                }
            } catch (err) {}
        });
    }

    // Cross-tab sync via storage events
    window.addEventListener('storage', function (e) {
        if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
            applyTheme(e.newValue, false);
        }
    });

    // Synchronize UI button state and favicon when DOM is interactive
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            const active = document.documentElement.getAttribute('data-theme') || getInitialTheme();
            updateToggleButtons(active);
            updateFavicon(active);
        });
    } else {
        const active = document.documentElement.getAttribute('data-theme') || getInitialTheme();
        updateToggleButtons(active);
        updateFavicon(active);
    }
})();

