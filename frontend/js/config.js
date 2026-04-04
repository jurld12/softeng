/**
 * Frontend Configuration
 * CENTRALIZED PORT AND API CONFIGURATION
 * Edit API_BASE_URL here to change backend connection
 */

const CONFIG = {
    // Backend API Configuration (EDIT HERE TO CHANGE PORT)
    API_BASE_URL: 'http://127.0.0.1:5000',
    
    // API Endpoints
    ENDPOINTS: {
        // Auth
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        CHANGE_PASSWORD: '/auth/change-password',
        REFRESH: '/auth/refresh',
        
        // Patient
        PATIENT_DASHBOARD: '/patients/me/dashboard',
        PATIENT_PROFILE: '/patients/me/profile',
        PATIENT_BIOMETRICS: '/patients/me/biometrics',
        PATIENT_ALERTS: '/patients/me/alerts',
        PATIENT_ACHIEVEMENTS: '/patients/me/achievements',
        PATIENT_GAMIFICATION: '/patients/me/gamification',
        PATIENT_POINTS: '/patients/me/points',
        PATIENT_BADGES: '/patients/me/badges',
        PATIENT_STREAK: '/patients/me/streak',
        PATIENT_MEDICATIONS: '/patients/me/medications',
        PATIENT_CHATBOT: '/patients/me/chatbot/message',
        
        // Doctor
        DOCTOR_DIRECTORY: '/auth/doctors',
        DOCTOR_PATIENTS: '/doctor/patients',
        DOCTOR_PATIENT_DETAILS: '/doctor/patients',
        DOCTOR_APPOINTMENTS: '/doctor/appointments',
        
        // Admin
        ADMIN_USERS: '/admin/users',
        ADMIN_CREATE_DOCTOR: '/admin/doctors',
        ADMIN_STATS: '/admin/stats',
        
        // Health Check
        HEALTH: '/health'
    },
    
    // Chart Configuration
    CHART_COLORS: {
        primary: '#1e40af',
        success: '#16a34a',
        warning: '#ea580c',
        danger: '#dc2626',
        info: '#0891b2'
    },
    
    // Date Format
    DATE_FORMAT: 'YYYY-MM-DD',
    TIME_FORMAT: 'HH:mm:ss',
    
    // Pagination
    DEFAULT_PAGE_SIZE: 10,
    
    // Local Storage Keys
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'healio_access_token',
        USER_ROLE: 'healio_user_role',
        USER_ID: 'healio_user_id',
        USER_NAME: 'healio_user_name',
        REFRESH_TOKEN: 'healio_refresh_token',
        AUTH_PERSIST: 'healio_auth_persist',
        NOTIFICATION_PREFS: 'healio_notification_prefs',
        THEME: 'healio_theme'
    },

    // Session behavior
    SESSION: {
        INACTIVITY_TIMEOUT_MINUTES: 15,
        INACTIVITY_CHECK_INTERVAL_MS: 15000,
        ACTIVITY_WRITE_THROTTLE_MS: 15000
    },

    // Shared vital status thresholds (used by dashboard and vitals pages)
    VITAL_STATUS_RULES: {
        bloodSugar: {
            normal: [70, 130],
            attention: [54, 180]
        },
        heartRate: {
            normal: [60, 100],
            attention: [50, 120]
        },
        steps: {
            normal: [10000, 25000],
            attention: [5000, 35000]
        },
        sleep: {
            normal: [7, 9],
            attention: [6, 10]
        },
        oxygen: {
            normal: [95, 100],
            attention: [90, 94]
        },
        temp: {
            normal: [97, 99],
            attention: [95, 100.4]
        },
        respRate: {
            normal: [12, 20],
            attention: [10, 24]
        },
        hydration: {
            normal: [2, 3.5],
            attention: [1.5, 4]
        }
    }
};

const ROLE_HOME_ROUTES = {
    patient: 'dashboard-v2.html',
    doctor: 'doctor-dashboard.html',
    admin: 'admin-dashboard.html'
};

const SESSION_ACTIVITY_KEY = 'healio_last_activity_at';
const AUTH_PERSISTED_VALUE = '1';
const AUTH_SESSION_VALUE = '0';

