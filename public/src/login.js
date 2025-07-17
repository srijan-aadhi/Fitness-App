// public/src/login.js
const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    // Check if response is JSON before trying to parse
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      // Response is JSON, safe to parse
      data = await res.json();
    } else {
      // Response is not JSON (likely HTML error page)
      const textResponse = await res.text();
      console.error('Non-JSON response received:', textResponse.substring(0, 200) + '...');
      
      // Create a generic error object for non-JSON responses
      data = { 
        message: `Server error (${res.status}): Please try again later or contact support.`,
        error: 'Non-JSON response received'
      };
    }

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
      } else if (res.status === 500) {
        alert('Server error. Please try again later or contact support.');
        console.error('Server error details:', data);
      } else {
        alert(data.message || 'Login failed. Please try again.');
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    alert('Network error. Please check your connection and try again.');
  }
});
