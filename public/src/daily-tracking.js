// Multi-step form variables
let currentStep = 1;
let signatureCanvas, signatureCtx;
let isDrawing = false;
let signatureData = null;

// Validation functions for "Other" inputs
function validateWaterIntake(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 10; // Reasonable water intake range
}

function validateTimeInput(value) {
  // Check if it's a valid time format (HH:MM or H:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(value);
}

function validateSleepLength(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 24; // Reasonable sleep hours range
}

function validateTrainingMinutes(value) {
  if (!value || value.trim() === '') return false;
  
  // Check if it's a range format (e.g., "100-110")
  const rangePattern = /^\d+\s*-\s*\d+$/;
  if (rangePattern.test(value.trim())) {
    const [min, max] = value.trim().split('-').map(n => parseInt(n.trim()));
    return min > 0 && max > min && max <= 600; // Reasonable range limits
  }
  
  // If not a range, check if it's a single number
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 600;
}

// Show/hide custom input fields when "Other" is selected
function setupOtherInputHandlers() {
  const fieldsWithOther = [
    { name: 'trainingMinutes', validator: validateTrainingMinutes, placeholder: 'Enter range (e.g., 100-110)', errorMsg: 'Please enter a valid range format (e.g., 100-110) with no letters' },
    { name: 'waterIntake', validator: validateWaterIntake, placeholder: 'Enter liters (e.g., 2.5)', errorMsg: 'Please enter a valid number between 0.1 and 10 liters' },
    { name: 'breakfastTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 08:30)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'lunchTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 12:30)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'snackTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 15:30)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'dinnerTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 19:00)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'sleepLength', validator: validateSleepLength, placeholder: 'Enter hours (e.g., 7.5)', errorMsg: 'Please enter a valid number between 0.1 and 24 hours' },
    { name: 'sleepQuality', validator: (value) => value.trim().length >= 2, placeholder: 'Enter sleep quality description', errorMsg: 'Please enter a description of at least 2 characters' },
    { name: 'tiredness', validator: (value) => value.trim().length >= 2, placeholder: 'Enter tiredness description', errorMsg: 'Please enter a description of at least 2 characters' }
  ];

  fieldsWithOther.forEach(field => {
    // Create the custom input container
    const customInputContainer = document.createElement('div');
    customInputContainer.id = `${field.name}CustomContainer`;
    customInputContainer.className = 'mt-2 hidden';
    customInputContainer.innerHTML = `
      <input type="text" 
             id="${field.name}Custom" 
             placeholder="${field.placeholder}"
             class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
      <div id="${field.name}CustomError" class="text-red-600 text-sm mt-1 hidden"></div>
    `;

    // Find the "Other" radio button and add the container after its parent
    const otherRadio = document.querySelector(`input[name="${field.name}"][value="Other"]`);
    if (otherRadio) {
      otherRadio.parentElement.parentElement.appendChild(customInputContainer);
      
      // Add event listener to show/hide custom input
      const radioButtons = document.querySelectorAll(`input[name="${field.name}"]`);
      radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.value === 'Other' && radio.checked) {
            customInputContainer.classList.remove('hidden');
            document.getElementById(`${field.name}Custom`).focus();
          } else {
            customInputContainer.classList.add('hidden');
            document.getElementById(`${field.name}CustomError`).classList.add('hidden');
          }
        });
      });

      // Add validation on input
      const customInput = document.getElementById(`${field.name}Custom`);
      customInput.addEventListener('blur', () => {
        validateCustomInput(field.name, field.validator, field.errorMsg);
      });
      
      customInput.addEventListener('input', () => {
        // Clear error on input
        document.getElementById(`${field.name}CustomError`).classList.add('hidden');
      });
    }
  });
}

function validateCustomInput(fieldName, validator, errorMsg) {
  const customInput = document.getElementById(`${fieldName}Custom`);
  const errorDiv = document.getElementById(`${fieldName}CustomError`);
  
  if (customInput.value.trim() === '') {
    errorDiv.textContent = 'This field is required when "Other" is selected';
    errorDiv.classList.remove('hidden');
    return false;
  }
  
  if (!validator(customInput.value.trim())) {
    errorDiv.textContent = errorMsg;
    errorDiv.classList.remove('hidden');
    return false;
  }
  
  errorDiv.classList.add('hidden');
  return true;
}

