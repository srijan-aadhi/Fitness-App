// public/src/app.js

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

// Store user role information
let userRole = localStorage.getItem('userRole') || 'Athlete';

// 👇 New: Check if returning from add-athlete page
if (localStorage.getItem('athleteAdded') === 'true') {
  localStorage.removeItem('athleteAdded');
  show('entry');
  loadAthletes();
}

let sessionTimer = null;
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes

function show(section) {
  if (section === 'login' || section === 'signup') {
    window.location.href = `/${section}.html`;
    return;
  }

  ['entry','dashboard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const target = document.getElementById(section);
  if (target) target.classList.remove('hidden');

  if (section === 'entry') {
    loadAthletes();
  } else if (section === 'dashboard') {
    // Load dashboard analytics when dashboard is shown
    setTimeout(() => {
      loadDashboard();
    }, 100);
  }
  
  updateNav(section);
}

function updateNav(activeSection) {
  const entries = document.querySelectorAll('.nav-item');
  entries.forEach(el => el.classList.remove('border-b-2', 'border-yellow-400'));
  const activeEl = document.querySelector(`[onclick="show('${activeSection}')"]`);
  activeEl?.classList.add('border-b-2', 'border-yellow-400');
}

function resetSession() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    alert('Session expired. Please log in again.');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = '/login.html';
  }, SESSION_TIMEOUT);
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  window.location.href = '/login.html';
}

// Check if user can create athletes (Tester role or higher)
function canCreateAthletes() {
  const roleHierarchy = {
    'Athlete': 1,
    'Tester': 2, 
    'Admin': 3,
    'Super Admin': 4
  };
  
  return (roleHierarchy[userRole] || 1) >= 2; // Tester level or higher
}

// Configuration for API endpoints
const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';

// Fetch user profile to get role information with timeout
async function fetchUserProfile() {
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const userData = await res.json();
      userRole = userData.role;
      localStorage.setItem('userRole', userRole);
      
      // Update UI based on role
      updateUIForRole();
    } else {
      // If profile fetch fails, fallback to stored role and show UI
      updateUIForRole();
    }
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    // Fallback to stored role and show UI even if fetch fails
    updateUIForRole();
  }
}

// Update UI elements based on user role
function updateUIForRole() {
  // Add role indicator to the page
  const roleIndicator = document.createElement('div');
  roleIndicator.id = 'roleIndicator';
  roleIndicator.className = 'fixed bottom-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-full text-sm font-semibold z-50 shadow-lg';
  roleIndicator.textContent = `Role: ${userRole}`;
  
  // Remove existing role indicator if present
  const existing = document.getElementById('roleIndicator');
  if (existing) existing.remove();
  
  document.body.appendChild(roleIndicator);
  
  // Role-based UI control logic
  const isAthlete = userRole === 'Athlete';
  const isTrainer = userRole === 'Tester' || userRole === 'Admin';
  const isSuperAdmin = userRole === 'Super Admin';
  
  // First, authorize basic navigation elements that everyone can see
  const basicNavItems = document.querySelectorAll('.nav-item[onclick="show(\'dashboard\')"]');
  basicNavItems.forEach(btn => {
    if (btn) btn.classList.add('role-authorized');
  });
  
  // Role-specific authorization
  if (isAthlete) {
    // Athletes can see injury form
    const injuryFormButtons = document.querySelectorAll('.nav-item[onclick="show(\'entry\')"], .hero-assessment-btn[onclick="show(\'entry\')"], button[onclick="show(\'entry\')"]');
    injuryFormButtons.forEach(btn => {
      if (btn) btn.classList.add('role-authorized');
    });
    
    // Hide Individual Results Filter for Athletes
    const allFilterContainers = document.querySelectorAll('.bg-gray-800');
    allFilterContainers.forEach(container => {
      const label = container.querySelector('label');
      if (label && label.textContent.includes('Individual Results Filter')) {
        container.style.display = 'none';
      }
    });
  }
  
  if (isTrainer) {
    // Trainers can see assessment forms but NOT injury forms or daily tracking
    const assessmentButtons = document.querySelectorAll('.nav-item[onclick*="strength-form.html"], .nav-item[onclick*="speed-form.html"], .nav-item[onclick*="agility-form.html"], .hero-assessment-btn[onclick*="strength-form.html"], .hero-assessment-btn[onclick*="speed-form.html"], .hero-assessment-btn[onclick*="agility-form.html"]');
    assessmentButtons.forEach(btn => {
      if (btn) btn.classList.add('role-authorized');
    });
    
    // Show injury reports button for trainers
    const injuryReportsBtn = document.getElementById('injuryReportsBtn');
    if (injuryReportsBtn) {
      injuryReportsBtn.style.display = 'block';
    }
  }
  
  // Super Admin gets access to ALL forms - no restrictions
  if (isSuperAdmin) {
    // Authorize all navigation elements
    const allNavItems = document.querySelectorAll('.nav-item, .hero-assessment-btn');
    allNavItems.forEach(btn => {
      if (btn) btn.classList.add('role-authorized');
    });
    
    // Show injury reports button for Super Admin
    const injuryReportsBtn = document.getElementById('injuryReportsBtn');
    if (injuryReportsBtn) {
      injuryReportsBtn.style.display = 'block';
    }
    
    // Ensure Individual Results Filter is visible for Super Admin
    const allFilterContainers = document.querySelectorAll('.bg-gray-800');
    allFilterContainers.forEach(container => {
      const label = container.querySelector('label');
      if (label && label.textContent.includes('Individual Results Filter')) {
        container.style.display = '';
      }
    });
  }
  
  // Update membership filter based on role
  updateMembershipFilter();
  
  // Hide loading overlay after role-based UI is set up
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
  }
}

