// Modal instances
let medicationModal;
let deleteModal;
let currentMedicationId = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    initializeModals();
    loadCurrentUser();
    loadMedications();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('healio_access_token');
    if (!token) {
        window.location.href = 'login-v2.html';
        return;
    }
}

// Initialize Bootstrap modals
function initializeModals() {
    medicationModal = new bootstrap.Modal(document.getElementById('medicationModal'));
    deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
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
            document.getElementById('sidebarUserName').textContent = data.name || 'User';
            document.getElementById('sidebarUserEmail').textContent = data.email || '';
            
            // Update avatar
            const avatar = document.getElementById('sidebarUserAvatar');
            if (avatar) {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=7c3aed&color=fff`;
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load medications from API
async function loadMedications() {
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/patients/me/medications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const medications = await response.json();
            displayMedications(medications);
        } else {
            showError('Failed to load medications');
        }
    } catch (error) {
        console.error('Error loading medications:', error);
        showError('Error loading medications');
    }
}

// Display medications in the UI
function displayMedications(medications) {
    const activeMeds = medications.filter(med => med.active);
    const inactiveMeds = medications.filter(med => !med.active);

    // Display active medications
    const activeList = document.getElementById('activeMedicationsList');
    if (activeMeds.length === 0) {
        activeList.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-capsule fs-1 mb-3 d-block"></i>
                <p>No active medications</p>
                <button class="btn btn-primary" onclick="openAddModal()">
                    <i class="bi bi-plus-lg me-2"></i>Add Your First Medication
                </button>
            </div>
        `;
    } else {
        activeList.innerHTML = activeMeds.map(med => createMedicationCard(med)).join('');
        attachMedicationCardEvents();
    }

    // Display inactive medications
    const inactiveList = document.getElementById('inactiveMedicationsList');
    if (inactiveMeds.length === 0) {
        inactiveList.innerHTML = `
            <div class="col-12 text-center text-muted py-5">
                <i class="bi bi-archive fs-1 mb-3 d-block"></i>
                <p>No past medications</p>
            </div>
        `;
    } else {
        inactiveList.innerHTML = inactiveMeds.map(med => createMedicationCard(med)).join('');
        attachMedicationCardEvents();
    }
}

// Attach event listeners to medication card buttons
function attachMedicationCardEvents() {
    // Edit buttons
    document.querySelectorAll('.btn-edit-med').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const card = this.closest('[data-med-id]');
            const medId = card.getAttribute('data-med-id');
            openEditModal(medId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-delete-med').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const card = this.closest('[data-med-id]');
            const medId = card.getAttribute('data-med-id');
            const medName = card.getAttribute('data-med-name');
            openDeleteModal(medId, medName);
        });
    });
}

