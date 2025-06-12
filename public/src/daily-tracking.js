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

// Show/hide custom input fields when "Other" is selected
function setupOtherInputHandlers() {
  const fieldsWithOther = [
    { name: 'waterIntake', validator: validateWaterIntake, placeholder: 'Enter liters (e.g., 2.5)', errorMsg: 'Please enter a valid number between 0.1 and 10 liters' },
    { name: 'breakfastTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 08:30)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'lunchTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 12:30)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'snackTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 15:30)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'dinnerTime', validator: validateTimeInput, placeholder: 'Enter time (e.g., 19:00)', errorMsg: 'Please enter a valid time format (HH:MM)' },
    { name: 'sleepLength', validator: validateSleepLength, placeholder: 'Enter hours (e.g., 7.5)', errorMsg: 'Please enter a valid number between 0.1 and 24 hours' }
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

function validateStep2() {
  const requiredFields = ['sleepLength', 'sleepQuality', 'tiredness'];
  const missingFields = [];
  const invalidFields = [];
  
  requiredFields.forEach(field => {
    const checkedRadio = document.querySelector(`input[name="${field}"]:checked`);
    if (!checkedRadio) {
      missingFields.push(field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
    } else if (checkedRadio.value === 'Other') {
      // Validate custom input for sleep length
      if (field === 'sleepLength') {
        const customInput = document.getElementById(`${field}Custom`);
        if (!customInput.value.trim()) {
          missingFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} (Other)`);
        } else if (!validateSleepLength(customInput.value.trim())) {
          invalidFields.push(`${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: Please enter a valid number between 0.1 and 24 hours`);
          document.getElementById(`${field}CustomError`).textContent = 'Please enter a valid number between 0.1 and 24 hours';
          document.getElementById(`${field}CustomError`).classList.remove('hidden');
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
document.getElementById('dailyTrackingForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in.');
    window.location.href = '/login.html';
    return;
  }

  // Validate Step 2
  if (!validateStep2()) {
    return;
  }

  // Clear old messages
  document.getElementById('successMessage').classList.add('hidden');
  document.getElementById('errorMessage').classList.add('hidden');

  // Collect form data from both steps using the new getFieldValue function
  const formData = {
    // Step 1 data
    previousDay: document.getElementById('previousDay').value,
    appetite: getFieldValue('appetite'),
    waterIntake: getFieldValue('waterIntake'),
    breakfastTime: getFieldValue('breakfastTime'),
    lunchTime: getFieldValue('lunchTime'),
    snackTime: getFieldValue('snackTime'),
    dinnerTime: getFieldValue('dinnerTime'),
    
    // Step 2 data
    sleepLength: getFieldValue('sleepLength'),
    sleepQuality: getFieldValue('sleepQuality'),
    tiredness: getFieldValue('tiredness'),
    signature: signatureData
  };

  try {
    const res = await fetch('/api/daily-tracking', {
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
document.getElementById('nextStep').addEventListener('click', () => {
  if (validateStep1()) {
    showStep(2);
  }
});

document.getElementById('prevStep').addEventListener('click', () => {
  showStep(1);
});

// Clear signature button
document.getElementById('clearSignature').addEventListener('click', clearSignature);

// Check user role on page load and add role indicator
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
  // Set default date to yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  document.getElementById('previousDay').value = yesterday.toISOString().split('T')[0];
  
  // Initialize signature canvas
  initSignatureCanvas();
  
  // Setup "Other" input handlers
  setupOtherInputHandlers();
  
  // Check user role
  checkUserRole();
  
  // Start with step 1
  showStep(1);
}); 