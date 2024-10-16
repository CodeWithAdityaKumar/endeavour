import { auth, db, storage , app} from '../configs/firebase.js';
import { ref, set, get, remove, update, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { createUserWithEmailAndPassword, deleteUser as deleteAuthUser, updatePassword, getAuth , signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { checkAdminOrModeratorAccess, getCurrentUser } from './auth-check.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { firebaseConfig } from '../configs/firebase.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-functions.js";
import { initProjectManagement } from './project-management.js';
import { initNotificationManagement } from './notification-management.js';

// Create a separate Auth instance for user creation
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

// Add this line near the top of the file, after other imports
const functions = getFunctions(app);

let users = [];

// Fetch users from Firebase
async function fetchUsers() {
    showLoadingSpinner();
    const usersRef = ref(db, 'users');
    try {
        const snapshot = await get(usersRef);
        users = [];
        snapshot.forEach((childSnapshot) => {
            users.push({
                _id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        updateUserOverview();
        await renderUserList(users);
    } catch (error) {
        console.error("Error fetching users:", error);
    } finally {
        hideLoadingSpinner();
    }
}

// Update user overview
function updateUserOverview() {
    const totalUsersElement = document.getElementById('totalUsers');
    const activeUsersElement = document.getElementById('activeUsers');
    const inactiveUsersElement = document.getElementById('inactiveUsers');

    if (totalUsersElement) totalUsersElement.textContent = users.length;
    if (activeUsersElement) activeUsersElement.textContent = users.filter(u => u.isActive).length;
    if (inactiveUsersElement) inactiveUsersElement.textContent = users.filter(u => !u.isActive).length;
}

// Render user list
async function renderUserList(filteredUsers) {
    const userList = document.getElementById('userList');
    if (!userList) {
        console.error("User list element not found");
        return;
    }
    userList.innerHTML = '';

    try {
        const currentUser = await getCurrentUser();
        const isModerator = currentUser && currentUser.role === 'moderator';

        for (const user of filteredUsers) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="p-2">${user.name || ''}</td>
                <td class="p-2">${user.email || ''}</td>
                <td class="p-2">${user.regNo || ''}</td>
                <td class="p-2">${user.role || ''}</td>
                <td class="p-2">${user.teamRole || ''}</td>
                <td class="p-2">${user.isActive ? 'Active' : 'Inactive'}</td>
                <td class="p-2">${user.emailVerified ? '<i class="fas fa-check-circle text-green-500"></i>' : '<i class="fas fa-times-circle text-red-500"></i>'}</td>
                <td class="p-2">
                    <button onclick="window.viewUser('${user._id}')" class="text-green-500 hover:text-green-700 mr-2">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="window.editUser('${user._id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="window.toggleUserStatus('${user._id}')" class="text-yellow-500 hover:text-yellow-700 mr-2">
                        <i class="fas fa-toggle-on"></i>
                    </button>
                    <button onclick="window.deleteUser('${user._id}')" class="text-red-500 hover:text-red-700" ${isModerator ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            userList.appendChild(row);
        }
    } catch (error) {
        console.error("Error rendering user list:", error);
    }
}

// Search and filter users
function searchAndFilterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const roleFilter = document.getElementById('roleFilter').value;
    const teamRoleFilter = document.getElementById('teamRoleFilter').value;

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                              user.email.toLowerCase().includes(searchTerm) ||
                              user.regNo.toLowerCase().includes(searchTerm);
        const matchesRole = roleFilter === '' || user.role === roleFilter;
        const matchesTeamRole = teamRoleFilter === '' || user.teamRole === teamRoleFilter;
        return matchesSearch && matchesRole && matchesTeamRole;
    });

    renderUserList(filteredUsers);
}

// Edit user function
async function editUser(userId) {
    showLoadingSpinner();
    try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const user = snapshot.val();
            user._id = userId;
            
            // Populate the edit form with user data
            const editForm = document.getElementById('editUserForm');
            if (editForm) {
                editForm.elements.editUserId.value = user._id;
                editForm.elements.editName.value = user.name || '';
                editForm.elements.editEmail.value = user.email || '';
                editForm.elements.editRegNo.value = user.regNo || '';
                editForm.elements.editRole.value = user.role || '';
                editForm.elements.editTeamRole.value = user.teamRole || '';
                editForm.elements.editLinkedin.value = user.linkedin || '';
                editForm.elements.editInstagram.value = user.instagram || '';
                editForm.elements.editTrade.value = user.trade || '';
                editForm.elements.editGender.value = user.gender || '';
                editForm.elements.editPhoneNumber.value = user.phoneNumber || '';
                editForm.elements.editYear.value = user.year || '';
                editForm.elements.editProgramme.value = user.programme || '';
                editForm.elements.editPost.value = user.post || '';
                
                // Add profile image preview if exists
                const profileImagePreview = document.getElementById('editProfileImagePreview');
                if (profileImagePreview) {
                    profileImagePreview.src = user.profileImageUrl || '';
                    profileImagePreview.style.display = user.profileImageUrl ? 'block' : 'none';
                }
            } else {
                console.error('Edit user form not found');
                throw new Error('Edit user form not found');
            }
            
            // Show the edit modal
            const editModal = document.getElementById('editUserModal');
            if (editModal) {
                editModal.classList.remove('hidden');
            } else {
                console.error('Edit user modal not found');
                throw new Error('Edit user modal not found');
            }
        } else {
            alert("User not found. Please try again.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("An error occurred while fetching user data. Please try again.");
    } finally {
        hideLoadingSpinner();
    }
}

// Save edited user
async function saveEditedUser(event) {
    event.preventDefault();
    showLoadingSpinner();
    const userId = document.getElementById('editUserId').value;
    const userRef = ref(db, `users/${userId}`);
    const updatedUser = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        regNo: document.getElementById('editRegNo').value,
        role: document.getElementById('editRole').value,
        teamRole: document.getElementById('editTeamRole').value,
        linkedin: document.getElementById('editLinkedin').value,
        instagram: document.getElementById('editInstagram').value,
        trade: document.getElementById('editTrade').value,
        gender: document.getElementById('editGender').value,
        phoneNumber: document.getElementById('editPhoneNumber').value,
        year: document.getElementById('editYear').value,
        programme: document.getElementById('editProgramme').value,
        post: document.getElementById('editPost').value,
    };

    try {
        // Handle profile image upload
        const profileImageInput = document.getElementById('editProfileImage');
        if (profileImageInput.files.length > 0) {
            // Delete old profile image if it exists
            const oldUserData = (await get(userRef)).val();
            if (oldUserData.profileImageUrl) {
                const oldImageRef = storageRef(storage, oldUserData.profileImageUrl);
                await deleteObject(oldImageRef);
            }

            // Upload new profile image
            const imageFile = profileImageInput.files[0];
            const imageRef = storageRef(storage, `profile_images/${userId}`);
            await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(imageRef);
            updatedUser.profileImageUrl = imageUrl;
        }

        await update(userRef, updatedUser);
        closeEditModal();
        fetchUsers(); // Refresh the user list
        alert("User updated successfully.");
    } catch (error) {
        console.error("Error updating user:", error);
        alert("An error occurred while updating the user. Please try again.");
    } finally {
        hideLoadingSpinner();
    }
}

// Toggle user status
async function toggleUserStatus(userId) {
    showLoadingSpinner();
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();
        await update(userRef, { isActive: !userData.isActive });
        fetchUsers(); // Refresh the user list
    } catch (error) {
        console.error("Error toggling user status:", error);
        alert("An error occurred while toggling user status. Please try again.");
    } finally {
        hideLoadingSpinner();
    }
}

// Delete user
async function deleteUser(userId) {
    if (auth.currentUser.uid === userId) {
        alert("You cannot delete your own account.");
        return;
    }

    if (confirm('Are you sure you want to delete this user?')) {
        showLoadingSpinner();
        try {
            // Get the user reference
            const userRef = ref(db, `users/${userId}`);
            const userSnapshot = await get(userRef);
            
            if (!userSnapshot.exists()) {
                throw new Error("User not found in the database.");
            }

            const userData = userSnapshot.val();

            // Delete profile image from storage if it exists
            if (userData.profileImageUrl) {
                const imageRef = storageRef(storage, userData.profileImageUrl);
                await deleteObject(imageRef);
            }

            // Delete user from Realtime Database
            await remove(userRef);

            // Delete user from Firebase Authentication
            try {
                // Create a new instance of Auth
                const tempAuth = getAuth(secondaryApp);
                
                // Sign in as the user to be deleted
                const userEmail = userData.email;
                const userPassword = userData.regNo; // Assuming regNo is used as password
                await signInWithEmailAndPassword(tempAuth, userEmail, userPassword);
                
                // Delete the user
                await deleteAuthUser(tempAuth.currentUser);
                
                // Sign out from the temporary auth instance
                await tempAuth.signOut();

                alert("User has been successfully deleted from both the database and authentication.");
            } catch (authError) {
                console.error("Error deleting user from authentication:", authError);
                alert("User has been deleted from the database, but could not be deleted from authentication. An admin needs to manually delete this user from the Firebase Authentication console.");
            }

            fetchUsers(); // Refresh the user list
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("An error occurred while deleting the user. Please check the console for more details.");
        } finally {
            hideLoadingSpinner();
        }
    }
}

// Add new user function
async function addNewUser(event) {
    event.preventDefault();
    showLoadingSpinner();
    const addForm = document.getElementById('addUserForm');
    if (!addForm) {
        console.error('Add user form not found');
        hideLoadingSpinner();
        return;
    }

    const newUser = {
        name: addForm.elements.addName.value,
        email: addForm.elements.addEmail.value,
        regNo: addForm.elements.addRegNo.value,
        role: addForm.elements.addRole.value,
        teamRole: addForm.elements.addTeamRole.value,
        linkedin: addForm.elements.addLinkedin.value,
        instagram: addForm.elements.addInstagram.value,
        trade: addForm.elements.addTrade.value,
        gender: addForm.elements.addGender.value,
        phoneNumber: addForm.elements.addPhoneNumber.value,
        year: addForm.elements.addYear.value,
        programme: addForm.elements.addProgramme.value,
        post: addForm.elements.addPost.value,
        isActive: true
    };

    try {
        // Create user in Firebase Authentication using regNo as password
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.regNo);
        const uid = userCredential.user.uid;

        // Immediately sign out the user from the secondary app
        await secondaryAuth.signOut();

        // Handle profile image upload
        const profileImageInput = document.getElementById('addProfileImage');
        if (profileImageInput.files.length > 0) {
            const imageFile = profileImageInput.files[0];
            const imageRef = storageRef(storage, `profile_images/${uid}`);
            await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(imageRef);
            newUser.profileImageUrl = imageUrl;
        }

        // Add user to Realtime Database
        const userRef = ref(db, `users/${uid}`);
        await set(userRef, { ...newUser, uid });

        closeAddModal();
        addForm.reset();
        fetchUsers(); // Refresh the user list
        alert(`User added successfully. Default password is the registration number.`);
    } catch (error) {
        console.error("Error adding new user:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert("This email address is already in use. Please use a different email address.");
        } else {
            alert("An error occurred while adding the user. Please try again.");
        }
    } finally {
        hideLoadingSpinner();
    }
}

