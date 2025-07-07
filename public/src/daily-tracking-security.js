// public/src/daily-tracking-security.js
// Security logic for daily tracking form

const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

// Store user role information
let userRole = localStorage.getItem('userRole') || 'Athlete';

// Configuration for API endpoints
const API_BASE_URL = 'https://fitness-app-production-b5bb.up.railway.app';

// Fetch user profile to get role information
async function fetchUserProfile() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
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
  
  // Check if current user should have access to this form
  let hasAccess = false;
  
  if (isAthlete || isSuperAdmin) {
    // Athletes and Super Admins have access to daily tracking
    hasAccess = true;
  } else if (isTrainer) {
    // Trainers should NOT have access to daily tracking
    hasAccess = false;
  }
  
  // If user doesn't have access, redirect them
  if (!hasAccess) {
    alert('Access denied. Only Athletes and Super Admins can access daily tracking.');
    window.location.href = '/index.html';
    return;
  }
  
  // For Super Admins, show assessment form navigation buttons
  if (isSuperAdmin) {
    const navFormButtons = document.querySelectorAll('.nav-form-btn');
    navFormButtons.forEach(btn => {
      if (btn) btn.classList.add('role-authorized');
    });
  }
  
  // Hide loading overlay after role-based UI is set up
  setTimeout(() => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.classList.add('hidden');
    }
  }, 500); // Small delay to ensure smooth loading experience
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  window.location.href = '/login.html';
}

// Initialize security check
async function initSecurity() {
  await fetchUserProfile();
}

// Start the security check after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSecurity);
} else {
  // DOM is already loaded
  initSecurity();
} 