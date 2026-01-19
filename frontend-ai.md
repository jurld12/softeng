# Healio Frontend Development - AI Context Guide

## Project Overview

**Healio** is a Virtual Health Companion System with a FastAPI backend and vanilla JavaScript frontend. It helps patients track biometric data, doctors monitor patients, and admins manage the system.

### Technology Stack
- **Backend**: FastAPI (Python) with MongoDB
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Authentication**: JWT Bearer Tokens
- **API Base URL**: `http://127.0.0.1:5000`

### User Roles
1. **Patient**: Track biometrics, view alerts, earn achievements
2. **Doctor**: View assigned patients, analyze patient data
3. **Admin**: Manage users, view system statistics

---

## Architecture Overview

```
frontend/
├── index.html              # Landing page
├── login.html             # Login/Register page
├── patient-dashboard.html # Patient dashboard
├── css/
│   └── styles.css         # Main styles
└── js/
    ├── config.js          # API configuration & helpers
    └── main.js            # Shared utilities

backend/
├── app/
│   ├── main.py           # FastAPI entry point
│   ├── database.py       # MongoDB connection
│   ├── api/routes/       # API endpoints
│   ├── middleware/       # Auth middleware
│   ├── models/           # Pydantic schemas
│   ├── services/         # Business logic
│   └── utils/            # Utilities
└── config.py             # Configuration
```

---

## Backend API Documentation

### Base Configuration
```javascript
const API_BASE_URL = 'http://127.0.0.1:5000';

// Always include JWT token in requests
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('healio_access_token')}`
};
```

---

## Authentication API

### 1. Register User
**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "patient",
  "height": 175.5,
  "weight": 70.0,
  "gender": "male",
  "date_of_birth": "1990-01-15"
}
```

**Response** (201 Created):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "507f1f77bcf86cd799439011",
  "role": "patient",
  "name": "John Doe"
}
```

**Frontend Example**:
```javascript
async function register(userData) {
    const response = await fetch('http://127.0.0.1:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
    }
    
    const data = await response.json();
    
    // Store auth data
    localStorage.setItem('healio_access_token', data.access_token);
    localStorage.setItem('healio_user_role', data.role);
    localStorage.setItem('healio_user_id', data.user_id);
    localStorage.setItem('healio_user_name', data.name);
    
    return data;
}
```

---

### 2. Login
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "507f1f77bcf86cd799439011",
  "role": "patient",
  "name": "John Doe"
}
```

**Frontend Example**:
```javascript
async function login(email, password) {
    const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store credentials
    localStorage.setItem('healio_access_token', data.access_token);
    localStorage.setItem('healio_user_role', data.role);
    localStorage.setItem('healio_user_id', data.user_id);
    localStorage.setItem('healio_user_name', data.name);
    
    // Redirect based on role
    if (data.role === 'patient') {
        window.location.href = '/patient-dashboard.html';
    } else if (data.role === 'doctor') {
        window.location.href = '/doctor-dashboard.html';
    } else if (data.role === 'admin') {
        window.location.href = '/admin-dashboard.html';
    }
    
    return data;
}
```

---

### 3. Logout
**Endpoint**: `POST /auth/logout`

**Headers**: Requires JWT token

**Response** (200 OK):
```json
{
  "message": "Logged out successfully",
  "detail": "Please delete your access token from local storage"
}
```

**Frontend Example**:
```javascript
function logout() {
    localStorage.removeItem('healio_access_token');
    localStorage.removeItem('healio_user_role');
    localStorage.removeItem('healio_user_id');
    localStorage.removeItem('healio_user_name');
    window.location.href = '/index.html';
}
```

---

### 4. Get Current User
**Endpoint**: `GET /auth/me`

**Headers**: Requires JWT token

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient",
  "active": true,
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

## Patient API

### 5. Get Patient Dashboard
**Endpoint**: `GET /patients/me/dashboard`

**Headers**: Requires JWT token (patient role)

**Response** (200 OK):
```json
{
  "latest_metrics": {
    "heart_rate": {
      "value": 72,
      "timestamp": "2026-01-19T08:30:00Z"
    },
    "steps": {
      "value": 8500,
      "timestamp": "2026-01-19T08:30:00Z"
    },
    "blood_glucose": {
      "value": 95,
      "timestamp": "2026-01-19T07:00:00Z"
    }
  },
  "weekly_averages": {
    "heart_rate": 74.5,
    "steps": 7800,
    "sleep_hours": 7.2
  },
  "monthly_averages": {
    "heart_rate": 73.8,
    "steps": 8100,
    "sleep_hours": 7.5
  },
  "recent_alerts": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "user_id": "507f1f77bcf86cd799439011",
      "metric": "heart_rate",
      "value": 110,
      "severity": "medium",
      "message": "Heart rate above normal range",
      "acknowledged": false,
      "created_at": "2026-01-18T14:20:00Z"
    }
  ],
  "total_achievements": 12
}
```

