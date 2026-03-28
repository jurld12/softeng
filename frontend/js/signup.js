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
const termsCheck = document.getElementById('termsCheck');

signupForm.setAttribute('novalidate', 'novalidate');

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

function parseApiErrorMessage(payload, fallbackMessage = 'Registration failed.') {
    if (!payload) {
        return fallbackMessage;
    }

    if (typeof payload === 'string') {
        return payload;
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

            if (detailMessages.length > 0) {
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

// Form Validation
function clearValidationErrors() {
    signupForm.querySelectorAll('.is-invalid').forEach((field) => {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
    });

    signupForm.querySelectorAll('.validation-error-message').forEach((errorElement) => {
        errorElement.remove();
    });
}

function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) {
        return;
    }

    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');

    const feedback = document.createElement('div');
    feedback.className = 'invalid-feedback d-block validation-error-message';
    feedback.textContent = message;

    const inputGroup = field.closest('.input-group');
    if (inputGroup) {
        inputGroup.insertAdjacentElement('afterend', feedback);
    } else if (field.type === 'checkbox') {
        const formCheckContainer = field.closest('.form-check');
        if (formCheckContainer) {
            formCheckContainer.insertAdjacentElement('afterend', feedback);
        } else {
            field.insertAdjacentElement('afterend', feedback);
        }
    } else {
        field.insertAdjacentElement('afterend', feedback);
    }
}

function isAtLeastAge(dateString, minimumAge) {
    const dob = new Date(dateString);
    if (Number.isNaN(dob.getTime())) {
        return false;
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDifference = today.getMonth() - dob.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return age >= minimumAge;
}

function validateForm(formData) {
    clearValidationErrors();

    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;

    if (!formData.fullName) {
        errors.push({ fieldId: 'fullName', message: 'Full name is required.' });
    }

    if (!formData.email) {
        errors.push({ fieldId: 'email', message: 'Email address is required.' });
    } else if (!emailRegex.test(formData.email)) {
        errors.push({ fieldId: 'email', message: 'Please enter a valid email address.' });
    }

    if (!formData.phone) {
        errors.push({ fieldId: 'phone', message: 'Phone number is required.' });
    } else if (!phoneRegex.test(formData.phone)) {
        errors.push({ fieldId: 'phone', message: 'Please enter a valid phone number.' });
    }

    if (!formData.password) {
        errors.push({ fieldId: 'password', message: 'Password is required.' });
    } else {
        if (formData.password.length < 8) {
            errors.push({ fieldId: 'password', message: 'Password must be at least 8 characters long.' });
        }

        if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
            errors.push({ fieldId: 'password', message: 'Password must contain both letters and numbers.' });
        }
    }

    if (!formData.confirmPassword) {
        errors.push({ fieldId: 'confirmPassword', message: 'Please confirm your password.' });
    } else if (formData.password !== formData.confirmPassword) {
        errors.push({ fieldId: 'confirmPassword', message: 'Passwords do not match.' });
    }

    if (!formData.dateOfBirth) {
        errors.push({ fieldId: 'dateOfBirth', message: 'Date of birth is required.' });
    } else if (!isAtLeastAge(formData.dateOfBirth, 13)) {
        errors.push({ fieldId: 'dateOfBirth', message: 'You must be at least 13 years old to register.' });
    }

    if (!formData.gender) {
        errors.push({ fieldId: 'gender', message: 'Please select a gender.' });
    }

    if (!formData.address) {
        errors.push({ fieldId: 'address', message: 'Address is required.' });
    }

    if (!formData.termsAccepted) {
        errors.push({ fieldId: 'termsCheck', message: 'You must agree to the Terms of Service and Privacy Policy.' });
    }

    const fieldErrors = new Map();
    errors.forEach((error) => {
        if (!fieldErrors.has(error.fieldId)) {
            fieldErrors.set(error.fieldId, error.message);
        }
    });

    fieldErrors.forEach((message, fieldId) => setFieldError(fieldId, message));

    if (fieldErrors.size > 0) {
        showAlert('Please fix the highlighted fields before submitting.', 'danger');

        const firstInvalidField = signupForm.querySelector('.is-invalid');
        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus({ preventScroll: true });
        }

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
        fullName: document.getElementById('fullName').value.trim(),
        name: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        dateOfBirth: document.getElementById('dateOfBirth').value,
        date_of_birth: document.getElementById('dateOfBirth').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value.trim(),
        blood_type: document.getElementById('bloodType').value || null,
        height: parseFloat(document.getElementById('height').value) || null,
        weight: parseFloat(document.getElementById('weight').value) || null,
        allergies: allergies.length > 0 ? allergies : null,
        emergency_contact: emergencyContact,
        assigned_doctor_id: assignedDoctorSelect.value || null,
        termsAccepted: termsCheck.checked,
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
        const { confirmPassword, termsAccepted, fullName, dateOfBirth, ...signupData } = formData;
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
        });

        const data = await response.json().catch(() => null);
        
        if (!response.ok) {
            const backendMessage = parseApiErrorMessage(data, 'Unable to create account right now.');
            throw new Error(backendMessage);
        }
        
        // Success
        showAlert('Account created successfully! Redirecting to login...', 'success');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login-v2.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        const isNetworkError = error instanceof TypeError && /failed to fetch/i.test(error.message || '');
        const message = isNetworkError
            ? 'Unable to reach the server. Please check your connection and try again.'
            : (error.message || 'Failed to create account. Please try again.');

        showAlert(message, 'danger');
        
        // Reset button state
        submitBtn.disabled = false;
        submitText.classList.remove('d-none');
        submitSpinner.classList.add('d-none');
    }
});

// Initialize allergies list
renderAllergies();
loadAvailableDoctors();

signupForm.querySelectorAll('input, select').forEach((field) => {
    const clearFieldValidationError = () => {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');

        const inputGroup = field.closest('.input-group');
        let errorElement = null;

        if (inputGroup && inputGroup.nextElementSibling && inputGroup.nextElementSibling.classList.contains('validation-error-message')) {
            errorElement = inputGroup.nextElementSibling;
        } else if (field.nextElementSibling && field.nextElementSibling.classList.contains('validation-error-message')) {
            errorElement = field.nextElementSibling;
        }

        if (errorElement) {
            errorElement.remove();
        }
    };

    field.addEventListener('input', clearFieldValidationError);
    field.addEventListener('change', clearFieldValidationError);
});

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
