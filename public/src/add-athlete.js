const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';

document.getElementById('addAthleteForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in.');
    window.location.href = '/login.html';
    return;
  }

  // Check user role before attempting to create athlete
  const userRole = localStorage.getItem('userRole') || 'Athlete';
  const roleHierarchy = {
    'Athlete': 1,
    'Tester': 2, 
    'Admin': 3,
    'Super Admin': 4
  };
  
  // Allow athletes to add their first athlete, but require Tester+ role for subsequent additions
  if ((roleHierarchy[userRole] || 1) < 2) {
    // Check if this is an athlete's first time adding an athlete
    if (userRole === 'Athlete') {
      try {
        const athleteCheckRes = await fetch(`${API_BASE_URL}/api/athletes?checkExisting=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (athleteCheckRes.ok) {
          const result = await athleteCheckRes.json();
          if (result.hasExisting) {
            alert('Access denied: You can only add one athlete. You already have an athlete in the system.');
            // Redirect back to dashboard
            setTimeout(() => {
              window.location.href = 'index.html';
            }, 2000);
            return;
          }
        }
      } catch (err) {
        console.error('Error checking existing athletes:', err);
      }
    } else {
      alert('Access denied: You need Tester role or higher to add new athletes. Please contact an administrator to upgrade your account.');
      // Redirect back to dashboard
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
      return;
    }
  }

  // Clear old messages
  document.getElementById('successMessage').classList.add('hidden');
  document.getElementById('errorMessage').classList.add('hidden');

  const formData = {
    fullName: document.getElementById('fullName').value,
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    sport: document.getElementById('sport').value,
    contact: document.getElementById('contact').value,
  };

  try {
    const res = await fetch(`${API_BASE_URL}/api/athletes`, {
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
      document.getElementById('addAthleteForm').reset();
      
      // Automatically redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } else {
      // Handle specific error messages
      let errorText = 'Failed to add athlete.';
      
      if (res.status === 403) {
        errorText = 'Access denied: You need Admin role or higher to add athletes. Please contact an administrator.';
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
    }
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('errorMessage').textContent = 'Network error. Please check your connection and try again.';
    document.getElementById('errorMessage').classList.remove('hidden');
  }
});

// Go Back button functionality (using inline onclick for better reliability)
// The button has an inline onclick that redirects to index.html

async function loadAthletes() {
  console.log('loadAthletes called');
  const select = document.getElementById('athleteSelect');
  select.innerHTML = '';

  // Always add the placeholder
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Select Athlete';
  select.appendChild(placeholder);

  try {
    const res = await fetch(`${API_BASE_URL}/api/athletes`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch athletes');
    const data = await res.json();

    data.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = user.fullName;
      select.appendChild(option);
    });
  } catch (err) {
    // Optionally show an error message to the user
    console.error('Error loading athletes:', err);
  }

  const addNew = document.createElement('option');
  addNew.value = 'add_new';
  addNew.textContent = '➕ Add New Athlete';
  select.appendChild(addNew);
}