**Frontend Example**:
```javascript
async function loadPatientDashboard() {
    const token = localStorage.getItem('healio_access_token');
    
    const response = await fetch('http://127.0.0.1:5000/patients/me/dashboard', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to load dashboard');
    }
    
    const data = await response.json();
    
    // Update UI with data
    displayLatestMetrics(data.latest_metrics);
    displayWeeklyAverages(data.weekly_averages);
    displayAlerts(data.recent_alerts);
    
    return data;
}

function displayLatestMetrics(metrics) {
    if (metrics.heart_rate) {
        document.getElementById('heart-rate-value').textContent = 
            Math.round(metrics.heart_rate.value);
    }
    if (metrics.steps) {
        document.getElementById('steps-value').textContent = 
            metrics.steps.value.toLocaleString();
    }
    // ... display other metrics
}
```

---

### 6. Add Biometric Entry
**Endpoint**: `POST /patients/me/biometrics`

**Headers**: Requires JWT token (patient role)

**Request Body**:
```json
{
  "metric": "heart_rate",
  "value": 75,
  "unit": "bpm",
  "notes": "After morning jog",
  "timestamp": "2026-01-19T09:00:00Z"
}
```

**Available Metrics**:
- `heart_rate` - Heart rate in bpm
- `steps` - Daily step count
- `calories` - Calories burned
- `blood_pressure_systolic` - Systolic BP
- `blood_pressure_diastolic` - Diastolic BP
- `blood_glucose` - Blood glucose in mg/dL
- `sleep_hours` - Hours of sleep

**Response** (201 Created):
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "user_id": "507f1f77bcf86cd799439011",
  "metric": "heart_rate",
  "value": 75,
  "unit": "bpm",
  "notes": "After morning jog",
  "timestamp": "2026-01-19T09:00:00Z"
}
```

**Frontend Example**:
```javascript
async function addBiometricData(metric, value, notes = '') {
    const token = localStorage.getItem('healio_access_token');
    
    const biometricData = {
        metric: metric,
        value: parseFloat(value),
        unit: getUnitForMetric(metric),
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    const response = await fetch('http://127.0.0.1:5000/patients/me/biometrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(biometricData)
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
    }
    
    return await response.json();
}

function getUnitForMetric(metric) {
    const units = {
        'heart_rate': 'bpm',
        'steps': 'steps',
        'calories': 'kcal',
        'blood_pressure_systolic': 'mmHg',
        'blood_pressure_diastolic': 'mmHg',
        'blood_glucose': 'mg/dL',
        'sleep_hours': 'hours'
    };
    return units[metric] || '';
}
```

---

### 7. Get Biometric Entries
**Endpoint**: `GET /patients/me/biometrics`

**Query Parameters**:
- `metric` (optional): Filter by metric type
- `from_date` (optional): Start date (ISO format)
- `to_date` (optional): End date (ISO format)
- `limit` (optional): Max results (default: 100, max: 1000)

**Example**: `GET /patients/me/biometrics?metric=heart_rate&limit=50`

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "user_id": "507f1f77bcf86cd799439011",
    "metric": "heart_rate",
    "value": 75,
    "unit": "bpm",
    "notes": "After morning jog",
    "timestamp": "2026-01-19T09:00:00Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439011",
    "metric": "heart_rate",
    "value": 68,
    "unit": "bpm",
    "notes": "Resting",
    "timestamp": "2026-01-18T09:00:00Z"
  }
]
```

**Frontend Example**:
```javascript
async function getBiometrics(metric = null, days = 7) {
    const token = localStorage.getItem('healio_access_token');
    
    // Build query parameters
    const params = new URLSearchParams();
    if (metric) params.append('metric', metric);
    
    // Calculate date range
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    params.append('from_date', fromDate.toISOString());
    params.append('to_date', toDate.toISOString());
    params.append('limit', '100');
    
    const url = `http://127.0.0.1:5000/patients/me/biometrics?${params}`;
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch biometrics');
    }
    
    return await response.json();
}