// Get the actual value for a field (either radio selection or custom input)
function getFieldValue(fieldName) {
  const checkedRadio = document.querySelector(`input[name="${fieldName}"]:checked`);
  if (checkedRadio && checkedRadio.value === 'Other') {
    // Special case for training minutes which uses a different ID
    if (fieldName === 'trainingMinutes') {
      const customInput = document.getElementById('customTrainingMinutes');
      return customInput ? customInput.value.trim() : null;
    }
    return document.getElementById(`${fieldName}Custom`).value.trim();
  }
  return checkedRadio ? checkedRadio.value : null;
}

// Initialize signature canvas
function initSignatureCanvas() {
  signatureCanvas = document.getElementById('signatureCanvas');
  signatureCtx = signatureCanvas.getContext('2d');
  
  // Set canvas background to white
  signatureCtx.fillStyle = 'white';
  signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  
  // Set drawing style
  signatureCtx.strokeStyle = '#000000';
  signatureCtx.lineWidth = 2;
  signatureCtx.lineCap = 'round';
  signatureCtx.lineJoin = 'round';
  
  // Mouse events
  signatureCanvas.addEventListener('mousedown', startDrawing);
  signatureCanvas.addEventListener('mousemove', draw);
  signatureCanvas.addEventListener('mouseup', stopDrawing);
  signatureCanvas.addEventListener('mouseout', stopDrawing);
  
  // Touch events for mobile
  signatureCanvas.addEventListener('touchstart', handleTouch);
  signatureCanvas.addEventListener('touchmove', handleTouch);
  signatureCanvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) {
  isDrawing = true;
  const rect = signatureCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  signatureCtx.beginPath();
  signatureCtx.moveTo(x, y);
}

function draw(e) {
  if (!isDrawing) return;
  const rect = signatureCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  signatureCtx.lineTo(x, y);
  signatureCtx.stroke();
  signatureData = signatureCanvas.toDataURL(); // Save signature data
}

function stopDrawing() {
  if (isDrawing) {
    isDrawing = false;
    signatureData = signatureCanvas.toDataURL();
  }
}

function handleTouch(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                   e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  signatureCanvas.dispatchEvent(mouseEvent);
}

function clearSignature() {
  signatureCtx.fillStyle = 'white';
  signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  signatureData = null;
}

// Step navigation functions
function showStep(step) {
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
  
  // Show current step
  document.getElementById(`step${step}`).classList.remove('hidden');
  
  // Update step indicators
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove('active', 'completed');
  });
  
  // Mark completed steps
  for (let i = 1; i < step; i++) {
    document.getElementById(`step${i}Indicator`).classList.add('completed');
  }
  
  // Mark current step as active
  document.getElementById(`step${step}Indicator`).classList.add('active');
  
  currentStep = step;
}

function validateStep1() {
  // Step 1: Only validate membership ID and training minutes
  const requiredFields = ['membershipId', 'trainingMinutes'];
  const missingFields = [];
  const invalidFields = [];
  
  requiredFields.forEach(field => {
    if (field === 'membershipId') {
      if (!document.getElementById(field).value.trim()) {
        missingFields.push('Membership ID');
      }
    } else {
      const checkedRadio = document.querySelector(`input[name="${field}"]:checked`);
      if (!checkedRadio) {
        missingFields.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      } else if (checkedRadio.value === 'Other') {
        // Special case for training minutes which uses different IDs
        if (field === 'trainingMinutes') {
          if (!validateCustomTrainingMinutes()) {
            invalidFields.push('Training Minutes: Please enter a valid range format (e.g., 100-110)');
          }
        } else {
          // Validate custom input for other fields
          const customInput = document.getElementById(`${field}Custom`);
          if (!customInput.value.trim()) {
            missingFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (Other)`);
          } else {
            // Validate based on field type
            let isValid = false;
            let errorMsg = '';
            
            switch (field) {
              default:
                isValid = true; // No specific validation for step 1 other fields
                break;
            }
            
            if (!isValid) {
              invalidFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${errorMsg}`);
              document.getElementById(`${field}CustomError`).textContent = errorMsg;
              document.getElementById(`${field}CustomError`).classList.remove('hidden');
            }
          }
        }
      }
    }
  });
  
  if (missingFields.length > 0) {
    alert('Please fill in all required fields: ' + missingFields.join(', '));
    return false;
  }
  
  if (invalidFields.length > 0) {
    alert('Please fix the following validation errors:\n' + invalidFields.join('\n'));
    return false;
  }
  
  return true;
}

