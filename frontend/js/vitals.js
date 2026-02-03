// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

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
        id: 'bmi',
        name: 'BMI',
        unit: '',
        icon: 'bi-person',
        description: 'Body Mass Index',
        apiMetric: 'bmi',
        optimalRange: null,
        color: '#8b5cf6'
    },
    {
        id: 'steps',
        name: 'Steps',
        unit: 'steps',
        icon: 'bi-shoe-prints',
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
    checkAuthentication();
    loadCurrentUser();
    loadVitalPreferences();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('healio_access_token');
    if (!token) {
        window.location.href = 'login-v2.html';
        return;
    }
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('healio_access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Load current user info
async function loadCurrentUser() {
    try {
        const token = localStorage.getItem('healio_access_token');
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

// Logout function
function logout() {
    localStorage.clear();
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
                        <canvas id="chart-${vital.id}" height="200"></canvas>
                    </div>
                    <div class="col-lg-4">
                        <h6 class="mb-3">Add New Reading</h6>
                        <div class="mb-3">
                            <label class="form-label small">Value${vital.unit ? ` (${vital.unit})` : ''}</label>
                            <input type="number" class="form-control" id="input-${vital.id}" placeholder="Enter value">
                        </div>
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
    }, 100);
}

// Load latest value for a vital
async function loadLatestVitalValue(vitalId) {
    try {
        const vital = ALL_VITALS.find(v => v.id === vitalId);
        if (!vital) return;
        
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
        
        // Load vital history and create chart
        loadVitalHistory(vitalId);
    }
};

// Load vital history
async function loadVitalHistory(vitalId) {
    try {
        const vital = ALL_VITALS.find(v => v.id === vitalId);
        if (!vital) return;
        
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
    const values = sortedReadings.map(r => r.value);
    
    // Create chart
    vitalCharts[vitalId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: vital.name,
                data: values,
                borderColor: vital.color,
                backgroundColor: `${vital.color}20`,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
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
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} ${vital.unit}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#e5e7eb'
                    }
                },
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

// Add vital reading
window.addVitalReading = async function(vitalId) {
    const vital = ALL_VITALS.find(v => v.id === vitalId);
    if (!vital) return;
    
    const valueInput = document.getElementById(`input-${vitalId}`);
    const timeInput = document.getElementById(`time-${vitalId}`);
    
    const value = parseFloat(valueInput.value);
    if (isNaN(value)) {
        alert('Please enter a valid value');
        return;
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
        
        if (response.ok) {
            // Clear inputs
            valueInput.value = '';
            timeInput.value = '';
            
            // Reload history
            await loadVitalHistory(vitalId);
            
            // Update main display value
            document.getElementById(`${vitalId}Value`).textContent = value;
            
            // Show success message
            showSuccessMessage(`${vital.name} reading added successfully!`);
        } else {
            alert('Failed to add reading');
        }
    } catch (error) {
        console.error('Error adding reading:', error);
        alert('Error adding reading');
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