function getAuthManagedKeys() {
    return [
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        CONFIG.STORAGE_KEYS.USER_ROLE,
        CONFIG.STORAGE_KEYS.USER_ID,
        CONFIG.STORAGE_KEYS.USER_NAME,
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
        SESSION_ACTIVITY_KEY
    ];
}

function readStorageItem(storage, key) {
    try {
        return storage.getItem(key);
    } catch (error) {
        return null;
    }
}

function writeStorageItem(storage, key, value) {
    try {
        storage.setItem(key, value);
    } catch (error) {
        // Ignore storage write failures (e.g. privacy mode quota restrictions).
    }
}

function removeStorageItem(storage, key) {
    try {
        storage.removeItem(key);
    } catch (error) {
        // Ignore storage remove failures.
    }
}

function clearAuthKeysFromStorage(storage) {
    getAuthManagedKeys().forEach((key) => removeStorageItem(storage, key));
}

function isAuthPersisted() {
    return readStorageItem(localStorage, CONFIG.STORAGE_KEYS.AUTH_PERSIST) === AUTH_PERSISTED_VALUE;
}

function setAuthPersisted(persist) {
    writeStorageItem(
        localStorage,
        CONFIG.STORAGE_KEYS.AUTH_PERSIST,
        persist ? AUTH_PERSISTED_VALUE : AUTH_SESSION_VALUE
    );
}

function getAuthReadStorage() {
    return isAuthPersisted() ? localStorage : sessionStorage;
}

function getRawAccessTokenFromStorage() {
    return readStorageItem(getAuthReadStorage(), CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
}

function normalizeLegacyAuthStorage() {
    const persistFlag = readStorageItem(localStorage, CONFIG.STORAGE_KEYS.AUTH_PERSIST);
    if (persistFlag === AUTH_PERSISTED_VALUE || persistFlag === AUTH_SESSION_VALUE) {
        return;
    }

    const sessionToken = readStorageItem(sessionStorage, CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const localToken = readStorageItem(localStorage, CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

    // Legacy builds stored auth only in localStorage. Defaulting to session-based auth means
    // we clear those legacy persisted tokens so users must explicitly sign in again.
    if (!sessionToken && localToken) {
        clearAuthKeysFromStorage(localStorage);
    }

    setAuthPersisted(false);
}

let sessionActivityListenersBound = false;
let sessionInactivityMonitorId = null;
let lastSessionActivityWriteAt = 0;

function getSessionInactivityTimeoutMs() {
    const minutes = Number(CONFIG?.SESSION?.INACTIVITY_TIMEOUT_MINUTES);
    const fallbackMinutes = 15;
    const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : fallbackMinutes;
    return safeMinutes * 60 * 1000;
}

function getSessionInactivityCheckIntervalMs() {
    const configured = Number(CONFIG?.SESSION?.INACTIVITY_CHECK_INTERVAL_MS);
    const fallback = 15000;
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
}

function getSessionActivityWriteThrottleMs() {
    const configured = Number(CONFIG?.SESSION?.ACTIVITY_WRITE_THROTTLE_MS);
    const fallback = 15000;
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
}

function isAuthFreeRoute() {
    if (typeof window === 'undefined' || !window.location) {
        return false;
    }

    const path = String(window.location.pathname || '').toLowerCase();
    return path.endsWith('/login-v2.html')
        || path.endsWith('/signup.html')
        || path.endsWith('/index.html')
        || path === '/' || path === '';
}

function getStoredLastActivityAt() {
    const raw = Number(readStorageItem(getAuthReadStorage(), SESSION_ACTIVITY_KEY));
    return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

function markSessionActivity(force = false) {
    const token = getRawAccessTokenFromStorage();
    if (!token) {
        return;
    }

    const authStorage = getAuthReadStorage();

    const now = Date.now();
    const throttleMs = getSessionActivityWriteThrottleMs();

    if (!force && lastSessionActivityWriteAt > 0 && (now - lastSessionActivityWriteAt) < throttleMs) {
        return;
    }

    writeStorageItem(authStorage, SESSION_ACTIVITY_KEY, String(now));
    lastSessionActivityWriteAt = now;
}

function bindSessionActivityListeners() {
    if (sessionActivityListenersBound || typeof window === 'undefined') {
        return;
    }

    const activityEvents = ['click', 'keydown', 'mousedown', 'mousemove', 'scroll', 'touchstart', 'focus'];
    activityEvents.forEach((eventName) => {
        window.addEventListener(eventName, () => {
            markSessionActivity(false);
        }, { passive: true });
    });

    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                markSessionActivity(true);
            }
        });
    }

    window.addEventListener('storage', (event) => {
        if (event.key === SESSION_ACTIVITY_KEY && event.newValue) {
            const incoming = Number(event.newValue);
            if (Number.isFinite(incoming) && incoming > 0) {
                lastSessionActivityWriteAt = incoming;
            }
            return;
        }

        if (event.key === CONFIG.STORAGE_KEYS.ACCESS_TOKEN && !event.newValue && !isAuthFreeRoute()) {
            redirectToLogin();
        }
    });

    sessionActivityListenersBound = true;
}