// Update membership filter based on user role
async function updateMembershipFilter() {
  const membershipFilter = document.getElementById('membershipFilter');
  if (!membershipFilter) return;
  
  if (userRole === 'Athlete') {
    // For athletes, show their own membership ID and make it read-only
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        const userData = await res.json();
        membershipFilter.value = userData.membership_id || '';
        membershipFilter.readOnly = true;
        membershipFilter.placeholder = 'Your Membership ID';
        membershipFilter.className = 'bg-gray-600 border border-gray-500 text-gray-300 px-3 py-2 rounded-md focus:outline-none cursor-not-allowed w-48';
        
        // Update label text for athletes
        const label = membershipFilter.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
          label.innerHTML = '<i class="fas fa-id-card mr-2"></i>Your Membership ID';
        }
      }
    } catch (err) {
      console.error('Failed to fetch user profile for membership ID:', err);
    }
  } else {
    // For other roles, allow filtering by membership ID
    membershipFilter.readOnly = false;
    membershipFilter.placeholder = 'Enter Membership ID to filter';
    membershipFilter.className = 'bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-48';
    
    // Update label text for other roles
    const label = membershipFilter.previousElementSibling;
    if (label && label.tagName === 'LABEL') {
      label.innerHTML = '<i class="fas fa-user-circle mr-2"></i>Filter by Membership ID';
    }
  }
}

