const doctorSettingsState = {
    loading: false
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkDoctorAuthentication()) {
        return;
    }

    attachDoctorSettingsHandlers();
    await loadDoctorProfile();
});

function checkDoctorAuthentication() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }

    if (role !== 'doctor') {
        window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'dashboard-v2.html';
        return false;
    }

    return true;
}

window.logout = async function() {
    try {
        await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGOUT), {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
        window.location.href = 'login-v2.html';
    }
};

function attachDoctorSettingsHandlers() {
    document.getElementById('logoutButton').addEventListener('click', () => window.logout());
    document.getElementById('doctorProfileForm').addEventListener('submit', handleProfileSubmit);
    document.getElementById('doctorPasswordForm').addEventListener('submit', handlePasswordSubmit);
}

async function readJsonResponse(response) {
    if (response.status === 401 || response.status === 403) {
        await logout();
        throw new Error('Your session has expired. Please sign in again.');
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload.detail || `Request failed with status ${response.status}`);
    }

    return payload;
}

async function loadDoctorProfile() {
    if (doctorSettingsState.loading) {
        return;
    }

    doctorSettingsState.loading = true;

    try {
        const response = await fetch(getApiUrl('/doctor/me/profile'), {
            headers: getAuthHeaders()
        });

        const profile = await readJsonResponse(response);
        document.getElementById('doctorNameInput').value = profile.name || '';
        document.getElementById('doctorSpecialtyInput').value = profile.specialty || '';
        document.getElementById('doctorEmailInput').value = profile.email || '';
        document.getElementById('doctorPhoneInput').value = profile.phone || '';

        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, profile.name || 'Doctor');
    } catch (error) {
        console.error('Failed to load doctor profile:', error);
        setSettingsStatus(error.message || 'Failed to load doctor profile.', 'danger');
    } finally {
        doctorSettingsState.loading = false;
    }
}

async function handleProfileSubmit(event) {
    event.preventDefault();

    const saveButton = document.getElementById('saveDoctorProfileButton');
    const payload = {
        name: document.getElementById('doctorNameInput').value.trim(),
        specialty: document.getElementById('doctorSpecialtyInput').value.trim(),
        email: document.getElementById('doctorEmailInput').value.trim(),
        phone: document.getElementById('doctorPhoneInput').value.trim() || null
    };

    if (!payload.name || !payload.specialty || !payload.email) {
        setSettingsStatus('Name, specialty, and email are required.', 'warning');
        return;
    }

    saveButton.disabled = true;
    const originalLabel = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

    try {
        const response = await fetch(getApiUrl('/doctor/me/profile'), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        const updated = await readJsonResponse(response);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, updated.name || payload.name);
        setSettingsStatus('Doctor profile updated successfully.', 'success');
    } catch (error) {
        console.error('Failed to update doctor profile:', error);
        setSettingsStatus(error.message || 'Failed to update doctor profile.', 'danger');
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalLabel;
    }
}

async function handlePasswordSubmit(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    if (newPassword !== confirmPassword) {
        setSettingsStatus('New password and confirmation do not match.', 'warning');
        return;
    }

    const button = document.getElementById('changeDoctorPasswordButton');
    button.disabled = true;
    const originalLabel = button.innerHTML;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...';

    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.CHANGE_PASSWORD), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        await readJsonResponse(response);
        document.getElementById('doctorPasswordForm').reset();
        setSettingsStatus('Password updated successfully.', 'success');
    } catch (error) {
        console.error('Failed to update password:', error);
        setSettingsStatus(error.message || 'Failed to update password.', 'danger');
    } finally {
        button.disabled = false;
        button.innerHTML = originalLabel;
    }
}

function setSettingsStatus(message, tone = 'warning') {
    const banner = document.getElementById('settingsStatus');
    banner.hidden = false;
    banner.className = `doctor-settings-status mb-4 doctor-settings-status--${tone}`;
    banner.textContent = message;
}
