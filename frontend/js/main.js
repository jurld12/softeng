/**
 * Healio Frontend - Main JavaScript
 */

const patientDoctorPickerState = {
    initialized: false,
    loading: false,
    saving: false,
    profile: null,
    doctors: [],
    modal: null
};

/**
 * Update notification badge with active reminder count
 */
window.updateNotificationBadge = async function() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return; // No badge on this page
    
    const token = localStorage.getItem('healio_access_token');
    if (!token) {
        badge.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/reminders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            badge.style.display = 'none';
            return;
        }
        
        const reminders = await response.json();
        
        // Count active reminders that are not completed today
        const today = new Date().toISOString().split('T')[0];
        const activeReminders = reminders.filter(r => {
            if (!r.active) return false;
            
            // Check if not completed today
            const todayHistory = r.history?.find(h => h.date === today);
            return !todayHistory?.completed;
        });
        
        const count = activeReminders.length;
        
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
        badge.style.display = 'none';
    }
};

// Check backend connection on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkBackendStatus();
    await window.updateNotificationBadge();
    await initializePatientDoctorPicker();
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

function shouldEnablePatientDoctorPicker() {
    return isLoggedIn()
        && getUserRole() === 'patient'
        && !!document.querySelector('.dashboard-header')
        && !!document.querySelector('.main-content');
}

async function initializePatientDoctorPicker() {
    if (patientDoctorPickerState.initialized || !shouldEnablePatientDoctorPicker()) {
        return;
    }

    if (!ensurePatientDoctorPickerUi()) {
        return;
    }

    patientDoctorPickerState.initialized = true;
    attachPatientDoctorPickerHandlers();
    window.addEventListener('healio:doctor-assignment-updated', handlePatientDoctorAssignmentUpdate);

    await refreshPatientDoctorPicker();
}

function ensurePatientDoctorPickerUi() {
    const actionsContainer = getPatientHeaderActionsContainer();
    if (!actionsContainer) {
        return false;
    }

    if (!document.getElementById('patientDoctorButton')) {
        const doctorButton = document.createElement('button');
        doctorButton.type = 'button';
        doctorButton.id = 'patientDoctorButton';
        doctorButton.className = 'btn btn-light border-0 shadow-sm rounded-3 px-3 d-inline-flex align-items-center gap-2 flex-shrink-0';
        doctorButton.setAttribute('aria-label', 'Choose your primary doctor');
        doctorButton.title = 'Choose your primary doctor';
        doctorButton.innerHTML = `
            <i class="bi bi-person-badge fs-5 text-primary"></i>
            <span class="d-none d-md-inline text-start" style="min-width: 0;">
                <span class="d-block text-muted" style="font-size: 11px; line-height: 1;">Primary doctor</span>
                <span class="d-block fw-semibold text-truncate" id="patientDoctorButtonLabel" style="max-width: 180px;">Loading...</span>
            </span>
        `;

        const firstIconButton = actionsContainer.querySelector('.btn-icon');
        actionsContainer.insertBefore(doctorButton, firstIconButton || null);
    }

    if (!document.getElementById('patientDoctorModal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="modal fade" id="patientDoctorModal" tabindex="-1" aria-labelledby="patientDoctorModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-header border-0 pb-0">
                            <div>
                                <h5 class="modal-title" id="patientDoctorModalLabel">Choose Primary Doctor</h5>
                                <p class="text-muted small mb-0">Update your care team without leaving the current dashboard page.</p>
                            </div>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body pt-3">
                            <div class="rounded-4 border bg-light-subtle p-3 mb-3">
                                <div class="text-muted text-uppercase fw-semibold" style="font-size: 11px; letter-spacing: 0.08em;">Current selection</div>
                                <div class="fw-semibold mt-1" id="patientDoctorCurrentName">Loading...</div>
                                <div class="small text-muted" id="patientDoctorCurrentMeta">Fetching your current doctor assignment.</div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-semibold" for="patientDoctorSelect">Available Doctors</label>
                                <select class="form-select" id="patientDoctorSelect" disabled>
                                    <option value="">Loading available doctors...</option>
                                </select>
                            </div>
                            <div class="form-text" id="patientDoctorStatus">Loading available doctors...</div>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="patientDoctorSave" disabled>
                                <i class="bi bi-check2-circle me-2"></i>Save doctor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }

    return true;
}

function getPatientHeaderActionsContainer() {
    const headerRow = document.querySelector('.dashboard-header .container-fluid > .d-flex');
    if (!headerRow) {
        return null;
    }

    const children = Array.from(headerRow.children);
    for (let index = children.length - 1; index >= 0; index -= 1) {
        const child = children[index];
        if (child.classList && child.classList.contains('d-flex')) {
            return child;
        }
    }

    return null;
}

function attachPatientDoctorPickerHandlers() {
    const doctorButton = document.getElementById('patientDoctorButton');
    const saveButton = document.getElementById('patientDoctorSave');
    const modalElement = document.getElementById('patientDoctorModal');

    if (doctorButton) {
        doctorButton.addEventListener('click', async () => {
            patientDoctorPickerState.modal = patientDoctorPickerState.modal || new bootstrap.Modal(modalElement);
            patientDoctorPickerState.modal.show();
            await refreshPatientDoctorPicker(true);
        });
    }

    if (saveButton) {
        saveButton.addEventListener('click', savePatientDoctorSelection);
    }

    if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', () => {
            renderPatientDoctorPickerStatus();
        });
    }
}