function validateStep2() {
  // Step 2: Validate nutrition and meal fields
  const requiredFields = ['previousDay', 'appetite', 'waterIntake', 'breakfastTime', 'lunchTime', 'snackTime', 'dinnerTime'];
  const missingFields = [];
  const invalidFields = [];
  
  requiredFields.forEach(field => {
    if (field === 'previousDay') {
      if (!document.getElementById(field).value) {
        missingFields.push('Previous Day');
      }
    } else {
      const checkedRadio = document.querySelector(`input[name="${field}"]:checked`);
      if (!checkedRadio) {
        missingFields.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
      } else if (checkedRadio.value === 'Other') {
        // Validate custom input
        const customInput = document.getElementById(`${field}Custom`);
        if (!customInput.value.trim()) {
          missingFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (Other)`);
        } else {
          // Validate based on field type
          let isValid = false;
          let errorMsg = '';
          
          switch (field) {
            case 'trainingMinutes':
              isValid = validateTrainingMinutes(customInput.value.trim());
              errorMsg = 'Please enter a valid number between 1 and 600 minutes';
              break;
            case 'waterIntake':
              isValid = validateWaterIntake(customInput.value.trim());
              errorMsg = 'Please enter a valid number between 0.1 and 10 liters';
              break;
            case 'breakfastTime':
            case 'lunchTime':
            case 'snackTime':
            case 'dinnerTime':
              isValid = validateTimeInput(customInput.value.trim());
              errorMsg = 'Please enter a valid time format (HH:MM)';
              break;
          }
          
          if (!isValid) {
            invalidFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${errorMsg}`);
            document.getElementById(`${field}CustomError`).textContent = errorMsg;
            document.getElementById(`${field}CustomError`).classList.remove('hidden');
          }
        }
      }
    }
  });
  
  if (missingFields.length > 0) {
    alert('Please fill in all required fields: ' + missingFields.join(', '));
    return false;
  }
  
  if (invalidFields.length > 0) {
    alert('Please fix the following validation errors:\n' + invalidFields.join('\n'));
    return false;
  }
  
  return true;
}

function validateStep3() {
  // Step 3: Validate sleep and wellness fields
  const requiredFields = ['sleepLength', 'sleepQuality', 'tiredness'];
  const missingFields = [];
  const invalidFields = [];
  
  requiredFields.forEach(field => {
    const checkedRadio = document.querySelector(`input[name="${field}"]:checked`);
    if (!checkedRadio) {
      missingFields.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
    } else if (checkedRadio.value === 'Other') {
      // Check for custom input container
      const customInput = document.getElementById(`${field}Custom`);
      if (!customInput) {
        console.warn(`Custom input for ${field} not found`);
        return;
      }
      
      if (!customInput.value.trim()) {
        missingFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (Other)`);
      } else {
        // Validate based on field type
        let isValid = true;
        let errorMsg = '';
        
        if (field === 'sleepLength') {
          isValid = validateSleepLength(customInput.value.trim());
          errorMsg = 'Please enter a valid number between 0.1 and 24 hours';
        } else if (field === 'sleepQuality' || field === 'tiredness') {
          isValid = customInput.value.trim().length >= 2;
          errorMsg = 'Please enter a description of at least 2 characters';
        }
        
        if (!isValid) {
          invalidFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${errorMsg}`);
          const errorDiv = document.getElementById(`${field}CustomError`);
          if (errorDiv) {
            errorDiv.textContent = errorMsg;
            errorDiv.classList.remove('hidden');
          }
        }
      }
    }
  });
  
  if (missingFields.length > 0) {
    alert('Please fill in all required fields: ' + missingFields.join(', '));
    return false;
  }
  
  if (invalidFields.length > 0) {
    alert('Please fix the following validation errors:\n' + invalidFields.join('\n'));
    return false;
  }
  
  if (!signatureData) {
    alert('Please provide your signature');
    return false;
  }
  
  return true;
}

