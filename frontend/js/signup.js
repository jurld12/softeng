// API Configuration
const API_BASE_URL = 'http://127.0.0.1:5000';

// State
const allergies = [];

// DOM Elements
const signupForm = document.getElementById('signupForm');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrengthBar = document.getElementById('passwordStrengthBar');
const allergiesInput = document.getElementById('allergiesInput');
const addAllergyBtn = document.getElementById('addAllergyBtn');
const allergiesList = document.getElementById('allergiesList');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const submitSpinner = document.getElementById('submitSpinner');
const alertContainer = document.getElementById('alertContainer');
const assignedDoctorSelect = document.getElementById('assignedDoctor');
const assignedDoctorStatus = document.getElementById('assignedDoctorStatus');

async function loadAvailableDoctors() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/doctors`);

        if (!response.ok) {
            throw new Error('Failed to load doctors');
        }

        const doctors = await response.json();
        populateDoctorOptions(doctors);
    } catch (error) {
        console.error('Error loading doctors:', error);
        assignedDoctorSelect.innerHTML = '<option value="">No doctors available right now</option>';
        assignedDoctorSelect.disabled = true;
        assignedDoctorStatus.textContent = 'No active doctors are available yet. You can still create your account and choose later.';
    }
}

function formatDoctorLabel(doctor) {
    const specialty = doctor.specialty ? ` - ${doctor.specialty}` : '';
    const email = doctor.email ? ` - ${doctor.email}` : '';
    return `${doctor.name}${specialty}${email}`;
}

function populateDoctorOptions(doctors) {
    const options = ['<option value="">No doctor selected</option>'];

    doctors.forEach(doctor => {
        const doctorId = doctor.id || doctor._id;
        const label = formatDoctorLabel(doctor);
        options.push(`<option value="${doctorId}">${label}</option>`);
    });

    assignedDoctorSelect.innerHTML = options.join('');
    assignedDoctorSelect.disabled = doctors.length === 0;
    assignedDoctorStatus.textContent = doctors.length
        ? 'Choose the doctor who should be linked to your account.'
        : 'No active doctors are available yet. You can still create your account and choose later.';
}

// Password Strength Checker
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    passwordStrengthBar.className = 'password-strength-bar';
    
    if (strength === 0) {
        passwordStrengthBar.className = 'password-strength-bar';
    } else if (strength <= 2) {
        passwordStrengthBar.className = 'password-strength-bar strength-weak';
    } else if (strength === 3) {
        passwordStrengthBar.className = 'password-strength-bar strength-medium';
    } else {
        passwordStrengthBar.className = 'password-strength-bar strength-strong';
    }
});

// Allergy Management
function addAllergy() {
    const allergyText = allergiesInput.value.trim();
    
    if (!allergyText) {
        showAlert('Please enter an allergy', 'warning');
        return;
    }
    
    if (allergies.includes(allergyText)) {
        showAlert('This allergy is already added', 'warning');
        return;
    }
    
    allergies.push(allergyText);
    allergiesInput.value = '';
    renderAllergies();
}

function removeAllergy(index) {
    allergies.splice(index, 1);
    renderAllergies();
}

function renderAllergies() {
    if (allergies.length === 0) {
        allergiesList.innerHTML = '<span class="text-muted small">No allergies added yet</span>';
        return;
    }
    
    allergiesList.innerHTML = allergies.map((allergy, index) => `
        <span class="allergy-tag">
            ${allergy}
            <button type="button" onclick="window.removeAllergyAt(${index})" aria-label="Remove">
                <i class="bi bi-x"></i>
            </button>
        </span>
    `).join('');
}

// Expose removeAllergy to global scope for onclick
window.removeAllergyAt = removeAllergy;

addAllergyBtn.addEventListener('click', addAllergy);
allergiesInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addAllergy();
    }
});

// Alert Display
function showAlert(message, type = 'danger') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alert);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Form Validation
function validateForm(formData) {
    // Check password match
    if (formData.password !== formData.confirmPassword) {
        showAlert('Passwords do not match', 'danger');
        return false;
    }
    
    // Check password strength
    if (formData.password.length < 8) {
        showAlert('Password must be at least 8 characters long', 'danger');
        return false;
    }
    
    if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        showAlert('Password must contain both letters and numbers', 'danger');
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showAlert('Please enter a valid email address', 'danger');
        return false;
    }
    
    // Validate phone format (basic check)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
        showAlert('Please enter a valid phone number', 'danger');
        return false;
    }
    
    // Validate date of birth (must be at least 13 years old)
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    
    if (age < 13) {
        showAlert('You must be at least 13 years old to register', 'danger');
        return false;
    }
    
    return true;
}

// Form Submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect form data
    const emergencyName = document.getElementById('emergencyName').value.trim();
    const emergencyRelation = document.getElementById('emergencyRelation').value;
    const emergencyPhone = document.getElementById('emergencyPhone').value.trim();
    
    // Build emergency contact object only if at least one field is filled
    let emergencyContact = null;
    if (emergencyName || emergencyRelation || emergencyPhone) {
        emergencyContact = {
            name: emergencyName || null,
            relationship: emergencyRelation || null,
            phone: emergencyPhone || null
        };
    }
    
    const formData = {
        name: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        date_of_birth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value.trim(),
        blood_type: document.getElementById('bloodType').value || null,
        height: parseFloat(document.getElementById('height').value) || null,
        weight: parseFloat(document.getElementById('weight').value) || null,
        allergies: allergies.length > 0 ? allergies : null,
        emergency_contact: emergencyContact,
        assigned_doctor_id: assignedDoctorSelect.value || null,
        role: 'patient' // Default role for new signups
    };
    
    // Validate form
    if (!validateForm(formData)) {
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitText.classList.add('d-none');
    submitSpinner.classList.remove('d-none');
    
    try {
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...signupData } = formData;
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Registration failed');
        }
        
        // Success
        showAlert('Account created successfully! Redirecting to login...', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login-v2.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showAlert(error.message || 'Failed to create account. Please try again.', 'danger');
        
        // Reset button state
        submitBtn.disabled = false;
        submitText.classList.remove('d-none');
        submitSpinner.classList.add('d-none');
    }
});

// Initialize allergies list
renderAllergies();
loadAvailableDoctors();

// Check if already logged in
const token = localStorage.getItem('healio_access_token');
if (token) {
    // Already logged in, redirect to dashboard
    const role = localStorage.getItem('healio_user_role');
    if (role === 'patient') {
        window.location.href = 'dashboard-v2.html';
    } else if (role === 'doctor') {
        window.location.href = 'doctor-dashboard.html';
    } else if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    }
}
