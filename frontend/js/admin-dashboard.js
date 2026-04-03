const adminDashboardState = {
    admin: null,
    stats: null,
    doctors: [],
    patients: [],
    selectedDoctorId: null,
    loading: false,
    doctorSearchTerm: '',
    patientSearchTerm: ''
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAdminAuthentication()) {
        return;
    }

    attachAdminDashboardHandlers();
    await refreshAdminDashboard();
});

function checkAdminAuthentication() {
    if (typeof ensureAuthenticated === 'function') {
        return ensureAuthenticated({
            requiredRole: 'admin',
            allowMissingRole: false
        });
    }

    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }

    if (role !== 'admin') {
        window.location.href = role === 'doctor' ? 'doctor-dashboard.html' : 'dashboard-v2.html';
        return false;
    }

    return true;
}

function attachAdminDashboardHandlers() {
    document.getElementById('refreshAdminDashboard').addEventListener('click', refreshAdminDashboard);
    document.getElementById('createDoctorForm').addEventListener('submit', handleCreateDoctor);
    document.getElementById('editDoctorForm').addEventListener('submit', handleEditDoctor);
    document.getElementById('doctorSearch').addEventListener('input', (e) => {
        adminDashboardState.doctorSearchTerm = e.target.value;
        renderDoctorRoster();
    });
    document.getElementById('userSearch').addEventListener('input', (e) => {
        adminDashboardState.patientSearchTerm = e.target.value;
        renderUserRoster();
    });

    document.querySelectorAll('.nav-item-custom').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-item-custom').forEach(item => item.classList.remove('active'));
            link.classList.add('active');
        });
    });
}

window.logout = async function() {
    if (typeof performLogout === 'function') {
        await performLogout();
        return;
    }

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

async function refreshAdminDashboard() {
    if (adminDashboardState.loading) {
        return;
    }

    adminDashboardState.loading = true;
    setAdminStatus('Refreshing admin workspace...', 'info');
    setRefreshButtonState(true);

    try {
        const [admin, stats, users] = await Promise.all([
            loadCurrentAdmin(),
            loadAdminStats(),
            loadAdminUsers()
        ]);

        adminDashboardState.admin = admin;
        adminDashboardState.stats = stats;
        adminDashboardState.doctors = users
            .filter(user => user.role === 'doctor')
            .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));

        adminDashboardState.patients = users
            .filter(user => user.role === 'patient')
            .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));

        renderAdminProfile();
        renderStats();
        renderDoctorRoster();
        renderUserRoster();
        setAdminStatus('Admin workspace is up to date.', 'success');
    } catch (error) {
        console.error('Admin dashboard refresh failed:', error);
        setAdminStatus(error.message || 'Failed to load the admin dashboard.', 'danger');
    } finally {
        adminDashboardState.loading = false;
        setRefreshButtonState(false);
    }
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

async function loadCurrentAdmin() {
    const response = await fetch(getApiUrl('/auth/me'), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadAdminStats() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.ADMIN_STATS), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadAdminUsers() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.ADMIN_USERS), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

