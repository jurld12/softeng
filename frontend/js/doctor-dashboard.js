const doctorDashboardState = {
    doctor: null,
    patients: [],
    filteredPatients: [],
    queue: [],
    appointments: [],
    upcomingAppointments: [],
    pastAppointments: [],
    activeTab: 'patients',
    activeFilter: 'all',
    searchTerm: '',
    selectedPatientId: null,
    loading: false,
    fallbackMode: false,
    lastUpdated: null
};

const queueTimes = ['08:30', '09:45', '11:15', '13:30', '15:00', '16:45'];

const demoPatients = [
    {
        _id: 'P-2024-001',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        active: true,
        created_at: '2024-11-15T09:00:00Z',
        summary: {
            alert_count: 2,
            metrics: {
                blood_glucose: { average: 185, count: 12 },
                heart_rate: { average: 78, count: 18 },
                sleep_hours: { average: 6.5, count: 11 },
                steps: { average: 4200, count: 16 }
            }
        }
    },
    {
        _id: 'P-2024-002',
        name: 'Michael Chen',
        email: 'michael@example.com',
        active: true,
        created_at: '2024-11-14T09:00:00Z',
        summary: {
            alert_count: 1,
            metrics: {
                blood_glucose: { average: 95, count: 14 },
                heart_rate: { average: 88, count: 17 },
                sleep_hours: { average: 7.2, count: 13 },
                steps: { average: 6100, count: 19 }
            }
        }
    },
    {
        _id: 'P-2024-003',
        name: 'Emily Rodriguez',
        email: 'emily@example.com',
        active: true,
        created_at: '2024-11-16T09:00:00Z',
        summary: {
            alert_count: 1,
            metrics: {
                blood_glucose: { average: 88, count: 16 },
                heart_rate: { average: 72, count: 20 },
                sleep_hours: { average: 5.1, count: 12 },
                steps: { average: 4800, count: 18 }
            }
        }
    },
    {
        _id: 'P-2024-004',
        name: 'James Wilson',
        email: 'james@example.com',
        active: true,
        created_at: '2024-11-13T09:00:00Z',
        summary: {
            alert_count: 2,
            metrics: {
                blood_glucose: { average: 102, count: 15 },
                heart_rate: { average: 105, count: 18 },
                sleep_hours: { average: 7.8, count: 10 },
                steps: { average: 5700, count: 16 }
            }
        }
    },
    {
        _id: 'P-2024-005',
        name: 'Lisa Anderson',
        email: 'lisa@example.com',
        active: true,
        created_at: '2024-11-17T09:00:00Z',
        summary: {
            alert_count: 0,
            metrics: {
                blood_glucose: { average: 92, count: 13 },
                heart_rate: { average: 75, count: 16 },
                sleep_hours: { average: 8.0, count: 11 },
                steps: { average: 8400, count: 17 }
            }
        }
    }
];

function checkDoctorAuthentication() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const role = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ROLE);

    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }

    if (role !== 'doctor') {
        alert('Access denied. This page is for doctors only.');
        window.location.href = 'login-v2.html';
        return false;
    }

    return true;
}

window.logout = async function() {
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

function getStoredDoctorFallback() {
    return {
        name: localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME) || 'Doctor',
        email: 'doctor@healio.app',
        specialty: ''
    };
}

async function readJsonResponse(response) {
    if (response.status === 401 || response.status === 403) {
        const error = new Error('SESSION_EXPIRED');
        error.code = 'SESSION_EXPIRED';
        throw error;
    }

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
}

async function loadCurrentDoctor() {
    const response = await fetch(getApiUrl('/auth/me'), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadDoctorPatients() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.DOCTOR_PATIENTS), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadDoctorAppointments(statusFilter = '') {
    const query = statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : '';
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_APPOINTMENTS}${query}`), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function refreshDoctorAppointments() {
    const [upcomingPayload, pastPayload] = await Promise.all([
        loadDoctorAppointments('upcoming').catch(() => ({ appointments: [] })),
        loadDoctorAppointments('past').catch(() => ({ appointments: [] }))
    ]);

    doctorDashboardState.upcomingAppointments = Array.isArray(upcomingPayload.appointments)
        ? upcomingPayload.appointments
        : [];
    doctorDashboardState.pastAppointments = Array.isArray(pastPayload.appointments)
        ? pastPayload.appointments
        : [];
    doctorDashboardState.appointments = [
        ...doctorDashboardState.upcomingAppointments,
        ...doctorDashboardState.pastAppointments
    ];
}

async function updateDoctorAppointmentStatus(appointmentId, statusValue) {
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_APPOINTMENTS}/${appointmentId}/status?status_value=${encodeURIComponent(statusValue)}`), {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadPatientSummary(patientId) {
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_PATIENT_DETAILS}/${patientId}/summary?days=30`), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function escalateDoctorPatient(patientId) {
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_PATIENT_DETAILS}/${patientId}/escalate`), {
        method: 'POST',
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadDoctorPatientBiometrics(patientId, limit = 100) {
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_PATIENT_DETAILS}/${patientId}/biometrics?limit=${encodeURIComponent(limit)}`), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function loadDoctorPatientNotes(patientId) {
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_PATIENT_DETAILS}/${patientId}/notes`), {
        headers: getAuthHeaders()
    });

    return readJsonResponse(response);
}

async function createDoctorPatientNote(patientId, noteText) {
    const response = await fetch(getApiUrl(`${CONFIG.ENDPOINTS.DOCTOR_PATIENT_DETAILS}/${patientId}/notes`), {
        method: 'POST',
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ note: noteText })
    });

    return readJsonResponse(response);
}

async function mapWithConcurrency(items, limit, mapper) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
        }
    }

    const workerCount = Math.min(limit, items.length);
    await Promise.all(Array.from({ length: workerCount }, worker));
    return results;
}

