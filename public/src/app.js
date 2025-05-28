// src/app.js (main app logic for index.html)

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
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

function updateNav(section) {
  const nav = document.getElementById('navBar');
  if (!nav) return;
  nav.innerHTML = `
    <button onclick="show('entry')" class="py-2 px-4 bg-yellow-500 text-white rounded">Test Entry</button>
    <button onclick="show('dashboard')" class="py-2 px-4 bg-purple-500 text-white rounded">Dashboard</button>
    <button onclick="logout()" class="py-2 px-4 bg-blue-600 text-white rounded">Logout</button>
  `;
}

function startSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    alert('Session expired. Please log in again.');
    logout();
  }, SESSION_TIMEOUT);
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

// Load athletes dynamically
async function loadAthletes() {
  const res = await fetch('/api/athletes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const select = document.getElementById('athleteSelect');
  select.innerHTML = '';

  data.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.fullName;
    select.appendChild(option);
  });

  const addNew = document.createElement('option');
  addNew.value = 'new';
  addNew.textContent = '➕ Add New Athlete';
  select.appendChild(addNew);
}

document.getElementById('athleteSelect').addEventListener('change', e => {
  if (e.target.value === 'new') {
    window.location.href = '/signup.html';
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

['click', 'keydown', 'mousemove'].forEach(evt => {
  document.addEventListener(evt, () => {
    if (token) startSessionTimer();
  });
});

startSessionTimer();
show('dashboard');
loadDashboard();
