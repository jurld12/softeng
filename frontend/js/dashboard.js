// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

const CONFIG = {
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'healio_access_token',
        USER_ROLE: 'healio_user_role',
        USER_ID: 'healio_user_id',
        USER_NAME: 'healio_user_name'
    },
    ENDPOINTS: {
        LOGOUT: '/auth/logout',
        PATIENT_DASHBOARD: '/patients/me/dashboard',
        PATIENT_BIOMETRICS: '/patients/me/biometrics',
        PATIENT_MEDICATIONS: '/patients/me/medications'
    }
};

function getApiUrl(endpoint) {
    return API_BASE_URL + endpoint;
}

function getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// ==================== Authentication Check ====================
function checkAuthentication() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);
    
    if (!token) {
        console.log('No token found, redirecting to login');
        window.location.href = 'login-v2.html';
        return false;
    }
    
    if (role !== 'patient') {
        console.log('User is not a patient, redirecting');
        alert('Access denied. This page is for patients only.');
        window.location.href = 'login-v2.html';
        return false;
    }
    
    return true;
}

// ==================== Logout Function ====================
window.logout = async function() {
    try {
        // Call logout API
        await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGOUT), {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear localStorage
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ROLE);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
        
        // Redirect to login
        window.location.href = 'login-v2.html';
    }
};

// ==================== Load Current User Data ====================
async function loadCurrentUser() {
    try {
        const response = await fetch(getApiUrl('/auth/me'), {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                throw new Error('Session expired');
            }
            throw new Error('Failed to load user data');
        }
        
        const userData = await response.json();
        console.log('User data loaded:', userData);
        
        // Update sidebar user info
        const userName = userData.name || 'User';
        document.getElementById('sidebarUserName').textContent = userName;
        document.getElementById('sidebarUserEmail').textContent = userData.email || '';
        
        // Update greeting
        const hour = new Date().getHours();
        let greeting = 'Good Evening';
        if (hour < 12) greeting = 'Good Morning';
        else if (hour < 18) greeting = 'Good Afternoon';
        
        document.getElementById('greetingText').textContent = `${greeting}, ${userName.split(' ')[0]} 👋`;
        
        // Update profile section
        updateProfileSection(userData);
        
        return userData;
    } catch (error) {
        console.error('Error loading user:', error);
        if (error.message === 'Session expired') {
            alert('Your session has expired. Please login again.');
            window.logout();
        }
        throw error;
    }
}

// ==================== Update Profile Section ====================
function updateProfileSection(userData) {
    // Update profile name and avatar
    document.getElementById('profileName').textContent = userData.name || 'N/A';
    
    // Update profile avatar URLs
    const avatarName = encodeURIComponent(userData.name || 'User');
    const avatarUrls = document.querySelectorAll('img[src*="ui-avatars.com"]');
    avatarUrls.forEach(img => {
        img.src = `https://ui-avatars.com/api/?name=${avatarName}&background=7c3aed&color=fff&size=${img.width || 80}`;
    });
    
    // Calculate age if date_of_birth exists
    if (userData.date_of_birth) {
        const dob = new Date(userData.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        document.getElementById('profileAge').textContent = `${age} years`;
        document.getElementById('profileDOB').textContent = dob.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } else {
        document.getElementById('profileAge').textContent = 'N/A';
        document.getElementById('profileDOB').textContent = 'Not provided';
    }
    
    // Update gender
    if (userData.gender) {
        document.getElementById('profileGender').textContent = 
            userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1);
    } else {
        document.getElementById('profileGender').style.display = 'none';
    }
    
    // Update blood type
    if (userData.blood_type) {
        document.getElementById('profileBlood').textContent = userData.blood_type;
    } else {
        document.getElementById('profileBlood').style.display = 'none';
    }
    
    // Update height and weight
    document.getElementById('profileHeight').textContent = 
        userData.height ? `${userData.height} cm` : 'Not provided';
    document.getElementById('profileWeight').textContent = 
        userData.weight ? `${userData.weight} kg` : 'Not provided';
    
    // Update phone
    document.getElementById('profilePhone').textContent = userData.phone || 'Not provided';
    
    // Update email
    document.getElementById('profileEmail').textContent = userData.email || 'N/A';
    
    // Update address
    document.getElementById('profileAddress').textContent = userData.address || 'Not provided';
    
    // Update allergies
    const allergiesList = document.getElementById('allergiesList');
    if (userData.allergies && userData.allergies.length > 0) {
        allergiesList.innerHTML = userData.allergies.map(allergy => 
            `<span class="badge" style="background: #fee; color: #c33;">${allergy}</span>`
        ).join('');
    } else {
        allergiesList.innerHTML = '<span class="text-muted small">No known allergies</span>';
    }
    
    // Update emergency contact
    document.getElementById('profileEmergency').textContent = 
        userData.emergency_contact || 'Not provided';
}