// Helper function to build full API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}

function parseJwtPayload(token) {
    if (!token || typeof token !== 'string') {
        return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
        return null;
    }

    try {
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
        const json = atob(padded);
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
}

function isAccessTokenExpired(token, skewSeconds = 20) {
    const payload = parseJwtPayload(token);
    const exp = Number(payload?.exp);

    if (!Number.isFinite(exp)) {
        return false;
    }

    return Date.now() >= (exp * 1000) - (Math.max(0, skewSeconds) * 1000);
}

function isSessionInactive(timeoutMs = getSessionInactivityTimeoutMs()) {
    const token = getRawAccessTokenFromStorage();
    if (!token) {
        return false;
    }

    const lastActivityAt = getStoredLastActivityAt();
    if (!lastActivityAt) {
        return true;
    }

    return (Date.now() - lastActivityAt) >= timeoutMs;
}

function expireSessionAndMaybeRedirect() {
    clearAuthState();

    if (!isAuthFreeRoute()) {
        redirectToLogin();
    }
}

function evaluateSessionState() {
    const rawToken = getRawAccessTokenFromStorage();
    if (!rawToken) {
        return;
    }

    if (isAccessTokenExpired(rawToken) || isSessionInactive()) {
        expireSessionAndMaybeRedirect();
    }
}

function startSessionInactivityMonitor() {
    if (typeof window === 'undefined') {
        return;
    }

    bindSessionActivityListeners();
    evaluateSessionState();

    if (sessionInactivityMonitorId) {
        return;
    }

    sessionInactivityMonitorId = window.setInterval(() => {
        evaluateSessionState();
    }, getSessionInactivityCheckIntervalMs());
}

// Helper: read currently stored access token from standard key.
function getStoredAccessToken() {
    const token = getRawAccessTokenFromStorage();
    if (!token) {
        return null;
    }

    if (isAccessTokenExpired(token) || isSessionInactive()) {
        clearAuthState();
        return null;
    }

    return token;
}

function isStoredAccessTokenExpired() {
    const token = getStoredAccessToken();
    return token ? isAccessTokenExpired(token) : true;
}

function getStoredUserRole() {
    return readStorageItem(getAuthReadStorage(), CONFIG.STORAGE_KEYS.USER_ROLE);
}

function getStoredUserName() {
    return readStorageItem(getAuthReadStorage(), CONFIG.STORAGE_KEYS.USER_NAME);
}

function getRoleHomeRoute(role) {
    return ROLE_HOME_ROUTES[String(role || '').toLowerCase()] || '';
}

function getSharedVitalStatusRules() {
    return CONFIG?.VITAL_STATUS_RULES || {};
}

function resolveSharedVitalRangeStatus(value, rule) {
    if (!rule || !Number.isFinite(value)) {
        return 'unknown';
    }

    const [normalMin, normalMax] = rule.normal || [];
    const [attentionMin, attentionMax] = rule.attention || [];

    if (Number.isFinite(normalMin) && Number.isFinite(normalMax) && value >= normalMin && value <= normalMax) {
        return 'normal';
    }

    if (Number.isFinite(attentionMin) && Number.isFinite(attentionMax) && value >= attentionMin && value <= attentionMax) {
        return 'attention';
    }

    return 'critical';
}

function resolveSharedBloodPressureStatus(systolic, diastolic) {
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
        return 'unknown';
    }

    const isNormal = systolic >= 90 && systolic <= 120 && diastolic >= 60 && diastolic <= 80;
    if (isNormal) {
        return 'normal';
    }

    const isAttention = systolic >= 80 && systolic <= 139 && diastolic >= 50 && diastolic <= 89;
    if (isAttention) {
        return 'attention';
    }

    return 'critical';
}