// Load athletes dynamically
async function loadAthletes() {
  const res = await fetch(`${API_BASE_URL}/api/athletes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const select = document.getElementById('athleteSelect');
  select.innerHTML = '';

  // Add placeholder option
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Choose an athlete...';
  select.appendChild(placeholder);

  // Check if no athletes exist
  if (!data || data.length === 0) {
    // Only show add-athlete option if user is an athlete and hasn't added any athletes yet
    const userRole = localStorage.getItem('userRole') || 'Athlete';
    const showAddAthleteOption = userRole === 'Athlete';
    
    if (showAddAthleteOption) {
      // Add option to redirect to add athlete page
      const addAthleteOption = document.createElement('option');
      addAthleteOption.value = 'add-athlete';
      addAthleteOption.textContent = 'No athletes found - Click here to add one';
      addAthleteOption.style.color = '#ef4444';
      addAthleteOption.style.fontWeight = 'bold';
      select.appendChild(addAthleteOption);
      
      // Add event listener to redirect when selected
      select.addEventListener('change', function() {
        if (this.value === 'add-athlete') {
          window.location.href = 'add-athlete.html';
        }
      });
    } else {
      // For non-athletes, just show a message that no athletes are available
      const noAthletesOption = document.createElement('option');
      noAthletesOption.value = '';
      noAthletesOption.textContent = 'No athletes available';
      noAthletesOption.disabled = true;
      noAthletesOption.style.color = '#6b7280';
      select.appendChild(noAthletesOption);
    }
    
    return;
  }

  data.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.fullName;
    select.appendChild(option);
  });
  
  // Note: Once athletes exist, athletes should not see the add-athlete option
  // This ensures athletes can only add their first athlete, after which they 
  // must use existing athletes from the dropdown
}

// Add injury show/hide functionality
document.addEventListener('DOMContentLoaded', function() {
  const hasInjuryRadios = document.querySelectorAll('input[name="hasInjury"]');
  const injuryDescription = document.getElementById('injuryDescription');
  
  hasInjuryRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.value === 'yes') {
        injuryDescription.classList.remove('hidden');
      } else {
        injuryDescription.classList.add('hidden');
        document.getElementById('injury').value = ''; // Clear the text area
      }
    });
  });
});

// Submit Performance Test
document.getElementById('entryForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const athleteId = document.getElementById('athleteSelect').value;
  
  // Check if athlete is selected
  if (!athleteId) {
    alert('Please select an athlete first.');
    return;
  }
  
  // Check if injury question is answered
  const hasInjury = document.querySelector('input[name="hasInjury"]:checked');
  if (!hasInjury) {
    alert('Please answer whether you have any current injury or recent surgery.');
    return;
  }
  
  // Get injury description if they answered yes
  let injuryDescription = '';
  if (hasInjury.value === 'yes') {
    injuryDescription = document.getElementById('injury').value.trim();
    if (!injuryDescription) {
      alert('Please describe your injury or recent surgery.');
      return;
    }
  } else {
    injuryDescription = 'No current injury or recent surgery';
  }
  
  const test = {
    athlete_id: athleteId,
    injury: injuryDescription
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/injury-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      alert('Injury form submitted successfully! Redirecting to daily tracking...');
      // Redirect to daily tracking after successful submission
      setTimeout(() => {
        window.location.href = 'daily-tracking.html';
      }, 1500);
    } else {
      // Handle specific error messages
      if (res.status === 403) {
        alert('Access denied: You need Tester role or higher to submit performance tests. Please contact an administrator.');
      } else {
        alert(data.message || 'Failed to submit test. Please try again.');
      }
    }
  } catch (err) {
    console.error('Error submitting test:', err);
    alert('Network error. Please check your connection and try again.');
  }
});

// Dashboard Chart Variables
let daysTrainedChart, monthlyTrainingChart, waterIntakeChart, hungerLevelChart, sleepHoursChart, sleepQualityChart;

// Load Dashboard Analytics
async function loadDashboard() {
  try {
    // Get filter values
    const membershipFilter = document.getElementById('membershipFilter');
    const monthWiseFilter = document.getElementById('monthWiseFilter');
    
    const membershipId = membershipFilter?.value || '';
    const monthWise = monthWiseFilter?.checked || false;
    
    // Get selected months from the selected list
    const selectedMonths = getSelectedMonths();
    
    console.log('Selected months:', selectedMonths);

    // If no months selected, show a message instead of loading empty data
    if (selectedMonths.length === 0) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'bg-yellow-600 text-white p-4 rounded-lg mb-4';
      errorMsg.textContent = 'Please select at least one month to view dashboard data.';
      
      const dashboard = document.getElementById('dashboard');
      if (dashboard) {
        // Remove any existing error messages
        const existingError = dashboard.querySelector('.bg-yellow-600, .bg-red-600');
        if (existingError) existingError.remove();
        
        dashboard.insertBefore(errorMsg, dashboard.firstChild);
      }
      return;
    }

    // Remove any existing error messages
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      const existingError = dashboard.querySelector('.bg-yellow-600, .bg-red-600');
      if (existingError) existingError.remove();
    }

    // Build query parameters
    const params = new URLSearchParams({
      membershipId,
      monthWise: monthWise.toString()
    });
    
    // Add each selected month as a separate parameter
    selectedMonths.forEach(month => {
      params.append('months', month);
    });

    // Fetch dashboard data with filters
    const res = await fetch(`${API_BASE_URL}/api/dashboard-analytics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Dashboard data received:', data);
    updateDashboardCharts(data);
    
  } catch (err) {
    console.error('Error loading dashboard:', err);
    // Show error message to user
    const errorMsg = document.createElement('div');
    errorMsg.className = 'bg-red-600 text-white p-4 rounded-lg mb-4';
    errorMsg.textContent = 'Failed to load dashboard data. Please try refreshing the page.';
    
    const dashboard = document.getElementById('dashboard');
    if (dashboard) {
      dashboard.insertBefore(errorMsg, dashboard.firstChild);
    }
  }
}

