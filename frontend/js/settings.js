// Store allergies array
let allergies = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadCurrentUser();
    loadUserProfile();
    loadNotificationPreferences();
    setupAllergyHandlers();
    setupHeightWeightHandlers();
    setupToggleButton();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
        window.location.href = 'login-v2.html';
        return false;
    }
    return true;
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Load current user info for sidebar
async function loadCurrentUser() {
    try {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
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

// Load user profile data
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            
            // Populate basic fields
            document.getElementById('profileName').value = data.name || '';
            document.getElementById('profileEmail').value = data.email || '';
            document.getElementById('profilePhone').value = data.phone || '';
            
            // Access profile object if it exists
            const profile = data.profile || {};
            
            // Format date of birth if exists
            if (profile.date_of_birth) {
                const dob = new Date(profile.date_of_birth);
                const formattedDob = dob.toISOString().split('T')[0];
                document.getElementById('profileDob').value = formattedDob;
            }
            
            // Additional fields from profile
            if (profile.gender) document.getElementById('profileGender').value = profile.gender;
            if (profile.blood_type) document.getElementById('profileBloodType').value = profile.blood_type;
            if (profile.address) document.getElementById('profileAddress').value = profile.address;
            if (profile.height) document.getElementById('profileHeight').value = profile.height;
            if (profile.weight) document.getElementById('profileWeight').value = profile.weight;
            
            // Calculate and display BMI if height and weight exist
            if (profile.height && profile.weight) {
                calculateBMI();
            }
            
            // Load allergies
            if (profile.allergies && Array.isArray(profile.allergies)) {
                allergies = profile.allergies;
                displayAllergies();
            }
            
            // Emergency contact
            if (profile.emergency_contact) {
                document.getElementById('emergencyName').value = profile.emergency_contact.name || '';
                document.getElementById('emergencyRelation').value = profile.emergency_contact.relationship || '';
                document.getElementById('emergencyPhone').value = profile.emergency_contact.phone || '';
            }
            
            // Check if we should auto-expand extended fields
            checkAndAutoExpandFields();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile data');
    }
}

// Load notification preferences from localStorage
function loadNotificationPreferences() {
    const prefs = localStorage.getItem(CONFIG.STORAGE_KEYS.NOTIFICATION_PREFS);
    
    if (prefs) {
        try {
            const preferences = JSON.parse(prefs);
            document.getElementById('emailNotifications').checked = preferences.email !== false;
            document.getElementById('pushNotifications').checked = preferences.push !== false;
            document.getElementById('reminderAlerts').checked = preferences.reminders !== false;
            document.getElementById('weeklyReports').checked = preferences.weekly !== false;
        } catch (error) {
            console.error('Error loading preferences:', error);
            // Set defaults
            setDefaultNotifications();
        }
    } else {
        // Set defaults
        setDefaultNotifications();
    }
    
    // Attach change listeners
    document.getElementById('emailNotifications').addEventListener('change', saveNotificationPreferences);
    document.getElementById('pushNotifications').addEventListener('change', saveNotificationPreferences);
    document.getElementById('reminderAlerts').addEventListener('change', saveNotificationPreferences);
    document.getElementById('weeklyReports').addEventListener('change', saveNotificationPreferences);
}

// Set default notification preferences
function setDefaultNotifications() {
    document.getElementById('emailNotifications').checked = true;
    document.getElementById('pushNotifications').checked = true;
    document.getElementById('reminderAlerts').checked = true;
    document.getElementById('weeklyReports').checked = true;
}

// Save notification preferences
function saveNotificationPreferences() {
    const preferences = {
        email: document.getElementById('emailNotifications').checked,
        push: document.getElementById('pushNotifications').checked,
        reminders: document.getElementById('reminderAlerts').checked,
        weekly: document.getElementById('weeklyReports').checked
    };
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.NOTIFICATION_PREFS, JSON.stringify(preferences));
    showSuccess('Notification preferences saved');
}

