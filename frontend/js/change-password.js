// Initialize page
window.addEventListener('DOMContentLoaded', () => {
    if (!checkAuthentication()) {
        return;
    }

    loadCurrentUser();
    setupPasswordToggleButtons();
    setupChangePasswordForm();
    updatePasswordRequirements('');
});

function checkAuthentication() {
    if (typeof ensureAuthenticated === 'function') {
        return ensureAuthenticated({
            requiredRole: 'patient',
            allowMissingRole: true
        });
    }

    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }
    return true;
}

function buildAuthHeaders() {
    const token = typeof getStoredAccessToken === 'function'
        ? getStoredAccessToken()
        : localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: buildAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Unable to load user details');
        }

        const user = await response.json();
        const name = user.name || 'User';
        const email = user.email || '';

        document.getElementById('sidebarUserName').textContent = name;
        document.getElementById('sidebarUserEmail').textContent = email;

        const avatar = document.getElementById('sidebarUserAvatar');
        if (avatar) {
            avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`;
        }
    } catch (error) {
        console.error('Error loading current user:', error);
        showAlert('danger', 'Unable to load account details. Please refresh the page.');
    }
}

function setupPasswordToggleButtons() {
    const buttons = document.querySelectorAll('[data-toggle-password]');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = button.querySelector('i');

            if (!input || !icon) {
                return;
            }

            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
        });
    });
}

function setupChangePasswordForm() {
    const form = document.getElementById('changePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');

    form.addEventListener('submit', handleChangePasswordSubmit);

    newPasswordInput.addEventListener('input', () => {
        updatePasswordRequirements(newPasswordInput.value);
    });
}

async function handleChangePasswordSubmit(event) {
    event.preventDefault();
    clearAlert();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const validationError = validatePasswordInputs(currentPassword, newPassword, confirmPassword);
    if (validationError) {
        showAlert('danger', validationError);
        return;
    }

    setSubmitState(true);

    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.CHANGE_PASSWORD}`, {
            method: 'POST',
            headers: buildAuthHeaders(),
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(responseData.detail || 'Failed to update password');
        }

        showAlert('success', 'Password updated successfully.');
        document.getElementById('changePasswordForm').reset();
        updatePasswordRequirements('');
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('danger', error.message || 'Failed to update password. Please try again.');
    } finally {
        setSubmitState(false);
    }
}

function validatePasswordInputs(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
        return 'Please fill in all password fields.';
    }

    if (currentPassword === newPassword) {
        return 'New password must be different from your current password.';
    }

    if (newPassword !== confirmPassword) {
        return 'New password and confirmation do not match.';
    }

    const checks = getPasswordRequirementChecks(newPassword);
    const failedRequirement = Object.values(checks).includes(false);

    if (failedRequirement) {
        return 'New password does not meet the required strength rules.';
    }

    return '';
}

function getPasswordRequirementChecks(password) {
    return {
        reqLength: password.length >= 8,
        reqUpper: /[A-Z]/.test(password),
        reqLower: /[a-z]/.test(password),
        reqNumber: /\d/.test(password),
        reqSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
}

function updatePasswordRequirements(password) {
    const checks = getPasswordRequirementChecks(password);
    Object.entries(checks).forEach(([elementId, isMet]) => {
        setRequirementState(elementId, isMet);
    });
}

function setRequirementState(elementId, isMet) {
    const item = document.getElementById(elementId);
    if (!item) {
        return;
    }

    item.classList.toggle('text-success', isMet);
    item.classList.toggle('text-muted', !isMet);

    const icon = item.querySelector('i');
    if (!icon) {
        return;
    }

    icon.className = isMet ? 'bi bi-check-circle-fill me-2' : 'bi bi-circle me-2';
}

function setSubmitState(isLoading) {
    const button = document.getElementById('changePasswordBtn');
    if (!button.dataset.defaultLabel) {
        button.dataset.defaultLabel = button.innerHTML;
    }

    button.disabled = isLoading;
    button.innerHTML = isLoading
        ? '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Updating...'
        : button.dataset.defaultLabel;
}

function showAlert(type, message) {
    const alertContainer = document.getElementById('formAlert');
    alertContainer.className = `alert alert-${type}`;
    alertContainer.textContent = message;
}

function clearAlert() {
    const alertContainer = document.getElementById('formAlert');
    alertContainer.className = 'alert d-none';
    alertContainer.textContent = '';
}

function logout() {
    if (typeof performLogout === 'function') {
        performLogout();
        return;
    }

    if (typeof clearAuthState === 'function') {
        clearAuthState();
    } else {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
    }

    window.location.href = 'login-v2.html';
}

window.logout = logout;
