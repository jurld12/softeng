// ==================== Authentication Check ====================
function checkAuthentication() {
    if (typeof ensureAuthenticated === 'function') {
        return ensureAuthenticated({
            requiredRole: 'patient',
            allowMissingRole: true
        });
    }

    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

    const isExpired = typeof isAccessTokenExpired === 'function'
        ? isAccessTokenExpired(token)
        : false;
    const isInactive = typeof isSessionInactive === 'function'
        ? isSessionInactive()
        : false;
    
    if (!token || isExpired || isInactive) {
        console.log('No token found, redirecting to login');
        if (typeof clearAuthState === 'function') {
            clearAuthState();
        }
        window.location.href = 'login-v2.html';
        return false;
    }
    
    if (role && role !== 'patient') {
        console.log('User is not a patient, redirecting');
        window.location.href = 'login-v2.html';
        return false;
    }
    
    return true;
}

// ==================== Logout Function ====================
window.logout = async function() {
    if (typeof performLogout === 'function') {
        await performLogout();
        return;
    }

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
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
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

        // Update profile section from the same endpoint used by settings page.
        const profilePayload = await loadDashboardProfile(userData);
        updateProfileSection(profilePayload);
        
        return userData;
    } catch (error) {
        console.error('Error loading user:', error);
        if (error.message === 'Session expired') {
            return null;
        }
        throw error;
    }
}

async function loadDashboardProfile(userData) {
    try {
        const endpoint = CONFIG?.ENDPOINTS?.PATIENT_PROFILE || '/patients/me/profile';
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            return userData;
        }

        const data = await response.json();
        const profile = data.profile || {};

        return {
            name: data.name || userData.name,
            email: data.email || userData.email,
            phone: data.phone || userData.phone,
            date_of_birth: profile.date_of_birth || userData.date_of_birth,
            gender: profile.gender || userData.gender,
            blood_type: profile.blood_type || userData.blood_type,
            height: profile.height || userData.height,
            weight: profile.weight || userData.weight,
            address: profile.address || userData.address,
            allergies: Array.isArray(profile.allergies) ? profile.allergies : (userData.allergies || []),
            emergency_contact: profile.emergency_contact || userData.emergency_contact
        };
    } catch (error) {
        console.error('Error loading dashboard profile:', error);
        return userData;
    }
}

// Vital status determination uses resolveSharedVitalStatusLevel() from config.js

// ==================== Update Profile Section ====================
function updateProfileSection(userData) {
    const profile = userData || {};
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };

    const toNumber = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    setText('profileName', profile.name || 'N/A');

    const avatarName = encodeURIComponent(profile.name || 'User');
    document.querySelectorAll('#sidebarUserAvatar, .profile-avatar').forEach((img) => {
        const size = Number(img.getAttribute('width')) || img.clientWidth || 80;
        img.src = `https://ui-avatars.com/api/?name=${avatarName}&background=7c3aed&color=fff&size=${size}`;
    });

    if (profile.date_of_birth) {
        const dob = new Date(profile.date_of_birth);
        if (!Number.isNaN(dob.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const birthdayPassed =
                today.getMonth() > dob.getMonth()
                || (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
            if (!birthdayPassed) {
                age -= 1;
            }

            setText('profileAge', `${Math.max(0, age)} years`);
            setText('profileDOB', dob.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }));
        } else {
            setText('profileAge', 'N/A');
            setText('profileDOB', 'Not provided');
        }
    } else {
        setText('profileAge', 'N/A');
        setText('profileDOB', 'Not provided');
    }

    const gender = String(profile.gender || '').trim();
    setText('profileGender', gender ? `${gender.charAt(0).toUpperCase()}${gender.slice(1)}` : 'Not provided');

    setText('profileBlood', profile.blood_type || 'Not provided');

    const height = toNumber(profile.height);
    const weight = toNumber(profile.weight);
    setText('profileHeight', Number.isFinite(height) ? `${height} cm` : 'Not provided');
    setText('profileWeight', Number.isFinite(weight) ? `${weight} kg` : 'Not provided');

    setText('profilePhone', profile.phone || 'Not provided');
    setText('profileEmail', profile.email || 'N/A');
    setText('profileAddress', profile.address || 'Not provided');

    const allergiesList = document.getElementById('allergiesList');
    if (allergiesList) {
        const allergies = Array.isArray(profile.allergies)
            ? profile.allergies
            : (typeof profile.allergies === 'string' && profile.allergies.trim() ? [profile.allergies.trim()] : []);

        if (allergies.length > 0) {
            allergiesList.innerHTML = allergies.map((allergy) =>
                `<span class="badge" style="background: #fee; color: #c33;">${escapeHtml(String(allergy))}</span>`
            ).join('');
        } else {
            allergiesList.innerHTML = '<span class="text-muted small">No known allergies</span>';
        }
    }

    if (typeof profile.emergency_contact === 'object' && profile.emergency_contact !== null) {
        const emergencyName = profile.emergency_contact.name || '';
        const emergencyPhone = profile.emergency_contact.phone || '';
        const emergencyRelationship = profile.emergency_contact.relationship || '';
        const parts = [emergencyName, emergencyRelationship, emergencyPhone].filter(Boolean);
        setText('profileEmergency', parts.join(' - ') || 'Not provided');
    } else {
        setText('profileEmergency', profile.emergency_contact || 'Not provided');
    }
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
        
        // Update vitals from dashboard
        updateVitals(dashboardData.latest_metrics);
        
        // Load missing vitals from biometric endpoint
        await loadCurrentVitals();
        
        return dashboardData;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data. Using demo data.');
        return null;
    }
}