// Update all dashboard charts
function updateDashboardCharts(data) {
  // Update values
  const daysTrainedValue = document.getElementById('daysTrainedValue');
  const maxDaysValue = document.getElementById('maxDaysValue');
  const waterIntakeValue = document.getElementById('waterIntakeValue');
  
  if (daysTrainedValue) daysTrainedValue.textContent = data.daysTrained || 0;
  if (maxDaysValue) maxDaysValue.textContent = data.maxDays || 365;
  if (waterIntakeValue) waterIntakeValue.textContent = data.waterIntake || 0;

  // Update chart titles based on filtering
  updateChartTitles();

  // Create charts with real data
  createDaysTrainedGauge(data.daysTrained || 0, data.maxDays || 365);
  createWaterIntakeGauge(data.waterIntake || 0);
  createMonthlyTrainingChart(data.monthlyTraining);
  createHungerLevelChart(data.hungerLevel);
  createSleepHoursChart(data.sleepHours);
  createSleepQualityChart(data.sleepQuality);
}

// Update chart titles to show filtering status
function updateChartTitles() {
  const membershipFilter = document.getElementById('membershipFilter');
  const membershipId = membershipFilter?.value?.trim() || '';
  
  const sleepHoursTitle = document.getElementById('sleepHoursTitle');
  const sleepHoursSubtitle = document.getElementById('sleepHoursSubtitle');
  
  if (membershipId) {
    // Individual filtering is active
    if (sleepHoursTitle) {
      sleepHoursTitle.innerHTML = `<i class="fas fa-user mr-2 text-blue-400"></i>Sleep Hours Distribution - Member ID: ${membershipId}`;
    }
    if (sleepHoursSubtitle) {
      sleepHoursSubtitle.textContent = 'Individual results: Number of entries for each sleep duration';
    }
  } else {
    // Show all users
    if (sleepHoursTitle) {
      sleepHoursTitle.innerHTML = 'Sleep Hours Distribution - All Users';
    }
    if (sleepHoursSubtitle) {
      sleepHoursSubtitle.textContent = 'Combined results: Number of entries for each sleep duration';
    }
  }
}

// Create Days Trained Gauge Chart
function createDaysTrainedGauge(value, max) {
  const ctx = document.getElementById('daysTrainedChart');
  if (!ctx) return;

  if (daysTrainedChart) daysTrainedChart.destroy();

  const percentage = (value / max) * 100;
  
  daysTrainedChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#3B82F6', '#374151'],
        borderWidth: 0,
        cutout: '75%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

// Create Water Intake Gauge Chart
function createWaterIntakeGauge(value) {
  const ctx = document.getElementById('waterIntakeChart');
  if (!ctx) return;

  if (waterIntakeChart) waterIntakeChart.destroy();

  const percentage = (value / 3) * 100; // 3L is max recommended
  
  waterIntakeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [percentage, 100 - percentage],
        backgroundColor: ['#06B6D4', '#374151'],
        borderWidth: 0,
        cutout: '75%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

// Create Monthly Training Hours Chart
function createMonthlyTrainingChart(data) {
  const ctx = document.getElementById('monthlyTrainingChart');
  if (!ctx) return;

  if (monthlyTrainingChart) monthlyTrainingChart.destroy();

  if (!data || !data.labels || !data.datasets) {
    console.log('No monthly training data available');
    return;
  }

  monthlyTrainingChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: data.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#9CA3AF' },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: 'Months',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        },
        y: {
          beginAtZero: true,
          ticks: { 
            color: '#9CA3AF',
            stepSize: 1,
            callback: function(value) {
              return Number.isInteger(value) ? `${value} days` : '';
            }
          },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: 'Number of Days',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { 
            color: '#9CA3AF', 
            boxWidth: 12, 
            font: { size: 10 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const range = context.dataset.label;
              const days = context.parsed.y;
              return `${range} minutes: ${days} day${days !== 1 ? 's' : ''}`;
            }
          }
        }
      }
    }
  });
}