// Form submission
const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';

document.getElementById('dailyTrackingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in.');
    window.location.href = '/login.html';
    return;
  }

  // Validate Step 3
  if (!validateStep3()) {
    return;
  }

  // Clear old messages
  document.getElementById('successMessage').classList.add('hidden');
  document.getElementById('errorMessage').classList.add('hidden');

  // Collect form data from both steps using the new getFieldValue function
  const userRole = localStorage.getItem('userRole') || 'Athlete';
  let membershipId = document.getElementById('membershipId').value.trim();
  
  // For athletes, get membership ID from their profile if field is hidden/empty
  if (userRole === 'Athlete' && !membershipId) {
    try {
      const res = await fetch('https://fitness-app-production-b5bb.up.railway.app/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const userData = await res.json();
        membershipId = userData.membership_id || '';
      }
    } catch (err) {
      console.error('Failed to fetch membership ID:', err);
    }
  }
  
  const formData = {
    // Step 1 data
    membershipId: membershipId,
    trainingMinutes: getFieldValue('trainingMinutes'),
    previousDay: document.getElementById('previousDay').value,
    appetite: getFieldValue('appetite'),
    waterIntake: getFieldValue('waterIntake'),
    breakfastTime: getFieldValue('breakfastTime'),
    lunchTime: getFieldValue('lunchTime'),
    snackTime: getFieldValue('snackTime'),
    dinnerTime: getFieldValue('dinnerTime'),
    
    // Step 3 data
    sleepLength: getFieldValue('sleepLength'),
    sleepQuality: getFieldValue('sleepQuality'),
    tiredness: getFieldValue('tiredness'),
    signature: signatureData
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/daily-tracking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById('successMessage').classList.remove('hidden');
      document.getElementById('dailyTrackingForm').reset();
      
      // Reset to step 1
      showStep(1);
      
      // Reset signature
      clearSignature();
      
      // Hide all custom input containers
      document.querySelectorAll('[id$="CustomContainer"]').forEach(container => {
        container.classList.add('hidden');
      });
      
      // Clear all custom input error messages
      document.querySelectorAll('[id$="CustomError"]').forEach(error => {
        error.classList.add('hidden');
      });
      
      // Reset date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      document.getElementById('previousDay').value = yesterday.toISOString().split('T')[0];
      
      // Scroll to success message
      document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
    } else {
      // Handle specific error messages
      let errorText = 'Failed to submit daily tracking.';
      
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
      
      document.getElementById('errorMessage').textContent = errorText;
      document.getElementById('errorMessage').classList.remove('hidden');
      document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth' });
    }
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('errorMessage').textContent = 'Network error. Please check your connection and try again.';
    document.getElementById('errorMessage').classList.remove('hidden');
    document.getElementById('errorMessage').scrollIntoView({ behavior: 'smooth' });
  }
});

// Step navigation event listeners
document.getElementById('nextStep1').addEventListener('click', () => {
  if (validateStep1()) {
    showStep(2);
  }
});

document.getElementById('prevStep2').addEventListener('click', () => {
  showStep(1);
});

document.getElementById('nextStep2').addEventListener('click', () => {
  if (validateStep2()) {
    showStep(3);
  }
});

document.getElementById('prevStep3').addEventListener('click', () => {
  showStep(2);
});

// Clear signature button
document.getElementById('clearSignature').addEventListener('click', clearSignature);

