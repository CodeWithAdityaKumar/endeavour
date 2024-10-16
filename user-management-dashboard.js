import { isAdmin } from './auth-check.js';

// ... (existing code)

async function initializeUserManagementDashboard() {
    const adminStatus = await isAdmin();
    
    if (adminStatus) {
        // Show admin content
        document.getElementById('adminContent').style.display = 'block';
        // Load user list and other admin functionalities
        loadUserList();
    } else {
        // Show access denied message
        document.getElementById('accessDenied').style.display = 'block';
    }
}

// Call this function when the page loads
document.addEventListener('DOMContentLoaded', initializeUserManagementDashboard);

// ... (rest of the existing code)