// Create Hunger Level Chart with real data
function createHungerLevelChart(data) {
  const ctx = document.getElementById('hungerLevelChart');
  if (!ctx) return;

  if (hungerLevelChart) hungerLevelChart.destroy();

  if (!data || !data.months || !data.categories || !data.data) {
    console.log('No hunger level data available');
    return;
  }

  // Store original data for tooltip display
  const originalData = data.data.map(monthData => 
    monthData.map(count => count || 0)
  );

  // Create datasets from real data with percentage conversion
  const datasets = data.categories.map((category, index) => {
    const colors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#F97316'];
    return {
      label: category,
      data: data.data.map(monthData => {
        const totalForMonth = monthData.reduce((sum, count) => sum + (count || 0), 0);
        const categoryCount = monthData[index] || 0;
        return totalForMonth > 0 ? (categoryCount / totalForMonth) * 100 : 0;
      }),
      backgroundColor: colors[index % colors.length],
      originalCounts: data.data.map(monthData => monthData[index] || 0)
    };
  });

  hungerLevelChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          stacked: true,
          min: 0,
          max: 100,
          ticks: { 
            color: '#9CA3AF',
            stepSize: 20,
            callback: function(value) {
              return `${value}%`;
            }
          },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: 'Percentage (%)',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        },
        y: {
          stacked: true,
          ticks: { color: '#9CA3AF' },
          grid: { color: '#374151' }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: { color: '#9CA3AF', boxWidth: 12, font: { size: 10 } }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const category = context.dataset.label;
              const percentage = context.parsed.x.toFixed(1);
              const originalCount = context.dataset.originalCounts[context.dataIndex];
              return `${category}: ${originalCount} ${originalCount !== 1 ? 'entries' : 'entry'} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// Create Sleep Hours Chart with real data
function createSleepHoursChart(data) {
  const ctx = document.getElementById('sleepHoursChart');
  if (!ctx) return;

  if (sleepHoursChart) sleepHoursChart.destroy();

  if (!data || !data.data || data.data.length === 0) {
    console.log('No sleep hours data available');
    return;
  }

  // Extract sleep hours and count occurrences
  const sleepHourCounts = {};
  data.data.forEach((dataPoint) => {
    const hours = dataPoint.value || 0;
    const hourLabel = `${hours}h`;
    sleepHourCounts[hourLabel] = (sleepHourCounts[hourLabel] || 0) + 1;
  });

  // Sort hours numerically and prepare data
  const sortedHours = Object.keys(sleepHourCounts).sort((a, b) => {
    const hoursA = parseFloat(a.replace('h', ''));
    const hoursB = parseFloat(b.replace('h', ''));
    return hoursA - hoursB;
  });

  const countsData = sortedHours.map(hour => sleepHourCounts[hour]);

  // Generate color array for each hour based on actual hour value
  const colorPalette = [
    '#EF4444', // Red - 1h (very little sleep)
    '#F97316', // Orange - 2h
    '#F59E0B', // Amber - 3h
    '#EAB308', // Yellow - 4h
    '#84CC16', // Lime - 5h
    '#22C55E', // Green - 6h
    '#10B981', // Emerald - 7h (good sleep)
    '#06B6D4', // Cyan - 8h (optimal sleep)
    '#3B82F6', // Blue - 9h
    '#6366F1', // Indigo - 10h
    '#8B5CF6', // Violet - 11h
    '#A855F7', // Purple - 12h+
  ];

  const colors = sortedHours.map((hourLabel) => {
    const hourValue = parseFloat(hourLabel.replace('h', ''));
    // Use hour value - 1 as index (1h = index 0, 2h = index 1, etc.)
    const colorIndex = Math.max(0, Math.min(hourValue - 1, colorPalette.length - 1));
    return colorPalette[colorIndex];
  });

  const borderColors = colors.map(color => {
    // Create darker border colors by reducing brightness
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
  });

  sleepHoursChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sortedHours,
      datasets: [{
        label: 'Sleep Hours',
        data: countsData,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#9CA3AF' },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: 'Hours of Sleep',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        },
        y: {
          beginAtZero: true,
          ticks: { 
            color: '#9CA3AF',
            stepSize: 1,
            callback: function(value) {
              return Number.isInteger(value) ? `${value}` : '';
            }
          },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: '# of entries',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: function(context) {
              return `${context[0].label} of Sleep`;
            },
            label: function(context) {
              const entries = context.parsed.y;
              return `${entries} ${entries !== 1 ? 'entries' : 'entry'}`;
            }
          }
        }
      }
    }
  });
}

// Create Sleep Quality Chart with real data
function createSleepQualityChart(data) {
  const ctx = document.getElementById('sleepQualityChart');
  if (!ctx) return;

  if (sleepQualityChart) sleepQualityChart.destroy();

  if (!data || !data.months || !data.categories) {
    console.log('No sleep quality data available');
    return;
  }

  // Create datasets for each sleep quality category
  const datasets = data.categories.map((category, index) => {
    // Use intuitive colors for sleep quality (green=good, red=bad)
    const colorMap = {
      'Very Deep': '#10B981',    // Green - excellent sleep
      'Normal': '#3B82F6',       // Blue - good sleep  
      'Restless': '#F59E0B',     // Amber - poor sleep
      'Bad with Breaks': '#EF4444', // Red - bad sleep
      'Not at all': '#7F1D1D'    // Dark red - terrible sleep
    };
    const colors = colorMap[category] || '#6B7280';
    
    // Calculate data for each month
    const categoryData = data.months.map(month => {
      // Find data points for this category and month
      const monthData = data.data.filter(point => 
        point.category === category && point.month === month
      );
      // Sum up the counts for this category in this month
      return monthData.reduce((sum, point) => sum + (point.count || 0), 0);
    });
    
    return {
      label: category,
      data: categoryData,
      backgroundColor: colors,
      borderColor: colors,
      borderWidth: 1
    };
  });

  sleepQualityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: '#9CA3AF' },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: 'Months',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        },
        y: {
          beginAtZero: true,
          ticks: { 
            color: '#9CA3AF',
            stepSize: 1,
            callback: function(value) {
              return Number.isInteger(value) ? `${value}` : '';
            }
          },
          grid: { color: '#374151' },
          title: {
            display: true,
            text: '# of entries',
            color: '#9CA3AF',
            font: { size: 12 }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { 
            color: '#9CA3AF', 
            boxWidth: 12, 
            font: { size: 10 },
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              return context[0].label;
            },
            label: function(context) {
              const category = context.dataset.label;
              const entries = context.parsed.y;
              return `${category}: ${entries} ${entries !== 1 ? 'entries' : 'entry'}`;
            }
          }
        }
      }
    }
  });
}

// Array to store selected months
let selectedMonthsArray = [];

// Make functions globally accessible immediately
window.selectedMonthsArray = selectedMonthsArray;

// All available months for the dropdown
const allMonths = [
  {value: 'Jun-25', label: 'June 2025'},
  {value: 'May-25', label: 'May 2025'},
  {value: 'Apr-25', label: 'April 2025'},
  {value: 'Mar-25', label: 'March 2025'},
  {value: 'Feb-25', label: 'February 2025'},
  {value: 'Jan-25', label: 'January 2025'},
  {value: 'Dec-24', label: 'December 2024'},
  {value: 'Nov-24', label: 'November 2024'},
  {value: 'Oct-24', label: 'October 2024'},
  {value: 'Sep-24', label: 'September 2024'},
  {value: 'Aug-24', label: 'August 2024'},
  {value: 'Jul-24', label: 'July 2024'},
  {value: 'Jun-24', label: 'June 2024'},
  {value: 'May-24', label: 'May 2024'},
  {value: 'Apr-24', label: 'April 2024'},
  {value: 'Mar-24', label: 'March 2024'},
  {value: 'Feb-24', label: 'February 2024'},
  {value: 'Jan-24', label: 'January 2024'},
  {value: 'Dec-23', label: 'December 2023'},
  {value: 'Nov-23', label: 'November 2023'}
];

// Get selected months array
function getSelectedMonths() {
  return selectedMonthsArray;
}

// Update selected months count display
function updateSelectedCount() {
  const countElement = document.getElementById('selectedCount');
  if (countElement) {
    const newText = `(${selectedMonthsArray.length} selected)`;
    countElement.textContent = newText;
    console.log('Updated count display to:', newText);
  } else {
    console.error('selectedCount element not found!');
  }
}

// Update the dropdown options to hide selected items
function updateDropdownOptions() {
  const dropdown = document.getElementById('monthDropdown');
  if (!dropdown) {
    console.error('monthDropdown element not found!');
    return;
  }
  
  console.log('Updating dropdown options, currently selected:', selectedMonthsArray);
  
  // Store current selection
  const currentValue = dropdown.value;
  
  // Clear dropdown
  dropdown.innerHTML = '<option value="">Select a time period...</option>';
  
  // Group months by year
  const years = {'2025': [], '2024': [], '2023': []};
  
  allMonths.forEach(month => {
    // Only add if not already selected
    if (!selectedMonthsArray.includes(month.value)) {
      const year = month.value.split('-')[1];
      const fullYear = year.length === 2 ? `20${year}` : year;
      if (years[fullYear]) {
        years[fullYear].push(month);
      }
    }
  });
  
  // Add optgroups and options
  Object.keys(years).forEach(year => {
    if (years[year].length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = year;
      
      years[year].forEach(month => {
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.label;
        optgroup.appendChild(option);
      });
      
      dropdown.appendChild(optgroup);
    }
  });
  
  // Restore selection if it's still available
  if (currentValue && !selectedMonthsArray.includes(currentValue)) {
    dropdown.value = currentValue;
  }
  
  console.log('Dropdown updated, available options:', dropdown.options.length);
}

// Update the selected months list display
function updateSelectedMonthsList() {
  const listContainer = document.getElementById('selectedMonthsList');
  if (!listContainer) {
    console.error('selectedMonthsList element not found!');
    return;
  }
  
  console.log('Updating list with selected months:', selectedMonthsArray);
  
  if (selectedMonthsArray.length === 0) {
    listContainer.innerHTML = '<p class="text-xs text-gray-400 italic">No time periods selected yet...</p>';
    return;
  }
  
  // Create list of selected items with remove buttons
  const listItems = selectedMonthsArray.map(monthValue => {
    const month = allMonths.find(m => m.value === monthValue);
    if (!month) {
      console.error('Month not found for value:', monthValue);
      return '';
    }
    
    return `
      <div class="flex items-center justify-between bg-blue-600 text-white px-2 py-1 rounded mb-1 text-xs">
        <span>${month.label}</span>
        <button onclick="window.removeSelectedMonth('${monthValue}')" class="ml-2 text-blue-200 hover:text-white transition-colors">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
  }).filter(item => item !== '').join('');
  
  listContainer.innerHTML = listItems;
  console.log('List updated with HTML:', listContainer.innerHTML);
}