// Create medication card HTML
function createMedicationCard(medication) {
    console.log('Creating card for medication:', medication);
    const startDate = new Date(medication.start_date).toLocaleDateString();
    const endDate = medication.end_date ? new Date(medication.end_date).toLocaleDateString() : 'Ongoing';
    
    const medId = medication.id || medication._id;
    console.log('Using medication ID:', medId);
    
    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 ${!medication.active ? 'bg-light' : ''}" data-med-id="${escapeHtml(medId)}" data-med-name="${escapeHtml(medication.name)}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="card-title mb-0">${escapeHtml(medication.name)}</h5>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary btn-edit-med" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-delete-med" title="Delete">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="mb-2">
                        <span class="badge bg-primary">${escapeHtml(medication.dosage)}</span>
                        <span class="badge bg-secondary">${escapeHtml(medication.frequency)}</span>
                        ${medication.time_of_day ? `<span class="badge bg-info">${escapeHtml(medication.time_of_day)}</span>` : ''}
                    </div>
                    
                    ${medication.instructions ? `
                        <p class="card-text small text-muted mb-2">
                            <i class="bi bi-info-circle me-1"></i>${escapeHtml(medication.instructions)}
                        </p>
                    ` : ''}
                    
                    <div class="small text-muted">
                        <div><i class="bi bi-calendar-event me-1"></i>Started: ${startDate}</div>
                        ${medication.end_date ? `<div><i class="bi bi-calendar-x me-1"></i>Ends: ${endDate}</div>` : ''}
                    </div>
                    
                    <div class="mt-3">
                        ${medication.active 
                            ? '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Active</span>' 
                            : '<span class="badge bg-secondary"><i class="bi bi-archive me-1"></i>Inactive</span>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Open modal to add new medication
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Medication';
    document.getElementById('saveButtonText').textContent = 'Save Medication';
    document.getElementById('medicationForm').reset();
    document.getElementById('medicationId').value = '';
    
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('activeCheckbox').checked = true;
    
    medicationModal.show();
}

// Open modal to edit existing medication
async function openEditModal(medicationId) {
    try {
        const token = localStorage.getItem('healio_access_token');
        const response = await fetch(`${API_BASE_URL}/patients/me/medications/${medicationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const medication = await response.json();
            console.log('Loaded medication for editing:', medication);
            
            const medId = medication.id || medication._id;
            console.log('Using medication ID for edit:', medId);
            
            document.getElementById('modalTitle').textContent = 'Edit Medication';
            document.getElementById('saveButtonText').textContent = 'Update Medication';
            document.getElementById('medicationId').value = medId;
            document.getElementById('medicationName').value = medication.name;
            document.getElementById('dosage').value = medication.dosage;
            document.getElementById('frequency').value = medication.frequency;
            document.getElementById('timeOfDay').value = medication.time_of_day || '';
            document.getElementById('instructions').value = medication.instructions || '';
            document.getElementById('startDate').value = medication.start_date.split('T')[0];
            document.getElementById('endDate').value = medication.end_date ? medication.end_date.split('T')[0] : '';
            document.getElementById('activeCheckbox').checked = medication.active;
            
            medicationModal.show();
        } else {
            showError('Failed to load medication details');
        }
    } catch (error) {
        console.error('Error loading medication:', error);
        showError('Error loading medication details');
    }
}

// Save medication (create or update)
async function saveMedication() {
    const form = document.getElementById('medicationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const medicationId = document.getElementById('medicationId').value;
    const medicationData = {
        name: document.getElementById('medicationName').value,
        dosage: document.getElementById('dosage').value,
        frequency: document.getElementById('frequency').value,
        time_of_day: document.getElementById('timeOfDay').value || null,
        instructions: document.getElementById('instructions').value || null,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value || null,
        active: document.getElementById('activeCheckbox').checked
    };

    try {
        const token = localStorage.getItem('healio_access_token');
        const url = medicationId 
            ? `${API_BASE_URL}/patients/me/medications/${medicationId}`
            : `${API_BASE_URL}/patients/me/medications`;
        
        const method = medicationId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(medicationData)
        });

        if (response.ok) {
            medicationModal.hide();
            loadMedications();
            showSuccess(medicationId ? 'Medication updated successfully' : 'Medication added successfully');
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to save medication');
        }
    } catch (error) {
        console.error('Error saving medication:', error);
        showError('Error saving medication');
    }
}

// Open delete confirmation modal
function openDeleteModal(medicationId, medicationName) {
    console.log('openDeleteModal called with:', medicationId, medicationName);
    currentMedicationId = medicationId;
    document.getElementById('deleteItemName').textContent = medicationName;
    deleteModal.show();
}

// Confirm and delete medication
async function confirmDelete() {
    console.log('confirmDelete called with ID:', currentMedicationId);
    if (!currentMedicationId) {
        console.error('No medication ID set');
        return;
    }

    try {
        const token = localStorage.getItem('healio_access_token');
        const url = `${API_BASE_URL}/patients/me/medications/${currentMedicationId}`;
        console.log('Deleting medication at:', url);
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Delete response status:', response.status);
        
        if (response.ok) {
            deleteModal.hide();
            loadMedications();
            showSuccess('Medication deleted successfully');
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Delete failed:', errorData);
            showError(errorData.detail || 'Failed to delete medication');
        }
    } catch (error) {
        console.error('Error deleting medication:', error);
        showError('Error deleting medication');
    }
    
    currentMedicationId = null;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    // Create a simple toast notification
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

function logout() {
    localStorage.removeItem('healio_access_token');
    localStorage.removeItem('healio_user_id');
    localStorage.removeItem('healio_user_role');
    localStorage.removeItem('healio_user_name');
    window.location.href = 'login-v2.html';
}
