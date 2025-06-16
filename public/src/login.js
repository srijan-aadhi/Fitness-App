// public/src/login.js
const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // Store both token and role information
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role || 'Athlete');
      
      console.log('Login successful. Role:', data.role);
      window.location.href = '/index.html#dashboard';
    } else {
      // Handle specific error messages
      if (res.status === 401) {
        alert('Invalid email or password. Please check your credentials.');
      } else {
        alert(data.message || 'Login failed. Please try again.');
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Network error. Please check your connection and try again.');
  }
});