// Add a month to selected list
function addSelectedMonth(monthValue) {
  console.log('addSelectedMonth called with value:', monthValue);
  console.log('Current selected months before adding:', selectedMonthsArray);
  
  if (monthValue && !selectedMonthsArray.includes(monthValue)) {
    selectedMonthsArray.push(monthValue);
    window.selectedMonthsArray = selectedMonthsArray; // Keep window reference updated
    
    console.log('Added month. New selected months:', selectedMonthsArray);
    
    updateSelectedCount();
    updateSelectedMonthsList();
    updateDropdownOptions();
    loadDashboard();
  } else {
    console.log('Month not added - either empty or already selected');
  }
}

// Make function globally accessible
window.addSelectedMonth = addSelectedMonth;

// Test function to verify dropdown functionality
window.testDropdownFunctionality = function() {
  console.log('=== Dropdown Functionality Test ===');
  console.log('Selected months array:', selectedMonthsArray);
  console.log('Window selected months:', window.selectedMonthsArray);
  
  const dropdown = document.getElementById('monthDropdown');
  const listContainer = document.getElementById('selectedMonthsList');
  const countElement = document.getElementById('selectedCount');
  
  console.log('Dropdown element:', dropdown ? 'Found' : 'NOT FOUND');
  console.log('List container element:', listContainer ? 'Found' : 'NOT FOUND');
  console.log('Count element:', countElement ? 'Found' : 'NOT FOUND');
  
  if (dropdown) {
    console.log('Dropdown options count:', dropdown.options.length);
    console.log('Dropdown value:', dropdown.value);
  }
  
  if (listContainer) {
    console.log('List container content:', listContainer.innerHTML);
  }
  
  if (countElement) {
    console.log('Count display:', countElement.textContent);
  }
  
  console.log('=== End Test ===');
};