// Usage: Get heart rate data for last 30 days
const heartRateData = await getBiometrics('heart_rate', 30);
```

---

### 8. Get Patient Alerts
**Endpoint**: `GET /patients/me/alerts`

**Query Parameters**:
- `acknowledged` (optional): Filter by acknowledged status (true/false)
- `severity` (optional): Filter by severity (low/medium/high)
- `limit` (optional): Max results (default: 50)

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "user_id": "507f1f77bcf86cd799439011",
    "metric": "blood_glucose",
    "value": 165,
    "severity": "high",
    "message": "Blood glucose significantly above normal range",
    "acknowledged": false,
    "created_at": "2026-01-19T07:15:00Z"
  }
]
```

---

### 9. Acknowledge Alert
**Endpoint**: `PATCH /patients/me/alerts/{alert_id}/acknowledge`

**Response** (200 OK):
```json
{
  "message": "Alert acknowledged successfully"
}
```

---

### 10. Get Patient Achievements
**Endpoint**: `GET /patients/me/achievements`

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "user_id": "507f1f77bcf86cd799439011",
    "badge_id": "first_entry",
    "badge_name": "First Steps",
    "badge_description": "Logged your first biometric entry",
    "earned_at": "2026-01-10T12:00:00Z",
    "points_awarded": 10
  },
  {
    "_id": "507f1f77bcf86cd799439017",
    "user_id": "507f1f77bcf86cd799439011",
    "badge_id": "week_streak",
    "badge_name": "Week Warrior",
    "badge_description": "Logged data for 7 consecutive days",
    "earned_at": "2026-01-17T12:00:00Z",
    "points_awarded": 50
  }
]
```

---

### 11. Export Patient Data
**Endpoint**: `GET /patients/me/export/{format}`

**Path Parameters**:
- `format`: Either `csv` or `pdf`

**Query Parameters**:
- `from_date` (optional): Start date
- `to_date` (optional): End date

**Response**: File download (CSV or PDF)

**Frontend Example**:
```javascript
async function exportData(format = 'csv') {
    const token = localStorage.getItem('healio_access_token');
    
    const response = await fetch(`http://127.0.0.1:5000/patients/me/export/${format}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Export failed');
    }
    
    // Trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-data-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
```

---

## Doctor API

### 12. Get Doctor's Patients
**Endpoint**: `GET /doctor/patients`

**Headers**: Requires JWT token (doctor role)

**Query Parameters**:
- `search` (optional): Search by name or email

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "active": true,
    "created_at": "2026-01-10T10:00:00Z"
  }
]
```

**Frontend Example**:
```javascript
async function getDoctorPatients(searchQuery = '') {
    const token = localStorage.getItem('healio_access_token');
    
    let url = 'http://127.0.0.1:5000/doctor/patients';
    if (searchQuery) {
        url += `?search=${encodeURIComponent(searchQuery)}`;
    }
    
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch patients');
    }
    
    return await response.json();
}
```

---

### 13. Get Patient Details
**Endpoint**: `GET /doctor/patients/{patient_id}`

**Headers**: Requires JWT token (doctor role)

**Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "patient",
  "active": true,
  "created_at": "2026-01-10T10:00:00Z",
  "profile": {
    "height": 175.5,
    "weight": 70.0,
    "gender": "male",
    "date_of_birth": "1990-01-15"
  }
}
```

---

### 14. Get Patient Biometrics (Doctor View)
**Endpoint**: `GET /doctor/patients/{patient_id}/biometrics`

**Query Parameters**: Same as patient biometrics endpoint

**Response**: Same format as patient biometrics

---

### 15. Get Patient Summary
**Endpoint**: `GET /doctor/patients/{patient_id}/summary`

**Query Parameters**:
- `days` (optional): Number of days to analyze (default: 30, max: 365)

**Response** (200 OK):
```json
{
  "patient_id": "507f1f77bcf86cd799439011",
  "period_days": 30,
  "heart_rate": {
    "average": 73.5,
    "min": 58,
    "max": 110,
    "count": 85
  },
  "steps": {
    "average": 8200,
    "min": 2500,
    "max": 15000,
    "count": 85
  },
  "blood_glucose": {
    "average": 98.5,
    "min": 75,
    "max": 165,
    "count": 42
  }
}
```

---

## Admin API

### 16. Get All Users
**Endpoint**: `GET /admin/users`

**Headers**: Requires JWT token (admin role)