async function refreshPatientDoctorPicker(showErrorsInModal = false) {
    if (patientDoctorPickerState.loading) {
        return;
    }

    patientDoctorPickerState.loading = true;
    updatePatientDoctorPickerControls();

    const results = await Promise.allSettled([
        fetchPatientDoctorProfile(),
        fetchPatientDoctorDirectory()
    ]);

    const [profileResult, doctorsResult] = results;

    if (profileResult.status === 'fulfilled') {
        patientDoctorPickerState.profile = profileResult.value;
    }

    if (doctorsResult.status === 'fulfilled') {
        patientDoctorPickerState.doctors = doctorsResult.value;
    }

    patientDoctorPickerState.loading = false;
    renderPatientDoctorPicker();

    if (showErrorsInModal) {
        if (profileResult.status === 'rejected') {
            setPatientDoctorStatus(profileResult.reason?.message || 'Unable to load your profile right now.', 'danger');
        } else if (doctorsResult.status === 'rejected') {
            setPatientDoctorStatus(doctorsResult.reason?.message || 'Unable to load the doctor directory right now.', 'danger');
        }
    }
}

async function fetchPatientDoctorProfile() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.PATIENT_PROFILE), {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Unable to load your profile.');
    }

    return response.json();
}

async function fetchPatientDoctorDirectory() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.DOCTOR_DIRECTORY));

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Unable to load available doctors.');
    }

    const doctors = await response.json();
    return doctors
        .map(normalizeDoctorDirectoryItem)
        .filter(Boolean);
}

function normalizeDoctorDirectoryItem(doctor) {
    if (!doctor) {
        return null;
    }

    const doctorId = doctor.id || doctor._id;
    if (!doctorId) {
        return null;
    }

    return {
        id: String(doctorId),
        name: doctor.name || 'Unnamed doctor',
        email: doctor.email || '',
        specialty: doctor.specialty || ''
    };
}

function formatDoctorPickerLabel(doctor) {
    const specialty = doctor?.specialty ? ` - ${doctor.specialty}` : '';
    const email = doctor?.email ? ` - ${doctor.email}` : '';
    return `${doctor?.name || 'Doctor'}${specialty}${email}`;
}

function formatDoctorPickerMeta(doctor) {
    return [doctor?.specialty, doctor?.email].filter(Boolean).join(' • ');
}

function getAssignedDoctor() {
    const profile = patientDoctorPickerState.profile;
    if (!profile) {
        return null;
    }

    const assignedDoctorId = profile.assigned_doctor_id ? String(profile.assigned_doctor_id) : '';
    const directDoctor = normalizeDoctorDirectoryItem(profile.assigned_doctor);
    if (directDoctor) {
        return directDoctor;
    }

    if (!assignedDoctorId) {
        return null;
    }

    return patientDoctorPickerState.doctors.find(doctor => doctor.id === assignedDoctorId) || {
        id: assignedDoctorId,
        name: 'Previously assigned doctor',
        email: ''
    };
}