// Manual test function to add a month
window.testAddMonth = function(monthValue = 'Dec-24') {
  console.log('=== Manual Add Month Test ===');
  console.log('Adding month:', monthValue);
  addSelectedMonth(monthValue);
  console.log('=== End Manual Test ===');
};

// Manual test function to force update displays
window.forceUpdateDisplays = function() {
  console.log('=== Force Update Displays ===');
  console.log('Current selected months:', selectedMonthsArray);
  updateSelectedCount();
  updateSelectedMonthsList();
  updateDropdownOptions();
  console.log('=== End Force Update ===');
};

// Remove a month from selected list - make it global
window.removeSelectedMonth = function(monthValue) {
  const index = selectedMonthsArray.indexOf(monthValue);
  if (index > -1) {
    selectedMonthsArray.splice(index, 1);
    window.selectedMonthsArray = selectedMonthsArray; // Keep window reference updated
    updateSelectedCount();
    updateSelectedMonthsList();
    updateDropdownOptions();
    loadDashboard();
  }
}

// Add event listeners for dashboard filters
function setupDashboardFilters() {
  const membershipFilter = document.getElementById('membershipFilter');
  const monthWiseFilter = document.getElementById('monthWiseFilter');
  const monthDropdown = document.getElementById('monthDropdown');
  const selectAllBtn = document.getElementById('selectAllMonths');
  const clearAllBtn = document.getElementById('clearAllMonths');

  if (membershipFilter) {
    membershipFilter.addEventListener('input', debounce(loadDashboard, 500));
  }
  
  if (monthWiseFilter) {
    monthWiseFilter.addEventListener('change', loadDashboard);
  }
  
  // Add listener for month dropdown
  if (monthDropdown) {
    console.log('Setting up dropdown change listener');
    monthDropdown.addEventListener('change', (e) => {
      console.log('Dropdown change event fired, value:', e.target.value);
      if (e.target.value) {
        console.log('Adding selected month:', e.target.value);
        addSelectedMonth(e.target.value);
        // Reset dropdown to placeholder
        e.target.value = '';
        console.log('Dropdown reset to empty value');
      }
    });
  } else {
    console.error('monthDropdown not found during event listener setup');
  }
  
  // Select All button
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      console.log('Select All button clicked');
      console.log('Before Select All - selected months:', selectedMonthsArray);
      
      // Add all available months
      allMonths.forEach(month => {
        if (!selectedMonthsArray.includes(month.value)) {
          selectedMonthsArray.push(month.value);
        }
      });
      
      window.selectedMonthsArray = selectedMonthsArray; // Update window reference
      
      console.log('After Select All - selected months:', selectedMonthsArray);
      
      updateSelectedCount();
      updateSelectedMonthsList();
      updateDropdownOptions();
      loadDashboard();
    });
  }
  
  // Clear All button
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      selectedMonthsArray = [];
      updateSelectedCount();
      updateSelectedMonthsList();
      updateDropdownOptions();
      loadDashboard();
    });
  }
  
  // Initialize the interface with default selection
  console.log('Setting up dashboard filters...');
  
  // Add Jun-25 as default selection (like the original had checked)
  if (selectedMonthsArray.length === 0) {
    selectedMonthsArray.push('Jun-25');
    window.selectedMonthsArray = selectedMonthsArray; // Update window reference
    console.log('Added default selection Jun-25:', selectedMonthsArray);
  }
  
  // Force immediate update without delay
  console.log('Running immediate initialization...');
  console.log('Selected months at initialization:', selectedMonthsArray);
  
  // Try to update immediately
  const immediateUpdate = () => {
    const dropdown = document.getElementById('monthDropdown');
    const listContainer = document.getElementById('selectedMonthsList');
    const countElement = document.getElementById('selectedCount');
    
    if (dropdown && listContainer && countElement) {
      console.log('All elements found, updating immediately');
      updateSelectedCount();
      updateSelectedMonthsList();
      updateDropdownOptions();
      console.log('Immediate initialization complete');
      return true;
    }
    return false;
  };
  
  // Try immediate update first
  if (!immediateUpdate()) {
    console.log('Elements not ready, using timeout...');
    setTimeout(() => {
      if (!immediateUpdate()) {
        console.error('Elements still not found after timeout!');
      }
    }, 100);
  }
}

