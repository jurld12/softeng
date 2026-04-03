// All available vitals with their metadata
const ALL_VITALS = [
    {
        id: 'heartRate',
        name: 'Heart Rate',
        unit: 'bpm',
        icon: 'bi-heart-pulse',
        description: 'Monitor your heart rate',
        apiMetric: 'heart_rate',
        optimalRange: { min: 60, max: 100 },
        color: '#ec4899'
    },
    {
        id: 'bloodSugar',
        name: 'Blood Glucose',
        unit: 'mg/dL',
        icon: 'bi-activity',
        description: 'Track blood sugar levels',
        apiMetric: 'blood_glucose',
        optimalRange: { min: 80, max: 130 },
        color: '#7c3aed'
    },
    {
        id: 'bp',
        name: 'Blood Pressure',
        unit: 'mmHg',
        icon: 'bi-droplet-fill',
        description: 'Monitor blood pressure',
        apiMetric: 'blood_pressure',
        optimalRange: null,
        color: '#3b82f6'
    },
    {
        id: 'oxygen',
        name: 'Blood Oxygen',
        unit: '%',
        icon: 'bi-wind',
        description: 'Track oxygen saturation',
        apiMetric: 'blood_oxygen',
        optimalRange: { min: 95, max: 100 },
        color: '#3b82f6'
    },
    {
        id: 'temp',
        name: 'Body Temperature',
        unit: '°F',
        icon: 'bi-thermometer-half',
        description: 'Monitor body temperature',
        apiMetric: 'body_temperature',
        optimalRange: { min: 97, max: 99 },
        color: '#ef4444'
    },
    {
        id: 'weight',
        name: 'Weight',
        unit: 'kg',
        icon: 'bi-speedometer',
        description: 'Track your weight',
        apiMetric: 'weight',
        optimalRange: null,
        color: '#f59e0b'
    },
    {
        id: 'steps',
        name: 'Steps',
        unit: 'steps',
        icon: 'bi-bar-chart-steps',
        description: 'Daily step count',
        apiMetric: 'steps',
        optimalRange: null,
        color: '#10b981'
    },
    {
        id: 'calories',
        name: 'Calories Burned',
        unit: 'kcal',
        icon: 'bi-fire',
        description: 'Track calories burned',
        apiMetric: 'calories',
        optimalRange: null,
        color: '#f97316'
    },
    {
        id: 'sleep',
        name: 'Sleep Hours',
        unit: 'hours',
        icon: 'bi-moon-stars',
        description: 'Monitor sleep duration',
        apiMetric: 'sleep_hours',
        optimalRange: null,
        color: '#6366f1'
    },
    {
        id: 'respRate',
        name: 'Respiratory Rate',
        unit: 'breaths/min',
        icon: 'bi-lungs',
        description: 'Track breathing rate',
        apiMetric: 'respiratory_rate',
        optimalRange: null,
        color: '#14b8a6'
    },
    {
        id: 'hydration',
        name: 'Hydration',
        unit: 'L',
        icon: 'bi-cup-straw',
        description: 'Daily water intake',
        apiMetric: 'hydration',
        optimalRange: null,
        color: '#06b6d4'
    }
];

// Store for vital charts
let vitalCharts = {};

// Store for vital history data
let vitalHistoryData = {};

// User's vital preferences
let vitalPreferences = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuthentication()) {
        return;
    }

    loadCurrentUser();
    loadVitalPreferences();
});

// Check if user is authenticated
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

