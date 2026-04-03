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
        NOTIFICATION_PREFS: 'healio_notification_prefs'
    }
};

// Helper function to build full API URL
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}

// Helper function to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, getApiUrl, getAuthHeaders };
}

// Export shorthand for direct access (for browser script tags)
const API_BASE_URL = CONFIG.API_BASE_URL;