// Handle profile form submission
document.getElementById('profileForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('profileName').value,
        email: document.getElementById('profileEmail').value,
        phone: document.getElementById('profilePhone').value,
        date_of_birth: document.getElementById('profileDob').value,
        gender: document.getElementById('profileGender').value,
        blood_type: document.getElementById('profileBloodType').value,
        address: document.getElementById('profileAddress').value,
        height: parseFloat(document.getElementById('profileHeight').value) || null,
        weight: parseFloat(document.getElementById('profileWeight').value) || null,
        allergies: allergies,
        emergency_contact: {
            name: document.getElementById('emergencyName').value,
            relationship: document.getElementById('emergencyRelation').value,
            phone: document.getElementById('emergencyPhone').value
        }
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showSuccess('Profile updated successfully!');
            
            // Update sidebar with new name
            document.getElementById('sidebarUserName').textContent = formData.name;
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, formData.name);
            
            // Update avatar
            const avatar = document.getElementById('sidebarUserAvatar');
            if (avatar) {
                avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=7c3aed&color=fff`;
            }
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile');
    }
});

// Confirm delete account
function confirmDeleteAccount() {
    const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.');
    
    if (confirmed) {
        const doubleConfirm = confirm('Please confirm again. This will permanently delete all your health data, medications, and account information.');
        
        if (doubleConfirm) {
            deleteAccount();
        }
    }
    
    return false;
}

// Delete account
async function deleteAccount() {
    try {
        const response = await fetch(`${API_BASE_URL}/patients/me`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            alert('Your account has been deleted successfully.');
            logout();
        } else {
            const error = await response.json();
            showError(error.detail || 'Failed to delete account');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showError('Failed to delete account');
    }
}

// Logout function
function logout() {
    localStorage.clear();
    window.location.href = 'login-v2.html';
}

// Show success message
function showSuccess(message) {
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

// Show error message
function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-danger position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Setup allergy handlers
function setupAllergyHandlers() {
    const addBtn = document.getElementById('addAllergyBtn');
    const input = document.getElementById('allergiesInput');
    
    addBtn.addEventListener('click', addAllergy);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addAllergy();
        }
    });
}

// Add allergy
function addAllergy() {
    const input = document.getElementById('allergiesInput');
    const allergy = input.value.trim();
    
    if (allergy && !allergies.includes(allergy)) {
        allergies.push(allergy);
        input.value = '';
        displayAllergies();
    }
}

// Display allergies
function displayAllergies() {
    const container = document.getElementById('allergiesList');
    container.innerHTML = '';
    
    allergies.forEach((allergy, index) => {
        const tag = document.createElement('span');
        tag.className = 'badge bg-light text-dark me-2 mb-2';
        tag.style.fontSize = '0.875rem';
        tag.innerHTML = `
            ${allergy}
            <button type="button" class="btn-close btn-close-sm ms-2" style="font-size: 0.6rem;" onclick="removeAllergy(${index})"></button>
        `;
        container.appendChild(tag);
    });
}

// Remove allergy
function removeAllergy(index) {
    allergies.splice(index, 1);
    displayAllergies();
}

// Setup height/weight handlers for BMI calculation
function setupHeightWeightHandlers() {
    const heightInput = document.getElementById('profileHeight');
    const weightInput = document.getElementById('profileWeight');
    
    heightInput.addEventListener('input', calculateBMI);
    weightInput.addEventListener('input', calculateBMI);
}

// Calculate BMI
function calculateBMI() {
    const height = parseFloat(document.getElementById('profileHeight').value);
    const weight = parseFloat(document.getElementById('profileWeight').value);
    const bmiField = document.getElementById('profileBMI');
    
    if (height > 0 && weight > 0) {
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        bmiField.value = bmi.toFixed(1);
    } else {
        bmiField.value = '';
    }
}

// Make removeAllergy available globally
window.removeAllergy = removeAllergy;

// Setup toggle button for extended fields
function setupToggleButton() {
    const toggleBtn = document.getElementById('toggleExtendedFields');
    const extendedFields = document.getElementById('extendedFields');
    const toggleIcon = document.getElementById('toggleIcon');
    const toggleText = document.getElementById('toggleText');
    
    toggleBtn.addEventListener('click', () => {
        const isHidden = extendedFields.style.display === 'none';
        
        if (isHidden) {
            extendedFields.style.display = 'block';
            toggleIcon.className = 'bi bi-chevron-up me-1';
            toggleText.textContent = 'Show Less Details';
        } else {
            extendedFields.style.display = 'none';
            toggleIcon.className = 'bi bi-chevron-down me-1';
            toggleText.textContent = 'Show More Details';
        }
    });
    
    // Auto-expand if user has medical info or emergency contact filled
    checkAndAutoExpandFields();
}

// Check if user has extended fields filled and auto-expand if so
function checkAndAutoExpandFields() {
    // Wait a bit for data to load
    setTimeout(() => {
        const hasHeight = document.getElementById('profileHeight').value;
        const hasWeight = document.getElementById('profileWeight').value;
        const hasAllergies = allergies.length > 0;
        const hasEmergencyContact = document.getElementById('emergencyName').value;
        
        if (hasHeight || hasWeight || hasAllergies || hasEmergencyContact) {
            const extendedFields = document.getElementById('extendedFields');
            const toggleIcon = document.getElementById('toggleIcon');
            const toggleText = document.getElementById('toggleText');
            
            extendedFields.style.display = 'block';
            toggleIcon.className = 'bi bi-chevron-up me-1';
            toggleText.textContent = 'Show Less Details';
        }
    }, 500);
}
