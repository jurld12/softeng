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
        NOTIFICATION_PREFS: 'healio_notification_prefs',
        THEME: 'healio_theme'
    }
};

const ROLE_HOME_ROUTES = {
    patient: 'dashboard-v2.html',
    doctor: 'doctor-dashboard.html',
    admin: 'admin-dashboard.html'
};

// Helper function to build full API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}

// Helper: read currently stored access token from standard key.
function getStoredAccessToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
}

function getStoredUserRole() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);
}

function getStoredUserName() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME);
}

function getRoleHomeRoute(role) {
    return ROLE_HOME_ROUTES[String(role || '').toLowerCase()] || '';
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
    const keysToClear = [
        CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
        CONFIG.STORAGE_KEYS.USER_ROLE,
        CONFIG.STORAGE_KEYS.USER_ID,
        CONFIG.STORAGE_KEYS.USER_NAME,
        CONFIG.STORAGE_KEYS.REFRESH_TOKEN
    ];

    keysToClear.forEach((key) => {
        localStorage.removeItem(key);
    });
}

function redirectToLogin() {
    window.location.href = 'login-v2.html';
}

function storeAuthState(authPayload) {
    if (!authPayload || typeof authPayload !== 'object') {
        return;
    }

    if (authPayload.access_token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, authPayload.access_token);
    }

    if (authPayload.refresh_token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, authPayload.refresh_token);
    }

    if (authPayload.user_id || authPayload.id) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, authPayload.user_id || authPayload.id);
    }

    if (authPayload.role) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ROLE, authPayload.role);
    }

    if (authPayload.name) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, authPayload.name);
    }
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

    if (!requiredRole) {
        return true;
    }

    const role = String(getStoredUserRole() || '').toLowerCase();
    if (!role && allowMissingRole) {
        return true;
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
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        getApiUrl,
        getAuthHeaders,
        getStoredAccessToken,
        getStoredUserRole,
        getStoredUserName,
        getRoleHomeRoute,
        redirectToRoleHome,
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
