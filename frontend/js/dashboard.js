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

        // Update profile section from the same endpoint used by settings page.
        const profilePayload = await loadDashboardProfile(userData);
        updateProfileSection(profilePayload);
        
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
        document.getElementById('profileGender').style.display = '';
        document.getElementById('profileGender').textContent = 
            userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1);
    } else {
        document.getElementById('profileGender').textContent = 'Not provided';
    }
    
    // Update blood type
    if (userData.blood_type) {
        document.getElementById('profileBlood').style.display = '';
        document.getElementById('profileBlood').textContent = userData.blood_type;
    } else {
        document.getElementById('profileBlood').textContent = 'Not provided';
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
    if (typeof userData.emergency_contact === 'object' && userData.emergency_contact !== null) {
        const emergencyName = userData.emergency_contact.name || '';
        const emergencyPhone = userData.emergency_contact.phone || '';
        const emergencyRelationship = userData.emergency_contact.relationship || '';
        const parts = [emergencyName, emergencyRelationship, emergencyPhone].filter(Boolean);
        document.getElementById('profileEmergency').textContent = parts.join(' - ') || 'Not provided';
    } else {
        document.getElementById('profileEmergency').textContent = userData.emergency_contact || 'Not provided';
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
                            
                            // Update status badge if there's a threshold
                            const thresholds = {
                                'oxygen': { low: 90, normal: 95, high: 100 },
                                'temp': { low: 97, normal: 98.6, high: 99.5 },
                                'steps': { low: 5000, normal: 10000, high: 15000 },
                                'respRate': { low: 12, normal: 20, high: 25 },
                                'hydration': { low: 1.5, normal: 2.5, high: 4 }
                            };
                            
                            if (thresholds[vital.id]) {
                                const t = thresholds[vital.id];
                                updateVitalStatus(vital.id, value, t.low, t.normal, t.high);
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
        updateVitalStatus('bloodSugar', value, 70, 100, 140);
    }
    
    // Update heart rate
    if (latestMetrics.heart_rate) {
        const value = Math.round(latestMetrics.heart_rate.value);
        setVitalText('heartRateValue', value);
        updateVitalStatus('heartRate', value, 60, 100, 110);
    }
    
    // Update steps
    if (latestMetrics.steps) {
        const value = Math.round(latestMetrics.steps.value);
        setVitalText('stepsValue', value.toLocaleString());
        updateVitalStatus('steps', value, 5000, 10000, 15000);
    }
    
    // Update sleep hours
    if (latestMetrics.sleep_hours) {
        const value = latestMetrics.sleep_hours.value.toFixed(1);
        setVitalText('sleepValue', value);
        updateVitalStatus('sleep', value, 6, 7, 9);
    }
    
    // Update blood pressure
    if (latestMetrics.blood_pressure_systolic && latestMetrics.blood_pressure_diastolic) {
        const systolic = Math.round(latestMetrics.blood_pressure_systolic.value);
        const diastolic = Math.round(latestMetrics.blood_pressure_diastolic.value);
        setVitalText('bpValue', `${systolic}/${diastolic}`);
        updateVitalStatus('bp', systolic, 90, 120, 140);
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
        updateVitalStatus('oxygen', value, 90, 95, 100);
    }
    
    // Update body temperature
    if (latestMetrics.body_temperature) {
        const value = latestMetrics.body_temperature.value.toFixed(1);
        setVitalText('tempValue', value);
        updateVitalStatus('temp', value, 97, 98.6, 99.5);
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
        updateVitalStatus('respRate', value, 12, 20, 25);
    }
    
    // Update hydration
    if (latestMetrics.hydration) {
        const value = latestMetrics.hydration.value.toFixed(1);
        setVitalText('hydrationValue', value);
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
        updateVitalStatus('bp', systolicValue, 90, 120, 140);
        
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
    }
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('vitalInputModal'));
    modal.hide();
    
    // Show success message
    showSuccessMessage(`${window.currentVitalData.name} updated successfully!`);
    
    // Reload dashboard data
    setTimeout(async () => {
        await loadDashboardData();
        const gamificationSummary = await loadGamification();
        await loadDashboardAchievements(gamificationSummary);
    }, 1000);
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

// ==================== Load Gamification ====================
async function loadGamification() {
    const endpoint = CONFIG?.ENDPOINTS?.PATIENT_GAMIFICATION || '/patients/me/gamification';

    try {
        const response = await fetch(getApiUrl(endpoint), {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to load gamification summary');
        }

        const summary = await response.json();
        renderGamification(summary);
        return summary;
    } catch (error) {
        console.error('Error loading gamification:', error);
        renderGamification(null, true);
        return null;
    }
}

// ==================== Render Gamification ====================
function renderGamification(summary, isError = false) {
    const points = summary?.points || {};
    const totalPointsRaw = Number(points.total_points);
    const levelRaw = Number(points.level);
    const rankRaw = Number(points.rank);
    const streakRaw = Number(summary?.current_streak);
    const badgesEarnedRaw = Number(summary?.badges_earned);
    const totalBadgesRaw = Number(summary?.total_badges_available);

    const totalPoints = Number.isFinite(totalPointsRaw) ? totalPointsRaw : 0;
    const level = Number.isFinite(levelRaw) && levelRaw > 0 ? levelRaw : 1;
    const rank = Number.isFinite(rankRaw) && rankRaw > 0 ? `#${rankRaw}` : '-';
    const streak = Number.isFinite(streakRaw) && streakRaw >= 0 ? streakRaw : 0;
    const badgesEarned = Number.isFinite(badgesEarnedRaw) && badgesEarnedRaw >= 0 ? badgesEarnedRaw : 0;
    const totalBadges = Number.isFinite(totalBadgesRaw) && totalBadgesRaw >= 0 ? totalBadgesRaw : 0;

    setGamificationText('gamificationPointsValue', totalPoints.toLocaleString());
    setGamificationText('gamificationLevelValue', String(level));
    setGamificationText('gamificationRankValue', rank);
    setGamificationText('gamificationStreakValue', `${streak} day${streak === 1 ? '' : 's'}`);
    setGamificationText('badgeProgressPill', `${badgesEarned} / ${totalBadges} badges`);

    const badgesContainer = document.getElementById('recentBadgesList');
    if (!badgesContainer) {
        return;
    }

    if (isError) {
        badgesContainer.innerHTML = '<div class="gamification-empty">Unable to load badges right now.</div>';
        return;
    }

    const badges = Array.isArray(summary?.badges) ? summary.badges.slice(0, 6) : [];
    if (!badges.length) {
        badgesContainer.innerHTML = '<div class="gamification-empty">No badges yet. Keep tracking to earn your first badge.</div>';
        return;
    }

    badgesContainer.innerHTML = badges.map((badge) => {
        const icon = escapeHtml(String(badge?.icon || '🏅'));
        const name = escapeHtml(String(badge?.name || 'Badge'));
        const dateLabel = escapeHtml(formatBadgeDate(badge?.date_awarded));

        return `
            <article class="gamification-badge">
                <div class="gamification-badge__icon">${icon}</div>
                <div>
                    <div class="gamification-badge__title">${name}</div>
                    <div class="gamification-badge__date">${dateLabel}</div>
                </div>
            </article>
        `;
    }).join('');
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
            const derived = deriveAchievementsFromBadges(gamificationSummary?.badges || []);
            renderDashboardAchievements(derived, { derived: true });
            return derived;
        }

        renderDashboardAchievements(list);
        return list;
    } catch (error) {
        console.error('Error loading achievements:', error);
        const derived = deriveAchievementsFromBadges(gamificationSummary?.badges || []);

        if (derived.length) {
            renderDashboardAchievements(derived, { derived: true });
            return derived;
        }

        renderDashboardAchievements([], { error: true });
        return [];
    }
}

function deriveAchievementsFromBadges(badges) {
    if (!Array.isArray(badges) || !badges.length) {
        return [];
    }

    return badges.slice(0, 4).map((badge) => ({
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
                <div class="gamification-achievement__title">${title}</div>
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