// ==================== Load Dashboard Data ====================
async function loadDashboardData() {
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.PATIENT_DASHBOARD), {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Failed to load dashboard data');
        }
        
        const dashboardData = await response.json();
        console.log('Dashboard data loaded:', dashboardData);
        
        // Update vitals
        updateVitals(dashboardData.latest_metrics);
        
        return dashboardData;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data. Using demo data.');
        return null;
    }
}

// ==================== Update Vitals Display ====================
function updateVitals(latestMetrics) {
    if (!latestMetrics) return;
    
    // Update blood glucose / blood sugar
    if (latestMetrics.blood_glucose) {
        const value = Math.round(latestMetrics.blood_glucose.value);
        document.getElementById('bloodSugarValue').textContent = value;
        updateVitalStatus('bloodSugar', value, 70, 100, 140);
    }
    
    // Update heart rate
    if (latestMetrics.heart_rate) {
        const value = Math.round(latestMetrics.heart_rate.value);
        document.getElementById('heartRateValue').textContent = value;
        updateVitalStatus('heartRate', value, 60, 100, 110);
    }
    
    // Update steps
    if (latestMetrics.steps) {
        const value = Math.round(latestMetrics.steps.value);
        document.getElementById('stepsValue').textContent = value.toLocaleString();
        updateVitalStatus('steps', value, 5000, 10000, 15000);
    }
    
    // Update sleep hours
    if (latestMetrics.sleep_hours) {
        const value = latestMetrics.sleep_hours.value.toFixed(1);
        document.getElementById('sleepValue').textContent = value;
        updateVitalStatus('sleep', value, 6, 7, 9);
    }
    
    // Update blood pressure
    if (latestMetrics.blood_pressure_systolic && latestMetrics.blood_pressure_diastolic) {
        const systolic = Math.round(latestMetrics.blood_pressure_systolic.value);
        const diastolic = Math.round(latestMetrics.blood_pressure_diastolic.value);
        document.getElementById('bpValue').textContent = `${systolic}/${diastolic}`;
        updateVitalStatus('bp', systolic, 90, 120, 140);
    }
    
    // Update calories
    if (latestMetrics.calories) {
        const value = Math.round(latestMetrics.calories.value);
        document.getElementById('caloriesValue').textContent = value.toLocaleString();
    }
    
    // Update blood oxygen
    if (latestMetrics.blood_oxygen) {
        const value = Math.round(latestMetrics.blood_oxygen.value);
        document.getElementById('oxygenValue').textContent = value;
        updateVitalStatus('oxygen', value, 90, 95, 100);
    }
    
    // Update body temperature
    if (latestMetrics.body_temperature) {
        const value = latestMetrics.body_temperature.value.toFixed(1);
        document.getElementById('tempValue').textContent = value;
        updateVitalStatus('temp', value, 97, 98.6, 99.5);
    }
    
    // Update weight
    if (latestMetrics.weight) {
        const value = latestMetrics.weight.value.toFixed(1);
        document.getElementById('weightValue').textContent = value;
    }
    
    // Update BMI
    if (latestMetrics.bmi) {
        const value = latestMetrics.bmi.value.toFixed(1);
        document.getElementById('bmiValue').textContent = value;
        updateVitalStatus('bmi', value, 18.5, 24.9, 30);
    }
    
    // Update respiratory rate
    if (latestMetrics.respiratory_rate) {
        const value = Math.round(latestMetrics.respiratory_rate.value);
        document.getElementById('respRateValue').textContent = value;
        updateVitalStatus('respRate', value, 12, 20, 25);
    }
    
    // Update hydration
    if (latestMetrics.hydration) {
        const value = latestMetrics.hydration.value.toFixed(1);
        document.getElementById('hydrationValue').textContent = value;
        updateVitalStatus('hydration', value, 1.5, 2.5, 4);
    }
}