// ==================== Load Current Vitals ====================
// Fetch vitals from biometric endpoint (matches vitals.js pattern)
async function loadCurrentVitals() {
    const vitalMetrics = [
        { id: 'oxygen', metric: 'blood_oxygen', element: 'oxygenValue' },
        { id: 'temp', metric: 'body_temperature', element: 'tempValue' },
        { id: 'weight', metric: 'weight', element: 'weightValue' },
        { id: 'steps', metric: 'steps', element: 'stepsValue' },
        { id: 'calories', metric: 'calories', element: 'caloriesValue' },
        { id: 'respRate', metric: 'respiratory_rate', element: 'respRateValue' },
        { id: 'hydration', metric: 'hydration', element: 'hydrationValue' }
    ];
    
    try {
        for (const vital of vitalMetrics) {
            try {
                const response = await fetch(`${getApiUrl('/patients/me/biometrics')}?metric=${vital.metric}&limit=1`, {
                    headers: getAuthHeaders()
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const value = data[0].value;
                        const element = document.getElementById(vital.element);
                        if (element) {
                            // Format value based on vital type
                            if (vital.id === 'weight') {
                                element.textContent = parseFloat(value).toFixed(1);
                            } else if (vital.id === 'temp') {
                                element.textContent = parseFloat(value).toFixed(1);
                            } else if (vital.id === 'hydration') {
                                element.textContent = parseFloat(value).toFixed(1);
                            } else if (vital.id === 'steps') {
                                element.textContent = Math.round(value).toLocaleString();
                            } else if (vital.id === 'calories') {
                                element.textContent = Math.round(value).toLocaleString();
                            } else {
                                element.textContent = Math.round(value);
                            }

                            if (['oxygen', 'temp', 'steps', 'respRate', 'hydration'].includes(vital.id)) {
                                updateVitalStatus(vital.id, value);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error loading ${vital.metric}:`, error);
            }
        }
    } catch (error) {
        console.error('Error loading current vitals:', error);
    }
}

// ==================== Update Vitals Display ====================
function updateVitals(latestMetrics) {
    if (!latestMetrics) return;

    const setVitalText = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (!element) {
            return false;
        }
        element.textContent = value;
        return true;
    };
    
    // Update blood glucose / blood sugar
    if (latestMetrics.blood_glucose) {
        const value = Math.round(latestMetrics.blood_glucose.value);
        setVitalText('bloodSugarValue', value);
        updateVitalStatus('bloodSugar', value);
    }
    
    // Update heart rate
    if (latestMetrics.heart_rate) {
        const value = Math.round(latestMetrics.heart_rate.value);
        setVitalText('heartRateValue', value);
        updateVitalStatus('heartRate', value);
    }
    
    // Update steps
    if (latestMetrics.steps) {
        const value = Math.round(latestMetrics.steps.value);
        setVitalText('stepsValue', value.toLocaleString());
        updateVitalStatus('steps', value);
    }
    
    // Update sleep hours
    if (latestMetrics.sleep_hours) {
        const value = latestMetrics.sleep_hours.value.toFixed(1);
        setVitalText('sleepValue', value);
        updateVitalStatus('sleep', value);
    }
    
    // Update blood pressure
    if (latestMetrics.blood_pressure_systolic && latestMetrics.blood_pressure_diastolic) {
        const systolic = Math.round(latestMetrics.blood_pressure_systolic.value);
        const diastolic = Math.round(latestMetrics.blood_pressure_diastolic.value);
        setVitalText('bpValue', `${systolic}/${diastolic}`);
        updateVitalStatus('bp', systolic, diastolic);
    }
    
    // Update calories
    if (latestMetrics.calories) {
        const value = Math.round(latestMetrics.calories.value);
        setVitalText('caloriesValue', value.toLocaleString());
    }
    
    // Update blood oxygen
    if (latestMetrics.blood_oxygen) {
        const value = Math.round(latestMetrics.blood_oxygen.value);
        setVitalText('oxygenValue', value);
        updateVitalStatus('oxygen', value);
    }
    
    // Update body temperature
    if (latestMetrics.body_temperature) {
        const value = latestMetrics.body_temperature.value.toFixed(1);
        setVitalText('tempValue', value);
        updateVitalStatus('temp', value);
    }
    
    // Update weight
    if (latestMetrics.weight) {
        const value = latestMetrics.weight.value.toFixed(1);
        setVitalText('weightValue', value);
    }
    
    // Update respiratory rate
    if (latestMetrics.respiratory_rate) {
        const value = Math.round(latestMetrics.respiratory_rate.value);
        setVitalText('respRateValue', value);
        updateVitalStatus('respRate', value);
    }
    
    // Update hydration
    if (latestMetrics.hydration) {
        const value = latestMetrics.hydration.value.toFixed(1);
        setVitalText('hydrationValue', value);
        updateVitalStatus('hydration', value);
    }
}

// ==================== Update Vital Status Badge ====================
function updateVitalStatus(vitalId, value, secondaryValue = null) {
    const vitalCard = document.querySelector(`[data-vital-id="${vitalId}"]`);
    if (!vitalCard) return;
    
    const statusBadge = vitalCard.querySelector('.vital-status');
    if (!statusBadge) return;
    
    // Remove all status classes
    vitalCard.classList.remove('vital-card-normal', 'vital-card-attention', 'vital-card-critical');
    statusBadge.classList.remove('badge-normal', 'badge-attention', 'badge-critical', 'bg-secondary');

    const numericValue = Number(value);
    const secondaryNumericValue = Number(secondaryValue);
    const isMissingValue = !Number.isFinite(numericValue) || (vitalId === 'bp' && !Number.isFinite(secondaryNumericValue));

    if (isMissingValue) {
        statusBadge.classList.add('bg-secondary');
        statusBadge.textContent = 'No Data';
        return;
    }

    // Use shared resolver from config.js
    const statusLevel = resolveSharedVitalStatusLevel(vitalId, numericValue, secondaryNumericValue);

    const cardClass = `vital-card-${statusLevel}`;
    const badgeClass = `badge-${statusLevel}`;
    const label = statusLevel.charAt(0).toUpperCase() + statusLevel.slice(1);

    if (['normal', 'attention', 'critical'].includes(statusLevel)) {
        vitalCard.classList.add(cardClass);
        statusBadge.classList.add(badgeClass);
    } else {
        statusBadge.classList.add('bg-secondary');
    }
    statusBadge.textContent = label;
}

function parseApiErrorMessage(payload, fallback = 'Failed to save data') {
    if (!payload) {
        return fallback;
    }

    if (typeof payload === 'string') {
        return payload;
    }

    if (typeof payload === 'object') {
        if (typeof payload.detail === 'string') {
            return payload.detail;
        }

        if (Array.isArray(payload.detail)) {
            const detailMessages = payload.detail
                .map((item) => {
                    if (typeof item === 'string') {
                        return item;
                    }

                    if (item && typeof item === 'object') {
                        return item.msg || item.message || item.detail || '';
                    }

                    return '';
                })
                .filter((message) => message);

            if (detailMessages.length > 0) {
                return detailMessages.join('; ');
            }
        }

        if (typeof payload.message === 'string') {
            return payload.message;
        }

        if (typeof payload.error === 'string') {
            return payload.error;
        }
    }

    return fallback;
}

// ==================== Save Vital Data ====================
window.saveVitalData = async function() {
    const modalElement = document.getElementById('vitalInputModal');
    const saveButton = document.getElementById('saveVitalBtn');
    const originalSaveButtonContent = saveButton ? saveButton.innerHTML : '';

    if (saveButton) {
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
    }

    try {
    const timestamp = document.getElementById('vitalTimestamp').value;
    let value;
    let metric;
    
    // Get the current vital data from modal
    if (!window.currentVitalData) {
        showError('No vital data selected');
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
        'respRate': 'respiratory_rate',
        'hydration': 'hydration'
    };
    
    metric = metricMap[vitalId];
    
    if (window.currentVitalData.format === 'systolic/diastolic') {
        const systolic = document.getElementById('systolicValue').value;
        const diastolic = document.getElementById('diastolicValue').value;
        
        if (!systolic || !diastolic) {
            showError('Please enter both systolic and diastolic values');
            return;
        }

        const systolicValue = parseFloat(systolic);
        const diastolicValue = parseFloat(diastolic);

        if (Number.isNaN(systolicValue) || Number.isNaN(diastolicValue)) {
            showError('Please enter valid blood pressure values.');
            return;
        }

        if (systolicValue < 0 || diastolicValue < 0) {
            showError('Blood Pressure values must be 0 or greater.');
            return;
        }
        
        // Save systolic
        await saveBiometricEntry('blood_pressure_systolic', systolicValue, timestamp);
        // Save diastolic
        await saveBiometricEntry('blood_pressure_diastolic', diastolicValue, timestamp);
        
        // Update display
        document.getElementById('bpValue').textContent = `${systolic}/${diastolic}`;
        updateVitalStatus('bp', systolicValue, diastolicValue);
        
    } else {
        value = document.getElementById('vitalValue').value;
        
        if (!value) {
            showError('Please enter a value');
            return;
        }
        
        if (!metric) {
            showError('Unknown vital type');
            return;
        }

        const numericValue = parseFloat(value);
        if (Number.isNaN(numericValue)) {
            showError('Please enter a valid number.');
            return;
        }

        if (numericValue < 0) {
            showError(`${window.currentVitalData.name} must be 0 or greater.`);
            return;
        }

        if (vitalId === 'oxygen' && numericValue > 100) {
            showError('Blood Oxygen must be between 0 and 100%.');
            return;
        }

        if (vitalId === 'steps' && numericValue > 100000) {
            showError('Daily Steps must be 100,000 or less.');
            return;
        }
        
        await saveBiometricEntry(metric, numericValue, timestamp);
        
        // Update display
        const displayValue = ['steps', 'calories'].includes(metric) 
            ? Math.round(numericValue).toLocaleString() 
            : Math.round(numericValue);
        document.getElementById(`${vitalId}Value`).textContent = displayValue;

        updateVitalStatus(vitalId, numericValue);
    }
    
    // Close modal (force fallback if Bootstrap instance is missing/stuck)
    closeVitalInputModal(modalElement);
    
    // Show success message
    showSuccessMessage(`${window.currentVitalData.name} updated successfully!`);

    // Refresh all dashboard widgets after successful save.
    await refreshDashboardRealtimeData({ force: true });
    } catch (error) {
        console.error('Error saving vital data:', error);
    } finally {
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.innerHTML = originalSaveButtonContent;
        }
    }
};

function closeVitalInputModal(modalElement = document.getElementById('vitalInputModal')) {
    if (!modalElement) {
        return;
    }

    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();

    // Fallback cleanup for occasional stuck backdrop/modal state.
    window.setTimeout(() => {
        if (!modalElement.classList.contains('show')) {
            return;
        }

        modalElement.classList.remove('show');
        modalElement.style.display = 'none';
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.removeAttribute('aria-modal');

        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        document.querySelectorAll('.modal-backdrop').forEach((backdrop) => backdrop.remove());
    }, 300);
}

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

        const responseData = await response.json().catch(() => null);
        
        if (!response.ok) {
            throw new Error(parseApiErrorMessage(responseData, 'Failed to save data'));
        }
        
        return responseData;
    } catch (error) {
        console.error('Error saving biometric:', error);
        const userMessage = parseApiErrorMessage(error, 'Failed to save data');
        showError(`Failed to save data: ${userMessage}`);
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

    const vitalValueInput = document.getElementById('vitalValue');
    const systolicInput = document.getElementById('systolicValue');
    const diastolicInput = document.getElementById('diastolicValue');

    // Reset numeric constraints before applying vital-specific rules
    vitalValueInput.removeAttribute('max');
    vitalValueInput.min = '0';
    systolicInput.min = '0';
    diastolicInput.min = '0';

    if (vitalId === 'oxygen') {
        vitalValueInput.max = '100';
    } else if (vitalId === 'steps') {
        vitalValueInput.max = '100000';
    }
    
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
        'bloodSugar': 'Target range: 70-130 mg/dL',
        'heartRate': 'Normal range: 60-100 bpm',
        'steps': 'Recommended: 10,000 steps per day',
        'sleep': 'Recommended: 7-9 hours',
        'bp': 'Normal: <120/80 mmHg',
        'oxygen': 'Normal range: 95-100%',
        'temp': 'Normal range: 97-99°F',
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

let dashboardGamificationBadgeStates = [];
let dashboardGamificationBiometricStats = createEmptyDashboardBiometricStats();
const DASHBOARD_REALTIME_REFRESH_MS = 30000;
let dashboardRealtimeRefreshTimer = null;
let dashboardRealtimeRefreshInFlight = false;
let dashboardRealtimeListenersBound = false;

const DASHBOARD_BADGE_ART_THEMES = {
    first_entry: { start: '#2563eb', end: '#06b6d4', rim: '#f59e0b', symbol: '🎯' },
    week_streak: { start: '#f97316', end: '#ef4444', rim: '#facc15', symbol: '🔥' },
    month_streak: { start: '#0f766e', end: '#22c55e', rim: '#eab308', symbol: '🏆' },
    consistent_tracker: { start: '#0284c7', end: '#14b8a6', rim: '#22d3ee', symbol: '📊' },
    data_master: { start: '#4338ca', end: '#7c3aed', rim: '#f59e0b', symbol: '⭐' },
    heart_health: { start: '#ec4899', end: '#ef4444', rim: '#fda4af', symbol: '❤️' },
    step_crusher: { start: '#16a34a', end: '#0ea5e9', rim: '#fde047', symbol: '👟' },
    sleep_champion: { start: '#4f46e5', end: '#6366f1', rim: '#a78bfa', symbol: '😴' },
    wellness_warrior: { start: '#059669', end: '#14b8a6', rim: '#facc15', symbol: '💪' },
    default: { start: '#334155', end: '#0ea5e9', rim: '#cbd5e1', symbol: '🏅' }
};

const DASHBOARD_BADGE_ART_CACHE = {};

const DASHBOARD_BADGE_LIBRARY = [
    {
        id: 'first_entry',
        name: 'First Steps',
        description: 'Logged your first health data entry',
        icon: '🎯',
        points: 10,
        criteria: { type: 'entries', target: 1, unit: 'entries' }
    },
    {
        id: 'week_streak',
        name: 'Week Warrior',
        description: 'Logged data for 7 consecutive days',
        icon: '🔥',
        points: 50,
        criteria: { type: 'streak', target: 7, unit: 'streak days' }
    },
    {
        id: 'month_streak',
        name: 'Monthly Champion',
        description: 'Logged data for 30 consecutive days',
        icon: '🏆',
        points: 200,
        criteria: { type: 'streak', target: 30, unit: 'streak days' }
    },
    {
        id: 'consistent_tracker',
        name: 'Consistent Tracker',
        description: 'Logged 50 total entries',
        icon: '📊',
        points: 100,
        criteria: { type: 'entries', target: 50, unit: 'entries' }
    },
    {
        id: 'data_master',
        name: 'Data Master',
        description: 'Logged 100 total entries',
        icon: '⭐',
        points: 250,
        criteria: { type: 'entries', target: 100, unit: 'entries' }
    },
    {
        id: 'heart_health',
        name: 'Heart Health Guardian',
        description: 'Logged heart rate 20 times',
        icon: '❤️',
        points: 75,
        criteria: { type: 'metric_count', metric: 'heart_rate', target: 20, unit: 'heart logs' }
    },
    {
        id: 'step_crusher',
        name: 'Step Crusher',
        description: 'Logged 10,000+ steps in a single day',
        icon: '👟',
        points: 50,
        criteria: { type: 'metric_peak', metric: 'steps', target: 10000, unit: 'steps peak' }
    },
    {
        id: 'sleep_champion',
        name: 'Sleep Champion',
        description: 'Logged 8+ hours of sleep',
        icon: '😴',
        points: 30,
        criteria: { type: 'metric_peak', metric: 'sleep_hours', target: 8, unit: 'hours peak' }
    },
    {
        id: 'wellness_warrior',
        name: 'Wellness Warrior',
        description: 'Logged all metric types at least once',
        icon: '💪',
        points: 100,
        criteria: {
            type: 'metric_coverage',
            metrics: ['heart_rate', 'steps', 'calories', 'blood_glucose', 'sleep_hours'],
            target: 5,
            unit: 'metric types'
        }
    }
];

// ==================== Load Gamification ====================
async function loadGamification() {
    const endpoint = CONFIG?.ENDPOINTS?.PATIENT_GAMIFICATION || '/patients/me/gamification';

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                return null;
            }
            throw new Error('Failed to load gamification summary');
        }

        const summary = await response.json();
        dashboardGamificationBiometricStats = await loadDashboardBiometricStats();
        dashboardGamificationBadgeStates = buildDashboardBadgeStates(summary, dashboardGamificationBiometricStats);

        renderGamification(summary, {
            isError: false,
            badgeStates: dashboardGamificationBadgeStates
        });
        return summary;
    } catch (error) {
        console.error('Error loading gamification:', error);
        dashboardGamificationBadgeStates = [];
        dashboardGamificationBiometricStats = createEmptyDashboardBiometricStats();
        renderGamification(null, { isError: true, badgeStates: [] });
        return null;
    }
}

// ==================== Render Gamification ====================
function renderGamification(summary, options = {}) {
    const isError = typeof options === 'boolean' ? options : Boolean(options?.isError);
    const badgeStates = typeof options === 'object' && Array.isArray(options.badgeStates)
        ? options.badgeStates
        : dashboardGamificationBadgeStates;

    const points = summary?.points || {};
    const totalPoints = toDashboardSafeNumber(points.total_points);
    const level = toDashboardSafeNumber(points.level, 1, 1);
    const rank = Number.isFinite(Number(points.rank)) && Number(points.rank) > 0 ? `#${Number(points.rank)}` : '-';
    const streak = toDashboardSafeNumber(summary?.current_streak);
    const badgesEarned = toDashboardSafeNumber(summary?.badges_earned);
    const totalBadges = toDashboardSafeNumber(summary?.total_badges_available);

    setGamificationText('gamificationPointsValue', totalPoints.toLocaleString());
    setGamificationText('gamificationLevelValue', String(level));
    setGamificationText('gamificationRankValue', rank);
    setGamificationText('gamificationStreakValue', `${streak} day${streak === 1 ? '' : 's'}`);
    setGamificationText('badgeProgressPill', `${badgesEarned} / ${totalBadges} badges unlocked`);

    renderGamificationProgressInsights(summary, badgeStates, isError);

    const badgesContainer = document.getElementById('recentBadgesList');
    if (!badgesContainer) {
        return;
    }

    if (isError) {
        badgesContainer.innerHTML = '<div class="gamification-empty">Unable to load badges right now.</div>';
        return;
    }

    const badges = Array.isArray(badgeStates) ? badgeStates.slice(0, 6) : [];
    if (!badges.length) {
        badgesContainer.innerHTML = '<div class="gamification-empty">No badges yet. Keep tracking to earn your first badge.</div>';
        return;
    }

    badgesContainer.innerHTML = badges.map((badge) => {
        const progressPercent = Math.round(clampDashboardValue((badge?.progress?.ratio || 0) * 100, 0, 100));
        const unlocked = Boolean(badge?.unlocked);
        const unlockedClass = unlocked ? 'is-unlocked' : 'is-locked';
        const name = escapeHtml(String(badge?.name || 'Badge'));
        const description = escapeHtml(String(badge?.progress?.detail || badge?.description || 'Track progress to unlock this badge.'));
        const caption = unlocked
            ? escapeHtml(formatBadgeDate(badge?.date_awarded))
            : escapeHtml(String(badge?.progress?.label || 'In progress'));
        const artSrc = badge?.artSrc || getDashboardBadgeArtDataUri(badge?.id, badge?.icon);
        const statusIcon = unlocked ? 'bi-check-lg' : 'bi-lock-fill';
        const statusClass = unlocked ? 'is-unlocked' : '';
        const pieClass = unlocked
            ? 'pie-ring pie-ring-xs pie-ring-success badge-gallery-pie'
            : 'pie-ring pie-ring-xs badge-gallery-pie';

        return `
            <article class="badge-gallery-item ${unlockedClass}" title="${description}">
                <div class="badge-gallery-thumb">
                    <img src="${artSrc}" alt="${name} badge icon" class="badge-gallery-art" loading="lazy">
                    <span class="badge-gallery-lock ${statusClass}"><i class="bi ${statusIcon}"></i></span>
                </div>
                <div class="badge-gallery-name">${name}</div>
                <div class="badge-gallery-caption">${caption}</div>
                <div class="${pieClass}" style="--progress: ${progressPercent}%;">
                    <span>${progressPercent}%</span>
                </div>
            </article>
        `;
    }).join('');
}

function renderGamificationProgressInsights(summary, badgeStates, isError = false) {
    if (!summary || isError) {
        setGamificationText('gamificationLevelTrackTitle', 'Level progress unavailable');
        setGamificationText('gamificationLevelTrackMeta', 'Unable to calculate level progress right now.');
        setDashboardPieProgress('gamificationLevelPieRing', 0, 'gamificationLevelPiePercent');

        setGamificationText('gamificationBadgeTrackTitle', 'Badge progress unavailable');
        setGamificationText('gamificationBadgeTrackMeta', 'Unable to calculate badge progress right now.');
        setGamificationText('gamificationBadgeTrackHint', 'Try refreshing in a moment.');
        setDashboardPieProgress('gamificationBadgePieRing', 0, 'gamificationBadgePiePercent');
        return;
    }

    const totalPoints = toDashboardSafeNumber(summary?.points?.total_points);
    const level = toDashboardSafeNumber(summary?.points?.level, 1, 1);
    const pointsIntoCurrentLevel = totalPoints % 100;
    const pointsNeeded = pointsIntoCurrentLevel === 0 ? 100 : 100 - pointsIntoCurrentLevel;
    const levelProgressPercent = clampDashboardValue((pointsIntoCurrentLevel / 100) * 100, 0, 100);

    setGamificationText('gamificationLevelTrackTitle', `Level ${level} to Level ${level + 1}`);
    setGamificationText('gamificationLevelTrackMeta', `${pointsNeeded} points to next level`);
    setDashboardPieProgress('gamificationLevelPieRing', levelProgressPercent, 'gamificationLevelPiePercent');

    const nextBadge = getDashboardTopLockedBadge(badgeStates);
    if (!nextBadge) {
        setGamificationText('gamificationBadgeTrackTitle', 'All badges unlocked');
        setGamificationText('gamificationBadgeTrackMeta', 'Amazing consistency. You completed every badge.');
        setGamificationText('gamificationBadgeTrackHint', 'Keep your streak alive to stay on top.');
        setDashboardPieProgress('gamificationBadgePieRing', 100, 'gamificationBadgePiePercent');
        return;
    }

    const badgeProgressPercent = Math.round(clampDashboardValue(nextBadge.progress.ratio * 100, 0, 100));
    setGamificationText('gamificationBadgeTrackTitle', `${nextBadge.icon} ${nextBadge.name}`);
    setGamificationText('gamificationBadgeTrackMeta', nextBadge.progress.label);
    setGamificationText('gamificationBadgeTrackHint', nextBadge.progress.detail || nextBadge.description);
    setDashboardPieProgress('gamificationBadgePieRing', badgeProgressPercent, 'gamificationBadgePiePercent');
}

// ==================== Load Dashboard Achievements ====================
async function loadDashboardAchievements(gamificationSummary = null) {
    const endpoint = CONFIG?.ENDPOINTS?.PATIENT_ACHIEVEMENTS || '/patients/me/achievements';

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load achievements');
        }

        const achievements = await response.json();
        const list = Array.isArray(achievements) ? achievements : [];

        if (!list.length) {
            const derived = deriveAchievementsFromBadges(
                dashboardGamificationBadgeStates,
                gamificationSummary?.badges || []
            );
            renderDashboardAchievements(derived, { derived: true });
            return derived;
        }

        renderDashboardAchievements(list);
        return list;
    } catch (error) {
        console.error('Error loading achievements:', error);
        const derived = deriveAchievementsFromBadges(
            dashboardGamificationBadgeStates,
            gamificationSummary?.badges || []
        );

        if (derived.length) {
            renderDashboardAchievements(derived, { derived: true });
            return derived;
        }

        renderDashboardAchievements([], { error: true });
        return [];
    }
}

function deriveAchievementsFromBadges(badgeStates = [], fallbackBadges = []) {
    const unlockedStates = Array.isArray(badgeStates)
        ? badgeStates.filter((badge) => badge?.unlocked).slice(0, 4)
        : [];

    if (unlockedStates.length) {
        return unlockedStates.map((badge) => ({
            title: badge.name,
            description: badge.description,
            points: badge.points,
            date_awarded: badge.date_awarded || null
        }));
    }

    if (!Array.isArray(fallbackBadges) || !fallbackBadges.length) {
        return [];
    }

    return fallbackBadges.slice(0, 4).map((badge) => ({
        title: `Badge unlocked: ${badge?.name || 'Achievement'}`,
        description: badge?.description || 'Unlocked through your health tracking progress.',
        points: null,
        date_awarded: badge?.date_awarded || null
    }));
}

function renderDashboardAchievements(items, options = {}) {
    const container = document.getElementById('dashboardAchievementsList');
    if (!container) {
        return;
    }

    const { error = false, derived = false } = options;
    if (error) {
        container.innerHTML = '<div class="gamification-empty">Unable to load achievements right now.</div>';
        return;
    }

    if (!Array.isArray(items) || !items.length) {
        container.innerHTML = '<div class="gamification-empty">No achievements yet. Keep logging your health data to unlock milestones.</div>';
        return;
    }

    container.innerHTML = items.slice(0, 3).map((item) => {
        const title = escapeHtml(String(item?.title || item?.name || 'Achievement'));
        const description = escapeHtml(String(item?.description || 'Milestone unlocked.'));
        const dateLabel = escapeHtml(formatAchievementDate(item?.date_awarded));
        const pointsRaw = Number(item?.points);
        const pointsLabel = Number.isFinite(pointsRaw)
            ? `+${Math.round(pointsRaw)} pts`
            : (derived ? 'From badge progress' : 'Achievement');

        return `
            <article class="gamification-achievement">
                <div class="gamification-achievement__title-wrap">
                    <span class="gamification-achievement__icon"><i class="bi bi-trophy-fill"></i></span>
                    <span class="gamification-achievement__title">${title}</span>
                </div>
                <div class="gamification-achievement__description">${description}</div>
                <div class="gamification-achievement__meta">
                    <span>${dateLabel}</span>
                    <span class="gamification-achievement__points">${escapeHtml(pointsLabel)}</span>
                </div>
            </article>
        `;
    }).join('');
}

function formatAchievementDate(value) {
    if (!value) {
        return 'Recently unlocked';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Recently unlocked';
    }

    return `Unlocked ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function setGamificationText(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

function formatBadgeDate(value) {
    if (!value) {
        return 'Recently earned';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Recently earned';
    }

    return `Earned ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function createEmptyDashboardBiometricStats() {
    return {
        metricCounts: {},
        metricPeaks: {},
        metricTypes: new Set()
    };
}

async function loadDashboardBiometricStats() {
    const endpoint = '/patients/me/biometrics?limit=1000';
    const fallback = createEmptyDashboardBiometricStats();

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
                return fallback;
            }
            return fallback;
        }

        const entries = await response.json();
        if (!Array.isArray(entries)) {
            return fallback;
        }

        const metricCounts = {};
        const metricPeaks = {};
        const metricTypes = new Set();

        entries.forEach((entry) => {
            const metric = String(entry?.metric || '').toLowerCase();
            if (!metric) {
                return;
            }

            metricTypes.add(metric);
            metricCounts[metric] = (metricCounts[metric] || 0) + 1;

            const numericValue = Number(entry?.value);
            if (Number.isFinite(numericValue)) {
                const previousPeak = Number.isFinite(metricPeaks[metric])
                    ? metricPeaks[metric]
                    : Number.NEGATIVE_INFINITY;
                metricPeaks[metric] = Math.max(previousPeak, numericValue);
            }
        });

        return {
            metricCounts,
            metricPeaks,
            metricTypes
        };
    } catch (error) {
        console.error('Error loading dashboard biometric stats:', error);
        return fallback;
    }
}

function buildDashboardBadgeStates(summary, biometricStats) {
    const earnedBadges = Array.isArray(summary?.badges) ? summary.badges : [];
    const earnedById = new Map();
    const earnedByName = new Map();

    earnedBadges.forEach((badge) => {
        const badgeId = badge?.badge_id ? String(badge.badge_id) : '';
        const badgeName = badge?.name ? String(badge.name).toLowerCase() : '';

        if (badgeId) {
            earnedById.set(badgeId, badge);
        }
        if (badgeName) {
            earnedByName.set(badgeName, badge);
        }
    });

    return DASHBOARD_BADGE_LIBRARY.map((badge) => {
        const earnedBadge = earnedById.get(badge.id) || earnedByName.get(String(badge.name).toLowerCase()) || null;
        const progress = earnedBadge
            ? {
                ratio: 1,
                label: 'Completed',
                detail: formatBadgeDate(earnedBadge?.date_awarded)
            }
            : getDashboardBadgeProgress(badge.criteria, summary, biometricStats);

        return {
            ...badge,
            unlocked: Boolean(earnedBadge),
            date_awarded: earnedBadge?.date_awarded || null,
            artSrc: getDashboardBadgeArtDataUri(badge.id, badge.icon),
            progress
        };
    }).sort((a, b) => {
        if (a.unlocked !== b.unlocked) {
            return Number(b.unlocked) - Number(a.unlocked);
        }
        return b.progress.ratio - a.progress.ratio;
    });
}

function getDashboardBadgeProgress(criteria, summary, biometricStats) {
    if (!criteria || typeof criteria !== 'object') {
        return {
            ratio: 0,
            label: '0%',
            detail: 'Track health data to unlock this badge.'
        };
    }

    const target = Number(criteria.target);
    const current = getDashboardCurrentValueByCriteria(criteria, summary, biometricStats);
    const safeTarget = Number.isFinite(target) && target > 0 ? target : 1;
    const ratio = clampDashboardValue(current / safeTarget, 0, 1);

    return {
        ratio,
        label: getDashboardCriteriaProgressLabel(criteria, current, safeTarget),
        detail: getDashboardCriteriaRemainingLabel(criteria, current, safeTarget)
    };
}

function getDashboardCurrentValueByCriteria(criteria, summary, biometricStats) {
    switch (criteria.type) {
        case 'entries':
            return toDashboardSafeNumber(summary?.total_entries);
        case 'streak':
            return toDashboardSafeNumber(summary?.current_streak);
        case 'metric_count': {
            const metric = String(criteria.metric || '').toLowerCase();
            return toDashboardSafeNumber(biometricStats?.metricCounts?.[metric]);
        }
        case 'metric_peak': {
            const metric = String(criteria.metric || '').toLowerCase();
            return toDashboardSafeNumber(biometricStats?.metricPeaks?.[metric]);
        }
        case 'metric_coverage': {
            const metrics = Array.isArray(criteria.metrics) ? criteria.metrics : [];
            return metrics.reduce((count, metric) => {
                const key = String(metric || '').toLowerCase();
                const hasMetric = toDashboardSafeNumber(biometricStats?.metricCounts?.[key]) > 0;
                return count + (hasMetric ? 1 : 0);
            }, 0);
        }
        default:
            return 0;
    }
}

function getDashboardCriteriaProgressLabel(criteria, current, target) {
    const formattedCurrent = formatDashboardProgressValue(criteria, current);
    const formattedTarget = formatDashboardProgressValue(criteria, target);
    const unit = criteria.unit ? ` ${criteria.unit}` : '';
    return `${formattedCurrent} / ${formattedTarget}${unit}`;
}

function getDashboardCriteriaRemainingLabel(criteria, current, target) {
    const remaining = Math.max(target - current, 0);
    if (remaining <= 0) {
        return 'Ready to unlock on your next sync.';
    }

    if (criteria.type === 'metric_peak' && criteria.metric === 'steps') {
        return `${formatDashboardProgressValue(criteria, remaining)} more steps in one day needed.`;
    }

    if (criteria.type === 'metric_peak' && criteria.metric === 'sleep_hours') {
        return `${formatDashboardProgressValue(criteria, remaining)} more sleep hours needed.`;
    }

    if (criteria.type === 'metric_count') {
        return `${formatDashboardProgressValue(criteria, remaining)} more logs needed.`;
    }

    if (criteria.type === 'metric_coverage') {
        return `${formatDashboardProgressValue(criteria, remaining)} more metric types to log.`;
    }

    const unit = criteria.unit || 'steps';
    return `${formatDashboardProgressValue(criteria, remaining)} more ${unit} needed.`;
}

function getDashboardTopLockedBadge(badgeStates) {
    if (!Array.isArray(badgeStates)) {
        return null;
    }

    return badgeStates
        .filter((badge) => !badge.unlocked)
        .sort((a, b) => b.progress.ratio - a.progress.ratio)[0] || null;
}

function setDashboardPieProgress(elementId, percent, labelId = null) {
    const safePercent = Math.round(clampDashboardValue(percent, 0, 100));
    const element = document.getElementById(elementId);
    if (element) {
        element.style.setProperty('--progress', `${safePercent}%`);
    }

    if (labelId) {
        setGamificationText(labelId, `${safePercent}%`);
    }
}

function toDashboardSafeNumber(value, fallback = 0, minimum = 0) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return fallback;
    }
    return Math.max(minimum, numeric);
}

function clampDashboardValue(value, min, max) {
    if (!Number.isFinite(value)) {
        return min;
    }
    return Math.min(Math.max(value, min), max);
}

function formatDashboardProgressValue(criteria, value) {
    if (criteria.type === 'metric_peak' && criteria.metric === 'sleep_hours') {
        return Number(value).toFixed(1).replace(/\.0$/, '');
    }

    return Math.round(Number(value)).toLocaleString();
}

function getDashboardBadgeArtDataUri(badgeId, fallbackSymbol = '🏅') {
    if (DASHBOARD_BADGE_ART_CACHE[badgeId]) {
        return DASHBOARD_BADGE_ART_CACHE[badgeId];
    }

    const theme = DASHBOARD_BADGE_ART_THEMES[badgeId] || DASHBOARD_BADGE_ART_THEMES.default;
    const symbol = escapeDashboardSvgText(theme.symbol || fallbackSymbol || '🏅');

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="badge icon">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.start}" />
      <stop offset="100%" stop-color="${theme.end}" />
    </linearGradient>
    <linearGradient id="core" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0.9" />
    </linearGradient>
  </defs>
  <path d="M110 8L190 50V170L110 212L30 170V50Z" fill="url(#bg)" />
  <path d="M110 13L185 53V167L110 207L35 167V53Z" fill="none" stroke="${theme.rim}" stroke-width="6" stroke-linejoin="round" />
  <circle cx="110" cy="110" r="65" fill="url(#core)" />
  <circle cx="110" cy="110" r="56" fill="#ffffff" fill-opacity="0.35" />
  <circle cx="78" cy="74" r="10" fill="#ffffff" fill-opacity="0.45" />
  <text x="110" y="128" text-anchor="middle" font-size="66" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif">${symbol}</text>
</svg>
    `.trim();

    const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    DASHBOARD_BADGE_ART_CACHE[badgeId] = uri;
    return uri;
}

function escapeDashboardSvgText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function initializeDashboardThemePicker() {
    const trigger = document.getElementById('dashboardThemeDropdown');
    const options = Array.from(document.querySelectorAll('.dashboard-theme-option'));

    if (!trigger || !window.HealioTheme || !options.length) {
        return;
    }

    const capitalizeTheme = (theme) => {
        const value = String(theme || 'theme');
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const syncActiveOption = (activeTheme) => {
        options.forEach((option) => {
            const isActive = option.getAttribute('data-theme') === activeTheme;
            option.classList.toggle('is-active', isActive);
            option.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    };

    syncActiveOption(window.HealioTheme.getTheme());

    options.forEach((option) => {
        option.addEventListener('click', () => {
            const selectedTheme = option.getAttribute('data-theme');
            const appliedTheme = window.HealioTheme.setTheme(selectedTheme);
            syncActiveOption(appliedTheme);
            showSuccessMessage(`Theme switched to ${capitalizeTheme(appliedTheme)} mode`);
        });
    });

    window.addEventListener('healio:theme-changed', (event) => {
        const activeTheme = event.detail?.theme || window.HealioTheme.getTheme();
        syncActiveOption(activeTheme);
    });
}

// ==================== Utility: Escape HTML ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function refreshDashboardRealtimeData(options = {}) {
    if (dashboardRealtimeRefreshInFlight) {
        return;
    }

    if (!options.force && typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
    }

    dashboardRealtimeRefreshInFlight = true;

    try {
        await loadDashboardData();

        const gamificationSummary = await loadGamification();
        await loadDashboardAchievements(gamificationSummary);

        await Promise.allSettled([
            loadMedications(),
            loadAppointments(),
            typeof window.updateNotificationBadge === 'function'
                ? window.updateNotificationBadge()
                : Promise.resolve()
        ]);
    } catch (error) {
        console.error('Realtime dashboard refresh failed:', error);
    } finally {
        dashboardRealtimeRefreshInFlight = false;
    }
}

function bindDashboardRealtimeListeners() {
    if (dashboardRealtimeListenersBound || typeof window === 'undefined') {
        return;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshDashboardRealtimeData({ force: true });
        }
    });

    window.addEventListener('focus', () => {
        refreshDashboardRealtimeData({ force: true });
    });

    dashboardRealtimeListenersBound = true;
}

function startDashboardRealtimeUpdates() {
    if (dashboardRealtimeRefreshTimer || typeof window === 'undefined') {
        return;
    }

    bindDashboardRealtimeListeners();
    dashboardRealtimeRefreshTimer = window.setInterval(() => {
        refreshDashboardRealtimeData();
    }, DASHBOARD_REALTIME_REFRESH_MS);
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

        initializeDashboardThemePicker();
        
        // Load user data
        await loadCurrentUser();
        
        // Apply vital preferences first (hide unselected vitals)
        applyVitalPreferences();
        
        // Load dashboard data
        await loadDashboardData();

        // Load gamification summary and achievements
        const gamificationSummary = await loadGamification();
        await loadDashboardAchievements(gamificationSummary);
        
        // Load medications (don't let it fail the whole dashboard)
        try {
            await loadMedications();
        } catch (medError) {
            console.error('Medications load failed, but continuing:', medError);
        }
        
        // Load appointments (don't let it fail the whole dashboard)
        try {
            await loadAppointments();
        } catch (apptError) {
            console.error('Appointments load failed, but continuing:', apptError);
            const container = document.getElementById('dashboardAppointmentsList');
            if (container) {
                container.innerHTML = `
                    <div class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                        <p class="mb-0 mt-2">Failed to load appointments</p>
                    </div>
                `;
            }
        }

        startDashboardRealtimeUpdates();
        
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
        
        // Get all vital cards
        const allVitalCards = document.querySelectorAll('[data-vital-id]');
        const vitalElements = [];
        
        // Collect all enabled vital elements
        allVitalCards.forEach(vitalCard => {
            const vitalId = vitalCard.getAttribute('data-vital-id');
            // Check if vital is in preferences; if not in preferences, hide it (don't show by default)
            const isEnabled = preferences.hasOwnProperty(vitalId) ? preferences[vitalId] : false;
            const parentCol = vitalCard.closest('.col-md-6, .col-xl-4');
            
            if (isEnabled && parentCol) {
                // Clone the parent column element
                vitalElements.push(parentCol.cloneNode(true));
            }
        });
        
        // Find the vitals container based on any existing vital card
        const sampleVitalCard = document.querySelector('[data-vital-id]');
        const vitalsContainer = sampleVitalCard ? sampleVitalCard.closest('.row.g-3') : null;
        const toggleVitalsBtn = document.getElementById('toggleVitalsBtn');
        if (!vitalsContainer) return;
        
        // Clear the container
        vitalsContainer.innerHTML = '';
        
        // If no vitals are enabled, show a message
        if (vitalElements.length === 0) {
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
            if (toggleVitalsBtn) {
                toggleVitalsBtn.style.display = 'none';
            }
            return;
        }
        
        // Add enabled vitals to the container
        vitalElements.forEach(element => {
            vitalsContainer.appendChild(element);
        });
        
        // Show the "Show More" button if there are more than 6 vitals
        if (vitalElements.length > 6) {
            // Find or create the additional vitals container
            let additionalVitalsDiv = document.getElementById('additionalVitals');
            if (!additionalVitalsDiv) {
                additionalVitalsDiv = document.createElement('div');
                additionalVitalsDiv.id = 'additionalVitals';
                additionalVitalsDiv.className = 'col-12';
                additionalVitalsDiv.style.display = 'none';
                
                const innerRow = document.createElement('div');
                innerRow.className = 'row g-3';
                additionalVitalsDiv.appendChild(innerRow);
                
                vitalsContainer.appendChild(additionalVitalsDiv);
            }
            
            // Move vitals 7+ into the additional container
            const innerRow = additionalVitalsDiv.querySelector('.row');
            if (innerRow) {
                innerRow.innerHTML = '';
                for (let i = 6; i < vitalElements.length; i++) {
                    innerRow.appendChild(vitalElements[i]);
                }
            }

            if (toggleVitalsBtn) {
                toggleVitalsBtn.style.display = 'inline-flex';
                toggleVitalsBtn.innerHTML = 'Show More <i class="bi bi-chevron-down ms-1"></i>';
            }
        } else if (toggleVitalsBtn) {
            toggleVitalsBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error applying vital preferences:', error);
        // If there's an error, just show all vitals
    }
}

// ==================== Load Appointments ====================
async function loadAppointments() {
    const appointmentsList = document.getElementById('dashboardAppointmentsList');
    if (!appointmentsList) {
        console.error('Appointments list element not found');
        return;
    }
    
    try {
        console.log('Fetching appointments from:', `${API_BASE_URL}/appointments`);
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            headers: getAuthHeaders()
        });
        
        console.log('Appointments response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Appointments API error:', errorText);
            throw new Error('Failed to load appointments');
        }
        
        const data = await response.json();
        console.log('Appointments loaded:', data);
        
        displayAppointments(data.appointments || []);
    } catch (error) {
        console.error('Error loading appointments:', error);
        if (appointmentsList) {
            appointmentsList.innerHTML = `
                <div class="text-center text-muted py-3">
                    <p>Unable to load appointments</p>
                    <a href="appointments.html" class="btn btn-sm btn-primary">Go to Appointments Page</a>
                </div>
            `;
        }
    }
}

// ==================== Display Appointments ====================
function displayAppointments(appointments) {
    const appointmentsList = document.getElementById('dashboardAppointmentsList');
    if (!appointmentsList) return;
    
    // Filter for upcoming appointments only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingAppointments = appointments
        .filter(apt => {
            const aptDate = new Date(apt.date);
            return aptDate >= today && apt.status === 'upcoming';
        })
        .sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        })
        .slice(0, 3); // Show only next 3 appointments
    
    // Display appointments
    if (upcomingAppointments.length === 0) {
        appointmentsList.innerHTML = `
            <div class="text-center text-muted py-3">
                <p>No upcoming appointments</p>
                <a href="appointments.html" class="btn btn-sm btn-primary">
                    <i class="bi bi-plus-lg me-2"></i>Schedule Appointment
                </a>
            </div>
        `;
        return;
    }
    
    // Show up to 3 appointments on dashboard
    appointmentsList.innerHTML = upcomingAppointments.map(apt => {
        const date = new Date(apt.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        
        // Get initials for avatar
        const initials = apt.doctor 
            ? apt.doctor.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : apt.type[0].toUpperCase();
        
        const typeCapitalized = apt.type.charAt(0).toUpperCase() + apt.type.slice(1);
        
        return `
            <div class="appointment-item d-flex align-items-center gap-3">
                <div class="doctor-avatar">${initials}</div>
                <div class="flex-grow-1">
                    <h3 class="h6 mb-1 fw-semibold">${escapeHtml(apt.title)}</h3>
                    <p class="text-muted small mb-0">
                        ${formattedDate} 🕐 ${apt.time}
                        ${apt.doctor ? `• ${escapeHtml(apt.doctor)}` : `• ${typeCapitalized}`}
                    </p>
                </div>
                <a href="appointments.html" class="btn btn-sm btn-light" title="View details">
                    <i class="bi bi-arrow-right"></i>
                </a>
            </div>
        `;
    }).join('');
}

// ==================== Start Application ====================
// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