function resolveSharedVitalStatusLevel(vitalId, value, secondaryValue = null) {
    if (String(vitalId) === 'bp') {
        return resolveSharedBloodPressureStatus(Number(value), Number(secondaryValue));
    }

    const rules = getSharedVitalStatusRules();
    const rule = rules[String(vitalId)];
    if (!rule) {
        return 'unknown';
    }

    return resolveSharedVitalRangeStatus(Number(value), rule);
}

function redirectToRoleHome(role) {
    const route = getRoleHomeRoute(role);
    if (!route) {
        return false;
    }

    window.location.href = route;
    return true;
}

// Helper: clear only auth/session identity keys while preserving non-auth preferences.
function clearAuthState() {
    clearAuthKeysFromStorage(localStorage);
    clearAuthKeysFromStorage(sessionStorage);
    setAuthPersisted(false);
    lastSessionActivityWriteAt = 0;
}

function redirectToLogin() {
    window.location.href = 'login-v2.html';
}

function storeAuthState(authPayload, options = {}) {
    if (!authPayload || typeof authPayload !== 'object') {
        return;
    }

    const persist = options.persist === true;
    const targetStorage = persist ? localStorage : sessionStorage;
    const otherStorage = persist ? sessionStorage : localStorage;

    setAuthPersisted(persist);
    clearAuthKeysFromStorage(targetStorage);
    clearAuthKeysFromStorage(otherStorage);

    if (authPayload.access_token) {
        writeStorageItem(targetStorage, CONFIG.STORAGE_KEYS.ACCESS_TOKEN, authPayload.access_token);
    }

    if (authPayload.refresh_token) {
        writeStorageItem(targetStorage, CONFIG.STORAGE_KEYS.REFRESH_TOKEN, authPayload.refresh_token);
    }

    if (authPayload.user_id || authPayload.id) {
        writeStorageItem(targetStorage, CONFIG.STORAGE_KEYS.USER_ID, authPayload.user_id || authPayload.id);
    }

    if (authPayload.role) {
        writeStorageItem(targetStorage, CONFIG.STORAGE_KEYS.USER_ROLE, authPayload.role);
    }

    if (authPayload.name) {
        writeStorageItem(targetStorage, CONFIG.STORAGE_KEYS.USER_NAME, authPayload.name);
    }

    markSessionActivity(true);
    startSessionInactivityMonitor();
}

function ensureAuthenticated(options = {}) {
    const requiredRole = String(options.requiredRole || '').toLowerCase();
    const allowMissingRole = options.allowMissingRole !== false;
    const redirectOnRoleMismatch = options.redirectOnRoleMismatch !== false;

    const token = getStoredAccessToken();
    if (!token) {
        redirectToLogin();
        return false;
    }

    startSessionInactivityMonitor();

    if (isAccessTokenExpired(token)) {
        clearAuthState();
        redirectToLogin();
        return false;
    }

    if (isSessionInactive()) {
        clearAuthState();
        redirectToLogin();
        return false;
    }

    if (!requiredRole) {
        return true;
    }

    let role = String(getStoredUserRole() || '').toLowerCase();

    if (!role && allowMissingRole) {
        const payload = parseJwtPayload(token) || {};
        const payloadRole = String(payload.role || payload.user_role || '').toLowerCase();
        if (payloadRole) {
            role = payloadRole;
            writeStorageItem(getAuthReadStorage(), CONFIG.STORAGE_KEYS.USER_ROLE, role);
        }
    }

    if (!role) {
        clearAuthState();
        redirectToLogin();
        return false;
    }

    if (role === requiredRole) {
        return true;
    }

    if (redirectOnRoleMismatch && redirectToRoleHome(role)) {
        return false;
    }

    redirectToLogin();
    return false;
}

