// public/src/signup.js
const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';

const signupForm = document.getElementById('signupForm');
signupForm.addEventListener('submit', async (e) => {
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

  const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  const data = await res.json();

  if (data.token) {
    localStorage.setItem('token', data.token);
    window.location.href = '/index.html';
  } else {
    alert('Signup failed'); 
  }
});