// Debounce function for input filtering
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the app
async function init() {
  // Fallback mechanism: Always hide loading overlay after 8 seconds max
  const fallbackTimeout = setTimeout(() => {
    console.warn('App initialization taking too long, hiding loading overlay');
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }, 8000);
  
  try {
    resetSession();
    await fetchUserProfile(); // Get user role information
    await loadAthletes(); // Load athletes for selection
    clearTimeout(fallbackTimeout);
  } catch (err) {
    console.error('App initialization failed:', err);
    clearTimeout(fallbackTimeout);
    // Force hide overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }
  
  // Setup dashboard filters and initialize default selection
  setupDashboardFilters();
  
  // Default to dashboard, unless entry is specifically requested
  if (window.location.hash === '#entry') {
    show('entry');
  } else {
    // Default to dashboard on page load/reload
    show('dashboard');
    window.location.hash = '#dashboard'; // Update URL to reflect current view
    // Load dashboard after a short delay to ensure DOM is ready and filters are set
    setTimeout(() => {
      // Ensure we have the dropdown elements before loading dashboard
      const dropdown = document.getElementById('monthDropdown');
      const listContainer = document.getElementById('selectedMonthsList');
      
      if (dropdown && listContainer) {
        // Only load dashboard if we have selected months
        if (selectedMonthsArray.length > 0) {
          loadDashboard();
        }
      } else {
        // Retry initialization if elements aren't ready
        setTimeout(() => {
          if (selectedMonthsArray.length > 0) {
            loadDashboard();
          }
        }, 300);
      }
    }, 200);
  }
}

// Handle hash changes for navigation
window.addEventListener('hashchange', function() {
  if (window.location.hash === '#dashboard') {
    show('dashboard');
  } else if (window.location.hash === '#entry') {
    show('entry');
  }
});

// Start the application after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM is already loaded
  init();
}