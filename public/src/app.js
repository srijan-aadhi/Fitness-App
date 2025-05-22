// src/app.js
let token = null;

function show(section) {
  ['login','signup','entry','dashboard'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });
  document.getElementById(section).classList.remove('hidden');
}

// Login Handler
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    show('dashboard');
    loadDashboard();
  } else {
    alert(data.message || 'Login failed');
  }
});

// Signup Handler
document.getElementById('signupForm').addEventListener('submit', async e => {
  e.preventDefault();
  const user = {
    fullName: document.getElementById('fullName').value,
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    sport: document.getElementById('sport').value,
    contact: document.getElementById('contact').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const data = await res.json();
  if (data.token) {
    token = data.token;
    show('dashboard');
    loadDashboard();
  } else {
    alert('Signup failed');
  }
});

// Submit Performance Test
document.getElementById('entryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const test = {
    injury: document.getElementById('injury').value,
    squatR: +document.getElementById('squatR').value,
    squatL: +document.getElementById('squatL').value,
    pull: +document.getElementById('pull').value,
    push: +document.getElementById('push').value,
    test24: document.getElementById('test24').value
  };

  const res = await fetch('/api/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(test)
  });
  const data = await res.json();
  if (data.success) {
    alert('Test submitted!');
    loadDashboard();
    show('dashboard');
  } else {
    alert('Failed to submit test');
  }
});

// Load Dashboard
async function loadDashboard() {
  const res = await fetch('/api/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  document.getElementById('totalAthletes').textContent = data.totalAthletes;
  document.getElementById('recentTests').textContent = data.recentTests;

  const tbody = document.getElementById('dashboardTable');
  tbody.innerHTML = '';
  data.performanceRecords.forEach(record => {
    const row = `<tr class="border-t">
      <td class="py-2 px-4">${record.injury}</td>
      <td class="py-2 px-4">${record.timestamp}</td>
      <td class="py-2 px-4">${record.squatR}</td>
      <td class="py-2 px-4">${record.squatL}</td>
      <td class="py-2 px-4">${record.pull}</td>
      <td class="py-2 px-4">${record.push}</td>
      <td class="py-2 px-4">${record.test24}</td>
    </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

show('login');
