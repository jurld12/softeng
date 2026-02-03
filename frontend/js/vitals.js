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
        defaultEnabled: true
    },
    {
        id: 'bloodSugar',
        name: 'Blood Glucose',
        unit: 'mg/dL',
        icon: 'bi-activity',
        description: 'Track blood sugar levels',
        apiMetric: 'blood_glucose',
        defaultEnabled: true
    },
    {
        id: 'bp',
        name: 'Blood Pressure',
        unit: 'mmHg',
        icon: 'bi-droplet-fill',
        description: 'Monitor blood pressure',
        apiMetric: 'blood_pressure',
        defaultEnabled: true
    },
    {
        id: 'oxygen',
        name: 'Blood Oxygen',
        unit: '%',
        icon: 'bi-wind',
        description: 'Track oxygen saturation',
        apiMetric: 'blood_oxygen',
        defaultEnabled: true
    },
    {
        id: 'temp',
        name: 'Body Temperature',
        unit: '°F',
        icon: 'bi-thermometer-half',
        description: 'Monitor body temperature',
        apiMetric: 'body_temperature',
        defaultEnabled: true
    },
    {
        id: 'weight',
        name: 'Weight',
        unit: 'kg',
        icon: 'bi-speedometer',
        description: 'Track your weight',
        apiMetric: 'weight',
        defaultEnabled: true
    },
    {
        id: 'bmi',
        name: 'BMI',
        unit: '',
        icon: 'bi-person',
        description: 'Body Mass Index',
        apiMetric: 'bmi',
        defaultEnabled: true
    },
    {
        id: 'steps',
        name: 'Steps',
        unit: 'steps',
        icon: 'bi-shoe-prints',
        description: 'Daily step count',
        apiMetric: 'steps',
        defaultEnabled: true
    },
    {
        id: 'calories',
        name: 'Calories Burned',
        unit: 'kcal',
        icon: 'bi-fire',
        description: 'Track calories burned',
        apiMetric: 'calories',
        defaultEnabled: true
    },
    {
        id: 'sleep',
        name: 'Sleep Hours',
        unit: 'hours',
        icon: 'bi-moon-stars',
        description: 'Monitor sleep duration',
        apiMetric: 'sleep_hours',
        defaultEnabled: true
    },
    {
        id: 'respRate',
        name: 'Respiratory Rate',
        unit: 'breaths/min',
        icon: 'bi-lungs',
        description: 'Track breathing rate',
        apiMetric: 'respiratory_rate',
        defaultEnabled: false
    },
    {
        id: 'hydration',
        name: 'Hydration',
        unit: 'L',
        icon: 'bi-cup-straw',
        description: 'Daily water intake',
        apiMetric: 'hydration',
        defaultEnabled: false
    }
];

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
            if (avatar) {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=7c3aed&color=fff`;
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load vital preferences
async function loadVitalPreferences() {
    try {
        // Try to load from localStorage first
        const stored = localStorage.getItem('healio_vital_preferences');
        if (stored) {
            vitalPreferences = JSON.parse(stored);
        } else {
            // Initialize with default enabled vitals
            vitalPreferences = {};
            ALL_VITALS.forEach(vital => {
                vitalPreferences[vital.id] = vital.defaultEnabled;
            });
        }
        
        displayVitals();
    } catch (error) {
        console.error('Error loading preferences:', error);
        // Initialize with defaults
        vitalPreferences = {};
        ALL_VITALS.forEach(vital => {
            vitalPreferences[vital.id] = vital.defaultEnabled;
        });
        displayVitals();
    }
}

// Display all vitals with toggle switches
function displayVitals() {
    const vitalsGrid = document.getElementById('vitalsGrid');
    let showAll = false;
    
    function renderVitals() {
        // Show more button should appear when there are more than 6 TOTAL vitals
        const shouldShowMoreButton = ALL_VITALS.length > 6;
        
        const vitalsToShow = showAll ? ALL_VITALS : ALL_VITALS.slice(0, 6);
        
        vitalsGrid.innerHTML = vitalsToShow.map(vital => {
            const isEnabled = vitalPreferences[vital.id] !== undefined 
                ? vitalPreferences[vital.id] 
                : vital.defaultEnabled;
            
            return `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100 vital-selector-card" data-vital-id="${vital.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="vital-icon-large">
                                        <i class="bi ${vital.icon}" style="font-size: 24px; color: #7c3aed;"></i>
                                    </div>
                                    <div>
                                        <h5 class="card-title mb-0">${vital.name}</h5>
                                        <small class="text-muted">${vital.unit}</small>
                                    </div>
                                </div>
                                <div class="form-check form-switch">
                                    <input 
                                        class="form-check-input vital-toggle" 
                                        type="checkbox" 
                                        role="switch" 
                                        id="toggle-${vital.id}"
                                        data-vital-id="${vital.id}"
                                        ${isEnabled ? 'checked' : ''}
                                        style="width: 3rem; height: 1.5rem; cursor: pointer;">
                                </div>
                            </div>
                            <p class="card-text text-muted small mb-0">${vital.description}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add show more/less button if needed
        if (shouldShowMoreButton) {
            const buttonHtml = `
                <div class="col-12 text-center">
                    <button class="btn btn-outline-primary" id="toggleShowAll">
                        <i class="bi ${showAll ? 'bi-chevron-up' : 'bi-chevron-down'} me-2"></i>
                        ${showAll ? 'Show Less' : `Show ${ALL_VITALS.length - 6} More Vitals`}
                    </button>
                </div>
            `;
            vitalsGrid.innerHTML += buttonHtml;
            
            // Attach event listener to toggle button
            document.getElementById('toggleShowAll').addEventListener('click', function() {
                showAll = !showAll;
                renderVitals();
            });
        }
        
        // Attach event listeners to toggles
        document.querySelectorAll('.vital-toggle').forEach(toggle => {
            toggle.addEventListener('change', function() {
                const vitalId = this.getAttribute('data-vital-id');
                vitalPreferences[vitalId] = this.checked;
                updateCardAppearance(vitalId, this.checked);
            });
        });
        
        // Update card appearances based on enabled state
        ALL_VITALS.forEach(vital => {
            updateCardAppearance(vital.id, vitalPreferences[vital.id]);
        });
    }
    
    renderVitals();
    
    // Attach save button listener (only once)
    document.getElementById('savePreferences').addEventListener('click', saveVitalPreferences);
}

