// public/src/app.js

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

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

function updateNav(section) {
  const nav = document.getElementById('navBar');
  if (!nav) return;
  nav.innerHTML = `
    <button onclick="show('entry')" class="px-6 py-2 text-white hover:text-yellow-400 transition-colors font-semibold">
      <i class="fas fa-chart-line mr-2"></i>Test Entry
    </button>
    <button onclick="show('dashboard')" class="px-6 py-2 text-white hover:text-yellow-400 transition-colors font-semibold">
      <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
    </button>
    <button onclick="logout()" class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all font-semibold">
      <i class="fas fa-sign-out-alt mr-2"></i>Logout
    </button>
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
  addNew.value = 'add_new';
  addNew.textContent = '➕ Add New Athlete';
  select.appendChild(addNew);
}

document.getElementById('athleteSelect').addEventListener('change', e => {
  if (e.target.value === 'add_new') {
    window.location.href = 'add-athlete.html';
  }
});

// Submit Performance Test
document.getElementById('entryForm').addEventListener('submit', async e => {
  e.preventDefault();
  const test = {
    athlete_id: document.getElementById('athleteSelect').value,
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
  if (!Array.isArray(data.performanceRecords)) {
    alert(data.error || "Failed to load dashboard data.");
    return;
  }

  data.performanceRecords.forEach(record => {
    const row = `<tr class="border-t">
      <td class="py-2 px-4">${record.athleteName}</td>
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