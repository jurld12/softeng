/**
 * Healio Frontend - Main JavaScript
 */

// Check backend connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkBackendStatus();
});

/**
 * Check if backend is running
 */
async function checkBackendStatus() {
    const statusContainer = document.getElementById('status-container');
    
    if (!statusContainer) return;
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.HEALTH));
        
        if (response.ok) {
            const data = await response.json();
            statusContainer.innerHTML = `
                <p class="status-healthy">✅ Backend Status: ${data.status}</p>
                <p>Service: ${data.service}</p>
                <p>Version: ${data.version}</p>
                <p>Environment: ${data.environment}</p>
            `;
        } else {
            throw new Error('Backend responded with error');
        }
    } catch (error) {
        statusContainer.innerHTML = `
            <p class="status-error">❌ Backend Status: Offline</p>
            <p>Unable to connect to backend server.</p>
            <p>Make sure the backend is running on ${CONFIG.API_BASE_URL}</p>
        `;
    }
}

/**
 * Helper: Make authenticated API request
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: getAuthHeaders()
    };
    
    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(getApiUrl(endpoint), options);
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'API request failed');
    }
    
    return await response.json();
}

/**
 * Helper: Show notification/toast
 */
function showNotification(message, type = 'info') {
    // TODO: Implement toast/notification UI
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message); // Temporary
}

/**
 * Helper: Check if user is logged in
 */
function isLoggedIn() {
    return !!localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Helper: Get current user role
 */
function getUserRole() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);
}

/**
 * Helper: Logout user
 */
function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
    window.location.href = '/index.html';
}

/**
 * Helper: Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Helper: Format time
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