// ==================== Update Vital Status Badge ====================
function updateVitalStatus(vitalId, value, lowThreshold, normalThreshold, highThreshold) {
    const vitalCard = document.querySelector(`[data-vital-id="${vitalId}"]`);
    if (!vitalCard) return;
    
    const statusBadge = vitalCard.querySelector('.vital-status');
    if (!statusBadge) return;
    
    // Remove all status classes
    vitalCard.classList.remove('vital-card-normal', 'vital-card-attention', 'vital-card-critical');
    statusBadge.classList.remove('badge-normal', 'badge-attention', 'badge-critical');
    
    // Determine status
    if (value >= lowThreshold && value <= normalThreshold) {
        vitalCard.classList.add('vital-card-normal');
        statusBadge.classList.add('badge-normal');
        statusBadge.textContent = 'Normal';
    } else if (value < lowThreshold || (value > normalThreshold && value <= highThreshold)) {
        vitalCard.classList.add('vital-card-attention');
        statusBadge.classList.add('badge-attention');
        statusBadge.textContent = 'Attention';
    } else {
        vitalCard.classList.add('vital-card-critical');
        statusBadge.classList.add('badge-critical');
        statusBadge.textContent = 'Critical';
    }
}

// ==================== Save Vital Data ====================
window.saveVitalData = async function() {
    const timestamp = document.getElementById('vitalTimestamp').value;
    let value;
    let metric;
    
    // Get the current vital data from modal
    if (!window.currentVitalData) {
        alert('No vital data selected');
        return;
    }
    
    const vitalId = window.currentVitalData.id;
    
    // Map vital IDs to API metric names
    const metricMap = {
        'bloodSugar': 'blood_glucose',
        'heartRate': 'heart_rate',
        'steps': 'steps',
        'sleep': 'sleep_hours',
        'calories': 'calories',
        'oxygen': 'blood_oxygen',
        'temp': 'body_temperature',
        'weight': 'weight',
        'bmi': 'bmi',
        'respRate': 'respiratory_rate',
        'hydration': 'hydration'
    };
    
    metric = metricMap[vitalId];
    
    if (window.currentVitalData.format === 'systolic/diastolic') {
        const systolic = document.getElementById('systolicValue').value;
        const diastolic = document.getElementById('diastolicValue').value;
        
        if (!systolic || !diastolic) {
            alert('Please enter both systolic and diastolic values');
            return;
        }
        
        // Save systolic
        await saveBiometricEntry('blood_pressure_systolic', parseFloat(systolic), timestamp);
        // Save diastolic
        await saveBiometricEntry('blood_pressure_diastolic', parseFloat(diastolic), timestamp);
        
        // Update display
        document.getElementById('bpValue').textContent = `${systolic}/${diastolic}`;
        updateVitalStatus('bp', parseFloat(systolic), 90, 120, 140);
        
    } else {
        value = document.getElementById('vitalValue').value;
        
        if (!value) {
            alert('Please enter a value');
            return;
        }
        
        if (!metric) {
            alert('Unknown vital type');
            return;
        }
        
        await saveBiometricEntry(metric, parseFloat(value), timestamp);
        
        // Update display
        const displayValue = ['steps', 'calories'].includes(metric) 
            ? Math.round(value).toLocaleString() 
            : Math.round(value);
        document.getElementById(`${vitalId}Value`).textContent = displayValue;
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('vitalInputModal'));
    modal.hide();
    
    // Show success message
    showSuccessMessage(`${window.currentVitalData.name} updated successfully!`);
    
    // Reload dashboard data
    setTimeout(() => loadDashboardData(), 1000);
};