// Get auth headers
function getAuthHeaders() {
    const token = typeof getStoredAccessToken === 'function'
        ? getStoredAccessToken()
        : localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Load current user info
async function loadCurrentUser() {
    try {
        const token = typeof getStoredAccessToken === 'function'
            ? getStoredAccessToken()
            : localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
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
        } else if (typeof handleUnauthorizedResponse === 'function' && handleUnauthorizedResponse(response)) {
            return;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Logout function
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

// Load vital preferences
function loadVitalPreferences() {
    try {
        // Try to load from localStorage first
        const stored = localStorage.getItem('healio_vital_preferences');
        if (stored) {
            vitalPreferences = JSON.parse(stored);
        } else {
            // Initialize with all vitals enabled by default
            vitalPreferences = {};
            ALL_VITALS.forEach(vital => {
                vitalPreferences[vital.id] = true;
            });
        }
        
        displayVitals();
    } catch (error) {
        console.error('Error loading preferences:', error);
        // Initialize with all enabled
        vitalPreferences = {};
        ALL_VITALS.forEach(vital => {
            vitalPreferences[vital.id] = true;
        });
        displayVitals();
    }
}

// Display all vitals as expandable cards
function displayVitals() {
    const container = document.getElementById('vitalsContainer');
    
    container.innerHTML = ALL_VITALS.map(vital => {
        const isEnabled = vitalPreferences[vital.id] !== undefined ? vitalPreferences[vital.id] : true;
        return `
        <div class="vital-expandable-card mb-3" data-vital-id="${vital.id}" style="${isEnabled ? 'border-left: 4px solid ' + vital.color : ''}">
            <div class="vital-card-header" onclick="toggleVitalExpansion('${vital.id}')">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-3">
                        <div class="vital-icon">
                            <i class="bi ${vital.icon}" style="font-size: 28px; color: ${vital.color};"></i>
                        </div>
                        <div>
                            <div class="d-flex align-items-center gap-2">
                                <span class="vital-title">${vital.name}</span>
                                <span class="badge badge-normal vital-status" id="status-${vital.id}">Normal</span>
                            </div>
                            <div class="vital-value-inline">
                                <span id="${vital.id}Value">--</span> 
                                <span class="text-muted small">${vital.unit}</span>
                            </div>
                            ${vital.optimalRange ? 
                                `<div class="text-muted small" id="${vital.id}Range">Optimal: ${vital.optimalRange.min}-${vital.optimalRange.max} ${vital.unit}</div>` 
                                : ''}
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="form-check form-switch">
                            <input 
                                class="form-check-input vital-toggle" 
                                type="checkbox" 
                                role="switch" 
                                id="toggle-${vital.id}"
                                data-vital-id="${vital.id}"
                                ${isEnabled ? 'checked' : ''}
                                style="width: 2.5rem; height: 1.25rem; cursor: pointer;"
                                onclick="event.stopPropagation();">
                        </div>
                        <button class="btn btn-link vital-expand-btn">
                            <i class="bi bi-chevron-down"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="vital-card-body collapse" id="vital-details-${vital.id}">
                <hr class="my-3">
                <div class="row">
                    <div class="col-lg-8">
                        <h6 class="mb-3">7-Day Trend</h6>
                        <div style="position: relative; height: 250px;">
                            <canvas id="chart-${vital.id}"></canvas>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <h6 class="mb-3">Add New Reading</h6>
                        ${vital.id === 'bp' ? `
                        <div class="mb-3">
                            <label class="form-label small">Systolic (Upper)</label>
                            <input type="number" class="form-control" id="input-systolic-${vital.id}" placeholder="e.g., 120" min="0">
                        </div>
                        <div class="mb-3">
                            <label class="form-label small">Diastolic (Lower)</label>
                            <input type="number" class="form-control" id="input-diastolic-${vital.id}" placeholder="e.g., 80" min="0">
                        </div>
                        ` : `
                        <div class="mb-3">
                            <label class="form-label small">Value${vital.unit ? ` (${vital.unit})` : ''}</label>
                            <input type="number" class="form-control" id="input-${vital.id}" placeholder="Enter value" min="0" ${vital.id === 'oxygen' ? 'max="100" step="0.1"' : ''} ${vital.id === 'steps' ? 'max="100000" step="1"' : ''}>
                        </div>
                        `}
                        <div class="mb-3">
                            <label class="form-label small">Time (optional)</label>
                            <input type="datetime-local" class="form-control" id="time-${vital.id}">
                        </div>
                        <button class="btn btn-primary w-100 mb-3" onclick="addVitalReading('${vital.id}')">
                            <i class="bi bi-plus-lg me-2"></i>Add Reading
                        </button>
                        <h6 class="mb-2">Recent Readings</h6>
                        <div id="recent-${vital.id}" class="recent-readings-list">
                            <div class="text-muted small">No recent readings</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    // Load latest value for each vital
    ALL_VITALS.forEach(vital => {
        loadLatestVitalValue(vital.id);
    });
    
    // Attach event listeners to toggle switches
    setTimeout(() => {
        document.querySelectorAll('.vital-toggle').forEach(toggle => {
            toggle.addEventListener('change', function(e) {
                const vitalId = this.getAttribute('data-vital-id');
                vitalPreferences[vitalId] = this.checked;
                updateCardAppearance(vitalId, this.checked);
            });
        });
        
        // Attach save button listener
        const saveBtn = document.getElementById('savePreferences');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveVitalPreferences);
        }

        document.querySelectorAll('.vital-card-body input[type="number"]').forEach((input) => {
            input.addEventListener('input', () => clearVitalInputError(input));
        });
    }, 100);
}

// Load latest value for a vital
async function loadLatestVitalValue(vitalId) {
    try {
        const vital = ALL_VITALS.find(v => v.id === vitalId);
        if (!vital) return;
        
        // Special handling for blood pressure
        if (vitalId === 'bp') {
            console.log('Loading BP latest values...');
            const [systolicRes, diastolicRes] = await Promise.all([
                fetch(`${API_BASE_URL}/patients/me/biometrics?metric=blood_pressure_systolic&limit=1`, {
                    headers: getAuthHeaders()
                }),
                fetch(`${API_BASE_URL}/patients/me/biometrics?metric=blood_pressure_diastolic&limit=1`, {
                    headers: getAuthHeaders()
                })
            ]);
            
            console.log('BP responses:', systolicRes.status, diastolicRes.status);
            
            if (systolicRes.ok && diastolicRes.ok) {
                const systolicData = await systolicRes.json();
                const diastolicData = await diastolicRes.json();
                
                console.log('BP data:', systolicData, diastolicData);
                
                if (systolicData && systolicData.length > 0 && diastolicData && diastolicData.length > 0) {
                    const systolic = systolicData[0].value;
                    const diastolic = diastolicData[0].value;
                    const valueElement = document.getElementById(`${vitalId}Value`);
                    if (valueElement) {
                        valueElement.textContent = `${systolic}/${diastolic}`;
                        console.log('BP value updated:', `${systolic}/${diastolic}`);
                    }
                }
            }
        } else {
            const response = await fetch(`${API_BASE_URL}/patients/me/biometrics?metric=${vital.apiMetric}&limit=1`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const value = data[0].value;
                    const valueElement = document.getElementById(`${vitalId}Value`);
                    if (valueElement) {
                        valueElement.textContent = value;
                    }
                }
            }
        }
    } catch (error) {
        console.error(`Error loading ${vitalId} value:`, error);
    }
}

// Toggle vital expansion
window.toggleVitalExpansion = function(vitalId) {
    const detailsDiv = document.getElementById(`vital-details-${vitalId}`);
    const card = document.querySelector(`[data-vital-id="${vitalId}"]`);
    const expandBtn = card.querySelector('.vital-expand-btn i');
    
    if (detailsDiv.classList.contains('show')) {
        // Collapse
        detailsDiv.classList.remove('show');
        expandBtn.classList.remove('bi-chevron-up');
        expandBtn.classList.add('bi-chevron-down');
    } else {
        // Expand
        detailsDiv.classList.add('show');
        expandBtn.classList.remove('bi-chevron-down');
        expandBtn.classList.add('bi-chevron-up');
        
        // Set default time to current date and time
        const timeInput = document.getElementById(`time-${vitalId}`);
        if (timeInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            timeInput.value = now.toISOString().slice(0, 16);
        }
        
        // Load vital history and create chart
        loadVitalHistory(vitalId);
    }
};

// Load vital history
async function loadVitalHistory(vitalId) {
    try {
        const vital = ALL_VITALS.find(v => v.id === vitalId);
        if (!vital) return;
        
        // Special handling for blood pressure
        if (vitalId === 'bp') {
            const [systolicRes, diastolicRes] = await Promise.all([
                fetch(`${API_BASE_URL}/patients/me/biometrics?metric=blood_pressure_systolic&limit=7`, {
                    headers: getAuthHeaders()
                }),
                fetch(`${API_BASE_URL}/patients/me/biometrics?metric=blood_pressure_diastolic&limit=7`, {
                    headers: getAuthHeaders()
                })
            ]);
            
            if (systolicRes.ok && diastolicRes.ok) {
                const systolicData = await systolicRes.json();
                const diastolicData = await diastolicRes.json();
                
                // Combine systolic and diastolic readings by timestamp
                const combinedData = [];
                systolicData.forEach(sysReading => {
                    const diaReading = diastolicData.find(d => d.timestamp === sysReading.timestamp);
                    if (diaReading) {
                        combinedData.push({
                            timestamp: sysReading.timestamp,
                            value: `${sysReading.value}/${diaReading.value}`
                        });
                    }
                });
                
                vitalHistoryData[vitalId] = combinedData;
                
                // Update recent readings
                displayRecentReadings(vitalId, combinedData, vital.unit);
                
                // Create/update chart - pass raw systolic/diastolic data
                createVitalChart(vitalId, combinedData, vital);
            }
        } else {
            const response = await fetch(`${API_BASE_URL}/patients/me/biometrics?metric=${vital.apiMetric}&limit=7`, {
                headers: getAuthHeaders()
            });
            
            if (response.ok) {
                const data = await response.json();
                vitalHistoryData[vitalId] = data;
                
                // Update recent readings
                displayRecentReadings(vitalId, data, vital.unit);
                
                // Create/update chart
                createVitalChart(vitalId, data, vital);
            }
        }
    } catch (error) {
        console.error(`Error loading ${vitalId} history:`, error);
    }
}

// Display recent readings
function displayRecentReadings(vitalId, readings, unit) {
    const container = document.getElementById(`recent-${vitalId}`);
    if (!container) return;
    
    if (!readings || readings.length === 0) {
        container.innerHTML = '<div class="text-muted small">No recent readings</div>';
        return;
    }
    
    container.innerHTML = readings.slice(0, 5).map(reading => {
        const date = new Date(reading.timestamp);
        const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="reading-item d-flex justify-content-between py-2 border-bottom">
                <span class="text-muted small">${formattedDate} • ${formattedTime}</span>
                <span class="fw-semibold">${reading.value} ${unit}</span>
            </div>
        `;
    }).join('');
}

// Create vital chart
function createVitalChart(vitalId, readings, vital) {
    const canvas = document.getElementById(`chart-${vitalId}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (vitalCharts[vitalId]) {
        vitalCharts[vitalId].destroy();
    }
    
    // Prepare data
    const sortedReadings = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = sortedReadings.map(r => {
        const date = new Date(r.timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    let datasets = [];
    
    // Special handling for blood pressure
    if (vitalId === 'bp') {
        const systolicValues = [];
        const diastolicValues = [];
        
        sortedReadings.forEach(r => {
            const bpValue = r.value.toString();
            if (bpValue.includes('/')) {
                const [systolic, diastolic] = bpValue.split('/').map(v => parseFloat(v));
                systolicValues.push(systolic);
                diastolicValues.push(diastolic);
            } else {
                systolicValues.push(null);
                diastolicValues.push(null);
            }
        });
        
        datasets = [
            {
                label: 'Systolic (Upper)',
                data: systolicValues,
                borderColor: '#ef4444',
                backgroundColor: '#ef444420',
                tension: 0.4,
                fill: false,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointStyle: 'circle'
            },
            {
                label: 'Diastolic (Lower)',
                data: diastolicValues,
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f620',
                tension: 0.4,
                fill: false,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointStyle: 'circle'
            }
        ];
    } else {
        const values = sortedReadings.map(r => r.value);
        datasets = [{
            label: vital.name,
            data: values,
            borderColor: vital.color,
            backgroundColor: `${vital.color}20`,
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
        }];
    }
    
    // Configure y-axis based on vital type
    let yAxisConfig = {
        beginAtZero: false,
        grid: {
            color: '#e5e7eb'
        }
    };
    
    // Special configuration for heart rate, blood sugar, and blood pressure
    if (vitalId === 'heartRate' || vitalId === 'bloodSugar' || vitalId === 'bp') {
        yAxisConfig = {
            min: 0,
            max: 240,
            ticks: {
                stepSize: 40
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for blood oxygen
    if (vitalId === 'oxygen') {
        yAxisConfig = {
            min: 70,
            max: 100,
            ticks: {
                stepSize: 5
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for body temperature
    if (vitalId === 'temp') {
        yAxisConfig = {
            min: 95,
            max: 105,
            ticks: {
                stepSize: 2
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for weight
    if (vitalId === 'weight') {
        yAxisConfig = {
            min: 0,
            max: 200,
            ticks: {
                stepSize: 20
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for BMI
    if (vitalId === 'bmi') {
        yAxisConfig = {
            min: 10,
            max: 40,
            ticks: {
                stepSize: 5
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for steps
    if (vitalId === 'steps') {
        yAxisConfig = {
            min: 0,
            max: 20000,
            ticks: {
                stepSize: 5000
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for calories
    if (vitalId === 'calories') {
        yAxisConfig = {
            min: 0,
            max: 4500,
            ticks: {
                stepSize: 750
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for sleep
    if (vitalId === 'sleep') {
        yAxisConfig = {
            min: 0,
            max: 24,
            ticks: {
                stepSize: 4
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for respiratory rate
    if (vitalId === 'respRate') {
        yAxisConfig = {
            min: 0,
            max: 90,
            ticks: {
                stepSize: 15
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Special configuration for hydration
    if (vitalId === 'hydration') {
        yAxisConfig = {
            min: 0,
            max: 6,
            ticks: {
                stepSize: 1
            },
            grid: {
                color: '#e5e7eb'
            }
        };
    }
    
    // Create chart
    vitalCharts[vitalId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            if (vitalId === 'bp') {
                                return `${context.dataset.label}: ${context.parsed.y} mmHg`;
                            }
                            return `${context.parsed.y} ${vital.unit}`;
                        }
                    }
                }
            },
            scales: {
                y: yAxisConfig,
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Add range lines if available
    if (vital.optimalRange && vitalCharts[vitalId]) {
        vitalCharts[vitalId].data.datasets.push({
            label: 'Max',
            data: new Array(labels.length).fill(vital.optimalRange.max),
            borderColor: '#22c55e',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
        }, {
            label: 'Min',
            data: new Array(labels.length).fill(vital.optimalRange.min),
            borderColor: '#22c55e',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
        });
        vitalCharts[vitalId].update();
    }
}

function extractBackendErrorMessage(payload, fallbackMessage = 'Unable to save data.') {
    if (!payload) {
        return fallbackMessage;
    }

    if (typeof payload === 'string') {
        return payload;
    }

    if (payload instanceof Error) {
        return payload.message || fallbackMessage;
    }

    if (Array.isArray(payload)) {
        const messages = payload
            .map((item) => extractBackendErrorMessage(item, ''))
            .filter((message) => typeof message === 'string' && message.trim().length > 0);

        return messages.length ? messages.join('; ') : fallbackMessage;
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

            if (detailMessages.length) {
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

    return fallbackMessage;
}

function clearVitalInputError(inputElement) {
    if (!inputElement) {
        return;
    }

    inputElement.classList.remove('is-invalid');

    const errorElement = inputElement.nextElementSibling;
    if (errorElement && errorElement.classList.contains('vital-validation-error')) {
        errorElement.remove();
    }
}

function setVitalInputError(inputElement, message) {
    if (!inputElement) {
        return;
    }

    inputElement.classList.add('is-invalid');

    let errorElement = inputElement.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('vital-validation-error')) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback d-block vital-validation-error';
        inputElement.insertAdjacentElement('afterend', errorElement);
    }

    errorElement.textContent = message;
}

// Add vital reading
window.addVitalReading = async function(vitalId) {
    const vital = ALL_VITALS.find(v => v.id === vitalId);
    if (!vital) return;
    
    const timeInput = document.getElementById(`time-${vitalId}`);
    let value;
    
    // Handle blood pressure separately
    if (vitalId === 'bp') {
        const systolicInput = document.getElementById(`input-systolic-${vitalId}`);
        const diastolicInput = document.getElementById(`input-diastolic-${vitalId}`);
        clearVitalInputError(systolicInput);
        clearVitalInputError(diastolicInput);

        const systolicRaw = (systolicInput.value || '').trim();
        const diastolicRaw = (diastolicInput.value || '').trim();

        let hasValidationError = false;
        if (!systolicRaw) {
            setVitalInputError(systolicInput, 'Please enter systolic value.');
            hasValidationError = true;
        }

        if (!diastolicRaw) {
            setVitalInputError(diastolicInput, 'Please enter diastolic value.');
            hasValidationError = true;
        }

        if (hasValidationError) {
            return;
        }
        
        const systolic = parseFloat(systolicRaw);
        const diastolic = parseFloat(diastolicRaw);
        
        if (isNaN(systolic) || isNaN(diastolic)) {
            if (isNaN(systolic)) {
                setVitalInputError(systolicInput, 'Please enter a valid number.');
            }

            if (isNaN(diastolic)) {
                setVitalInputError(diastolicInput, 'Please enter a valid number.');
            }
            return;
        }

        if (systolic < 0 || diastolic < 0) {
            if (systolic < 0) {
                setVitalInputError(systolicInput, 'Value must be 0 or greater.');
            }

            if (diastolic < 0) {
                setVitalInputError(diastolicInput, 'Value must be 0 or greater.');
            }
            return;
        }
        
        value = `${systolic}/${diastolic}`;
    } else {
        const valueInput = document.getElementById(`input-${vitalId}`);
        clearVitalInputError(valueInput);

        const rawValue = (valueInput.value || '').trim();
        if (!rawValue) {
            setVitalInputError(valueInput, 'Please enter a value.');
            return;
        }

        value = parseFloat(rawValue);
        
        if (isNaN(value)) {
            setVitalInputError(valueInput, 'Please enter a valid number.');
            return;
        }

        if (value < 0) {
            setVitalInputError(valueInput, `${vital.name} must be 0 or greater.`);
            return;
        }

        if (vitalId === 'steps' && value > 100000) {
            setVitalInputError(valueInput, 'Daily Steps must be 100,000 or less.');
            return;
        }

        if (vitalId === 'oxygen' && (value < 0 || value > 100)) {
            setVitalInputError(valueInput, 'Blood Oxygen must be between 0 and 100%.');
            return;
        }
    }
    
    const timestamp = timeInput.value ? new Date(timeInput.value).toISOString() : new Date().toISOString();
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/biometrics`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                metric: vital.apiMetric,
                value: value,
                unit: vital.unit,
                timestamp: timestamp
            })
        });

        const responseData = await response.json().catch(() => null);
        
        if (response.ok) {
            // Clear inputs
            if (vitalId === 'bp') {
                document.getElementById(`input-systolic-${vitalId}`).value = '';
                document.getElementById(`input-diastolic-${vitalId}`).value = '';
            } else {
                const valueInput = document.getElementById(`input-${vitalId}`);
                valueInput.value = '';
            }
            
            // Reset time to current time
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            timeInput.value = now.toISOString().slice(0, 16);
            
            // Reload history
            await loadVitalHistory(vitalId);
            
            // Update main display value
            document.getElementById(`${vitalId}Value`).textContent = value;
            
            // Show success message
            showSuccessMessage(`${vital.name} reading added successfully!`);
        } else {
            const backendMessage = extractBackendErrorMessage(responseData, 'Failed to save data.');
            alert(`Failed to save data: ${backendMessage}`);
        }
    } catch (error) {
        console.error('Error adding reading:', error);
        const errorMessage = extractBackendErrorMessage(error, 'Failed to save data. Please try again.');
        alert(`Failed to save data: ${errorMessage}`);
    }
};

// Show success message
function showSuccessMessage(message) {
    // Create a simple toast notification
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

// Update card appearance based on enabled state
function updateCardAppearance(vitalId, isEnabled) {
    const card = document.querySelector(`[data-vital-id="${vitalId}"]`);
    if (!card) return;
    
    const vital = ALL_VITALS.find(v => v.id === vitalId);
    if (isEnabled && vital) {
        card.style.borderLeft = `4px solid ${vital.color}`;
    } else {
        card.style.borderLeft = '';
    }
}

// Save vital preferences
function saveVitalPreferences() {
    try {
        // Save to localStorage
        localStorage.setItem('healio_vital_preferences', JSON.stringify(vitalPreferences));
        
        showSuccessMessage('Vital preferences saved successfully!');
        
        // Optionally redirect to dashboard after a delay
        setTimeout(() => {
            window.location.href = 'dashboard-v2.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Failed to save preferences');
    }
}