async function hydratePatients(patients, useEmbeddedSummary = false) {
    const hydratedPatients = await mapWithConcurrency(patients, 6, async (patient, index) => {
        const patientId = patient._id || patient.id;
        let summary = patient.summary || null;

        if (!useEmbeddedSummary && patientId) {
            try {
                summary = await loadPatientSummary(patientId);
            } catch (error) {
                if (error.code === 'SESSION_EXPIRED') {
                    throw error;
                }
                console.warn(`Unable to load summary for patient ${patientId}:`, error);
            }
        }

        return normalizePatient(patient, summary, index);
    });

    return hydratedPatients.sort(sortPatientsByPriority);
}

function normalizePatient(patient, summary, index) {
    const patientId = patient._id || patient.id || `P-${String(index + 1).padStart(3, '0')}`;
    const createdAt = patient.created_at || new Date().toISOString();
    const alertCount = Number(summary?.alert_count || 0);

    const metrics = [
        createMetricDefinition('glucose', 'Glucose', getSummaryAverage(summary, 'blood_glucose'), 'mg/dL', 'bi-droplet-fill'),
        createMetricDefinition('heartRate', 'Heart rate', getSummaryAverage(summary, 'heart_rate'), 'bpm', 'bi-heart-pulse-fill'),
        createMetricDefinition('sleep', 'Sleep', getSummaryAverage(summary, 'sleep_hours'), 'hrs', 'bi-moon-stars-fill'),
        createMetricDefinition('steps', 'Activity', getSummaryAverage(summary, 'steps'), 'steps', 'bi-person-walking')
    ];

    const dataCoverage = Object.values(summary?.metrics || {}).reduce((total, metric) => {
        return total + Number(metric?.count || 0);
    }, 0);

    const priority = determinePriority(alertCount, metrics);
    const monitoringLabel = formatMonitoringLabel(createdAt);
    const focus = determineFocus(metrics, alertCount);

    return {
        id: patientId,
        code: formatPatientCode(patientId, createdAt, index),
        name: patient.name || 'Patient',
        email: patient.email || 'No email on file',
        active: patient.active !== false,
        createdAt,
        alertCount,
        dataCoverage,
        priority,
        priorityLabel: getPriorityLabel(priority),
        focus,
        monitoringLabel,
        metrics,
        summaryText: alertCount > 0
            ? `${alertCount} alert${alertCount === 1 ? '' : 's'} recorded in the last 30 days`
            : dataCoverage > 0
                ? `${dataCoverage} tracked readings across the last 30 days`
                : 'No recent biometric summary data available'
    };
}

function getSummaryAverage(summary, key) {
    return summary?.metrics?.[key]?.average ?? null;
}

function createMetricDefinition(key, label, value, unit, icon) {
    const status = classifyMetricStatus(key, value);
    const display = formatMetricDisplay(key, value);

    return {
        key,
        label,
        unit,
        icon,
        status,
        display,
        note: value === null ? 'No recent data' : '30 day avg'
    };
}

function classifyMetricStatus(key, value) {
    if (value === null || Number.isNaN(value)) {
        return 'missing';
    }

    if (key === 'glucose') {
        if (value < 70 || value >= 160) return 'critical';
        if (value >= 100) return 'attention';
        return 'normal';
    }

    if (key === 'heartRate') {
        if (value < 55 || value > 100) return 'critical';
        if (value < 60 || value > 90) return 'attention';
        return 'normal';
    }

    if (key === 'sleep') {
        if (value < 5.5) return 'critical';
        if (value < 7 || value > 9.5) return 'attention';
        return 'normal';
    }

    if (key === 'steps') {
        if (value < 3500) return 'critical';
        if (value < 7000) return 'attention';
        return 'normal';
    }

    return 'normal';
}

function formatMetricDisplay(key, value) {
    if (value === null || Number.isNaN(value)) {
        return 'No data';
    }

    if (key === 'steps') {
        return Math.round(value).toLocaleString();
    }

    if (key === 'sleep') {
        return Number(value).toFixed(1);
    }

    return String(Math.round(value));
}

function determinePriority(alertCount, metrics) {
    const criticalCount = metrics.filter(metric => metric.status === 'critical').length;
    const attentionCount = metrics.filter(metric => metric.status === 'attention').length;

    if (alertCount >= 2 || criticalCount >= 1) {
        return 'high';
    }

    if (alertCount === 1 || attentionCount >= 2) {
        return 'medium';
    }

    return 'low';
}

function getPriorityLabel(priority) {
    if (priority === 'high') return 'Immediate review';
    if (priority === 'medium') return 'Watch closely';
    return 'Stable';
}

function determineFocus(metrics, alertCount) {
    if (alertCount >= 2) {
        return 'Escalate active alerts';
    }

    const criticalMetric = metrics.find(metric => metric.status === 'critical');
    const attentionMetric = metrics.find(metric => metric.status === 'attention');
    const metric = criticalMetric || attentionMetric;

    if (!metric) {
        return 'Routine wellness review';
    }

    if (metric.key === 'glucose') return 'Glucose management';
    if (metric.key === 'heartRate') return 'Cardiac response';
    if (metric.key === 'sleep') return 'Sleep adherence';
    if (metric.key === 'steps') return 'Mobility coaching';
    return 'Routine wellness review';
}

function sortPatientsByPriority(left, right) {
    const order = { high: 0, medium: 1, low: 2 };

    if (order[left.priority] !== order[right.priority]) {
        return order[left.priority] - order[right.priority];
    }

    if (right.alertCount !== left.alertCount) {
        return right.alertCount - left.alertCount;
    }

    return left.name.localeCompare(right.name);
}

function formatPatientCode(patientId, createdAt, index) {
    if (String(patientId).startsWith('P-')) {
        return patientId;
    }

    const year = new Date(createdAt).getFullYear() || new Date().getFullYear();
    return `P-${year}-${String(index + 1).padStart(3, '0')}`;
}