// ==================== Save Biometric Entry ====================
async function saveBiometricEntry(metric, value, timestamp) {
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.PATIENT_BIOMETRICS), {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                metric: metric,
                value: value,
                timestamp: new Date(timestamp).toISOString()
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save data');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving biometric:', error);
        alert(`Failed to save data: ${error.message}`);
        throw error;
    }
}

// ==================== Show Success Message ====================
function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// ==================== Show Error Message ====================
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// ==================== Open Vital Modal ====================
window.openVitalModal = function(element) {
    const vitalName = element.getAttribute('data-vital-name');
    const vitalUnit = element.getAttribute('data-vital-unit');
    const vitalId = element.getAttribute('data-vital-id');
    const vitalFormat = element.getAttribute('data-vital-format');
    
    // Store current vital data
    window.currentVitalData = {
        name: vitalName,
        unit: vitalUnit,
        id: vitalId,
        format: vitalFormat
    };
    
    // Update modal labels
    document.getElementById('vitalInputModalLabel').textContent = `Update ${vitalName}`;
    document.getElementById('vitalNameLabel').textContent = vitalName;
    document.getElementById('vitalUnitLabel').textContent = vitalUnit;
    
    // Set default timestamp to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('vitalTimestamp').value = now.toISOString().slice(0, 16);
    
    // Handle special format for blood pressure
    if (vitalFormat === 'systolic/diastolic') {
        document.getElementById('singleInputGroup').style.display = 'none';
        document.getElementById('bpInputGroup').style.display = 'block';
        document.getElementById('systolicValue').value = '';
        document.getElementById('diastolicValue').value = '';
    } else {
        document.getElementById('singleInputGroup').style.display = 'block';
        document.getElementById('bpInputGroup').style.display = 'none';
        document.getElementById('vitalValue').value = '';
    }
    
    // Set helpful hints
    const hints = {
        'bloodSugar': 'Normal range: 70-100 mg/dL (fasting)',
        'heartRate': 'Normal range: 60-100 bpm',
        'steps': 'Recommended: 10,000 steps per day',
        'sleep': 'Recommended: 7-9 hours',
        'bp': 'Normal: <120/80 mmHg',
        'oxygen': 'Normal range: 95-100%',
        'temp': 'Normal range: 97.8-99°F',
        'weight': 'Track your weight over time',
        'bmi': 'Normal range: 18.5-24.9 kg/m²',
        'calories': 'Track daily calorie burn',
        'respRate': 'Normal range: 12-20 breaths per minute',
        'hydration': 'Recommended: 2-3 L per day'
    };
    document.getElementById('vitalHint').textContent = hints[vitalId] || '';
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('vitalInputModal'));
    modal.show();
};

