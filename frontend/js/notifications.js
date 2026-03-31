// Notifications/Reminders Page

// API_BASE_URL is imported from config.js
let reminders = [];
let patientAlerts = [];
let reminderDeleteModal = null;
let pendingReminderDeleteAction = null;

// Get auth token
function getAuthToken() {
    return localStorage.getItem('healio_access_token');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCurrentUser();
    setupReminderDeleteModal();
    loadReminders();
});

// Load patient alerts from API (includes doctor escalation alerts)
async function loadPatientAlerts() {
    const token = getAuthToken();
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}${CONFIG.ENDPOINTS.PATIENT_ALERTS}?acknowledged=false`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load alerts');
        }

        patientAlerts = await response.json();
    } catch (error) {
        console.error('Error loading patient alerts:', error);
        patientAlerts = [];
    }
}

function createEscalationAlertCard(alert) {
    const alertId = alert._id || alert.id || '';
    const createdAt = alert.created_at
        ? new Date(alert.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
        : 'Recently';

    return `
        <div class="section-card border-warning">
            <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="badge bg-warning-subtle text-warning border border-warning">doctor alert</span>
                        <small class="text-muted">${escapeHtml(createdAt)}</small>
                    </div>
                    <h5 class="mb-1"><i class="bi bi-megaphone me-2 text-warning"></i>Doctor Escalation</h5>
                    <p class="text-muted small mb-0">${escapeHtml(alert.message || 'Your doctor has asked you to book an appointment.')}</p>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="acknowledgePatientAlert('${alertId}')">Acknowledge</button>
            </div>
        </div>
    `;
}

async function acknowledgePatientAlert(alertId) {
    const token = getAuthToken();
    if (!token || !alertId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/alerts/${alertId}/acknowledge`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to acknowledge alert');
        }

        showToast('Alert acknowledged', 'success');
        await loadReminders();
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        showError('Failed to acknowledge alert');
    }
}

function setupReminderDeleteModal() {
    const modalElement = document.getElementById('deleteReminderConfirmModal');
    const confirmButton = document.getElementById('confirmDeleteReminderBtn');
    if (!modalElement || !confirmButton || !window.bootstrap || !window.bootstrap.Modal) {
        return;
    }

    reminderDeleteModal = bootstrap.Modal.getOrCreateInstance(modalElement);

    confirmButton.addEventListener('click', async () => {
        if (!pendingReminderDeleteAction) {
            reminderDeleteModal.hide();
            return;
        }

        confirmButton.disabled = true;
        const originalText = confirmButton.textContent;
        confirmButton.textContent = 'Deleting...';

        const action = pendingReminderDeleteAction;
        pendingReminderDeleteAction = null;

        try {
            await action();
        } finally {
            confirmButton.disabled = false;
            confirmButton.textContent = originalText;
            reminderDeleteModal.hide();
        }
    });

    modalElement.addEventListener('hidden.bs.modal', () => {
        pendingReminderDeleteAction = null;
    });
}

function openDeleteReminderConfirmation(title, message, onConfirm) {
    const titleElement = document.getElementById('deleteReminderConfirmTitle');
    const messageElement = document.getElementById('deleteReminderConfirmMessage');

    if (!reminderDeleteModal || !titleElement || !messageElement) {
        if (window.confirm(message)) {
            onConfirm();
        }
        return;
    }

    titleElement.textContent = title;
    messageElement.textContent = message;
    pendingReminderDeleteAction = onConfirm;
    reminderDeleteModal.show();
}

