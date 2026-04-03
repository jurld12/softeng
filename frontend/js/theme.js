(function () {
    const STORAGE_KEY = 'healio_theme';
    const COOKIE_KEY = 'healio_theme';
    const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
    const AVAILABLE_THEMES = ['light', 'dark', 'ocean', 'sunset'];
    const DEFAULT_THEME = 'light';
    const PATIENT_SIDEBAR_ITEMS = [
        { href: 'dashboard-v2.html', iconClass: 'bi bi-house-door-fill', label: 'Dashboard' },
        { href: 'vitals.html', iconClass: 'bi bi-heart-pulse', label: 'Vitals' },
        { href: 'appointments.html', iconClass: 'bi bi-calendar-check', label: 'Appointments' },
        { href: 'reports.html', iconClass: 'bi bi-file-earmark-text', label: 'Reports' },
        { href: 'achievements.html', iconClass: 'bi bi-trophy', label: 'Achievements' },
        { href: 'medications.html', iconClass: 'bi bi-capsule', label: 'Medications' },
        { href: 'notifications.html', iconClass: 'bi bi-bell', label: 'Notifications' },
        { href: 'chatbot.html', iconClass: 'bi bi-chat-dots', label: 'Chatbot' },
        { href: 'settings.html', iconClass: 'bi bi-gear', label: 'Settings' }
    ];
    const PATIENT_HEADER_LINKS = [
        { href: 'notifications.html', iconClass: 'bi bi-bell', title: 'Notifications', showBadge: true },
        { href: 'chatbot.html', iconClass: 'bi bi-chat-dots', title: 'Open chatbot' },
        { href: 'settings.html', iconClass: 'bi bi-gear', title: 'Settings' }
    ];
    const SETTINGS_RELATED_PAGES = new Set(['settings.html', 'change-password.html']);

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
        const bootstrapTheme = resolvedTheme === 'dark' ? 'dark' : 'light';

        root.setAttribute('data-theme', resolvedTheme);
        root.setAttribute('data-bs-theme', bootstrapTheme);
        root.style.colorScheme = resolvedTheme === 'dark' ? 'dark' : 'light';

        if (document.body) {
            document.body.setAttribute('data-theme', resolvedTheme);
            document.body.setAttribute('data-bs-theme', bootstrapTheme);
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

    function normalizeHref(value) {
        if (!value) {
            return '';
        }

        return String(value)
            .split('#')[0]
            .split('?')[0]
            .replace(/^\.\//, '')
            .toLowerCase();
    }

    function getCurrentPageName() {
        return normalizeHref((window.location.pathname || '').split('/').pop());
    }

    function isPatientSidebar(nav) {
        const hrefs = Array.from(nav.querySelectorAll('a.nav-item-custom'))
            .map((link) => normalizeHref(link.getAttribute('href')));

        return hrefs.includes('dashboard-v2.html')
            && hrefs.includes('vitals.html')
            && hrefs.includes('appointments.html');
    }

    function isSidebarItemActive(targetHref, currentPage) {
        const normalizedTarget = normalizeHref(targetHref);

        if (normalizedTarget === 'settings.html' && SETTINGS_RELATED_PAGES.has(currentPage)) {
            return true;
        }

        return normalizedTarget === currentPage;
    }

    function createSidebarLink(item, currentPage) {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'nav-item-custom';

        if (isSidebarItemActive(item.href, currentPage)) {
            link.classList.add('active');
        }

        const icon = document.createElement('i');
        icon.className = item.iconClass;

        const text = document.createElement('span');
        text.textContent = item.label;

        link.appendChild(icon);
        link.appendChild(text);
        return link;
    }

    function normalizePatientSidebar(nav) {
        const currentPage = getCurrentPageName();
        const fragment = document.createDocumentFragment();

        PATIENT_SIDEBAR_ITEMS.forEach((item) => {
            fragment.appendChild(createSidebarLink(item, currentPage));
        });

        nav.innerHTML = '';
        nav.appendChild(fragment);
    }

    function isThemePickerElement(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }

        return element.classList.contains('dropdown')
            && Boolean(element.querySelector('.dashboard-theme-trigger'));
    }

    function isStandardHeaderLink(element) {
        if (!(element instanceof HTMLElement)) {
            return false;
        }

        if (!element.matches('a.btn-icon')) {
            return false;
        }

        const href = normalizeHref(element.getAttribute('href'));
        return PATIENT_HEADER_LINKS.some((item) => normalizeHref(item.href) === href);
    }

    function createThemeOption(theme, label) {
        const item = document.createElement('li');
        const button = document.createElement('button');

        button.type = 'button';
        button.className = 'dropdown-item dashboard-theme-option';
        button.setAttribute('data-theme', theme);
        button.textContent = label;
        button.setAttribute('onclick', `window.HealioTheme && window.HealioTheme.setTheme('${theme}')`);

        item.appendChild(button);
        return item;
    }

    function createThemeDropdown() {
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown';

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'btn-icon dropdown-toggle dashboard-theme-trigger';
        trigger.id = 'healioThemeDropdown';
        trigger.setAttribute('data-bs-toggle', 'dropdown');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('title', 'Change theme');

        const triggerIcon = document.createElement('i');
        triggerIcon.className = 'bi bi-palette';
        trigger.appendChild(triggerIcon);

        const menu = document.createElement('ul');
        menu.className = 'dropdown-menu dropdown-menu-end dashboard-theme-menu';
        menu.setAttribute('aria-labelledby', trigger.id);
        menu.appendChild(createThemeOption('light', 'Light'));
        menu.appendChild(createThemeOption('dark', 'Dark'));
        menu.appendChild(createThemeOption('ocean', 'Ocean'));
        menu.appendChild(createThemeOption('sunset', 'Sunset'));

        dropdown.appendChild(trigger);
        dropdown.appendChild(menu);
        return dropdown;
    }

    function createHeaderIconLink(item) {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = 'btn-icon';

        if (item.title) {
            link.title = item.title;
        }

        const icon = document.createElement('i');
        icon.className = item.iconClass;
        link.appendChild(icon);

        if (item.showBadge) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.display = 'none';
            link.appendChild(badge);
        }

        return link;
    }

    function syncThemeOptionState(root = document) {
        const activeTheme = getTheme();
        const options = root.querySelectorAll('.dashboard-theme-option');

        options.forEach((option) => {
            const optionTheme = normalizeTheme(option.getAttribute('data-theme'));
            option.classList.toggle('is-active', optionTheme === activeTheme);
        });
    }

    function getHeaderActionsContainer(headerRow) {
        const directChildren = Array.from(headerRow.children);
        let actions = directChildren.find((child) => child.classList
            && child.classList.contains('d-flex')
            && child.classList.contains('gap-2'));

        if (actions) {
            actions.classList.add('align-items-center');
            return actions;
        }

        if (directChildren.length > 1) {
            const candidate = directChildren[directChildren.length - 1];
            if (candidate instanceof HTMLElement && candidate !== directChildren[0]) {
                candidate.classList.add('d-flex', 'gap-2', 'align-items-center');
                return candidate;
            }
        }

        actions = document.createElement('div');
        actions.className = 'd-flex gap-2 align-items-center';
        headerRow.appendChild(actions);
        return actions;
    }

    function normalizePatientHeaderActions() {
        const headerRow = document.querySelector('.dashboard-header .container-fluid > .d-flex.justify-content-between.align-items-center');
        if (!headerRow) {
            return;
        }

        const actions = getHeaderActionsContainer(headerRow);
        const preservedNodes = Array.from(actions.children)
            .filter((node) => !isThemePickerElement(node) && !isStandardHeaderLink(node));

        actions.innerHTML = '';
        preservedNodes.forEach((node) => {
            actions.appendChild(node);
        });

        actions.appendChild(createThemeDropdown());
        PATIENT_HEADER_LINKS.forEach((item) => {
            actions.appendChild(createHeaderIconLink(item));
        });
    }

    function enforcePatientNavigationConsistency() {
        const nav = document.querySelector('nav.nav-menu');
        if (!nav || !isPatientSidebar(nav)) {
            return;
        }

        normalizePatientSidebar(nav);
        normalizePatientHeaderActions();
        syncThemeOptionState();
    }

    // Apply persisted preference immediately when the script is loaded.
    applyTheme(getStoredTheme(), false);

    // Ensure body gets the theme attribute even if script ran in <head>.
    document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
            document.body.setAttribute('data-theme', getTheme());
        }

        enforcePatientNavigationConsistency();
        syncThemeOptionState();
    });

    window.addEventListener('healio:theme-changed', () => {
        syncThemeOptionState();
    });

    window.HealioTheme = {
        applyTheme,
        setTheme: applyTheme,
        getTheme,
        listThemes,
        refreshNavigation: enforcePatientNavigationConsistency
    };
})();
