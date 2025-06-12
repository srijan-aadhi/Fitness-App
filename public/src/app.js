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

  if (section === 'entry') loadAthletes();
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

// Fetch user profile to get role information
async function fetchUserProfile() {
  try {
    const res = await fetch('/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      const userData = await res.json();
      userRole = userData.role;
      localStorage.setItem('userRole', userRole);
      
      // Update UI based on role
      updateUIForRole();
    }
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
  }
}

// Update UI elements based on user role
function updateUIForRole() {
  // Add role indicator to the page
  const roleIndicator = document.createElement('div');
  roleIndicator.id = 'roleIndicator';
  roleIndicator.className = 'fixed bottom-4 left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold z-50 shadow-lg';
  roleIndicator.textContent = `Role: ${userRole}`;
  
  // Remove existing role indicator if present
  const existing = document.getElementById('roleIndicator');
  if (existing) existing.remove();
  
  document.body.appendChild(roleIndicator);
}

// Load athletes dynamically
async function loadAthletes() {
  const res = await fetch('/api/athletes', {
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

  data.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.fullName;
    select.appendChild(option);
  });

  // Only add "Add New Athlete" option if user has permission
  if (canCreateAthletes()) {
    const addNew = document.createElement('option');
    addNew.value = 'add_new';
    addNew.textContent = '➕ Add New Athlete';
    select.appendChild(addNew);
  } else {
    // Add disabled option explaining why they can't add athletes
    const noPermission = document.createElement('option');
    noPermission.value = 'no_permission';
    noPermission.textContent = '🔒 Upgrade to Tester role to add athletes';
    noPermission.disabled = true;
    select.appendChild(noPermission);
  }
}

document.getElementById('athleteSelect').addEventListener('change', e => {
  if (e.target.value === 'add_new') {
    if (canCreateAthletes()) {
      window.location.href = 'add-athlete.html';
    } else {
      alert('You need Tester role or higher to add new athletes. Please contact an administrator.');
      e.target.value = ''; // Reset selection
    }
  } else if (e.target.value === 'no_permission') {
    alert('You need Tester role or higher to add new athletes. Please contact an administrator to upgrade your account.');
    e.target.value = ''; // Reset selection
  }
});

// Submit Performance Test
document.getElementById('entryForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const athleteId = document.getElementById('athleteSelect').value;
  
  // Check if athlete is selected
  if (!athleteId || athleteId === 'add_new' || athleteId === 'no_permission') {
    alert('Please select an athlete first.');
    return;
  }
  
  const test = {
    athlete_id: athleteId,
    injury: document.getElementById('injury').value,
    squatR: +document.getElementById('squatR').value,
    squatL: +document.getElementById('squatL').value,
    pull: +document.getElementById('pull').value,
    push: +document.getElementById('push').value,
    test24: document.getElementById('test24').value
  };

  try {
    const res = await fetch('/api/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(test)
    });
    
    const data = await res.json();
    
    if (res.ok && data.success) {
      alert('Test submitted successfully!');
      loadDashboard();
      show('dashboard');
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

// Load Dashboard
async function loadDashboard() {
  try {
    const res = await fetch('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    document.getElementById('totalAthletes').textContent = data.totalAthletes;
    document.getElementById('recentTests').textContent = data.recentTests;

    const tbody = document.getElementById('dashboardTable');
    tbody.innerHTML = '';
    if (!Array.isArray(data.performanceRecords)) {
      alert(data.error || "Failed to load dashboard data.");
      return;
    }

    data.performanceRecords.forEach(record => {
      const row = `<tr class="border-t">
        <td class="py-2 px-4">${record.athleteName || 'Unknown'}</td>
        <td class="py-2 px-4">${new Date(record.timestamp).toLocaleDateString()}</td>
        <td class="py-2 px-4">${record.squatR}</td>
        <td class="py-2 px-4">${record.squatL}</td>
        <td class="py-2 px-4">${record.pull}</td>
        <td class="py-2 px-4">${record.push}</td>
        <td class="py-2 px-4">${record.test24}</td>
      </tr>`;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  } catch (err) {
    console.error('Error loading dashboard:', err);
    alert('Failed to load dashboard data. Please refresh the page.');
  }
}

// Initialize the app
async function init() {
  resetSession();
  await fetchUserProfile(); // Get user role information
  show('entry');
  loadDashboard();
}

// Start the application
init();