document.getElementById('addAthleteForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = localStorage.getItem('token');
  if (!token) {
    alert('You are not logged in.');
    return;
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
    const res = await fetch('/api/athletes', {
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
      document.getElementById('goBackBtn').classList.remove('hidden');
      document.getElementById('addAthleteForm').reset();
    } else {
      document.getElementById('errorMessage').textContent = data.error || data.message || 'Failed to add athlete.';
      document.getElementById('errorMessage').classList.remove('hidden');
    }
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('errorMessage').textContent = 'Something went wrong. Try again.';
    document.getElementById('errorMessage').classList.remove('hidden');
  }
});

document.getElementById('goBackBtn').addEventListener('click', () => {
  localStorage.setItem('athleteAdded', 'true');
  window.location.href = 'index.html';
});

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
    const res = await fetch('/api/athletes', {
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
