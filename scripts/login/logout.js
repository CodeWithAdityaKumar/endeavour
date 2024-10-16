import { auth } from '../../configs/firebase.js';
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

const logoutButton = document.getElementById('logoutButton');

if (logoutButton) {
    logoutButton.addEventListener('click', logout);
}

async function logout() {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
        // Redirect to the home page or login page after successful logout
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout failed:', error.message);
        // Display an error message to the user
        alert('Logout failed. Please try again.');
    }
}

export { logout };
