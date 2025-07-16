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
  console.log('Showing step:', step);
  
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
  
  // Show current step
  const currentStepElement = document.getElementById(`step${step}`);
  if (currentStepElement) {
    currentStepElement.classList.remove('hidden');
  }
  
  // Update step indicators
  document.querySelectorAll('.step').forEach(s => {
    s.classList.remove('active', 'completed');
  });
  
  // Mark completed steps
  for (let i = 1; i < step; i++) {
    const stepIndicator = document.getElementById(`step${i}Indicator`);
    if (stepIndicator) {
      stepIndicator.classList.add('completed');
    }
  }
  
  // Mark current step as active
  const activeStepIndicator = document.getElementById(`step${step}Indicator`);
  if (activeStepIndicator) {
    activeStepIndicator.classList.add('active');
  }
  
  currentStep = step;
  
  // Scroll to top of form
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Simplified validation functions
function validateStep1() {
  console.log('Validating Step 1');
  
  // Check membership ID
  const membershipId = document.getElementById('membershipId');
  if (!membershipId || !membershipId.value.trim()) {
    alert('Please enter your Membership ID');
    if (membershipId) membershipId.focus();
    return false;
  }
  
  // Check training minutes
  const trainingMinutes = document.querySelector('input[name="trainingMinutes"]:checked');
  if (!trainingMinutes) {
    alert('Please select your training minutes');
    return false;
  }
  
  // If "Other" is selected, validate custom input
  if (trainingMinutes.value === 'Other') {
    const customInput = document.getElementById('customTrainingMinutes');
    if (!customInput || !customInput.value.trim()) {
      alert('Please enter your custom training minutes');
      if (customInput) customInput.focus();
      return false;
    }
    
    if (!validateTrainingMinutes(customInput.value.trim())) {
      alert('Please enter a valid training minutes range (e.g., 100-110)');
      if (customInput) customInput.focus();
      return false;
    }
  }
  
  console.log('Step 1 validation passed');
  return true;
}

function validateStep2() {
  console.log('Validating Step 2');
  
  // Check previous day
  const previousDay = document.getElementById('previousDay');
  if (!previousDay || !previousDay.value) {
    alert('Please select the previous day');
    if (previousDay) previousDay.focus();
    return false;
  }
  
  // Check required radio button fields
  const requiredFields = ['appetite', 'waterIntake', 'breakfastTime', 'lunchTime', 'snackTime', 'dinnerTime'];
  
  for (const field of requiredFields) {
    const selected = document.querySelector(`input[name="${field}"]:checked`);
    if (!selected) {
      alert(`Please select an option for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return false;
    }
  }
  
  console.log('Step 2 validation passed');
  return true;
}

function validateStep3() {
  console.log('Validating Step 3');
  
  // Check required radio button fields
  const requiredFields = ['sleepLength', 'sleepQuality', 'tiredness'];
  
  for (const field of requiredFields) {
    const selected = document.querySelector(`input[name="${field}"]:checked`);
    if (!selected) {
      alert(`Please select an option for ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      return false;
    }
  }
  
  // Check signature
  if (!signatureData) {
    alert('Please provide your signature');
    return false;
  }
  
  console.log('Step 3 validation passed');
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
    return document.getElementById(`${fieldName}Custom`)?.value.trim() || null;
  }
  return checkedRadio ? checkedRadio.value : null;
}

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