function renderPatientDoctorPicker() {
    const buttonLabel = document.getElementById('patientDoctorButtonLabel');
    const doctorButton = document.getElementById('patientDoctorButton');
    const currentName = document.getElementById('patientDoctorCurrentName');
    const currentMeta = document.getElementById('patientDoctorCurrentMeta');
    const select = document.getElementById('patientDoctorSelect');
    const assignedDoctor = getAssignedDoctor();
    const assignedDoctorId = patientDoctorPickerState.profile?.assigned_doctor_id
        ? String(patientDoctorPickerState.profile.assigned_doctor_id)
        : '';

    if (buttonLabel) {
        buttonLabel.textContent = assignedDoctor ? assignedDoctor.name : 'Select doctor';
    }

    if (doctorButton) {
        doctorButton.title = assignedDoctor
            ? `Primary doctor: ${assignedDoctor.name}${assignedDoctor.specialty ? ` (${assignedDoctor.specialty})` : ''}`
            : 'Choose your primary doctor';
    }

    if (currentName) {
        currentName.textContent = assignedDoctor ? assignedDoctor.name : 'No doctor selected';
    }

    if (currentMeta) {
        const doctorMeta = formatDoctorPickerMeta(assignedDoctor);

        if (doctorMeta) {
            currentMeta.textContent = doctorMeta;
        } else if (assignedDoctorId && !assignedDoctor?.email) {
            currentMeta.textContent = 'Your saved doctor is unavailable. Choose a new doctor to reassign.';
        } else {
            currentMeta.textContent = 'Choose the doctor who should monitor and review your records.';
        }
    }

    if (select) {
        populatePatientDoctorSelect(select, assignedDoctorId, assignedDoctor);
    }

    updatePatientDoctorPickerControls();
    renderPatientDoctorPickerStatus();
    syncAppointmentDoctorField(assignedDoctor);
}

function populatePatientDoctorSelect(select, assignedDoctorId, assignedDoctor) {
    const currentValue = assignedDoctorId || '';
    const hasAssignedDoctorOption = currentValue
        ? patientDoctorPickerState.doctors.some(doctor => doctor.id === currentValue)
        : false;

    select.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'No doctor selected';
    select.appendChild(emptyOption);

    if (currentValue && !hasAssignedDoctorOption) {
        const fallbackOption = document.createElement('option');
        fallbackOption.value = currentValue;
        fallbackOption.textContent = assignedDoctor?.name || 'Previously assigned doctor';
        select.appendChild(fallbackOption);
    }

    patientDoctorPickerState.doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        option.textContent = formatDoctorPickerLabel(doctor);
        select.appendChild(option);
    });

    select.value = currentValue;
}

function updatePatientDoctorPickerControls() {
    const doctorButton = document.getElementById('patientDoctorButton');
    const saveButton = document.getElementById('patientDoctorSave');
    const select = document.getElementById('patientDoctorSelect');
    const isReady = !!patientDoctorPickerState.profile;

    if (doctorButton) {
        doctorButton.disabled = patientDoctorPickerState.loading && !patientDoctorPickerState.profile;
    }

    if (select) {
        select.disabled = patientDoctorPickerState.loading || patientDoctorPickerState.saving || patientDoctorPickerState.doctors.length === 0;
    }

    if (saveButton) {
        saveButton.disabled = !isReady || patientDoctorPickerState.loading || patientDoctorPickerState.saving;
        saveButton.innerHTML = patientDoctorPickerState.saving
            ? '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...'
            : '<i class="bi bi-check2-circle me-2"></i>Save doctor';
    }
}

function renderPatientDoctorPickerStatus() {
    if (patientDoctorPickerState.loading) {
        setPatientDoctorStatus('Loading available doctors...', 'muted');
        return;
    }

    const assignedDoctor = getAssignedDoctor();
    const assignedDoctorId = patientDoctorPickerState.profile?.assigned_doctor_id
        ? String(patientDoctorPickerState.profile.assigned_doctor_id)
        : '';

    if (assignedDoctor) {
        const specialtySuffix = assignedDoctor.specialty ? ` (${assignedDoctor.specialty})` : '';
        setPatientDoctorStatus(`Current doctor: ${assignedDoctor.name}${specialtySuffix}`, 'muted');
        return;
    }

    if (assignedDoctorId) {
        setPatientDoctorStatus('Your current doctor is unavailable. Choose a new doctor to continue.', 'warning');
        return;
    }

    if (patientDoctorPickerState.doctors.length) {
        setPatientDoctorStatus('Choose the doctor who should monitor and review your records.', 'muted');
        return;
    }

    setPatientDoctorStatus('No active doctors are available right now.', 'warning');
}

function setPatientDoctorStatus(message, tone = 'muted') {
    const status = document.getElementById('patientDoctorStatus');
    if (!status) {
        return;
    }

    const toneClassMap = {
        success: 'text-success',
        danger: 'text-danger',
        warning: 'text-warning',
        muted: 'text-muted'
    };

    status.className = `form-text ${toneClassMap[tone] || toneClassMap.muted}`;
    status.textContent = message;
}

