// Store allergies array
let allergies = [];
let pendingAssignedDoctorId = '';

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadCurrentUser();
    loadAvailableDoctors();
    loadUserProfile();
    ensureAppearanceSection();
    loadThemePreferences();
    loadNotificationPreferences();
    setupAllergyHandlers();
    setupHeightWeightHandlers();
    setupToggleButton();
    setupAssignedDoctorHandlers();
});

window.addEventListener('healio:doctor-assignment-updated', event => {
    const updatedProfile = event.detail?.profile;
    if (!updatedProfile) {
        return;
    }

    pendingAssignedDoctorId = updatedProfile.assigned_doctor_id || '';

    if (Array.isArray(event.detail?.doctors) && event.detail.doctors.length) {
        populateAssignedDoctorSelect(event.detail.doctors);
        return;
    }

    applyAssignedDoctorSelection();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }
    return true;
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Load current user info for sidebar
async function loadCurrentUser() {
    try {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('sidebarUserName').textContent = data.name || 'User';
            document.getElementById('sidebarUserEmail').textContent = data.email || '';
            
            const avatar = document.getElementById('sidebarUserAvatar');
            if (avatar && data.name) {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=7c3aed&color=fff`;
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load user profile data
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.PATIENT_PROFILE}`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // Populate basic fields
            document.getElementById('profileName').value = data.name || '';
            document.getElementById('profileEmail').value = data.email || '';
            document.getElementById('profilePhone').value = data.phone || '';
            
            // Access profile object if it exists
            const profile = data.profile || {};
            
            // Format date of birth if exists
            if (profile.date_of_birth) {
                const dob = new Date(profile.date_of_birth);
                const formattedDob = dob.toISOString().split('T')[0];
                document.getElementById('profileDob').value = formattedDob;
            }
            
            // Additional fields from profile
            if (profile.gender) document.getElementById('profileGender').value = profile.gender;
            if (profile.blood_type) document.getElementById('profileBloodType').value = profile.blood_type;
            if (profile.address) document.getElementById('profileAddress').value = profile.address;
            if (profile.height) document.getElementById('profileHeight').value = profile.height;
            if (profile.weight) document.getElementById('profileWeight').value = profile.weight;
            pendingAssignedDoctorId = data.assigned_doctor_id || '';
            applyAssignedDoctorSelection();
            
            // Calculate and display BMI if height and weight exist
            if (profile.height && profile.weight) {
                calculateBMI();
            }
            
            // Load allergies
            if (profile.allergies && Array.isArray(profile.allergies)) {
                allergies = profile.allergies;
                displayAllergies();
            }
            
            // Emergency contact
            const emergencyContact = normalizeEmergencyContact(profile.emergency_contact);
            if (emergencyContact) {
                document.getElementById('emergencyName').value = emergencyContact.name || '';
                document.getElementById('emergencyRelation').value = emergencyContact.relationship || '';
                document.getElementById('emergencyPhone').value = emergencyContact.phone || '';
            }
            
            // Check if we should auto-expand extended fields
            checkAndAutoExpandFields();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile data');
    }
}

async function loadAvailableDoctors() {
    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.DOCTOR_DIRECTORY}`);

        if (!response.ok) {
            throw new Error('Failed to load doctors');
        }

        const doctors = await response.json();
        populateAssignedDoctorSelect(doctors);
    } catch (error) {
        console.error('Error loading doctors:', error);
        const select = document.getElementById('profileAssignedDoctor');
        const status = document.getElementById('profileAssignedDoctorStatus');
        select.innerHTML = '<option value="">No doctors available right now</option>';
        select.disabled = true;
        status.textContent = 'No active doctors are available right now.';
    }
}

function formatDoctorOptionLabel(doctor) {
    const specialty = doctor.specialty ? ` - ${doctor.specialty}` : '';
    const email = doctor.email ? ` - ${doctor.email}` : '';
    return `${doctor.name}${specialty}${email}`;
}

function populateAssignedDoctorSelect(doctors) {
    const select = document.getElementById('profileAssignedDoctor');
    const status = document.getElementById('profileAssignedDoctorStatus');
    const currentValue = pendingAssignedDoctorId || select.value;

    select.innerHTML = [
        '<option value="">No doctor selected</option>',
        ...doctors.map(doctor => {
            const doctorId = doctor.id || doctor._id;
            return `<option value="${doctorId}">${formatDoctorOptionLabel(doctor)}</option>`;
        })
    ].join('');

    select.disabled = doctors.length === 0;
    if (currentValue) {
        select.value = currentValue;
    }

    status.textContent = doctors.length
        ? 'Choose the doctor who should monitor and review your records.'
        : 'No active doctors are available right now.';
    updateAssignedDoctorStatus();
}

function applyAssignedDoctorSelection() {
    const select = document.getElementById('profileAssignedDoctor');
    if (!select || !pendingAssignedDoctorId) {
        updateAssignedDoctorStatus();
        return;
    }

    const matchingOption = Array.from(select.options).find(option => option.value === pendingAssignedDoctorId);
    if (matchingOption) {
        select.value = pendingAssignedDoctorId;
    }

    updateAssignedDoctorStatus();
}

function setupAssignedDoctorHandlers() {
    const select = document.getElementById('profileAssignedDoctor');
    select.addEventListener('change', updateAssignedDoctorStatus);
}

function updateAssignedDoctorStatus() {
    const select = document.getElementById('profileAssignedDoctor');
    const status = document.getElementById('profileAssignedDoctorStatus');

    if (!select || !status) {
        return;
    }

    if (!select.value) {
        status.textContent = select.disabled
            ? 'No active doctors are available right now.'
            : 'Choose the doctor who should monitor and review your records.';
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    status.textContent = `Selected doctor: ${selectedOption.text}`;
}

function normalizeEmergencyContact(contact) {
    if (!contact) {
        return null;
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

function ensureAppearanceSection() {
    if (document.getElementById('themeSelect')) {
        return;
    }

    const grid = document.querySelector('.dashboard-content .container-fluid .row.g-4');
    if (!grid) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'col-12';
    wrapper.innerHTML = `
        <div class="card">
            <div class="card-body">
                <div class="d-flex align-items-center gap-3 mb-4">
                    <div class="bg-primary bg-opacity-10 p-3 rounded">
                        <i class="bi bi-palette fs-4 text-primary"></i>
                    </div>
                    <div>
                        <h5 class="card-title mb-1">Appearance</h5>
                        <p class="text-muted small mb-0">Switch themes instantly across the entire website</p>
                    </div>
                </div>

                <div class="row g-3 mb-3">
                    <div class="col-lg-5">
                        <label for="themeSelect" class="form-label fw-semibold">Theme Mode</label>
                        <select class="form-select" id="themeSelect">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="ocean">Ocean</option>
                            <option value="sunset">Sunset</option>
                        </select>
                    </div>
                    <div class="col-lg-7">
                        <label class="form-label fw-semibold">Quick Presets</label>
                        <div class="theme-option-grid" id="themePresetGrid">
                            <button type="button" class="theme-option-btn" data-theme-option="light">
                                <span>
                                    <span class="d-block fw-semibold">Light</span>
                                    <small class="text-muted">Bright and clean</small>
                                </span>
                                <span class="theme-swatch theme-swatch--light"></span>
                            </button>
                            <button type="button" class="theme-option-btn" data-theme-option="dark">
                                <span>
                                    <span class="d-block fw-semibold">Dark</span>
                                    <small class="text-muted">Low-light comfort</small>
                                </span>
                                <span class="theme-swatch theme-swatch--dark"></span>
                            </button>
                            <button type="button" class="theme-option-btn" data-theme-option="ocean">
                                <span>
                                    <span class="d-block fw-semibold">Ocean</span>
                                    <small class="text-muted">Cool teal-blue calm</small>
                                </span>
                                <span class="theme-swatch theme-swatch--ocean"></span>
                            </button>
                            <button type="button" class="theme-option-btn" data-theme-option="sunset">
                                <span>
                                    <span class="d-block fw-semibold">Sunset</span>
                                    <small class="text-muted">Warm orange-magenta glow</small>
                                </span>
                                <span class="theme-swatch theme-swatch--sunset"></span>
                            </button>
                        </div>
                    </div>
                </div>

                <p class="small text-muted mb-0">Your selected theme is saved automatically and applied on every page.</p>
            </div>
        </div>
    `;

    const notificationsIcon = document.querySelector('.dashboard-content .bi-bell');
    const notificationsBlock = notificationsIcon ? notificationsIcon.closest('.col-12') : null;

    if (notificationsBlock && notificationsBlock.parentElement === grid) {
        grid.insertBefore(wrapper, notificationsBlock);
    } else {
        grid.appendChild(wrapper);
    }
}

function loadThemePreferences() {
    const themeSelect = document.getElementById('themeSelect');
    const presetButtons = Array.from(document.querySelectorAll('[data-theme-option]'));

    if (!themeSelect || !window.HealioTheme) {
        return;
    }

    const activeTheme = window.HealioTheme.getTheme();
    themeSelect.value = activeTheme;
    syncThemePresetState(activeTheme, presetButtons);

    themeSelect.addEventListener('change', () => {
        const selected = themeSelect.value;
        const applied = window.HealioTheme.setTheme(selected);
        syncThemePresetState(applied, presetButtons);
        showSuccess(`Theme switched to ${capitalizeThemeName(applied)} mode`);
    });

    presetButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const selected = button.getAttribute('data-theme-option');
            const applied = window.HealioTheme.setTheme(selected);
            themeSelect.value = applied;
            syncThemePresetState(applied, presetButtons);
            showSuccess(`Theme switched to ${capitalizeThemeName(applied)} mode`);
        });
    });

    window.addEventListener('healio:theme-changed', (event) => {
        const appliedTheme = event.detail?.theme;
        if (!appliedTheme) {
            return;
        }
        themeSelect.value = appliedTheme;
        syncThemePresetState(appliedTheme, presetButtons);
    });
}

function syncThemePresetState(activeTheme, buttons) {
    buttons.forEach((button) => {
        const isActive = button.getAttribute('data-theme-option') === activeTheme;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function capitalizeThemeName(name) {
    const value = String(name || 'theme');
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// Load notification preferences from localStorage
function loadNotificationPreferences() {
    const prefs = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATION_PREFS);
    
    if (prefs) {
        try {
            const preferences = JSON.parse(prefs);
            document.getElementById('emailNotifications').checked = preferences.email !== false;
            document.getElementById('pushNotifications').checked = preferences.push !== false;
            document.getElementById('reminderAlerts').checked = preferences.reminders !== false;
            document.getElementById('weeklyReports').checked = preferences.weekly !== false;
        } catch (error) {
            console.error('Error loading preferences:', error);
            // Set defaults
            setDefaultNotifications();
        }
    } else {
        // Set defaults
        setDefaultNotifications();
    }
    
    // Attach change listeners
    document.getElementById('emailNotifications').addEventListener('change', saveNotificationPreferences);
    document.getElementById('pushNotifications').addEventListener('change', saveNotificationPreferences);
    document.getElementById('reminderAlerts').addEventListener('change', saveNotificationPreferences);
    document.getElementById('weeklyReports').addEventListener('change', saveNotificationPreferences);
}

// Set default notification preferences
function setDefaultNotifications() {
    document.getElementById('emailNotifications').checked = true;
    document.getElementById('pushNotifications').checked = true;
    document.getElementById('reminderAlerts').checked = true;
    document.getElementById('weeklyReports').checked = true;
}

// Save notification preferences
function saveNotificationPreferences() {
    const preferences = {
        email: document.getElementById('emailNotifications').checked,
        push: document.getElementById('pushNotifications').checked,
        reminders: document.getElementById('reminderAlerts').checked,
        weekly: document.getElementById('weeklyReports').checked
    };
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(preferences));
    showSuccess('Notification preferences saved');
}

// Handle profile form submission
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        date_of_birth: document.getElementById('profileDob').value,
        gender: document.getElementById('profileGender').value,
        blood_type: document.getElementById('profileBloodType').value,
        address: document.getElementById('profileAddress').value,
        height: parseFloat(document.getElementById('profileHeight').value) || null,
        weight: parseFloat(document.getElementById('profileWeight').value) || null,
        allergies: allergies,
        assigned_doctor_id: document.getElementById('profileAssignedDoctor').value || null,
        emergency_contact: {
            name: document.getElementById('emergencyName').value,
            relationship: document.getElementById('emergencyRelation').value,
            phone: document.getElementById('emergencyPhone').value
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.PATIENT_PROFILE}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            const updatedProfile = await response.json();
            pendingAssignedDoctorId = updatedProfile.assigned_doctor_id || '';
            applyAssignedDoctorSelection();
            window.dispatchEvent(new CustomEvent('healio:doctor-assignment-updated', {
                detail: {
                    profile: updatedProfile
                }
            }));
            showSuccess('Profile updated successfully!');
            
            // Update sidebar with new name
            document.getElementById('sidebarUserName').textContent = formData.name;
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, formData.name);
            
            // Update avatar
            const avatar = document.getElementById('sidebarUserAvatar');
            if (avatar) {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=7c3aed&color=fff`;
            }
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
    }
});