function formatMonitoringLabel(createdAt) {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
        return 'Monitoring start unavailable';
    }

    return `Monitoring since ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function getInitials(name) {
    return String(name || 'Doctor')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('');
}

function formatRelativeUpdate(date) {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
    });
}

function parseAppointmentDateTime(appointment) {
    if (!appointment || !appointment.date) {
        return null;
    }

    const timePart = appointment.time || '00:00';
    const parsed = new Date(`${appointment.date}T${timePart}`);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
}

function renderAppointmentItem(appointment) {
    const when = parseAppointmentDateTime(appointment);
    const dateLabel = when
        ? when.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : (appointment.date || 'Date not set');
    const timeLabel = appointment.time || 'Time not set';
    const patientName = appointment.patient_name || 'Unknown patient';
    const location = appointment.location || 'No location provided';
    const type = appointment.type || 'other';
    const status = appointment.status || 'upcoming';
    const normalizedStatus = String(status).toLowerCase();
    const isPast = normalizedStatus === 'completed' || normalizedStatus === 'cancelled' || Boolean(appointment.is_past);
    const encodedAppointmentId = encodeURIComponent(appointment.id || '');
    const encodedPatientId = encodeURIComponent(appointment.user_id || '');
    const showCompleteAction = normalizedStatus === 'upcoming';
    const statusClass = normalizedStatus === 'cancelled' ? 'missing' : normalizedStatus === 'completed' ? 'normal' : 'attention';
    const statusLabel = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    return `
        <article class="queue-item appointment-item appointment-item--${isPast ? 'past' : 'upcoming'}">
            <div class="queue-item__time">
                <strong>${escapeHtml(timeLabel)}</strong>
                <span>${escapeHtml(dateLabel)}</span>
            </div>
            <div class="queue-item__content">
                <div class="appointment-item__main">
                    <h3>${escapeHtml(appointment.title || 'Appointment')}</h3>
                    <p class="appointment-item__patient">${escapeHtml(patientName)} • ${escapeHtml(location)}</p>
                    <div class="queue-item__meta">
                        <span class="tag-pill">${escapeHtml(type)}</span>
                        <span class="status-pill ${getStatusBadgeClass(statusClass)}">${escapeHtml(statusLabel)}</span>
                    </div>
                </div>
                <div class="doctor-table__actions appointment-item__actions">
                    <button type="button" class="doctor-row-button" onclick="openPatientDetailsFromDashboard('${encodedPatientId}')">
                        Open patient
                    </button>
                    ${showCompleteAction ? `
                        <button type="button" class="doctor-row-button doctor-row-button--warn" onclick="completeAppointmentFromDashboard('${encodedAppointmentId}')">
                            Mark completed
                        </button>
                        <button type="button" class="doctor-row-button doctor-row-button--danger" onclick="cancelAppointmentFromDashboard('${encodedAppointmentId}')">
                            Mark cancelled
                        </button>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
}

window.openAppointmentPatient = function(encodedPatientId) {
    const patientId = decodeURIComponent(encodedPatientId || '');
    if (!patientId) {
        return;
    }

    const patient = doctorDashboardState.patients.find(item => String(item.id) === String(patientId));
    if (!patient) {
        doctorDashboardState.searchTerm = '';
        const searchInput = document.getElementById('patientSearch');
        if (searchInput) {
            searchInput.value = '';
        }
        applyPatientFilters();
        renderPatients();
        setStatusBanner('Patient card is not available in the current list.', 'info');
        return;
    }

    doctorDashboardState.activeTab = 'patients';
    switchTab('patients');
    setActiveRailButton('patients');
    doctorDashboardState.searchTerm = patient.name;

    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.value = patient.name;
    }

    applyPatientFilters();
    renderPatients();

    const workspace = document.getElementById('workspace');
    if (workspace) {
        workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.completeAppointmentFromDashboard = async function(encodedAppointmentId) {
    const appointmentId = decodeURIComponent(encodedAppointmentId || '');
    if (!appointmentId) {
        return;
    }

    try {
        await updateDoctorAppointmentStatus(appointmentId, 'completed');
        await refreshDoctorAppointments();
        renderAppointments();
        setStatusBanner('Appointment marked as completed.', 'info');
    } catch (error) {
        console.error('Unable to update appointment status:', error);
        setStatusBanner('Unable to update appointment status right now.', 'warning');
    }
};

window.cancelAppointmentFromDashboard = async function(encodedAppointmentId) {
    const appointmentId = decodeURIComponent(encodedAppointmentId || '');
    if (!appointmentId) {
        return;
    }

    try {
        await updateDoctorAppointmentStatus(appointmentId, 'cancelled');
        await refreshDoctorAppointments();
        renderAppointments();
        setStatusBanner('Appointment marked as cancelled.', 'info');
    } catch (error) {
        console.error('Unable to update appointment status:', error);
        setStatusBanner('Unable to update appointment status right now.', 'warning');
    }
};

function renderAppointments() {
    const upcomingList = document.getElementById('upcomingAppointmentsList');
    const pastList = document.getElementById('pastAppointmentsList');
    const upcomingCount = document.getElementById('upcomingAppointmentsCount');
    const pastCount = document.getElementById('pastAppointmentsCount');

    if (!upcomingList || !pastList || !upcomingCount || !pastCount) {
        return;
    }

    const upcomingAppointments = doctorDashboardState.upcomingAppointments || [];
    const pastAppointments = doctorDashboardState.pastAppointments || [];

    upcomingCount.textContent = String(upcomingAppointments.length);
    pastCount.textContent = String(pastAppointments.length);

    if (!upcomingAppointments.length) {
        upcomingList.innerHTML = `
            <div class="empty-state py-3">
                <i class="bi bi-calendar-event"></i>
                <h3>No upcoming appointments</h3>
                <p>Appointments assigned to your account will appear here.</p>
            </div>
        `;
    } else {
        upcomingList.innerHTML = upcomingAppointments.slice(0, 8).map(renderAppointmentItem).join('');
    }

    if (!pastAppointments.length) {
        pastList.innerHTML = `
            <div class="empty-state py-3">
                <i class="bi bi-clock-history"></i>
                <h3>No past appointments</h3>
                <p>Completed and historical appointments will show here.</p>
            </div>
        `;
    } else {
        pastList.innerHTML = pastAppointments.slice(0, 8).map(renderAppointmentItem).join('');
    }
}

function calculateAverageGlucose(patients) {
    const glucoseValues = patients
        .map(patient => patient.metrics.find(metric => metric.key === 'glucose'))
        .filter(metric => metric && metric.display !== 'No data')
        .map(metric => Number(metric.display));

    if (!glucoseValues.length) {
        return '--';
    }

    return `${Math.round(glucoseValues.reduce((total, value) => total + value, 0) / glucoseValues.length)} mg/dL`;
}

function buildCareQueue(patients) {
    const prioritizedPatients = patients.slice(0, 6);

    return prioritizedPatients.map((patient, index) => {
        const queueType = patient.priority === 'high'
            ? 'Escalation review'
            : patient.priority === 'medium'
                ? 'Trend review'
                : 'Routine follow-up';

        const mode = patient.priority === 'high'
            ? 'Telehealth escalation'
            : index % 2 === 0
                ? 'Clinic room 2'
                : 'Remote review';

        return {
            ...patient,
            time: queueTimes[index % queueTimes.length],
            dayLabel: index < 4 ? 'Today' : 'Next block',
            queueType,
            mode
        };
    });
}

function applyPatientFilters() {
    const normalizedQuery = doctorDashboardState.searchTerm.trim().toLowerCase();

    doctorDashboardState.filteredPatients = doctorDashboardState.patients.filter(patient => {
        const matchesSearch = !normalizedQuery || [patient.name, patient.email, patient.code]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);

        const matchesFilter = doctorDashboardState.activeFilter === 'all'
            || (doctorDashboardState.activeFilter === 'attention' && patient.priority !== 'low')
            || (doctorDashboardState.activeFilter === 'stable' && patient.priority === 'low');

        return matchesSearch && matchesFilter;
    });
}

function setStatusBanner(message, tone) {
    const banner = document.getElementById('dashboardStatus');
    banner.hidden = false;
    banner.className = `doctor-status-banner doctor-status-banner--${tone}`;
    banner.textContent = message;
}

function clearStatusBanner() {
    const banner = document.getElementById('dashboardStatus');
    banner.hidden = true;
    banner.textContent = '';
    banner.className = 'doctor-status-banner';
}

function renderDoctorProfile() {
    const doctor = doctorDashboardState.doctor || getStoredDoctorFallback();
    const doctorName = doctor.name || 'Doctor';
    const doctorEmail = doctor.email || 'doctor@healio.app';
    const doctorSpecialty = doctor.specialty || '';
    const doctorMeta = [doctorSpecialty, doctorEmail].filter(Boolean).join(' • ') || 'Doctor profile';

    document.getElementById('doctorName').textContent = doctorName;
    document.getElementById('doctorEmail').textContent = doctorMeta;
    const doctorInitials = getInitials(doctorName);
    document.getElementById('doctorAvatar').textContent = doctorInitials;

    const sidebarName = document.getElementById('sidebarDoctorName');
    const sidebarEmail = document.getElementById('sidebarDoctorEmail');
    const sidebarAvatar = document.getElementById('sidebarDoctorAvatar');

    if (sidebarName) {
        sidebarName.textContent = doctorName;
    }

    if (sidebarEmail) {
        sidebarEmail.textContent = doctorEmail;
    }

    if (sidebarAvatar) {
        sidebarAvatar.textContent = doctorInitials;
    }
}

function renderOverview() {
    const patients = doctorDashboardState.patients;
    const needingReview = patients.filter(patient => patient.priority !== 'low').length;
    const highPriority = patients.filter(patient => patient.priority === 'high').length;
    const trackedReadings = patients.reduce((total, patient) => total + patient.dataCoverage, 0);
    const averageGlucose = calculateAverageGlucose(patients);

    document.getElementById('totalPatientsStat').textContent = String(patients.length);
    document.getElementById('totalPatientsTrend').textContent = patients.length
        ? `${patients.filter(patient => patient.active).length} active patient records`
        : 'No patient records available';

    document.getElementById('attentionPatientsStat').textContent = String(needingReview);
    document.getElementById('attentionPatientsTrend').textContent = highPriority
        ? `${highPriority} immediate review${highPriority === 1 ? '' : 's'} queued first`
        : 'No immediate reviews at the moment';

    document.getElementById('averageGlucoseStat').textContent = averageGlucose;
    document.getElementById('averageGlucoseTrend').textContent = averageGlucose === '--'
        ? 'No glucose summaries available yet'
        : '30 day average across available glucose summaries';

    document.getElementById('trackedReadingsStat').textContent = trackedReadings.toLocaleString();
    document.getElementById('trackedReadingsTrend').textContent = trackedReadings
        ? 'Monthly summary coverage across monitored metrics'
        : 'Waiting for biometric summary coverage';
}

function renderHeroPanel() {
    const nextQueueItem = doctorDashboardState.queue[0];
    const urgentCount = doctorDashboardState.patients.filter(patient => patient.priority === 'high').length;

    if (nextQueueItem) {
        document.getElementById('nextReviewTitle').textContent = `${nextQueueItem.time} ${nextQueueItem.name}`;
        document.getElementById('nextReviewSubtitle').textContent = `${nextQueueItem.queueType} for ${nextQueueItem.focus.toLowerCase()}. ${nextQueueItem.summaryText}`;
    } else {
        document.getElementById('nextReviewTitle').textContent = 'No patient reviews queued yet';
        document.getElementById('nextReviewSubtitle').textContent = 'Add patients or wait for summary data to build the next review block.';
    }

    document.getElementById('queueLoadText').textContent = `${doctorDashboardState.queue.length} review${doctorDashboardState.queue.length === 1 ? '' : 's'}`;
    document.getElementById('lastUpdatedText').textContent = doctorDashboardState.lastUpdated
        ? formatRelativeUpdate(doctorDashboardState.lastUpdated)
        : 'Just now';

    const badge = document.getElementById('doctorNotificationBadge');
    const railAlertDot = document.getElementById('railAlertDot');

    if (urgentCount > 0) {
        badge.textContent = urgentCount > 99 ? '99+' : String(urgentCount);
        badge.style.display = 'flex';
        railAlertDot.hidden = false;
    } else {
        badge.style.display = 'none';
        railAlertDot.hidden = true;
    }
}

function renderAttentionBanner() {
    const flaggedPatients = doctorDashboardState.patients.filter(patient => patient.priority !== 'low');
    const headline = document.getElementById('attentionHeadline');
    const subtext = document.getElementById('attentionSubtext');
    const badges = document.getElementById('attentionBadges');

    if (!flaggedPatients.length) {
        headline.textContent = 'No urgent patients right now';
        subtext.textContent = 'High-priority patients will surface here when alerts or biometrics drift beyond safe ranges.';
        badges.innerHTML = '<span class="tag-pill">No active escalations</span>';
        return;
    }

    headline.textContent = `${flaggedPatients.length} patient${flaggedPatients.length === 1 ? '' : 's'} require attention`;
    subtext.textContent = 'Patients are ranked using alert counts first, then recent summary trends.';
    badges.innerHTML = flaggedPatients.slice(0, 5).map(patient => {
        const label = patient.alertCount > 0
            ? `${patient.name} (${patient.alertCount} alert${patient.alertCount === 1 ? '' : 's'})`
            : `${patient.name} (${patient.focus})`;
        return `<span class="alert-pill">${escapeHtml(label)}</span>`;
    }).join('');
}

function renderPatients() {
    const tableBody = document.getElementById('patientTableBody');
    const grid = document.getElementById('patientGrid');

    if (!tableBody && !grid) {
        return;
    }

    if (!doctorDashboardState.patients.length) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr class="doctor-table-empty">
                    <td colspan="7">No patients are assigned to this doctor yet.</td>
                </tr>
            `;
        }

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="bi bi-people"></i>
                    <h3>No patients available yet</h3>
                    <p>Once patient accounts are assigned to this doctor, their monitoring cards will appear here.</p>
                </div>
            `;
        }

        return;
    }

    if (!doctorDashboardState.filteredPatients.length) {
        if (tableBody) {
            tableBody.innerHTML = `
                <tr class="doctor-table-empty">
                    <td colspan="7">No patients match this filter. Try another search or status view.</td>
                </tr>
            `;
        }

        if (grid) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="bi bi-search"></i>
                    <h3>No patients match this view</h3>
                    <p>Try adjusting the search query or switching between stable and needs-review filters.</p>
                </div>
            `;
        }

        return;
    }

    if (tableBody) {
        tableBody.innerHTML = doctorDashboardState.filteredPatients.map(patient => renderPatientRow(patient)).join('');
    }

    if (grid) {
        grid.innerHTML = doctorDashboardState.filteredPatients.map(patient => renderPatientCard(patient)).join('');
    }
}