// Check authentication
function checkAuth() {
    const token = getAuthToken();
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
            // Update sidebar user info
            const nameEl = document.getElementById('sidebarUserName');
            const emailEl = document.getElementById('sidebarUserEmail');
            if (nameEl) nameEl.textContent = data.name || 'User';
            if (emailEl) emailEl.textContent = data.email || '';
            
            // Update avatar
            const avatars = document.querySelectorAll('img[alt="Profile"]');
            avatars.forEach(avatar => {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=7c3aed&color=fff`;
            });
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load reminders from API
async function loadReminders() {
    const token = getAuthToken();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/reminders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login-v2.html';
                return;
            }
            throw new Error('Failed to load reminders');
        }
        
        reminders = await response.json();
        await loadPatientAlerts();
        console.log('Loaded reminders:', reminders);
        displayActiveReminders();
        displayInactiveReminders();
    } catch (error) {
        console.error('Error loading reminders:', error);
        // Display error state instead of loading spinner
        const container = document.getElementById('activeRemindersContainer');
        container.innerHTML = `
            <div class="section-card text-center">
                <i class="bi bi-exclamation-triangle fs-1 text-warning mb-3 d-block"></i>
                <p class="text-muted mb-2">Failed to load reminders</p>
                <button class="btn btn-sm btn-primary" onclick="loadReminders()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// Display active reminders
function displayActiveReminders() {
    const container = document.getElementById('activeRemindersContainer');
    if (!container) {
        console.error('activeRemindersContainer not found');
        return;
    }
    
    const activeReminders = reminders.filter(r => r.active);
    const escalationAlerts = patientAlerts.filter(alert => {
        const metric = String(alert.metric || '').toLowerCase();
        return metric === 'doctor_escalation';
    });
    
    if (activeReminders.length === 0 && escalationAlerts.length === 0) {
        container.innerHTML = `
            <div class="section-card text-center">
                <i class="bi bi-bell-slash fs-1 text-muted mb-3 d-block"></i>
                <p class="text-muted mb-2">No active reminders</p>
                <p class="text-muted small">Click "Add Reminder" or "Auto-Generate" to create reminders</p>
            </div>
        `;
        return;
    }

    const alertCards = escalationAlerts.map(createEscalationAlertCard).join('');
    const reminderCards = activeReminders.map(reminder => createReminderCard(reminder)).join('');
    container.innerHTML = `${alertCards}${reminderCards}`;
}

// Display inactive reminders
function displayInactiveReminders() {
    const container = document.getElementById('inactiveRemindersContainer');
    const deleteInactiveBtn = document.getElementById('deleteInactiveBtn');
    if (!container) {
        console.error('inactiveRemindersContainer not found');
        return;
    }
    
    const inactiveReminders = reminders.filter(r => !r.active);
    
    if (inactiveReminders.length === 0) {
        if (deleteInactiveBtn) {
            deleteInactiveBtn.hidden = true;
        }
        container.innerHTML = `
            <div class="section-card text-center">
                <p class="text-muted mb-0">No inactive reminders</p>
            </div>
        `;
        return;
    }

    if (deleteInactiveBtn) {
        deleteInactiveBtn.hidden = false;
    }
    
    container.innerHTML = inactiveReminders.map(reminder => createReminderCard(reminder, false)).join('');
}

// Calculate completion rate
function calculateCompletionRate(history) {
    if (!history || history.length === 0) return 0;
    const completed = history.filter(h => h.completed).length;
    return Math.round((completed / history.length) * 100);
}

// Format history date for display (show last 2 digits of day)
function formatHistoryDate(dateStr) {
    // dateStr is in YYYY-MM-DD format
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return parts.length === 3 ? parts[2] : dateStr;
}

// Create reminder card HTML
function createReminderCard(reminder, showHistory = true) {
    const categoryColors = {
        medication: 'primary',
        exercise: 'success',
        measurement: 'warning',
        appointment: 'info',
        other: 'secondary'
    };
    
    const color = categoryColors[reminder.category] || 'secondary';
    const completionRate = calculateCompletionRate(reminder.history);
    
    // Check if completed today
    const today = new Date().toISOString().split('T')[0];
    const todayHistory = reminder.history?.find(h => h.date === today);
    const isCompletedToday = todayHistory?.completed || false;
    
    const actionsHtml = reminder.active
        ? `<button class="btn btn-sm btn-outline-secondary" onclick="toggleReminder('${reminder._id}')">Deactivate</button>`
        : `
            <div class="d-flex flex-column gap-2">
                <button class="btn btn-sm btn-outline-secondary" onclick="toggleReminder('${reminder._id}')">Activate</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteReminder('${reminder._id}')">Delete</button>
            </div>
        `;

    return `
        <div class="section-card ${isCompletedToday ? 'border-success' : ''}">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-start gap-3 flex-grow-1">
                    <div class="form-check mt-1">
                        <input class="form-check-input" type="checkbox" 
                               ${isCompletedToday ? 'checked' : ''} 
                               onchange="toggleTodayCompletion('${reminder._id}', this.checked)"
                               style="width: 24px; height: 24px; cursor: pointer;">
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 mb-2">
                            <i class="bi bi-bell text-primary"></i>
                            <h5 class="mb-0 ${isCompletedToday ? 'text-decoration-line-through text-muted' : ''}">${escapeHtml(reminder.title)}</h5>
                        </div>
                        <p class="text-muted small mb-3 ${isCompletedToday ? 'text-decoration-line-through' : ''}">${escapeHtml(reminder.description || '')}</p>
                        <div class="d-flex flex-wrap gap-2">
                            <span class="badge bg-light text-dark border">
                                <i class="bi bi-clock me-1"></i>${reminder.time}
                            </span>
                            <span class="badge bg-light text-dark border">${reminder.frequency}</span>
                            <span class="badge bg-${color}-subtle text-${color} border border-${color}">${reminder.category}</span>
                        </div>
                    </div>
                </div>
                ${actionsHtml}
            </div>
            
            ${showHistory && reminder.history && reminder.history.length > 0 ? `
                <div class="mt-4 pt-4 border-top">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <p class="text-muted small mb-0">Recent History (Last 7 Days)</p>
                        <p class="text-primary small fw-semibold mb-0">${completionRate}% completion rate</p>
                    </div>
                    <div class="d-flex gap-3">
                        ${reminder.history.slice(-7).map(h => `
                            <div class="text-center">
                                <div class="d-flex justify-content-center mb-2">
                                    ${h.completed ? 
                                        `<div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                            <i class="bi bi-check-circle-fill"></i>
                                        </div>` :
                                        `<div class="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
                                            <i class="bi bi-x-circle-fill"></i>
                                        </div>`
                                    }
                                </div>
                                <small class="text-muted">${formatHistoryDate(h.date)}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Toggle reminder active state
async function toggleReminder(id) {
    const token = getAuthToken();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/reminders/${id}/toggle`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to toggle reminder');
        }
        
        // Reload reminders
        await loadReminders();
        
        // Update notification badge
        if (typeof window.updateNotificationBadge === 'function') {
            window.updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error toggling reminder:', error);
        showError('Failed to toggle reminder');
    }
}

// Open add reminder modal
function openAddReminderModal() {
    const modal = new bootstrap.Modal(document.getElementById('addReminderModal'));
    document.getElementById('reminderForm').reset();
    modal.show();
}

// Save new reminder
async function saveReminder() {
    const title = document.getElementById('reminderTitle').value;
    const description = document.getElementById('reminderDescription').value;
    const time = document.getElementById('reminderTime').value;
    const frequency = document.getElementById('reminderFrequency').value;
    const category = document.getElementById('reminderCategory').value;
    
    if (!title || !time) {
        alert('Please fill in all required fields');
        return;
    }
    
    const token = getAuthToken();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/reminders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description: description || null,
                time,
                frequency,
                category,
                active: true
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create reminder');
        }
        
        // Reload reminders
        await loadReminders();
        
        // Update notification badge
        if (typeof window.updateNotificationBadge === 'function') {
            window.updateNotificationBadge();
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addReminderModal'));
        modal.hide();
    } catch (error) {
        console.error('Error creating reminder:', error);
        showError('Failed to create reminder');
    }
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

// Show error message
function showError(message) {
    showToast(message, 'danger');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>${escapeHtml(message)}
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Toggle today's completion status
async function toggleTodayCompletion(reminderId, isCompleted) {
    const token = getAuthToken();
    if (!token) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/reminders/${reminderId}/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                date: today,
                completed: isCompleted
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update completion status');
        }
        
        // Update local state
        const reminder = reminders.find(r => r._id === reminderId);
        if (reminder) {
            // Remove existing today entry if any
            reminder.history = reminder.history?.filter(h => h.date !== today) || [];
            // Add new entry
            reminder.history.push({ date: today, completed: isCompleted });
            // Re-render without full reload
            displayActiveReminders();
            displayInactiveReminders();
            
            // Update notification badge
            if (typeof window.updateNotificationBadge === 'function') {
                window.updateNotificationBadge();
            }
        }
    } catch (error) {
        console.error('Error updating completion:', error);
        showError('Failed to update completion status');
        // Reload to fix checkbox state
        await loadReminders();
    }
}

// Auto-generate reminders from medications and appointments
async function autoGenerateReminders(event) {
    const token = getAuthToken();
    if (!token) return;
    
    try {
        // Show loading
        const btn = event?.target?.closest('button') || event?.currentTarget;
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
        
        // Fetch medications and appointments
        const [medicationsRes, appointmentsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/patients/me/medications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_BASE_URL}/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        console.log('Medications response:', medicationsRes.status);
        console.log('Appointments response:', appointmentsRes.status);
        
        if (!medicationsRes.ok) {
            const medError = await medicationsRes.text();
            console.error('Medications error:', medError);
            throw new Error(`Failed to fetch medications: ${medicationsRes.status}`);
        }
        
        if (!appointmentsRes.ok) {
            const aptError = await appointmentsRes.text();
            console.error('Appointments error:', aptError);
            throw new Error(`Failed to fetch appointments: ${appointmentsRes.status}`);
        }
        
        const medications = await medicationsRes.json();
        const appointmentsData = await appointmentsRes.json();
        const appointments = appointmentsData.appointments || [];

        const activeMedications = medications.filter(m => m.active);
        const upcomingAppointments = appointments.filter(a => a.status === 'upcoming');

        const hasInactiveMedicationMatches = activeMedications.some((med) =>
            reminders.some((r) => r.category === 'medication' && !r.active && r.title.includes(med.name))
        );
        const hasInactiveAppointmentMatches = upcomingAppointments.some((apt) =>
            reminders.some((r) => r.category === 'appointment' && !r.active && r.title.includes(apt.title))
        );

        let shouldReactivateInactive = false;
        if (hasInactiveMedicationMatches || hasInactiveAppointmentMatches) {
            shouldReactivateInactive = window.confirm(
                'Inactive reminders were found for some medications or appointments. Click OK to reactivate them, or Cancel to generate new reminders.'
            );
        }
        
        let createdCount = 0;
        let reactivatedCount = 0;

        async function reactivateReminder(reminderId) {
            const toggleResponse = await fetch(`${API_BASE_URL}/patients/me/reminders/${reminderId}/toggle`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return toggleResponse.ok;
        }
        
        // Generate medication reminders
        for (const med of activeMedications) {
            const matchingReminders = reminders.filter(r =>
                r.category === 'medication' && r.title.includes(med.name)
            );
            const activeMatch = matchingReminders.find(r => r.active);
            const inactiveMatch = matchingReminders.find(r => !r.active);

            if (activeMatch) {
                continue;
            }

            if (inactiveMatch && shouldReactivateInactive) {
                const reactivated = await reactivateReminder(inactiveMatch._id);
                if (reactivated) {
                    reactivatedCount++;
                }
                continue;
            }

            // Parse time from time_of_day or use default
            let time = '09:00';
            if (med.time_of_day) {
                const timeMap = {
                    'morning': '08:00',
                    'afternoon': '14:00',
                    'evening': '18:00',
                    'night': '21:00'
                };
                const timeStr = med.time_of_day.toLowerCase();
                for (const [key, value] of Object.entries(timeMap)) {
                    if (timeStr.includes(key)) {
                        time = value;
                        break;
                    }
                }
            }

            const response = await fetch(`${API_BASE_URL}/patients/me/reminders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: `Take ${med.name}`,
                    description: `${med.dosage} - ${med.instructions || med.frequency}`,
                    time: time,
                    frequency: med.frequency.toLowerCase().includes('daily') ? 'daily' :
                        med.frequency.toLowerCase().includes('weekly') ? 'weekly' : 'daily',
                    category: 'medication',
                    active: true
                })
            });

            if (response.ok) {
                createdCount++;
            }
        }
        
        // Generate appointment reminders
        for (const apt of upcomingAppointments) {
            const matchingReminders = reminders.filter(r =>
                r.category === 'appointment' && r.title.includes(apt.title)
            );
            const activeMatch = matchingReminders.find(r => r.active);
            const inactiveMatch = matchingReminders.find(r => !r.active);

            if (activeMatch) {
                continue;
            }

            if (inactiveMatch && shouldReactivateInactive) {
                const reactivated = await reactivateReminder(inactiveMatch._id);
                if (reactivated) {
                    reactivatedCount++;
                }
                continue;
            }

            // Use appointment time or default to 1 hour before
            const aptTime = apt.time || '09:00';
            const [hours, minutes] = aptTime.split(':');
            const reminderHour = Math.max(0, parseInt(hours) - 1);
            const reminderTime = `${reminderHour.toString().padStart(2, '0')}:${minutes}`;

            const response = await fetch(`${API_BASE_URL}/patients/me/reminders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: `Appointment: ${apt.title}`,
                    description: `${apt.type} at ${apt.location || 'clinic'} - ${apt.date}`,
                    time: reminderTime,
                    frequency: 'as-needed',
                    category: 'appointment',
                    active: true
                })
            });

            if (response.ok) {
                createdCount++;
            }
        }
        
        // Restore button and show success
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        
        if (createdCount > 0 || reactivatedCount > 0) {
            const parts = [];
            if (createdCount > 0) {
                parts.push(`created ${createdCount}`);
            }
            if (reactivatedCount > 0) {
                parts.push(`reactivated ${reactivatedCount}`);
            }

            showToast(`Successfully ${parts.join(' and ')} reminder(s)!`, 'success');
            await loadReminders();
        } else {
            showToast('No changes made. Existing active reminders already cover your medications and appointments.', 'info');
        }
        
    } catch (error) {
        console.error('Error auto-generating reminders:', error);
        showToast(`Failed to generate reminders: ${error.message}`, 'danger');
        // Restore button
        if (event) {
            const btn = event.target?.closest('button') || event.currentTarget;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="bi bi-stars me-2"></i>Auto-Generate';
            }
        }
    }
}