// Update card appearance based on enabled state
function updateCardAppearance(vitalId, isEnabled) {
    const card = document.querySelector(`[data-vital-id="${vitalId}"]`);
    if (!card) return;
    
    if (isEnabled) {
        card.style.borderLeft = '4px solid #7c3aed';
        card.style.backgroundColor = '#f9f7ff';
    } else {
        card.style.borderLeft = '';
        card.style.backgroundColor = '';
    }
}

// Save vital preferences
async function saveVitalPreferences() {
    try {
        // Save to localStorage
        localStorage.setItem('healio_vital_preferences', JSON.stringify(vitalPreferences));
        
        showSuccess('Vital preferences saved successfully!');
        
        // Optionally redirect to dashboard after a delay
        setTimeout(() => {
            window.location.href = 'dashboard-v2.html';
        }, 1500);
    } catch (error) {
        console.error('Error saving preferences:', error);
        showError('Failed to save preferences');
    }
}

// Show success message
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast show align-items-center text-white bg-success border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-check-circle me-2"></i>${escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast show align-items-center text-white bg-danger border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-exclamation-triangle me-2"></i>${escapeHtml(message)}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Logout function
function logout() {
    localStorage.removeItem('healio_access_token');
    localStorage.removeItem('healio_user_id');
    localStorage.removeItem('healio_user_role');
    localStorage.removeItem('healio_user_name');
    window.location.href = 'login-v2.html';
}