function renderPatientRow(patient) {
    const priorityClass = getStatusBadgeClass(patient.priority === 'low' ? 'normal' : patient.priority === 'medium' ? 'attention' : 'critical');
    const alertLabel = patient.alertCount > 0
        ? `${patient.alertCount} Alert${patient.alertCount === 1 ? '' : 's'}`
        : 'On track';

    let actionClass = 'doctor-row-button';
    let actionLabel = 'Open card';

    if (patient.priority === 'high') {
        actionClass = 'doctor-row-button doctor-row-button--danger';
        actionLabel = 'Escalate';
    } else if (patient.priority === 'medium') {
        actionClass = 'doctor-row-button doctor-row-button--warn';
        actionLabel = 'Review';
    }

    const encodedPatientId = encodeURIComponent(patient.id);
    const actionHandler = patient.priority === 'high'
        ? `escalatePatientFromDashboard('${encodedPatientId}')`
        : `openPatientDetailsFromDashboard('${encodedPatientId}')`;

    return `
        <tr>
            <td>
                <div class="doctor-table__patient">
                    <span class="doctor-table__avatar">${escapeHtml(getInitials(patient.name))}</span>
                    <div class="doctor-table__meta">
                        <button type="button" class="doctor-link-button" onclick="openPatientDetailsFromDashboard('${encodedPatientId}')">${escapeHtml(patient.name)}</button>
                        <span>${escapeHtml(patient.code)}</span>
                    </div>
                </div>
            </td>
            <td>${escapeHtml(patient.email)}</td>
            <td><span class="status-pill ${priorityClass}">${escapeHtml(alertLabel)}</span></td>
            <td>${escapeHtml(patient.focus)}</td>
            <td>${escapeHtml(patient.summaryText)}</td>
            <td><span class="tag-pill">${escapeHtml(patient.monitoringLabel)}</span></td>
            <td>
                <div class="doctor-table__actions">
                    <button type="button" class="${actionClass}" onclick="${actionHandler}">${escapeHtml(actionLabel)}</button>
                </div>
            </td>
        </tr>
    `;
}