// Delete a single reminder
async function deleteReminder(id) {
    const token = getAuthToken();
    if (!token) return;

    openDeleteReminderConfirmation(
        'Delete old reminder',
        'Delete this old reminder permanently?',
        async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/patients/me/reminders/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to delete reminder');
                }

                showToast('Reminder deleted', 'success');
                await loadReminders();

                if (typeof window.updateNotificationBadge === 'function') {
                    window.updateNotificationBadge();
                }
            } catch (error) {
                console.error('Error deleting reminder:', error);
                showError('Failed to delete reminder');
            }
        }
    );
}

// Delete all inactive reminders
async function deleteInactiveReminders() {
    const token = getAuthToken();
    if (!token) return;

    const inactiveReminders = reminders.filter(r => !r.active);
    if (!inactiveReminders.length) {
        showToast('No old reminders to delete', 'info');
        return;
    }

    openDeleteReminderConfirmation(
        'Delete old reminders',
        `Delete ${inactiveReminders.length} old reminder(s)? This cannot be undone.`,
        async () => {
            try {
                const results = await Promise.all(
                    inactiveReminders.map(reminder =>
                        fetch(`${API_BASE_URL}/patients/me/reminders/${reminder._id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        })
                    )
                );

                const failed = results.filter(response => !response.ok).length;
                const deleted = inactiveReminders.length - failed;

                if (deleted > 0) {
                    showToast(`Deleted ${deleted} old reminder(s)`, 'success');
                }
                if (failed > 0) {
                    showToast(`${failed} reminder(s) could not be deleted`, 'danger');
                }

                await loadReminders();

                if (typeof window.updateNotificationBadge === 'function') {
                    window.updateNotificationBadge();
                }
            } catch (error) {
                console.error('Error deleting old reminders:', error);
                showError('Failed to delete old reminders');
            }
        }
    );
}