// Speed Form JavaScript
const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';
let formSubmitted = false;

// Validation functions
function validateName(name) {
  return name.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(name.trim());
}

function validateAge(age) {
  const ageNum = parseInt(age);
  return !isNaN(ageNum) && ageNum >= 10 && ageNum <= 100;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function validateInjuryHistory(history) {
  return history.trim().length >= 3;
}

function validateJumpMeasurement(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 100;
}

function validateSpeed(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 30;
}

function validateAirBikeTime(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 120;
}

function validateAssessmentDate(date) {
  if (!date) return false;
  const selectedDate = new Date(date);
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  return selectedDate <= today && selectedDate >= oneYearAgo;
}

// Show error message for a field
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  
  field.classList.add('error');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

// Clear error message for a field
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorDiv = document.getElementById(fieldId + 'Error');
  
  field.classList.remove('error');
  errorDiv.classList.remove('show');
}

// Validate individual field
function validateField(fieldId, value) {
  clearError(fieldId);
  
  switch (fieldId) {
    case 'assessmentDate':
      if (!validateAssessmentDate(value)) {
        showError(fieldId, 'Please select a valid date (within the last year, not future)');
        return false;
      }
      break;
      
    case 'athleteName':
      if (!validateName(value)) {
        showError(fieldId, 'Please enter a valid name (at least 2 characters, letters only)');
        return false;
      }
      break;
      
    case 'age':
      if (!validateAge(value)) {
        showError(fieldId, 'Please enter a valid age between 10 and 100');
        return false;
      }
      break;
      
    case 'email':
      if (!validateEmail(value)) {
        showError(fieldId, 'Please enter a valid email address');
        return false;
      }
      break;
      
    case 'injuryHistory':
      if (!validateInjuryHistory(value)) {
        showError(fieldId, 'Please provide injury history (minimum 3 characters, or write "None")');
        return false;
      }
      break;
      
    case 'squatJumpRight':
    case 'squatJumpLeft':
    case 'squatJumpBoth':
      if (!validateJumpMeasurement(value)) {
        showError(fieldId, 'Please enter a valid measurement between 0 and 100 inches');
        return false;
      }
      break;
      
    case 'speed10m':
      if (!validateSpeed(value)) {
        showError(fieldId, 'Please enter a valid time between 0.01 and 30 seconds');
        return false;
      }
      break;
      
    case 'airBike2Miles':
      if (!validateAirBikeTime(value)) {
        showError(fieldId, 'Please enter a valid time between 0.01 and 120 minutes');
        return false;
      }
      break;
      
    default:
      if (!value || value.trim() === '') {
        showError(fieldId, 'This field is required');
        return false;
      }
  }
  
  return true;
}

// Validate entire form
function validateForm() {
  const fields = [
    'assessmentDate',
    'athleteName', 
    'age',
    'email',
    'injuryHistory',
    'squatJumpRight',
    'squatJumpLeft',
    'squatJumpBoth',
    'speed10m',
    'airBike2Miles'
  ];
  
  let isValid = true;
  const errors = [];
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    const value = field.value;
    
    if (!validateField(fieldId, value)) {
      isValid = false;
      errors.push(fieldId);
    }
  });
  
  return { isValid, errors };
}

// Setup form validation
function setupFormValidation() {
  const form = document.getElementById('speedAssessmentForm');
  const fields = form.querySelectorAll('input, textarea');
  
  fields.forEach(field => {
    // Validate on blur (when user leaves the field)
    field.addEventListener('blur', (e) => {
      if (!formSubmitted) {
        validateField(e.target.id, e.target.value);
      }
    });
    
    // Clear errors on input (when user starts typing)
    field.addEventListener('input', (e) => {
      clearError(e.target.id);
    });
  });
}

// Handle form submission
async function handleFormSubmission(e) {
  e.preventDefault();
  formSubmitted = true;

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in.');
    window.location.href = '/login.html';
    return;
  }

  // Clear previous messages
  document.getElementById('successMessage').classList.add('hidden');
  document.getElementById('errorMessage').classList.add('hidden');

  // Validate form
  const validation = validateForm();
  if (!validation.isValid) {
    document.getElementById('errorText').textContent = 'Please fix the validation errors before submitting.';
    document.getElementById('errorMessage').classList.remove('hidden');
    document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // Collect form data
  const formData = {
    assessmentDate: document.getElementById('assessmentDate').value,
    athleteName: document.getElementById('athleteName').value.trim(),
    age: parseInt(document.getElementById('age').value),
    email: document.getElementById('email').value.trim(),
    injuryHistory: document.getElementById('injuryHistory').value.trim(),
    squatJumpRight: parseFloat(document.getElementById('squatJumpRight').value),
    squatJumpLeft: parseFloat(document.getElementById('squatJumpLeft').value),
    squatJumpBoth: parseFloat(document.getElementById('squatJumpBoth').value),
    speed10m: parseFloat(document.getElementById('speed10m').value),
    airBike2Miles: parseFloat(document.getElementById('airBike2Miles').value)
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/speed-assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      // Success
      document.getElementById('successMessage').classList.remove('hidden');
      document.getElementById('speedAssessmentForm').reset();
      
      // Reset form submission flag
      formSubmitted = false;
      
      // Set default date to today
      const today = new Date();
      document.getElementById('assessmentDate').value = today.toISOString().split('T')[0];
      
      // Scroll to success message
      document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
    } else {
      // Handle specific error messages
      let errorText = 'Failed to submit speed assessment.';
      
      if (res.status === 403) {
        errorText = 'Access denied. Please check your permissions.';
      } else if (res.status === 401) {
        errorText = 'Your session has expired. Please log in again.';
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          window.location.href = '/login.html';
        }, 2000);
      } else if (data.error || data.message) {
        errorText = data.error || data.message;
      }
      
      document.getElementById('errorText').textContent = errorText;
      document.getElementById('errorMessage').classList.remove('hidden');
      document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('errorText').textContent = 'Network error. Please check your connection and try again.';
    document.getElementById('errorMessage').classList.remove('hidden');
    document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth' });
  }
}

// Check user role and add role indicator
function checkUserRole() {
  const userRole = localStorage.getItem('userRole') || 'Athlete';
  
  // Add role indicator
  const roleIndicator = document.createElement('div');
  roleIndicator.className = 'fixed bottom-4 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold z-50 shadow-lg';
  roleIndicator.textContent = `Role: ${userRole}`;
  document.body.appendChild(roleIndicator);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Set default date to today
  const today = new Date();
  document.getElementById('assessmentDate').value = today.toISOString().split('T')[0];
  
  // Setup form validation
  setupFormValidation();
  
  // Add form submission handler
  document.getElementById('speedAssessmentForm').addEventListener('submit', handleFormSubmission);
  
  // Check user role
  checkUserRole();
}); 