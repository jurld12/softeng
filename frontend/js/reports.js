// Reports Page - Health Summary and Analytics

let vitalsChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    await loadPatientSummary();
    await loadCurrentVitals();
    await loadMedications();
    await loadVitalsTrend();
    generateHealthInsights();
});

// Load user data for sidebar
async function loadUserData() {
    try {
        const token = localStorage.getItem('healio_access_token');
        if (!token) {
            window.location.href = 'login-v2.html';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/patients/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            updateUserDisplay(data);
        } else if (response.status === 401) {
            window.location.href = 'login-v2.html';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update user display
function updateUserDisplay(user) {
    const name = user.full_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const email = user.email || 'user@example.com';
    
    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarUserEmail').textContent = email;
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`;
    document.getElementById('sidebarUserAvatar').src = avatarUrl;
}

// Load patient summary
async function loadPatientSummary() {
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/patients/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const patient = await response.json();
            displayPatientSummary(patient);
        }
    } catch (error) {
        console.error('Error loading patient summary:', error);
    }
}

// Display patient summary
function displayPatientSummary(patient) {
    const name = patient.full_name || patient.name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const age = patient.age || patient.date_of_birth ? calculateAge(patient.date_of_birth) : '--';
    const gender = patient.gender || '--';
    const bloodType = patient.blood_type || '--';
    
    document.getElementById('patientName').textContent = name;
    document.getElementById('patientAge').textContent = age;
    document.getElementById('patientGender').textContent = gender.charAt(0).toUpperCase() + gender.slice(1);
    document.getElementById('patientBloodType').textContent = bloodType;
    
    // Physical measurements
    document.getElementById('patientHeight').textContent = patient.height ? `${patient.height} cm` : '-- cm';
    document.getElementById('patientWeight').textContent = patient.weight ? `${patient.weight} kg` : '-- kg';
    
    // Calculate BMI if both height and weight are available
    if (patient.height && patient.weight) {
        const heightInMeters = patient.height / 100;
        const bmi = (patient.weight / (heightInMeters * heightInMeters)).toFixed(1);
        document.getElementById('patientBMI').textContent = bmi;
    } else {
        document.getElementById('patientBMI').textContent = '--';
    }
    
    // Allergies
    const allergiesContainer = document.getElementById('patientAllergies');
    if (patient.allergies && patient.allergies.length > 0) {
        allergiesContainer.innerHTML = patient.allergies.map(allergy => 
            `<span class="badge bg-danger-subtle text-danger border border-danger">${escapeHtml(allergy)}</span>`
        ).join('');
    } else {
        allergiesContainer.innerHTML = '<span class="badge bg-secondary-subtle text-secondary">None reported</span>';
    }
    
    // Conditions
    const conditionsContainer = document.getElementById('patientConditions');
    if (patient.conditions && patient.conditions.length > 0) {
        conditionsContainer.innerHTML = patient.conditions.map(condition => 
            `<span class="badge bg-warning-subtle text-warning border border-warning">${escapeHtml(condition)}</span>`
        ).join('');
    } else {
        conditionsContainer.innerHTML = '<span class="badge bg-secondary-subtle text-secondary">None reported</span>';
    }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '--';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age + ' years old';
}

// Load current vitals
async function loadCurrentVitals() {
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/patients/me/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            // Transform latest_metrics to vitals format
            const vitals = {
                blood_glucose: data.latest_metrics.blood_glucose?.value,
                heart_rate: data.latest_metrics.heart_rate?.value,
                blood_pressure_systolic: data.latest_metrics.blood_pressure_systolic?.value,
                blood_pressure_diastolic: data.latest_metrics.blood_pressure_diastolic?.value,
                blood_oxygen: data.latest_metrics.blood_oxygen?.value,
                body_temperature: data.latest_metrics.body_temperature?.value
            };
            displayCurrentVitals(vitals);
        } else {
            document.getElementById('currentVitals').innerHTML = `
                <div class="col-12 text-center text-muted py-4">
                    <p>No vital signs recorded yet</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading current vitals:', error);
        document.getElementById('currentVitals').innerHTML = `
            <div class="col-12 text-center text-muted py-4">
                <p>Unable to load vital signs</p>
            </div>
        `;
    }
}

// Display current vitals
function displayCurrentVitals(vitals) {
    const vitalCards = [
        { key: 'blood_glucose', label: 'Blood Sugar', unit: 'mg/dL', icon: 'droplet-fill', color: 'primary' },
        { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: 'heart-pulse', color: 'danger' },
        { key: 'blood_pressure', label: 'Blood Pressure', unit: 'mmHg', icon: 'activity', color: 'success' },
        { key: 'blood_oxygen', label: 'Blood Oxygen', unit: '%', icon: 'lungs', color: 'info' },
        { key: 'body_temperature', label: 'Temperature', unit: '°C', icon: 'thermometer-half', color: 'warning' }
    ];

    const container = document.getElementById('currentVitals');
    container.innerHTML = vitalCards.map(vital => {
        let value = '--';
        let status = 'Normal';
        let statusClass = 'success';

        if (vital.key === 'blood_pressure' && vitals.blood_pressure_systolic && vitals.blood_pressure_diastolic) {
            value = `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`;
            if (vitals.blood_pressure_systolic < 120 && vitals.blood_pressure_diastolic < 80) {
                status = 'Optimal';
            } else if (vitals.blood_pressure_systolic >= 140 || vitals.blood_pressure_diastolic >= 90) {
                status = 'High';
                statusClass = 'danger';
            }
        } else if (vitals[vital.key]) {
            value = vitals[vital.key];
            
            // Determine status based on value
            if (vital.key === 'blood_glucose') {
                if (value >= 70 && value <= 100) status = 'Normal';
                else if (value > 100 && value <= 125) { status = 'Elevated'; statusClass = 'warning'; }
                else { status = 'High'; statusClass = 'danger'; }
            } else if (vital.key === 'heart_rate') {
                if (value >= 60 && value <= 100) status = 'Normal';
                else { status = 'Abnormal'; statusClass = 'warning'; }
            } else if (vital.key === 'blood_oxygen') {
                if (value >= 95) status = 'Excellent';
                else if (value >= 90) { status = 'Normal'; statusClass = 'warning'; }
                else { status = 'Low'; statusClass = 'danger'; }
            } else if (vital.key === 'body_temperature') {
                if (value >= 36.1 && value <= 37.2) status = 'Normal';
                else { status = 'Abnormal'; statusClass = 'warning'; }
            }
        }

        return `
            <div class="col-md-4 col-lg">
                <div class="vital-card">
                    <div class="vital-icon text-${vital.color}">
                        <i class="bi bi-${vital.icon}"></i>
                    </div>
                    <p class="vital-label">${vital.label}</p>
                    <h3 class="vital-value">${value}</h3>
                    <p class="vital-unit">${vital.unit}</p>
                    <span class="badge bg-${statusClass}-subtle text-${statusClass} border border-${statusClass} mt-2">${status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Load medications
async function loadMedications() {
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/patients/me/medications`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const medications = await response.json();
            displayMedications(medications);
        }
    } catch (error) {
        console.error('Error loading medications:', error);
        document.getElementById('patientMedications').innerHTML = '<p class="text-muted small mb-0">No medications recorded</p>';
    }
}

// Display medications
function displayMedications(medications) {
    const container = document.getElementById('patientMedications');
    const activeMeds = medications.filter(med => med.active);
    
    if (activeMeds.length === 0) {
        container.innerHTML = '<p class="text-muted small mb-0">No active medications</p>';
        return;
    }
    
    container.innerHTML = activeMeds.slice(0, 3).map(med => `
        <div class="medication-summary">
            <p class="fw-semibold mb-0">${escapeHtml(med.name)}</p>
            <p class="text-muted small mb-0">${escapeHtml(med.dosage)} - ${escapeHtml(med.frequency)}</p>
        </div>
    `).join('');
}

// Load vitals trend
async function loadVitalsTrend() {
    try {
        const token = localStorage.getItem('healio_access_token');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const response = await fetch(`${API_BASE_URL}/patients/me/biometrics?limit=100`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const biometrics = await response.json();
            // Group metrics by date
            const groupedData = groupBiometricsByDate(biometrics);
            createVitalsChart(groupedData);
            calculateActivityAverages(biometrics);
        }
    } catch (error) {
        console.error('Error loading vitals trend:', error);
    }
}

// Group biometrics by date
function groupBiometricsByDate(biometrics) {
    const grouped = {};
    
    biometrics.forEach(entry => {
        const date = new Date(entry.timestamp).toDateString();
        if (!grouped[date]) {
            grouped[date] = { date: entry.timestamp };
        }
        grouped[date][entry.metric] = entry.value;
    });
    
    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
}

// Create vitals trend chart
function createVitalsChart(biometrics) {
    const ctx = document.getElementById('vitalsChart');
    if (!ctx) return;

    // Prepare data
    const labels = biometrics.map(b => {
        const date = new Date(b.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const bloodSugarData = biometrics.map(b => b.blood_glucose || null);
    const heartRateData = biometrics.map(b => b.heart_rate || null);
    const bloodPressureData = biometrics.map(b => b.blood_pressure_systolic || null);

    // Destroy existing chart if it exists
    if (vitalsChart) {
        vitalsChart.destroy();
    }

    vitalsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Blood Sugar (mg/dL)',
                    data: bloodSugarData,
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Heart Rate (bpm)',
                    data: heartRateData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                },
                {
                    label: 'Blood Pressure Systolic (mmHg)',
                    data: bloodPressureData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
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
}

// Calculate activity averages
function calculateActivityAverages(biometrics) {
    if (biometrics.length === 0) return;

    // Filter last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = biometrics.filter(b => new Date(b.timestamp) >= sevenDaysAgo);
    
    // Calculate averages by metric
    const avgSteps = calculateAverage(recent.filter(b => b.metric === 'steps').map(b => b.value));
    const avgSleep = calculateAverage(recent.filter(b => b.metric === 'sleep_hours').map(b => b.value));
    const avgCalories = calculateAverage(recent.filter(b => b.metric === 'calories').map(b => b.value));
    const avgWater = calculateAverage(recent.filter(b => b.metric === 'water_intake').map(b => b.value / 1000)); // Convert to liters

    document.getElementById('avgSteps').textContent = Math.round(avgSteps).toLocaleString();
    document.getElementById('avgSleep').textContent = avgSleep.toFixed(1);
    document.getElementById('avgCalories').textContent = Math.round(avgCalories).toLocaleString();
    document.getElementById('avgWater').textContent = avgWater.toFixed(1);
}

// Calculate average
function calculateAverage(values) {
    const filtered = values.filter(v => v > 0);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, val) => sum + val, 0) / filtered.length;
}

// Generate health insights
function generateHealthInsights() {
    const insights = [
        { type: 'success', icon: 'check-circle', message: 'Your vital signs are within normal ranges. Keep up the great work!' },
        { type: 'info', icon: 'info-circle', message: 'Regular monitoring helps track your health trends over time.' },
        { type: 'warning', icon: 'exclamation-triangle', message: 'Remember to take your medications as prescribed for optimal health.' }
    ];

    const container = document.getElementById('healthInsights');
    container.innerHTML = insights.map(insight => `
        <div class="alert alert-${insight.type} mb-0">
            <i class="bi bi-${insight.icon} me-2"></i>${insight.message}
        </div>
    `).join('');
}

// Download report
function downloadReport() {
    alert('Report download feature coming soon!');
    // TODO: Implement PDF generation
}

// Logout function
function logout() {
    localStorage.removeItem('healio_access_token');
    window.location.href = 'login-v2.html';
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