**Response** (200 OK):
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient",
    "active": true,
    "created_at": "2026-01-10T10:00:00Z"
  }
]
```

---

### 17. Get User by ID
**Endpoint**: `GET /admin/users/{user_id}`

**Response**: User object (same format as above)

---

### 18. Update User
**Endpoint**: `PATCH /admin/users/{user_id}`

**Request Body**:
```json
{
  "role": "doctor",
  "active": true
}
```

**Response** (200 OK): Updated user object

---

### 19. Delete User
**Endpoint**: `DELETE /admin/users/{user_id}`

**Response** (200 OK):
```json
{
  "message": "User 507f1f77bcf86cd799439011 deleted successfully"
}
```

---

### 20. Get System Statistics
**Endpoint**: `GET /admin/stats`

**Response** (200 OK):
```json
{
  "total_users": 150,
  "total_patients": 120,
  "total_doctors": 25,
  "total_admins": 5,
  "active_users": 145,
  "total_biometric_entries": 12500,
  "total_alerts": 350,
  "total_achievements": 1800
}
```

---

## Frontend Development Patterns

### Authentication Flow

```javascript
// Check if user is logged in
function requireAuth() {
    const token = localStorage.getItem('healio_access_token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Check user role
function requireRole(requiredRole) {
    const userRole = localStorage.getItem('healio_user_role');
    if (userRole !== requiredRole) {
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

// Call on protected pages
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    if (!requireRole('patient')) return;
    
    // Load page content
    loadDashboard();
});
```

---

### Error Handling Pattern

```javascript
async function apiCall(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('healio_access_token');
        
        const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            // Handle specific error codes
            if (response.status === 401) {
                // Unauthorized - token expired or invalid
                localStorage.clear();
                window.location.href = '/login.html';
                throw new Error('Session expired. Please login again.');
            }
            
            if (response.status === 403) {
                // Forbidden - insufficient permissions
                throw new Error('Access denied. Insufficient permissions.');
            }
            
            if (response.status === 404) {
                throw new Error('Resource not found.');
            }
            
            // Get error detail from response
            const error = await response.json();
            throw new Error(error.detail || 'Request failed');
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}
```

---

### Loading States Pattern

```javascript
function showLoader(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function hideLoader(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Usage
async function loadData() {
    showLoader('content-area');
    try {
        const data = await apiCall('/patients/me/dashboard');
        renderDashboard(data);
    } catch (error) {
        document.getElementById('content-area').innerHTML = `
            <div class="error">Failed to load data: ${error.message}</div>
        `;
    } finally {
        hideLoader('content-area');
    }
}
```

---

### Form Submission Pattern

```javascript
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable button to prevent double submission
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    try {
        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Submit to API
        const result = await apiCall('/patients/me/biometrics', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showNotification('Data saved successfully!', 'success');
        form.reset();
        
        // Refresh dashboard or relevant section
        await loadDashboard();
        
    } catch (error) {
        showNotification(error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
}

// Attach to form
document.getElementById('biometric-form').addEventListener('submit', handleFormSubmit);
```

---

### Chart/Visualization Pattern

```javascript
async function renderHeartRateChart() {
    try {
        // Fetch data
        const data = await apiCall('/patients/me/biometrics?metric=heart_rate&limit=30');
        
        // Prepare data for chart
        const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
        const values = data.map(d => d.value);
        
        // If using Chart.js or similar library
        // const ctx = document.getElementById('heartRateChart').getContext('2d');
        // new Chart(ctx, {
        //     type: 'line',
        //     data: {
        //         labels: labels,
        //         datasets: [{
        //             label: 'Heart Rate (bpm)',
        //             data: values,
        //             borderColor: '#1e40af',
        //             tension: 0.1
        //         }]
        //     }
        // });
        
        // Simple HTML/CSS visualization
        const chartContainer = document.getElementById('heart-rate-chart');
        chartContainer.innerHTML = values.map((value, index) => `
            <div class="chart-bar" style="height: ${value}px" 
                 title="${labels[index]}: ${value} bpm">
                <span>${value}</span>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to render chart:', error);
    }
}
```

---

### Notification/Toast Pattern

```javascript
function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    const container = document.getElementById('notification-container') 
        || createNotificationContainer();
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
    `;
    document.body.appendChild(container);
    return container;
}
```

---

## Common HTML Structures

### Dashboard Card
```html
<div class="metric-card">
    <div class="metric-icon">
        <i class="icon-heart"></i>
    </div>
    <div class="metric-info">
        <h3 class="metric-label">Heart Rate</h3>
        <p class="metric-value" id="heart-rate-value">--</p>
        <p class="metric-unit">bpm</p>
    </div>
    <div class="metric-status status-normal">Normal</div>
</div>
```

### Data Entry Form
```html
<form id="biometric-form">
    <div class="form-group">
        <label for="metric">Metric Type</label>
        <select id="metric" name="metric" required>
            <option value="heart_rate">Heart Rate</option>
            <option value="blood_glucose">Blood Glucose</option>
            <option value="steps">Steps</option>
            <option value="sleep_hours">Sleep Hours</option>
        </select>
    </div>
    
    <div class="form-group">
        <label for="value">Value</label>
        <input type="number" id="value" name="value" 
               step="0.1" min="0" required>
    </div>
    
    <div class="form-group">
        <label for="notes">Notes (optional)</label>
        <textarea id="notes" name="notes" rows="3"></textarea>
    </div>
    
    <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

### Alert List
```html
<div class="alerts-container">
    <div class="alert alert-high">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
            <h4>High Blood Glucose</h4>
            <p>Value: 165 mg/dL - Significantly above normal</p>
            <span class="alert-time">2 hours ago</span>
        </div>
        <button class="btn-acknowledge" onclick="acknowledgeAlert('alert-id')">
            Acknowledge
        </button>
    </div>
</div>
```

---

## CSS Styling Guidelines

### Colors
```css
:root {
    --primary: #1e40af;
    --success: #16a34a;
    --warning: #ea580c;
    --danger: #dc2626;
    --info: #0891b2;
    --gray-light: #f3f4f6;
    --gray-dark: #374151;
}
```

### Common Classes
```css
.btn-primary {
    background-color: var(--primary);
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

.metric-card {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loader {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
}

.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

---

## Best Practices for AI Code Generation

### 1. Always Handle Errors
```javascript
// ❌ Bad
const data = await fetch(url);

// ✅ Good
try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
} catch (error) {
    console.error('Error:', error);
    showNotification(error.message, 'error');
}
```

### 2. Validate Input
```javascript
function validateBiometricValue(metric, value) {
    const ranges = {
        heart_rate: { min: 30, max: 200 },
        blood_glucose: { min: 20, max: 500 },
        steps: { min: 0, max: 100000 },
        sleep_hours: { min: 0, max: 24 }
    };
    
    const range = ranges[metric];
    if (!range) return true;
    
    if (value < range.min || value > range.max) {
        throw new Error(`${metric} must be between ${range.min} and ${range.max}`);
    }
    
    return true;
}
```

### 3. Use Descriptive Variable Names
```javascript
// ❌ Bad
const d = await fetch(url);
const x = d.map(i => i.value);

// ✅ Good
const biometricData = await fetch(url);
const heartRateValues = biometricData.map(entry => entry.value);
```

### 4. Add Loading States
Always show feedback to users during async operations.

### 5. Format Dates Consistently
```javascript
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
```

### 6. Secure Token Storage
Always store JWT tokens in localStorage and include in every authenticated request.

### 7. Role-Based Access
Always check user roles before rendering role-specific UI or making role-specific API calls.

---

## Quick Reference: API Endpoints Summary

### Public Endpoints (No Auth)
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `GET /health` - Health check

### Patient Endpoints (Patient Role)
- `GET /patients/me/dashboard` - Dashboard summary
- `POST /patients/me/biometrics` - Add biometric entry
- `GET /patients/me/biometrics` - Get biometric entries
- `GET /patients/me/alerts` - Get alerts
- `PATCH /patients/me/alerts/{id}/acknowledge` - Acknowledge alert
- `GET /patients/me/achievements` - Get achievements
- `GET /patients/me/export/{format}` - Export data (csv/pdf)

### Doctor Endpoints (Doctor Role)
- `GET /doctor/patients` - List patients
- `GET /doctor/patients/{id}` - Patient details
- `GET /doctor/patients/{id}/biometrics` - Patient biometrics
- `GET /doctor/patients/{id}/summary` - Patient summary

### Admin Endpoints (Admin Role)
- `GET /admin/users` - List all users
- `GET /admin/users/{id}` - User details
- `PATCH /admin/users/{id}` - Update user
- `DELETE /admin/users/{id}` - Delete user
- `GET /admin/stats` - System statistics

### All Authenticated Users
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout

---

## Testing API Endpoints

You can test endpoints using the browser console:

```javascript
// Test login
const loginResponse = await fetch('http://127.0.0.1:5000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
    })
});
const loginData = await loginResponse.json();
console.log(loginData);

// Test authenticated endpoint
const token = loginData.access_token;
const dashboardResponse = await fetch('http://127.0.0.1:5000/patients/me/dashboard', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
const dashboardData = await dashboardResponse.json();
console.log(dashboardData);
```

---

## End of Frontend Development Guide

This document provides everything an AI needs to understand the Healio project structure and create frontend code that properly integrates with the backend API. Use the patterns and examples above as templates for building new features.