function handleUnauthorizedResponse(response, options = {}) {
    if (!response || (response.status !== 401 && response.status !== 403)) {
        return false;
    }

    const shouldClear = options.clearState !== false;
    const shouldRedirect = options.redirect !== false;

    if (shouldClear) {
        clearAuthState();
    }

    if (shouldRedirect) {
        redirectToLogin();
    }

    return true;
}

async function performLogout(options = {}) {
    const shouldCallApi = options.callApi !== false;
    const shouldRedirect = options.redirect !== false;

    if (shouldCallApi && getStoredAccessToken()) {
        try {
            await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGOUT), {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch (error) {
            // Ignore logout API failures and clear client auth state regardless.
        }
    }

    clearAuthState();

    if (shouldRedirect) {
        redirectToLogin();
    }
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = getStoredAccessToken();

    if (!token) {
        return {
            'Content-Type': 'application/json',
            'Authorization': ''
        };
    }

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

function readHeaderValue(headers, headerName) {
    if (!headers || !headerName) {
        return '';
    }

    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
        return headers.get(headerName) || '';
    }

    if (Array.isArray(headers)) {
        const match = headers.find(([name]) => String(name).toLowerCase() === String(headerName).toLowerCase());
        return match ? String(match[1] || '') : '';
    }

    if (typeof headers === 'object') {
        const directValue = headers[headerName] || headers[headerName.toLowerCase()] || headers[headerName.toUpperCase()];
        if (directValue) {
            return String(directValue);
        }

        const key = Object.keys(headers).find((item) => item.toLowerCase() === String(headerName).toLowerCase());
        return key ? String(headers[key] || '') : '';
    }

    return '';
}

function getRequestAuthorizationHeader(resource, init) {
    const initHeader = readHeaderValue(init?.headers, 'Authorization');
    if (initHeader) {
        return initHeader;
    }

    if (resource && typeof resource === 'object' && 'headers' in resource) {
        return readHeaderValue(resource.headers, 'Authorization');
    }

    return '';
}

function getRequestUrl(resource) {
    if (typeof resource === 'string') {
        return resource;
    }

    if (resource && typeof resource === 'object' && typeof resource.url === 'string') {
        return resource.url;
    }

    return '';
}

function shouldSkipAuthInterceptor(resource) {
    const rawUrl = getRequestUrl(resource);
    if (!rawUrl) {
        return false;
    }

    try {
        const parsedUrl = new URL(rawUrl, window.location.origin);
        const path = parsedUrl.pathname.toLowerCase();
        return path.endsWith('/auth/login') || path.endsWith('/auth/register');
    } catch (error) {
        return false;
    }
}

function installAuthFetchInterceptor() {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function' || window.__healioAuthFetchPatched) {
        return;
    }

    const nativeFetch = window.fetch.bind(window);

    window.fetch = async function(resource, init) {
        const response = await nativeFetch(resource, init);

        try {
            const authHeader = getRequestAuthorizationHeader(resource, init);
            const hasBearerToken = typeof authHeader === 'string'
                && authHeader.trim().toLowerCase().startsWith('bearer ');

            if (hasBearerToken && !shouldSkipAuthInterceptor(resource)) {
                handleUnauthorizedResponse(response);
            }
        } catch (error) {
            // If interceptor parsing fails, keep response behavior unchanged.
        }

        return response;
    };

    window.__healioAuthFetchPatched = true;
}

installAuthFetchInterceptor();
normalizeLegacyAuthStorage();
startSessionInactivityMonitor();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        getApiUrl,
        getAuthHeaders,
        isAccessTokenExpired,
        isStoredAccessTokenExpired,
        getStoredAccessToken,
        getStoredUserRole,
        getStoredUserName,
        getRoleHomeRoute,
        getSharedVitalStatusRules,
        resolveSharedVitalRangeStatus,
        resolveSharedBloodPressureStatus,
        resolveSharedVitalStatusLevel,
        redirectToRoleHome,
        isSessionInactive,
        markSessionActivity,
        startSessionInactivityMonitor,
        clearAuthState,
        redirectToLogin,
        storeAuthState,
        ensureAuthenticated,
        handleUnauthorizedResponse,
        performLogout
    };
}

// Export shorthand for direct access (for browser script tags)
const API_BASE_URL = CONFIG.API_BASE_URL;
