// Appointments & Calendar Management

// Global state
let currentDate = new Date(2026, 1, 11); // February 11, 2026 (matching the screenshot date)
let selectedDate = new Date(2026, 1, 11);
let appointments = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    await loadAppointments();
    renderCalendar();
    updateStats();
    setupEventListeners();
    
    // Set default date in form to selected date
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.valueAsDate = selectedDate;
    }
});

// Load user data
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
        } else {
            console.error('Failed to load user data');
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
    document.getElementById('topbarUserAvatar').src = avatarUrl;
    
    // Update sidebar avatar too
    const sidebarAvatar = document.querySelector('.sidebar-user img');
    if (sidebarAvatar) {
        sidebarAvatar.src = avatarUrl;
    }
}

// Load appointments from API
async function loadAppointments() {
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            appointments = data.appointments || [];
        } else {
            // If endpoint doesn't exist yet, use sample data
            appointments = getSampleAppointments();
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        // Use sample data for now
        appointments = getSampleAppointments();
    }
    
    // Update the UI after loading appointments
    displayAppointmentsForDate(selectedDate);
    updateAppointmentsTable();
}

// Sample appointments for testing
function getSampleAppointments() {
    return [
        {
            id: '1',
            title: 'Annual Physical Checkup',
            type: 'checkup',
            date: '2026-02-15',
            time: '10:00',
            doctor: 'Dr. Sarah Williams',
            location: 'City Medical Center',
            status: 'upcoming',
            notes: 'Bring previous test results'
        },
        {
            id: '2',
            title: 'Dental Cleaning',
            type: 'dental',
            date: '2026-02-20',
            time: '14:30',
            doctor: 'Dr. Michael Chen',
            location: 'Smile Dental Clinic',
            status: 'upcoming',
            notes: ''
        },
        {
            id: '3',
            title: 'Blood Test',
            type: 'lab',
            date: '2026-02-10',
            time: '08:00',
            doctor: 'Lab Technician',
            location: 'HealthCare Labs',
            status: 'completed',
            notes: 'Fasting required'
        }
    ];
}