function renderPatientCard(patient) {
    const priorityClass = `patient-card--${patient.priority}`;
    const priorityBadgeClass = getStatusBadgeClass(patient.priority === 'low' ? 'normal' : patient.priority === 'medium' ? 'attention' : 'critical');
    const alertLabel = patient.alertCount > 0
        ? `${patient.alertCount} Alert${patient.alertCount === 1 ? '' : 's'}`
        : 'On track';
    const encodedPatientId = encodeURIComponent(patient.id);

    return `
        <article class="patient-card ${priorityClass}">
            <div class="patient-card__header">
                <div class="patient-card__identity">
                    <div class="patient-card__avatar">${escapeHtml(getInitials(patient.name))}</div>
                    <div>
                        <h3><button type="button" class="doctor-link-button" onclick="openPatientDetailsFromDashboard('${encodedPatientId}')">${escapeHtml(patient.name)}</button></h3>
                        <p>${escapeHtml(patient.email)}</p>
                        <div class="patient-card__badges">
                            <span class="tag-pill">${escapeHtml(patient.code)}</span>
                            <span class="tag-pill">${escapeHtml(patient.monitoringLabel)}</span>
                        </div>
                    </div>
                </div>

                <div class="patient-card__priority">
                    <span class="status-pill ${priorityBadgeClass}">${escapeHtml(alertLabel)}</span>
                    <span>${escapeHtml(patient.priorityLabel)}</span>
                </div>
            </div>

            <div class="patient-card__metrics">
                ${patient.metrics.map(metric => renderMetricCard(metric)).join('')}
            </div>

            <div class="patient-card__footer">
                <div>
                    <strong>Care focus</strong>
                    <p>${escapeHtml(patient.focus)}</p>
                </div>
                <div>
                    <strong>Summary coverage</strong>
                    <p>${escapeHtml(patient.summaryText)}</p>
                </div>
            </div>
        </article>
    `;
}