// Setup training minutes "Other" option handler
function setupTrainingMinutesHandler() {
  const trainingRadios = document.querySelectorAll('input[name="trainingMinutes"]');
  const otherInput = document.getElementById('otherTrainingInput');
  const customInput = document.getElementById('customTrainingMinutes');
  const errorDiv = document.getElementById('customTrainingError');
  
  if (!otherInput || !customInput || !errorDiv) {
    console.log('Training minutes elements not found, skipping setup');
    return;
  }
  
  trainingRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'Other' && this.checked) {
        otherInput.classList.remove('hidden');
        customInput.focus();
      } else {
        otherInput.classList.add('hidden');
        errorDiv.classList.add('hidden');
        customInput.value = '';
      }
    });
  });
  
  // Add validation for custom input
  customInput.addEventListener('blur', function() {
    validateCustomTrainingMinutes();
  });
  
  customInput.addEventListener('input', function() {
    errorDiv.classList.add('hidden');
  });
}

// Validate custom training minutes input
function validateCustomTrainingMinutes() {
  const customInput = document.getElementById('customTrainingMinutes');
  const errorDiv = document.getElementById('customTrainingError');
  
  if (!customInput || !errorDiv) return true;
  
  const value = customInput.value.trim();
  
  if (value === '') {
    errorDiv.textContent = 'Please enter a training minutes range';
    errorDiv.classList.remove('hidden');
    return false;
  }
  
  if (!validateTrainingMinutes(value)) {
    errorDiv.textContent = 'Please enter a valid range format (e.g., 100-110) with no letters';
    errorDiv.classList.remove('hidden');
    return false;
  }
  
  errorDiv.classList.add('hidden');
  return true;
}

// Check user role on page load and handle membership ID
async function checkUserRole() {
  const userRole = localStorage.getItem('userRole') || 'Athlete';
  const token = localStorage.getItem('token');
  
  // Add role indicator
  const roleIndicator = document.createElement('div');
  roleIndicator.className = 'fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-semibold z-50 shadow-lg';
  roleIndicator.textContent = `Role: ${userRole}`;
  document.body.appendChild(roleIndicator);
  
  // Handle membership ID field based on role
  const membershipIdField = document.getElementById('membershipId');
  const membershipIdContainer = membershipIdField?.parentElement;
  
  if (userRole === 'Athlete') {
    // For athletes, auto-fill their membership ID and make it read-only (but visible)
    try {
      const res = await fetch('https://fitness-app-production-b5bb.up.railway.app/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const userData = await res.json();
        if (membershipIdField) {
          membershipIdField.value = userData.membership_id || 'Not assigned';
          membershipIdField.readOnly = true;
          membershipIdField.className = 'w-full p-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed';
        }
        
        // Update the label to show this is their membership ID
        const label = membershipIdContainer?.querySelector('label');
        if (label) {
          label.innerHTML = '<i class="fas fa-id-card mr-2"></i>Your Membership ID';
        }
        
        // Update the helper text
        const helpText = membershipIdContainer?.querySelector('p');
        if (helpText) {
          helpText.textContent = 'This is your unique membership ID - it cannot be changed';
          helpText.className = 'text-sm text-blue-600 mt-2';
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile for membership ID:', err);
      // Fallback if API call fails
      if (membershipIdField) {
        membershipIdField.value = 'Unable to load';
        membershipIdField.readOnly = true;
        membershipIdField.className = 'w-full p-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed';
      }
    }
  } else {
    // For other roles (Trainers/Admins), keep the field visible and editable
    if (membershipIdField) {
      membershipIdField.readOnly = false;
      membershipIdField.placeholder = 'Enter membership ID for the user';
      membershipIdField.className = 'w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
    }
    
    // Update label for non-athletes
    const label = membershipIdContainer?.querySelector('label');
    if (label) {
      label.innerHTML = '<i class="fas fa-id-card mr-2"></i>Membership ID *';
    }
    
    // Update helper text for non-athletes
    const helpText = membershipIdContainer?.querySelector('p');
    if (helpText) {
      helpText.textContent = 'Enter the membership ID for the person you are tracking';
      helpText.className = 'text-sm text-gray-500 mt-2';
    }
  }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', async function() {
  // Set default date to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  document.getElementById('previousDay').value = yesterday.toISOString().split('T')[0];
  
  // Initialize signature canvas
  initSignatureCanvas();
  
  // Setup "Other" input handlers
  setupOtherInputHandlers();
  
  // Setup training minutes handler
  setupTrainingMinutesHandler();
  
  // Check user role
  await checkUserRole();
  
  // Start with step 1
  showStep(1);
}); 