// Setup event listeners for navigation
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Step 1 -> Step 2
  const nextStep1 = document.getElementById('nextStep1');
  if (nextStep1) {
    nextStep1.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Next Step 1 clicked');
      if (validateStep1()) {
        showStep(2);
      }
    });
  }
  
  // Step 2 -> Step 1 (back)
  const prevStep2 = document.getElementById('prevStep2');
  if (prevStep2) {
    prevStep2.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Previous Step 2 clicked');
      showStep(1);
    });
  }
  
  // Step 2 -> Step 3
  const nextStep2 = document.getElementById('nextStep2');
  if (nextStep2) {
    nextStep2.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Next Step 2 clicked');
      if (validateStep2()) {
        showStep(3);
      }
    });
  }
  
  // Step 3 -> Step 2 (back)
  const prevStep3 = document.getElementById('prevStep3');
  if (prevStep3) {
    prevStep3.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Previous Step 3 clicked');
      showStep(2);
    });
  }
  
  // Clear signature button
  const clearSignatureBtn = document.getElementById('clearSignature');
  if (clearSignatureBtn) {
    clearSignatureBtn.addEventListener('click', function(e) {
      e.preventDefault();
      clearSignature();
    });
  }
  
  // Form submission
  const form = document.getElementById('dailyTrackingForm');
  if (form) {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('Form submitted');
      
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
      document.getElementById('successMessage')?.classList.add('hidden');
      document.getElementById('errorMessage')?.classList.add('hidden');

      // Collect form data
      const userRole = localStorage.getItem('userRole') || 'Athlete';
      let membershipId = document.getElementById('membershipId').value.trim();
      
      // For athletes, get membership ID from their profile if field is hidden/empty
      if (userRole === 'Athlete' && !membershipId) {
        try {
          const res = await fetch('https://app.dsnc.in/api/auth/profile', {
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
        membershipId: membershipId,
        trainingMinutes: getFieldValue('trainingMinutes'),
        previousDay: document.getElementById('previousDay').value,
        appetite: getFieldValue('appetite'),
        waterIntake: getFieldValue('waterIntake'),
        breakfastTime: getFieldValue('breakfastTime'),
        lunchTime: getFieldValue('lunchTime'),
        snackTime: getFieldValue('snackTime'),
        dinnerTime: getFieldValue('dinnerTime'),
        sleepLength: getFieldValue('sleepLength'),
        sleepQuality: getFieldValue('sleepQuality'),
        tiredness: getFieldValue('tiredness'),
        signature: signatureData
      };

      try {
        const res = await fetch('https://app.dsnc.in/api/daily-tracking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });

        const data = await res.json();

        if (res.ok) {
          const successMsg = document.getElementById('successMessage');
          if (successMsg) {
            successMsg.classList.remove('hidden');
            successMsg.scrollIntoView({ behavior: 'smooth' });
          }
          
          // Reset form
          form.reset();
          showStep(1);
          clearSignature();
          
          // Reset date to yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          document.getElementById('previousDay').value = yesterday.toISOString().split('T')[0];
          
        } else {
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
          
          const errorMsg = document.getElementById('errorMessage');
          if (errorMsg) {
            errorMsg.textContent = errorText;
            errorMsg.classList.remove('hidden');
            errorMsg.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } catch (err) {
        console.error('Error:', err);
        const errorMsg = document.getElementById('errorMessage');
        if (errorMsg) {
          errorMsg.textContent = 'Network error. Please check your connection and try again.';
          errorMsg.classList.remove('hidden');
          errorMsg.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
}

// Check user role on page load and handle membership ID
async function checkUserRole() {
  const userRole = localStorage.getItem('userRole') || 'Athlete';
  const token = localStorage.getItem('token');
  
  // Handle membership ID field based on role
  const membershipIdField = document.getElementById('membershipId');
  const membershipIdContainer = membershipIdField?.parentElement;
  
  if (userRole === 'Athlete') {
    // For athletes, auto-fill their membership ID and make it read-only (but visible)
    try {
      const res = await fetch('https://app.dsnc.in/api/auth/profile', {
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
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded - Initializing daily tracking form');
  
  // Wait a bit for all elements to be ready
  setTimeout(async function() {
    try {
      // Set default date to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const previousDayField = document.getElementById('previousDay');
      if (previousDayField) {
        previousDayField.value = yesterday.toISOString().split('T')[0];
      }
      
      // Initialize signature canvas
      initSignatureCanvas();
      
      // Setup training minutes handler
      setupTrainingMinutesHandler();
      
      // Setup event listeners
      setupEventListeners();
      
      // Check user role
      await checkUserRole();
      
      // Start with step 1
      showStep(1);
      
      console.log('Daily tracking form initialized successfully');
    } catch (error) {
      console.error('Error initializing daily tracking form:', error);
    }
  }, 100);
}); 