// ==================== Load Medications ====================
async function loadMedications() {
    const medicationsList = document.getElementById('medicationsList');
    if (!medicationsList) {
        console.error('Medications list element not found');
        return;
    }
    
    try {
        console.log('Fetching medications from:', getApiUrl(CONFIG.ENDPOINTS.PATIENT_MEDICATIONS));
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.PATIENT_MEDICATIONS), {
            headers: getAuthHeaders()
        });
        
        console.log('Medications response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Medications API error:', errorText);
            throw new Error('Failed to load medications');
        }
        
        const medications = await response.json();
        console.log('Medications loaded:', medications);
        
        displayMedications(medications);
    } catch (error) {
        console.error('Error loading medications:', error);
        if (medicationsList) {
            medicationsList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <p>Unable to load medications</p>
                    <a href="medications.html" class="btn btn-sm btn-primary">Go to Medications Page</a>
                </div>
            `;
        }
    }
}

// ==================== Display Medications ====================
function displayMedications(medications) {
    const medicationsList = document.getElementById('medicationsList');
    if (!medicationsList) return;
    
    // Filter only active medications
    const activeMeds = medications.filter(med => med.active);
    
    if (activeMeds.length === 0) {
        medicationsList.innerHTML = `
            <div class="text-center text-muted py-3">
                <p>No active medications</p>
                <a href="medications.html" class="btn btn-sm btn-primary">
                    <i class="bi bi-plus-lg me-2"></i>Add Medication
                </a>
            </div>
        `;
        return;
    }
    
    // Show up to 3 medications on dashboard
    const displayMeds = activeMeds.slice(0, 3);
    
    medicationsList.innerHTML = displayMeds.map(med => {
        const instructions = med.instructions || 
            (med.time_of_day ? `Take ${med.time_of_day}` : med.frequency);
        
        return `
            <div class="medication-item d-flex align-items-center gap-3">
                <div class="medication-icon">💊</div>
                <div class="flex-grow-1">
                    <h3 class="h6 mb-1 fw-semibold">${escapeHtml(med.name)} (${escapeHtml(med.dosage)})</h3>
                    <p class="text-muted small mb-0">${escapeHtml(instructions)}</p>
                </div>
                <a href="medications.html" class="btn btn-sm btn-light" title="View details">
                    <i class="bi bi-arrow-right"></i>
                </a>
            </div>
        `;
    }).join('');
}

// ==================== Utility: Escape HTML ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Initialize Dashboard ====================
async function initializeDashboard() {
    // Check authentication first
    if (!checkAuthentication()) {
        return;
    }
    
    try {
        // Show loading state
        console.log('Initializing dashboard...');
        
        // Load user data
        await loadCurrentUser();
        
        // Apply vital preferences first (hide unselected vitals)
        applyVitalPreferences();
        
        // Load dashboard data
        await loadDashboardData();
        
        // Load medications (don't let it fail the whole dashboard)
        try {
            await loadMedications();
        } catch (medError) {
            console.error('Medications load failed, but continuing:', medError);
        }
        
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Failed to load dashboard. Please refresh the page.');
    }
}

// ==================== Apply Vital Preferences ====================
function applyVitalPreferences() {
    try {
        const stored = localStorage.getItem('healio_vital_preferences');
        if (!stored) {
            // If no preferences set, show all vitals by default
            return;
        }
        
        const preferences = JSON.parse(stored);
        console.log('Applying vital preferences:', preferences);
        
        // Hide vitals that are not enabled
        Object.keys(preferences).forEach(vitalId => {
            const isEnabled = preferences[vitalId];
            const vitalCard = document.querySelector(`[data-vital-id="${vitalId}"]`);
            
            if (vitalCard) {
                const parentCol = vitalCard.closest('.col-md-6, .col-xl-4');
                if (parentCol) {
                    if (isEnabled) {
                        parentCol.style.display = '';
                    } else {
                        parentCol.style.display = 'none';
                    }
                }
            }
        });
        
        // Check if any vitals are visible
        const visibleVitals = document.querySelectorAll('[data-vital-id]');
        let anyVisible = false;
        visibleVitals.forEach(vital => {
            const parentCol = vital.closest('.col-md-6, .col-xl-4');
            if (parentCol && parentCol.style.display !== 'none') {
                anyVisible = true;
            }
        });
        
        // If no vitals are visible, show a message
        if (!anyVisible) {
            const vitalsContainer = document.querySelector('.section-card .row.g-3');
            if (vitalsContainer) {
                vitalsContainer.innerHTML = `
                    <div class="col-12">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-heart-pulse fs-1 mb-3 d-block"></i>
                            <p class="mb-3">No vitals selected for tracking</p>
                            <a href="vitals.html" class="btn btn-primary">
                                <i class="bi bi-gear me-2"></i>Configure Vitals
                            </a>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error applying vital preferences:', error);
        // If there's an error, just show all vitals
    }
}

// ==================== Start Application ====================
// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
