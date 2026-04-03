(function () {
    const STORAGE_KEY = 'healio_theme';
    const COOKIE_KEY = 'healio_theme';
    const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
    const AVAILABLE_THEMES = ['light', 'dark', 'ocean', 'sunset'];
    const DEFAULT_THEME = 'light';

    function normalizeTheme(theme) {
        const value = String(theme || '').trim().toLowerCase();
        if (AVAILABLE_THEMES.includes(value)) {
            return value;
        }
        return DEFAULT_THEME;
    }

    function getStoredTheme() {
        let localTheme = '';
        try {
            localTheme = localStorage.getItem(STORAGE_KEY) || '';
        } catch (error) {
            localTheme = '';
        }

        if (localTheme) {
            return normalizeTheme(localTheme);
        }

        const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`));
        const cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
        return normalizeTheme(cookieTheme || DEFAULT_THEME);
    }

    function setStoredTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            // Ignore storage failures and keep in-memory application only.
        }

        document.cookie = `${COOKIE_KEY}=${encodeURIComponent(theme)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }

    function applyTheme(theme, persist = true) {
        const resolvedTheme = normalizeTheme(theme);
        const root = document.documentElement;

        root.setAttribute('data-theme', resolvedTheme);
        root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';

        if (document.body) {
            document.body.setAttribute('data-theme', resolvedTheme);
        }

        if (persist) {
            setStoredTheme(resolvedTheme);
        }

        window.dispatchEvent(new CustomEvent('healio:theme-changed', {
            detail: { theme: resolvedTheme }
        }));

        return resolvedTheme;
    }

    function getTheme() {
        return normalizeTheme(document.documentElement.getAttribute('data-theme'));
    }

    function listThemes() {
        return [...AVAILABLE_THEMES];
    }

    // Apply persisted preference immediately when the script is loaded.
    applyTheme(getStoredTheme(), false);

    // Ensure body gets the theme attribute even if script ran in <head>.
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
            document.body.setAttribute('data-theme', getTheme());
        }
    });

    window.HealioTheme = {
        applyTheme,
        setTheme: applyTheme,
        getTheme,
        listThemes
    };
})();