function renderMetricCard(metric) {
    return `
        <section class="patient-metric patient-metric--${metric.key}">
            <div class="patient-metric__top">
                <div>
                    <p class="patient-metric__label">${escapeHtml(metric.label)}</p>
                    <p class="patient-metric__value">${escapeHtml(metric.display)}${metric.display === 'No data' ? '' : ` <small>${escapeHtml(metric.unit)}</small>`}</p>
                </div>
                <div class="patient-metric__icon">
                    <i class="bi ${escapeHtml(metric.icon)}"></i>
                </div>
            </div>
            <span class="status-pill ${getStatusBadgeClass(metric.status)}">${escapeHtml(getMetricStatusLabel(metric.status))}</span>
            <div class="patient-metric__note">${escapeHtml(metric.note)}</div>
        </section>
    `;
}

function getStatusBadgeClass(status) {
    if (status === 'critical' || status === 'high') return 'status-pill--critical';
    if (status === 'attention' || status === 'medium') return 'status-pill--attention';
    if (status === 'missing') return 'status-pill--missing';
    return 'status-pill--normal';
}

function getMetricStatusLabel(status) {
    if (status === 'critical') return 'Critical';
    if (status === 'attention') return 'Watch';
    if (status === 'missing') return 'No data';
    return 'Normal';
}

function renderQueue() {
    const queueList = document.getElementById('queueList');
    const highCount = doctorDashboardState.queue.filter(item => item.priority === 'high').length;
    const mediumCount = doctorDashboardState.queue.filter(item => item.priority === 'medium').length;
    const lowCount = doctorDashboardState.queue.filter(item => item.priority === 'low').length;

    document.getElementById('queueHighCount').textContent = String(highCount);
    document.getElementById('queueMediumCount').textContent = String(mediumCount);
    document.getElementById('queueLowCount').textContent = String(lowCount);
    document.getElementById('queueTotalCount').textContent = String(doctorDashboardState.queue.length);

    if (!doctorDashboardState.queue.length) {
        queueList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar3"></i>
                <h3>No care queue available</h3>
                <p>Once patient summaries arrive, Healio will rank the next review block here.</p>
            </div>
        `;

        document.getElementById('queueFocusTitle').textContent = 'No focus area yet';
        document.getElementById('queueFocusCopy').textContent = 'Load patient summaries to surface the strongest care theme.';
        return;
    }

    queueList.innerHTML = doctorDashboardState.queue.map(item => `
        <article class="queue-item">
            <div class="queue-item__time">
                <strong>${escapeHtml(item.time)}</strong>
                <span>${escapeHtml(item.dayLabel)}</span>
            </div>

            <div class="queue-item__content">
                <h3>${escapeHtml(item.name)}</h3>
                <p>${escapeHtml(item.queueType)} for ${escapeHtml(item.focus.toLowerCase())}. ${escapeHtml(item.summaryText)}</p>
                <div class="queue-item__meta">
                    <span class="status-pill ${getStatusBadgeClass(item.priority)}">${escapeHtml(item.priorityLabel)}</span>
                    <span class="tag-pill">${escapeHtml(item.mode)}</span>
                    <span class="tag-pill">${escapeHtml(item.code)}</span>
                </div>
            </div>
        </article>
    `).join('');

    const focusItem = doctorDashboardState.queue[0];
    document.getElementById('queueFocusTitle').textContent = `${focusItem.name} sets the pace`;
    document.getElementById('queueFocusCopy').textContent = `${focusItem.focus} is the leading care theme. Start with the earliest high-priority review and work down the ranked queue.`;
}

function switchTab(tabName) {
    doctorDashboardState.activeTab = tabName;

    document.querySelectorAll('.doctor-tab').forEach(button => {
        const isActive = button.dataset.tab === tabName;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const patientsPanel = document.getElementById('patientsPanel');
    const queuePanel = document.getElementById('queuePanel');

    if (patientsPanel) {
        patientsPanel.hidden = tabName !== 'patients';
        patientsPanel.classList.toggle('active', tabName === 'patients');
    }

    if (queuePanel) {
        queuePanel.hidden = tabName !== 'queue';
        queuePanel.classList.toggle('active', tabName === 'queue');
    }
}

function setActiveRailButton(activeKey) {
    document.querySelectorAll('[data-rail-key]').forEach(button => {
        const isActive = button.dataset.railKey === activeKey;
        button.classList.toggle('rail-button--active', isActive);
        button.classList.toggle('doctor-nav__button--active', isActive);
        button.classList.toggle('active', isActive);
    });
}

function renderDashboard() {
    applyPatientFilters();
    doctorDashboardState.queue = buildCareQueue(doctorDashboardState.patients);
    doctorDashboardState.lastUpdated = new Date();

    renderDoctorProfile();
    renderOverview();
    renderHeroPanel();
    renderAttentionBanner();
    renderPatients();
    renderQueue();
    renderAppointments();
    switchTab(doctorDashboardState.activeTab);
}

function showLoadingState() {
    const tableBody = document.getElementById('patientTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
            <tr class="doctor-table-row--skeleton"><td colspan="7"></td></tr>
            <tr class="doctor-table-row--skeleton"><td colspan="7"></td></tr>
            <tr class="doctor-table-row--skeleton"><td colspan="7"></td></tr>
        `;
    }

    const patientGrid = document.getElementById('patientGrid');
    if (patientGrid) {
        patientGrid.innerHTML = `
            <article class="patient-card patient-card--skeleton"></article>
            <article class="patient-card patient-card--skeleton"></article>
            <article class="patient-card patient-card--skeleton"></article>
            <article class="patient-card patient-card--skeleton"></article>
        `;
    }

    const queueList = document.getElementById('queueList');
    if (queueList) {
        queueList.innerHTML = `
            <article class="queue-item queue-item--skeleton"></article>
            <article class="queue-item queue-item--skeleton"></article>
            <article class="queue-item queue-item--skeleton"></article>
        `;
    }
}