function buildPatientDoctorProfilePayload(profile, assignedDoctorId) {
    if (!profile?.name || !profile?.email) {
        throw new Error('Unable to update your doctor because your profile is incomplete.');
    }

    const patientProfile = profile.profile || {};

    return {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        date_of_birth: patientProfile.date_of_birth || null,
        gender: patientProfile.gender || null,
        address: patientProfile.address || '',
        blood_type: patientProfile.blood_type || null,
        height: patientProfile.height ?? null,
        weight: patientProfile.weight ?? null,
        allergies: Array.isArray(patientProfile.allergies) ? patientProfile.allergies : [],
        emergency_contact: normalizeDoctorPickerEmergencyContact(patientProfile.emergency_contact),
        assigned_doctor_id: assignedDoctorId
    };
}

function normalizeDoctorPickerEmergencyContact(contact) {
    if (!contact) {
        return {
            name: '',
            relationship: '',
            phone: ''
        };
    }

    if (typeof contact === 'string') {
        return {
            name: contact,
            relationship: '',
            phone: ''
        };
    }

    return {
        name: contact.name || '',
        relationship: contact.relationship || '',
        phone: contact.phone || ''
    };
}

async function savePatientDoctorSelection() {
    const select = document.getElementById('patientDoctorSelect');
    if (!select) {
        return;
    }

    if (!patientDoctorPickerState.profile) {
        await refreshPatientDoctorPicker(true);
    }

    if (!patientDoctorPickerState.profile) {
        setPatientDoctorStatus('Unable to load your profile. Please refresh and try again.', 'danger');
        return;
    }

    const nextDoctorId = select.value || null;
    const currentDoctorId = patientDoctorPickerState.profile.assigned_doctor_id
        ? String(patientDoctorPickerState.profile.assigned_doctor_id)
        : null;

    if ((nextDoctorId || null) === currentDoctorId) {
        patientDoctorPickerState.modal?.hide();
        return;
    }

    patientDoctorPickerState.saving = true;
    updatePatientDoctorPickerControls();
    setPatientDoctorStatus('Saving your doctor selection...', 'muted');

    try {
        const payload = buildPatientDoctorProfilePayload(patientDoctorPickerState.profile, nextDoctorId);
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.PATIENT_PROFILE), {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'Unable to update your primary doctor.');
        }

        const updatedProfile = await response.json();
        patientDoctorPickerState.profile = updatedProfile;
        renderPatientDoctorPicker();
        showPatientDoctorToast('Primary doctor updated successfully.', 'success');

        window.dispatchEvent(new CustomEvent('healio:doctor-assignment-updated', {
            detail: {
                profile: updatedProfile,
                doctors: patientDoctorPickerState.doctors
            }
        }));

        patientDoctorPickerState.modal?.hide();
    } catch (error) {
        console.error('Error updating primary doctor:', error);
        setPatientDoctorStatus(error.message || 'Unable to update your primary doctor.', 'danger');
        showPatientDoctorToast(error.message || 'Unable to update your primary doctor.', 'danger');
    } finally {
        patientDoctorPickerState.saving = false;
        updatePatientDoctorPickerControls();
    }
}

function handlePatientDoctorAssignmentUpdate(event) {
    const updatedProfile = event.detail?.profile;
    if (updatedProfile) {
        patientDoctorPickerState.profile = updatedProfile;
    }

    if (Array.isArray(event.detail?.doctors) && event.detail.doctors.length) {
        patientDoctorPickerState.doctors = event.detail.doctors
            .map(normalizeDoctorDirectoryItem)
            .filter(Boolean);
    }

    renderPatientDoctorPicker();
}

function syncAppointmentDoctorField(assignedDoctor) {
    const appointmentDoctorInput = document.getElementById('appointmentDoctor');
    if (!appointmentDoctorInput || appointmentDoctorInput.value.trim()) {
        return;
    }

    appointmentDoctorInput.value = assignedDoctor?.name || '';
}

function showPatientDoctorToast(message, tone = 'success') {
    const toast = document.createElement('div');
    const toneClassMap = {
        success: 'alert-success',
        danger: 'alert-danger',
        info: 'alert-info'
    };
    const iconMap = {
        success: 'bi-check-circle',
        danger: 'bi-exclamation-triangle',
        info: 'bi-info-circle'
    };

    toast.className = `alert ${toneClassMap[tone] || toneClassMap.info} position-fixed top-0 end-0 m-3 shadow-sm`;
    toast.style.zIndex = '1080';
    toast.innerHTML = `
        <i class="bi ${iconMap[tone] || iconMap.info} me-2"></i>${message}
    `;

    document.body.appendChild(toast);

    window.setTimeout(() => {
        toast.remove();
    }, 3000);
}