function renderAdminProfile() {
    const admin = adminDashboardState.admin;
    if (!admin) {
        return;
    }

    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    const avatar = document.getElementById('sidebarUserAvatar');

    if (sidebarName) {
        sidebarName.textContent = admin.name || 'Admin';
    }

    if (sidebarEmail) {
        sidebarEmail.textContent = admin.email || '';
    }

    if (avatar) {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(admin.name || 'Admin')}&background=7c3aed&color=fff`;
    }
}

function renderStats() {
    const stats = adminDashboardState.stats;
    if (!stats) {
        return;
    }

    document.getElementById('totalUsersStat').textContent = String(stats.total_users ?? '--');
    document.getElementById('totalDoctorsStat').textContent = String(stats.total_doctors ?? '--');
    document.getElementById('totalPatientsStat').textContent = String(stats.total_patients ?? '--');
    document.getElementById('activeUsersStat').textContent = String(stats.active_users ?? '--');
}

function renderDoctorRoster() {
    const roster = document.getElementById('doctorRosterList');
    const count = document.getElementById('doctorRosterCount');
    const searchTerm = adminDashboardState.doctorSearchTerm.toLowerCase();
    const doctors = adminDashboardState.doctors.filter(d => !searchTerm || d.email.toLowerCase().includes(searchTerm));

    count.textContent = `${doctors.length} doctor${doctors.length === 1 ? '' : 's'}`;

    if (!doctors.length) {
        roster.innerHTML = `
            <div class="admin-empty-state">
                <i class="bi bi-person-badge"></i>
                <p class="mb-0">No doctor accounts exist yet. Create one using the form on this page.</p>
            </div>
        `;
        return;
    }

    roster.innerHTML = doctors.map(doctor => {
        const doctorName = escapeHtml(doctor.name || 'Doctor');
        const doctorInitials = escapeHtml(getInitials(doctor.name || 'Doctor'));
        const doctorMeta = escapeHtml([doctor.specialty || 'Specialty pending', doctor.email || ''].filter(Boolean).join(' • '));
        const createdAt = doctor.created_at ? escapeHtml(formatDate(doctor.created_at)) : 'Unknown';
        const active = Boolean(doctor.active);
        const badgeClass = active ? 'admin-badge admin-badge--active' : 'admin-badge admin-badge--inactive';
        const badgeLabel = active ? 'Active' : 'Inactive';
        const actionLabel = active ? 'Deactivate' : 'Activate';
        const nextActive = active ? 'false' : 'true';
        const encodedDoctorId = encodeURIComponent(doctor.id || doctor._id || '');

        return `
            <div class="admin-roster-item">
                <div class="admin-roster-item__identity">
                    <div class="admin-roster-item__avatar">${doctorInitials}</div>
                    <div style="min-width: 0;">
                        <div class="admin-roster-item__name text-truncate">${doctorName}</div>
                        <div class="admin-roster-item__meta text-truncate">${doctorMeta}</div>
                        <div class="admin-roster-item__meta">Created ${createdAt}</div>
                    </div>
                </div>
                <div class="admin-roster-item__actions">
                    <span class="${badgeClass}">${badgeLabel}</span>
                    <button class="btn btn-sm btn-outline-secondary" type="button" onclick="openDoctorEditModal('${encodedDoctorId}')">Edit</button>
                    <button class="btn btn-sm btn-outline-primary" type="button" onclick="toggleDoctorActive('${doctor.id || doctor._id}', ${nextActive})">${actionLabel}</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderUserRoster() {
    const roster = document.getElementById('userRosterList');
    const count = document.getElementById('userRosterCount');
    const searchTerm = adminDashboardState.patientSearchTerm.toLowerCase();
    const patients = adminDashboardState.patients.filter(p => !searchTerm || p.email.toLowerCase().includes(searchTerm));

    count.textContent = `${patients.length} user${patients.length === 1 ? '' : 's'}`;

    if (!patients.length) {
        roster.innerHTML = `
            <div class="admin-empty-state">
                <i class="bi bi-people"></i>
                <p class="mb-0">No user accounts exist yet.</p>
            </div>
        `;
        return;
    }

    roster.innerHTML = patients.map(patient => {
        const patientName = escapeHtml(patient.name || 'User');
        const patientInitials = escapeHtml(getInitials(patient.name || 'User'));
        const patientMeta = escapeHtml(patient.email || '');
        const createdAt = patient.created_at ? escapeHtml(formatDate(patient.created_at)) : 'Unknown';
        const active = Boolean(patient.active);
        const badgeClass = active ? 'admin-badge admin-badge--active' : 'admin-badge admin-badge--inactive';
        const badgeLabel = active ? 'Active' : 'Inactive';
        const actionLabel = active ? 'Deactivate' : 'Activate';
        const nextActive = active ? 'false' : 'true';

        return `
            <div class="admin-roster-item">
                <div class="admin-roster-item__identity">
                    <div class="admin-roster-item__avatar">${patientInitials}</div>
                    <div style="min-width: 0;">
                        <div class="admin-roster-item__name text-truncate">${patientName}</div>
                        <div class="admin-roster-item__meta text-truncate">${patientMeta}</div>
                        <div class="admin-roster-item__meta">Created ${createdAt}</div>
                    </div>
                </div>
                <div class="admin-roster-item__actions">
                    <span class="${badgeClass}">${badgeLabel}</span>
                    <button class="btn btn-sm btn-outline-primary" type="button" onclick="toggleUserActive('${patient.id || patient._id}', ${nextActive})">${actionLabel}</button>
                </div>
            </div>
        `;
    }).join('');
}

function getDoctorEditModalInstance() {
    const modalElement = document.getElementById('editDoctorModal');
    if (!modalElement || !window.bootstrap || !window.bootstrap.Modal) {
        return null;
    }

    return window.bootstrap.Modal.getOrCreateInstance(modalElement);
}

window.openDoctorEditModal = function(encodedDoctorId) {
    const doctorId = decodeURIComponent(encodedDoctorId || '');
    const doctor = adminDashboardState.doctors.find(item => String(item.id || item._id) === String(doctorId));
    if (!doctor) {
        setAdminStatus('Unable to find this doctor in the current roster.', 'danger');
        return;
    }

    adminDashboardState.selectedDoctorId = doctorId;
    document.getElementById('editDoctorName').value = doctor.name || '';
    document.getElementById('editDoctorSpecialty').value = doctor.specialty || '';
    document.getElementById('editDoctorEmail').value = doctor.email || '';
    document.getElementById('editDoctorPhone').value = doctor.phone || '';

    const modal = getDoctorEditModalInstance();
    if (modal) {
        modal.show();
    }
};

async function handleEditDoctor(event) {
    event.preventDefault();

    const doctorId = adminDashboardState.selectedDoctorId;
    if (!doctorId) {
        setAdminStatus('No doctor selected for editing.', 'danger');
        return;
    }

    const saveButton = document.getElementById('saveDoctorEditButton');
    const payload = {
        name: document.getElementById('editDoctorName').value.trim(),
        specialty: document.getElementById('editDoctorSpecialty').value.trim(),
        email: document.getElementById('editDoctorEmail').value.trim()
    };
    const phoneValue = document.getElementById('editDoctorPhone').value.trim();
    if (phoneValue) {
        payload.phone = phoneValue;
    }

    saveButton.disabled = true;
    const originalLabel = saveButton.textContent;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';

    try {
        const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.ADMIN_USERS}/${doctorId}`), {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        await readJsonResponse(response);

        const modal = getDoctorEditModalInstance();
        if (modal) {
            modal.hide();
        }

        setAdminStatus('Doctor profile updated successfully.', 'success');
        await refreshAdminDashboard();
    } catch (error) {
        console.error('Failed to update doctor profile:', error);
        setAdminStatus(error.message || 'Failed to update doctor profile.', 'danger');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalLabel;
    }
}

async function handleCreateDoctor(event) {
    event.preventDefault();

    const button = document.getElementById('createDoctorButton');
    const payload = {
        name: document.getElementById('doctorName').value.trim(),
        specialty: document.getElementById('doctorSpecialty').value.trim(),
        email: document.getElementById('doctorEmail').value.trim(),
        phone: document.getElementById('doctorPhone').value.trim() || null,
        password: document.getElementById('doctorPassword').value
    };

    button.disabled = true;
    button.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Creating...';

    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.ADMIN_CREATE_DOCTOR), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        await readJsonResponse(response);

        document.getElementById('createDoctorForm').reset();
        setAdminStatus('Doctor account created. The new doctor can sign in from the standard login page.', 'success');
        await refreshAdminDashboard();
    } catch (error) {
        console.error('Doctor creation failed:', error);
        setAdminStatus(error.message || 'Failed to create the doctor account.', 'danger');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Create doctor account';
    }
}

window.toggleDoctorActive = async function(doctorId, nextActive) {
    try {
        const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.ADMIN_USERS}/${doctorId}`), {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ active: nextActive })
        });

        await readJsonResponse(response);
        setAdminStatus(`Doctor account ${nextActive ? 'activated' : 'deactivated'} successfully.`, 'success');
        await refreshAdminDashboard();
    } catch (error) {
        console.error('Failed to update doctor status:', error);
        setAdminStatus(error.message || 'Failed to update doctor status.', 'danger');
    }
};

window.toggleUserActive = async function(userId, nextActive) {
    try {
        const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.ADMIN_USERS}/${userId}`), {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ active: nextActive })
        });

        await readJsonResponse(response);
        setAdminStatus(`User account ${nextActive ? 'activated' : 'deactivated'} successfully.`, 'success');
        await refreshAdminDashboard();
    } catch (error) {
        console.error('Failed to update user status:', error);
        setAdminStatus(error.message || 'Failed to update user status.', 'danger');
    }
};

function setRefreshButtonState(isLoading) {
    const button = document.getElementById('refreshAdminDashboard');
    button.disabled = isLoading;
    button.innerHTML = isLoading
        ? '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Refreshing...'
        : '<i class="bi bi-arrow-clockwise me-2"></i>Refresh';
}

function setAdminStatus(message, tone = 'info') {
    const banner = document.getElementById('adminStatusBanner');
    banner.className = `admin-status-banner mb-4 admin-status-banner--${tone}`;
    banner.textContent = message;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getInitials(name) {
    return String(name || 'Admin')
        .split(' ')
        .map(part => part[0] || '')
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}