async function initializeDoctorDashboard() {
    if (!checkDoctorAuthentication() || doctorDashboardState.loading) {
        return;
    }

    let abortRender = false;
    doctorDashboardState.loading = true;
    showLoadingState();

    try {
        clearStatusBanner();

        const doctor = await loadCurrentDoctor();
        doctorDashboardState.doctor = doctor;

        const patients = await loadDoctorPatients();
        await refreshDoctorAppointments();
        doctorDashboardState.fallbackMode = false;

        if (patients.length) {
            doctorDashboardState.patients = await hydratePatients(patients);
        } else {
            doctorDashboardState.patients = [];
            setStatusBanner('No patients are currently available for this doctor account.', 'info');
        }
    } catch (error) {
        console.error('Doctor dashboard load failed:', error);

        if (error.code === 'SESSION_EXPIRED') {
            alert('Your session has expired. Please login again.');
            abortRender = true;
            window.logout();
            return;
        }

        doctorDashboardState.doctor = doctorDashboardState.doctor || getStoredDoctorFallback();
        doctorDashboardState.patients = await hydratePatients(demoPatients, true);
        doctorDashboardState.appointments = [];
        doctorDashboardState.upcomingAppointments = [];
        doctorDashboardState.pastAppointments = [];
        doctorDashboardState.fallbackMode = true;
        setStatusBanner('Live doctor data is unavailable. Showing a polished reference view with demo patients.', 'warning');
    } finally {
        if (!abortRender) {
            applyPatientFilters();
            renderDashboard();
        }
        doctorDashboardState.loading = false;
        updateRefreshButton(false);
    }
}