// Confirm delete account
function confirmDeleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.');
    
    if (confirmed) {
        const doubleConfirm = confirm('Please confirm again. This will permanently delete all your health data, medications, and account information.');
        
        if (doubleConfirm) {
            deleteAccount();
        }
    }
    
    return false;
}

// Delete account
async function deleteAccount() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('Your account has been deleted successfully.');
            logout();
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showError('Failed to delete account');
    }
}

// Show export modal
function showExportModal() {
    const modal = new bootstrap.Modal(document.getElementById('exportModal'));
    document.getElementById('exportStatus').className = 'd-none';
    document.getElementById('exportBtn').disabled = false;
    document.getElementById('exportBtn').innerHTML = '<i class="bi bi-download me-2"></i>Export';
    modal.show();
}

// Trigger export from modal
async function triggerExport() {
    const format = document.querySelector('input[name="exportFormat"]:checked').value;
    const fromDate = document.getElementById('exportFromDate').value;
    const toDate = document.getElementById('exportToDate').value;

    const btn = document.getElementById('exportBtn');
    const status = document.getElementById('exportStatus');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Exporting...';
    status.className = 'd-none';

    try {
        let url = `${API_BASE_URL}/patients/me/export?format=${format}`;
        if (fromDate) url += `&from_date=${fromDate}T00:00:00`;
        if (toDate) url += `&to_date=${toDate}T23:59:59`;

        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ detail: 'Export failed' }));
            throw new Error(err.detail || 'Export failed');
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition') || '';
        const filenameMatch = disposition.match(/filename=([^;]+)/);
        const filename = filenameMatch ? filenameMatch[1] : `healio_export.${format}`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        bootstrap.Modal.getInstance(document.getElementById('exportModal')).hide();
        showSuccess(`Health data exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
        console.error('Export error:', error);
        status.className = 'alert alert-danger small';
        status.textContent = error.message || 'Export failed. Please try again.';
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-download me-2"></i>Export';
    }
}

// Logout function
function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
    window.location.href = 'login-v2.html';
}

// Show success message
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-danger position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Setup allergy handlers
function setupAllergyHandlers() {
    const addBtn = document.getElementById('addAllergyBtn');
    const input = document.getElementById('allergiesInput');
    
    addBtn.addEventListener('click', addAllergy);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addAllergy();
        }
    });
}

// Add allergy
function addAllergy() {
    const input = document.getElementById('allergiesInput');
    const allergy = input.value.trim();
    
    if (allergy && !allergies.includes(allergy)) {
        allergies.push(allergy);
        input.value = '';
        displayAllergies();
    }
}

// Display allergies
function displayAllergies() {
    const container = document.getElementById('allergiesList');
    container.innerHTML = '';
    
    allergies.forEach((allergy, index) => {
        const tag = document.createElement('span');
        tag.className = 'badge bg-light text-dark me-2 mb-2';
        tag.style.fontSize = '0.875rem';
        tag.innerHTML = `
            ${allergy}
            <button type="button" class="btn-close btn-close-sm ms-2" style="font-size: 0.6rem;" onclick="removeAllergy(${index})"></button>
        `;
        container.appendChild(tag);
    });
}

// Remove allergy
function removeAllergy(index) {
    allergies.splice(index, 1);
    displayAllergies();
}

// Setup height/weight handlers for BMI calculation
function setupHeightWeightHandlers() {
    const heightInput = document.getElementById('profileHeight');
    const weightInput = document.getElementById('profileWeight');
    
    heightInput.addEventListener('input', calculateBMI);
    weightInput.addEventListener('input', calculateBMI);
}

// Calculate BMI
function calculateBMI() {
    const height = parseFloat(document.getElementById('profileHeight').value);
    const weight = parseFloat(document.getElementById('profileWeight').value);
    const bmiField = document.getElementById('profileBMI');
    
    if (height > 0 && weight > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        bmiField.value = bmi.toFixed(1);
    } else {
        bmiField.value = '';
    }
}

// Make removeAllergy available globally
window.removeAllergy = removeAllergy;

// Setup toggle button for extended fields
function setupToggleButton() {
    const toggleBtn = document.getElementById('toggleExtendedFields');
    const extendedFields = document.getElementById('extendedFields');
    const toggleIcon = document.getElementById('toggleIcon');
    const toggleText = document.getElementById('toggleText');
    
    toggleBtn.addEventListener('click', () => {
        const isHidden = extendedFields.style.display === 'none';
        
        if (isHidden) {
            extendedFields.style.display = 'block';
            toggleIcon.className = 'bi bi-chevron-up me-1';
            toggleText.textContent = 'Show Less Details';
        } else {
            extendedFields.style.display = 'none';
            toggleIcon.className = 'bi bi-chevron-down me-1';
            toggleText.textContent = 'Show More Details';
        }
    });
    
    // Auto-expand if user has medical info or emergency contact filled
    checkAndAutoExpandFields();
}

// Check if user has extended fields filled and auto-expand if so
function checkAndAutoExpandFields() {
    // Wait a bit for data to load
    setTimeout(() => {
        const hasHeight = document.getElementById('profileHeight').value;
        const hasWeight = document.getElementById('profileWeight').value;
        const hasAllergies = allergies.length > 0;
        const hasEmergencyContact = document.getElementById('emergencyName').value;
        
        if (hasHeight || hasWeight || hasAllergies || hasEmergencyContact) {
            const extendedFields = document.getElementById('extendedFields');
            const toggleIcon = document.getElementById('toggleIcon');
            const toggleText = document.getElementById('toggleText');
            
            extendedFields.style.display = 'block';
            toggleIcon.className = 'bi bi-chevron-up me-1';
            toggleText.textContent = 'Show Less Details';
        }
    }, 500);
}