// Render calendar
function renderCalendar() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Update month display
    document.getElementById('currentMonth').textContent = 
        `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get previous month's last days
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayDiv = createDayElement(day, 'other-month');
        calendarDays.appendChild(dayDiv);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayDiv = createDayElement(day, '', date);
        calendarDays.appendChild(dayDiv);
    }
    
    // Add next month's days to fill the grid
    const totalCells = calendarDays.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayElement(day, 'other-month');
        calendarDays.appendChild(dayDiv);
    }
}

// Create day element
function createDayElement(day, className = '', date = null) {
    const dayDiv = document.createElement('div');
    dayDiv.className = `calendar-day ${className}`;
    dayDiv.textContent = day;
    
    if (date) {
        // Check if today
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayDiv.classList.add('today');
        }
        
        // Check if selected
        if (date.toDateString() === selectedDate.toDateString()) {
            dayDiv.classList.add('selected');
        }
        
        // Check if has appointments
        if (hasAppointmentOnDate(date)) {
            dayDiv.classList.add('has-appointment');
        }
        
        // Add click handler
        dayDiv.addEventListener('click', () => selectDate(date));
    }
    
    return dayDiv;
}

// Check if date has appointments
function hasAppointmentOnDate(date) {
    const dateString = formatDateForComparison(date);
    return appointments.some(apt => apt.date === dateString);
}

// Format date for comparison (YYYY-MM-DD)
function formatDateForComparison(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Select date
function selectDate(date) {
    selectedDate = date;
    renderCalendar();
    displayAppointmentsForDate(date);
    
    // Update form date
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.valueAsDate = date;
    }
}

// Display appointments for selected date
function displayAppointmentsForDate(date) {
    const dateString = formatDateForComparison(date);
    const dayAppointments = appointments.filter(apt => apt.date === dateString);
    
    const container = document.getElementById('upcomingAppointments');
    const emptyState = document.getElementById('emptyState');
    
    if (dayAppointments.length === 0) {
        emptyState.style.display = 'block';
        // Remove any existing appointment cards
        container.querySelectorAll('.appointment-card').forEach(card => card.remove());
    } else {
        emptyState.style.display = 'none';
        
        // Clear previous appointments
        container.querySelectorAll('.appointment-card').forEach(card => card.remove());
        
        // Add appointments
        dayAppointments.forEach(apt => {
            const card = createAppointmentCard(apt);
            container.insertBefore(card, emptyState);
        });
    }
}

// Create appointment card
function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = `appointment-card ${appointment.status}`;
    
    card.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-2">
            <div class="appointment-time">
                <i class="bi bi-clock me-1"></i>${appointment.time}
            </div>
            <span class="appointment-type-badge ${appointment.type}">${appointment.type}</span>
        </div>
        <div class="appointment-title">${appointment.title}</div>
        ${appointment.doctor ? `
            <div class="appointment-detail">
                <i class="bi bi-person"></i>
                <span>${appointment.doctor}</span>
            </div>
        ` : ''}
        ${appointment.location ? `
            <div class="appointment-detail">
                <i class="bi bi-geo-alt"></i>
                <span>${appointment.location}</span>
            </div>
        ` : ''}
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-primary me-2" onclick="editAppointment('${appointment.id}')">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteAppointment('${appointment.id}')">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Update appointments table
function updateAppointmentsTable() {
    const tbody = document.getElementById('appointmentsTableBody');
    
    if (appointments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    No appointments scheduled
                </td>
            </tr>
        `;
        return;
    }
    
    // Sort by date and time
    const sortedAppointments = [...appointments].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA - dateB;
    });
    
    tbody.innerHTML = sortedAppointments.map(apt => {
        const date = new Date(apt.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        return `
            <tr>
                <td>
                    <div class="fw-semibold">${formattedDate}</div>
                    <div class="small text-muted">${apt.time}</div>
                </td>
                <td>${apt.title}</td>
                <td><span class="appointment-type-badge ${apt.type}">${apt.type}</span></td>
                <td>
                    <div>${apt.doctor || '-'}</div>
                    <div class="small text-muted">${apt.location || '-'}</div>
                </td>
                <td><span class="status-badge ${apt.status}">${apt.status}</span></td>
                <td>
                    <button class="action-btn" onclick="editAppointment('${apt.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="action-btn" onclick="deleteAppointment('${apt.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Update stats
function updateStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Count this month's appointments
    const thisMonthCount = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate.getMonth() === currentMonth && 
               aptDate.getFullYear() === currentYear &&
               apt.status !== 'cancelled';
    }).length;
    
    // Count completed appointments
    const completedCount = appointments.filter(apt => apt.status === 'completed').length;
    
    document.getElementById('monthCount').textContent = thisMonthCount;
    document.getElementById('completedCount').textContent = completedCount;
}

// Setup event listeners
function setupEventListeners() {
    // Month navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        renderCalendar();
    });
    
    // Save appointment
    document.getElementById('saveAppointment').addEventListener('click', saveAppointment);
    
    // View all button
    document.getElementById('viewAllBtn').addEventListener('click', () => {
        document.getElementById('appointmentsTable').scrollIntoView({ behavior: 'smooth' });
    });
}

// Save appointment
async function saveAppointment() {
    const form = document.getElementById('appointmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const appointment = {
        id: Date.now().toString(),
        title: document.getElementById('appointmentTitle').value,
        type: document.getElementById('appointmentType').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        doctor: document.getElementById('appointmentDoctor').value,
        location: document.getElementById('appointmentLocation').value,
        notes: document.getElementById('appointmentNotes').value,
        reminder: document.getElementById('appointmentReminder').checked,
        status: 'upcoming'
    };
    
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointment)
        });
        
        if (response.ok) {
            const data = await response.json();
            appointments.push(data.appointment);
        } else {
            // If endpoint doesn't exist, just add locally
            appointments.push(appointment);
        }
    } catch (error) {
        console.error('Error saving appointment:', error);
        // Add locally anyway
        appointments.push(appointment);
    }
    
    // Update UI
    renderCalendar();
    displayAppointmentsForDate(selectedDate);
    updateAppointmentsTable();
    updateStats();
    
    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('addAppointmentModal'));
    modal.hide();
    form.reset();
    
    // Show success message
    showNotification('Appointment added successfully!', 'success');
}

// Edit appointment
function editAppointment(id) {
    const appointment = appointments.find(apt => apt.id === id);
    if (!appointment) return;
    
    // Populate form
    document.getElementById('appointmentTitle').value = appointment.title;
    document.getElementById('appointmentType').value = appointment.type;
    document.getElementById('appointmentDate').value = appointment.date;
    document.getElementById('appointmentTime').value = appointment.time;
    document.getElementById('appointmentDoctor').value = appointment.doctor || '';
    document.getElementById('appointmentLocation').value = appointment.location || '';
    document.getElementById('appointmentNotes').value = appointment.notes || '';
    document.getElementById('appointmentReminder').checked = appointment.reminder !== false;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addAppointmentModal'));
    modal.show();
    
    // Change save button to update
    const saveBtn = document.getElementById('saveAppointment');
    saveBtn.textContent = 'Update Appointment';
    saveBtn.onclick = () => updateAppointment(id);
}

// Update appointment
async function updateAppointment(id) {
    const form = document.getElementById('appointmentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const index = appointments.findIndex(apt => apt.id === id);
    if (index === -1) return;
    
    appointments[index] = {
        ...appointments[index],
        title: document.getElementById('appointmentTitle').value,
        type: document.getElementById('appointmentType').value,
        date: document.getElementById('appointmentDate').value,
        time: document.getElementById('appointmentTime').value,
        doctor: document.getElementById('appointmentDoctor').value,
        location: document.getElementById('appointmentLocation').value,
        notes: document.getElementById('appointmentNotes').value,
        reminder: document.getElementById('appointmentReminder').checked
    };
    
    // Update UI
    renderCalendar();
    displayAppointmentsForDate(selectedDate);
    updateAppointmentsTable();
    updateStats();
    
    // Close modal and reset
    const modal = bootstrap.Modal.getInstance(document.getElementById('addAppointmentModal'));
    modal.hide();
    form.reset();
    
    // Reset save button
    const saveBtn = document.getElementById('saveAppointment');
    saveBtn.textContent = 'Save Appointment';
    saveBtn.onclick = saveAppointment;
    
    showNotification('Appointment updated successfully!', 'success');
}

// Delete appointment
async function deleteAppointment(id) {
    if (!confirm('Are you sure you want to delete this appointment?')) {
        return;
    }
    
    const index = appointments.findIndex(apt => apt.id === id);
    if (index !== -1) {
        appointments.splice(index, 1);
        
        // Update UI
        renderCalendar();
        displayAppointmentsForDate(selectedDate);
        updateAppointmentsTable();
        updateStats();
        
        showNotification('Appointment deleted successfully!', 'success');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