// Helper functions for UI
function openAddModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('addUserModal').classList.add('hidden');
}

function closeEditModal() {
    document.getElementById('editUserModal').classList.add('hidden');
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Initialize dashboard
async function initDashboard() {
    showLoadingSpinner();
    try {
        const hasAccess = await checkAdminOrModeratorAccess();
        if (!hasAccess) {
            throw new Error('User is not admin or moderator or not logged in');
        }
        
        fetchUsers();
        initProjectManagement();
        initNotificationManagement(); // Add this line to initialize notification management

        // Add event listeners
        const searchInput = document.getElementById('searchInput');
        const roleFilter = document.getElementById('roleFilter');
        const teamRoleFilter = document.getElementById('teamRoleFilter');
        const editUserForm = document.getElementById('editUserForm');
        const addUserForm = document.getElementById('addUserForm');
        const addUserBtn = document.getElementById('addUserBtn');

        if (searchInput) searchInput.addEventListener('input', searchAndFilterUsers);
        if (roleFilter) roleFilter.addEventListener('change', searchAndFilterUsers);
        if (teamRoleFilter) teamRoleFilter.addEventListener('change', searchAndFilterUsers);
        if (editUserForm) editUserForm.addEventListener('submit', saveEditedUser);
        if (addUserForm) addUserForm.addEventListener('submit', addNewUser);
        if (addUserBtn) addUserBtn.addEventListener('click', openAddModal);
    } catch (error) {
        console.error("Error initializing dashboard:", error);
        // Display an error message to the user
        const dashboardContent = document.getElementById('dashboardContent');
        if (dashboardContent) {
            dashboardContent.innerHTML = '<p>You do not have permission to access this dashboard. Please log in as an admin or moderator.</p>';
        } else {
            console.error("Dashboard content element not found");
        }
    } finally {
        hideLoadingSpinner();
    }
}

// Run initialization when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);

// Export functions for global access
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.closeEditModal = closeEditModal;

// View user function
async function viewUser(userId) {
    showLoadingSpinner();
    try {
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (userSnapshot.exists()) {
            const userData = userSnapshot.val();
            const userDetails = document.getElementById('userDetails');
            userDetails.innerHTML = `
                <p><strong>Name:</strong> ${userData.name || ''}</p>
                <p><strong>Email:</strong> ${userData.email || ''}</p>
                <p><strong>Reg No:</strong> ${userData.regNo || ''}</p>
                <p><strong>Role:</strong> ${userData.role || ''}</p>
                <p><strong>Team Role:</strong> ${userData.teamRole || ''}</p>
                <p><strong>Status:</strong> ${userData.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Verified:</strong> ${userData.emailVerified ? 'Yes' : 'No'}</p>
                <p><strong>Gender:</strong> ${userData.gender || ''}</p>
                <p><strong>Phone Number:</strong> ${userData.phoneNumber || ''}</p>
                <p><strong>Year:</strong> ${userData.year || ''}</p>
                <p><strong>Programme:</strong> ${userData.programme || ''}</p>
                <p><strong>Trade:</strong> ${userData.trade || ''}</p>
                <p><strong>LinkedIn:</strong> ${userData.linkedin || ''}</p>
                <p><strong>Instagram:</strong> ${userData.instagram || ''}</p>
            `;

            // Fetch and display user projects
            const userProjects = document.getElementById('userProjects');
            userProjects.innerHTML = '<h4 class="text-lg font-semibold mb-2">User Projects</h4>';
            
            if (userData.projects && Object.keys(userData.projects).length > 0) {
                Object.values(userData.projects).forEach((project) => {
                    const projectElement = document.createElement('div');
                    projectElement.className = 'mb-2';
                    projectElement.innerHTML = `
                        <p><strong>${project.name}</strong> - ${project.status}</p>
                        <p>${project.description}</p>
                        <p>Progress: ${project.progress}%</p>
                    `;
                    userProjects.appendChild(projectElement);
                });
            } else {
                userProjects.innerHTML += '<p>No projects found for this user.</p>';
            }

            document.getElementById('viewUserModal').classList.remove('hidden');
        } else {
            alert("User not found. Please try again.");
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        alert("An error occurred while fetching user data. Please try again.");
    } finally {
        hideLoadingSpinner();
    }
}

// Add this function near the other modal-related functions
function closeViewModal() {
    document.getElementById('viewUserModal').classList.add('hidden');
}

// Add these lines at the end of your file
window.viewUser = viewUser;
window.closeViewModal = closeViewModal;

export { closeAddModal, closeEditModal, editUser, toggleUserStatus, deleteUser, openAddModal, closeViewModal };