function updateRefreshButton(isLoading) {
    const button = document.getElementById('refreshDashboardButton');
    button.disabled = isLoading;
    button.classList.toggle('is-loading', isLoading);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getPatientModalInstance() {
    const modalElement = document.getElementById('patientDetailsModal');
    if (!modalElement || !window.bootstrap || !window.bootstrap.Modal) {
        return null;
    }

    return window.bootstrap.Modal.getOrCreateInstance(modalElement);
}

function formatVitalTimestamp(value) {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function extractLatestVitals(biometrics) {
    const latest = {};

    biometrics.forEach(entry => {
        const key = entry?.metric;
        if (!key || latest[key]) {
            return;
        }

        latest[key] = {
            value: entry.value,
            timestamp: entry.timestamp || entry.created_at || null
        };
    });

    return latest;
}

function formatVitalValue(metric, value) {
    if (value === null || value === undefined || value === '') {
        return 'No data';
    }

    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
        if (metric === 'sleep_hours') return `${numeric.toFixed(1)} hrs`;
        if (metric === 'steps') return `${Math.round(numeric).toLocaleString()} steps`;
        if (metric === 'calories') return `${Math.round(numeric).toLocaleString()} kcal`;
        if (metric === 'blood_glucose') return `${Math.round(numeric)} mg/dL`;
        if (metric === 'heart_rate') return `${Math.round(numeric)} bpm`;
        if (metric === 'blood_oxygen') return `${Math.round(numeric)}%`;
        return String(Math.round(numeric));
    }

    return String(value);
}

function renderPatientVitalsPanel(biometrics) {
    const container = document.getElementById('patientDetailVitals');
    if (!container) {
        return;
    }

    if (!Array.isArray(biometrics) || !biometrics.length) {
        container.innerHTML = '<p class="text-muted mb-0">No recent vitals available for this patient.</p>';
        return;
    }

    const latestVitals = extractLatestVitals(biometrics);
    const preferredMetrics = [
        ['heart_rate', 'Heart rate'],
        ['blood_glucose', 'Blood glucose'],
        ['blood_oxygen', 'Blood oxygen'],
        ['sleep_hours', 'Sleep'],
        ['steps', 'Steps'],
        ['calories', 'Calories']
    ];

    const metricCards = preferredMetrics
        .filter(([metricKey]) => latestVitals[metricKey])
        .map(([metricKey, label]) => {
            const vital = latestVitals[metricKey];
            return `
                <article class="doctor-patient-vital-card">
                    <h4>${escapeHtml(label)}</h4>
                    <p>${escapeHtml(formatVitalValue(metricKey, vital.value))}</p>
                    <span>${escapeHtml(formatVitalTimestamp(vital.timestamp))}</span>
                </article>
            `;
        });

    container.innerHTML = metricCards.length
        ? metricCards.join('')
        : '<p class="text-muted mb-0">No recent vitals available for this patient.</p>';
}

function renderPatientNotesPanel(notes) {
    const list = document.getElementById('patientNotesList');
    const count = document.getElementById('patientNotesCount');

    if (!list || !count) {
        return;
    }

    const normalizedNotes = Array.isArray(notes) ? notes : [];
    count.textContent = String(normalizedNotes.length);

    if (!normalizedNotes.length) {
        list.innerHTML = '<p class="text-muted mb-0">No notes yet for this patient.</p>';
        return;
    }

    list.innerHTML = normalizedNotes.map(note => `
        <article class="doctor-note-item">
            <p>${escapeHtml(note.note || '')}</p>
            <span>${escapeHtml(formatVitalTimestamp(note.created_at))}</span>
        </article>
    `).join('');
}

async function loadAndRenderPatientDetails(patientId) {
    const [biometrics, notesPayload] = await Promise.all([
        loadDoctorPatientBiometrics(patientId).catch(() => []),
        loadDoctorPatientNotes(patientId).catch(() => ({ notes: [] }))
    ]);

    renderPatientVitalsPanel(Array.isArray(biometrics) ? biometrics : []);
    renderPatientNotesPanel(Array.isArray(notesPayload?.notes) ? notesPayload.notes : []);
}

window.openPatientDetailsFromDashboard = async function(encodedPatientId) {
    const patientId = decodeURIComponent(encodedPatientId || '');
    if (!patientId) {
        return;
    }

    const patient = doctorDashboardState.patients.find(item => String(item.id) === String(patientId));
    const modal = getPatientModalInstance();
    if (!modal) {
        return;
    }

    doctorDashboardState.selectedPatientId = patientId;

    const title = document.getElementById('patientDetailsModalTitle');
    const subtitle = document.getElementById('patientDetailsModalSubtitle');
    const input = document.getElementById('patientNoteInput');

    if (title) {
        title.textContent = patient ? `${patient.name} Details` : 'Patient Details';
    }
    if (subtitle) {
        subtitle.textContent = patient
            ? `${patient.email || 'No email on file'} • ${patient.code || ''}`
            : 'Vitals and care notes';
    }
    if (input) {
        input.value = '';
    }

    const vitals = document.getElementById('patientDetailVitals');
    const notes = document.getElementById('patientNotesList');
    const notesCount = document.getElementById('patientNotesCount');

    if (vitals) {
        vitals.innerHTML = '<p class="text-muted mb-0">Loading vitals...</p>';
    }
    if (notes) {
        notes.innerHTML = '<p class="text-muted mb-0">Loading notes...</p>';
    }
    if (notesCount) {
        notesCount.textContent = '0';
    }

    modal.show();

    try {
        await loadAndRenderPatientDetails(patientId);
    } catch (error) {
        console.error('Unable to load patient details:', error);
        setStatusBanner('Unable to load full patient details right now.', 'warning');
    }
};

window.escalatePatientFromDashboard = async function(encodedPatientId) {
    const patientId = decodeURIComponent(encodedPatientId || '');
    if (!patientId) {
        return;
    }

    const patient = doctorDashboardState.patients.find(item => String(item.id) === String(patientId));

    try {
        await escalateDoctorPatient(patientId);
        setStatusBanner(`${patient?.name || 'Patient'} has been notified to book an appointment.`, 'info');
    } catch (error) {
        console.error('Unable to escalate patient:', error);
        setStatusBanner(error.message || 'Unable to notify patient right now.', 'warning');
    }
};

async function handlePatientNoteSave(event) {
    event.preventDefault();

    const patientId = doctorDashboardState.selectedPatientId;
    const input = document.getElementById('patientNoteInput');
    const saveButton = document.getElementById('savePatientNoteButton');
    if (!patientId || !input || !saveButton) {
        return;
    }

    const noteText = input.value.trim();
    if (!noteText) {
        setStatusBanner('Please enter a note before saving.', 'warning');
        return;
    }

    saveButton.disabled = true;
    const originalLabel = saveButton.textContent;
    saveButton.textContent = 'Saving...';

    try {
        await createDoctorPatientNote(patientId, noteText);
        input.value = '';
        await loadAndRenderPatientDetails(patientId);
        setStatusBanner('Patient note saved.', 'info');
    } catch (error) {
        console.error('Unable to save patient note:', error);
        setStatusBanner(error.message || 'Unable to save patient note.', 'warning');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = originalLabel;
    }
}

function setupEventListeners() {
    document.getElementById('logoutButton').addEventListener('click', () => window.logout());

    document.getElementById('refreshDashboardButton').addEventListener('click', async () => {
        updateRefreshButton(true);
        await initializeDoctorDashboard();
    });

    document.getElementById('patientSearch').addEventListener('input', event => {
        doctorDashboardState.searchTerm = event.target.value;
        applyPatientFilters();
        renderPatients();
    });

    document.querySelectorAll('.doctor-filter').forEach(button => {
        button.addEventListener('click', () => {
            doctorDashboardState.activeFilter = button.dataset.filter;
            document.querySelectorAll('.doctor-filter').forEach(filterButton => {
                filterButton.classList.toggle('active', filterButton === button);
            });
            applyPatientFilters();
            renderPatients();
        });
    });

    document.querySelectorAll('.doctor-tab').forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
            setActiveRailButton(button.dataset.tab === 'queue' ? 'queue' : 'patients');
        });
    });

    document.querySelectorAll('[data-rail-target]').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.railTarget;
            const tabName = button.dataset.railTab;

            if (tabName) {
                switchTab(tabName);
            }

            const target = document.getElementById(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            setActiveRailButton(button.dataset.railKey || 'dashboard');
        });
    });

    const noteForm = document.getElementById('patientNoteForm');
    if (noteForm) {
        noteForm.addEventListener('submit', handlePatientNoteSave);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        setupEventListeners();
        await initializeDoctorDashboard();
    });
} else {
    setupEventListeners();
    initializeDoctorDashboard();
}