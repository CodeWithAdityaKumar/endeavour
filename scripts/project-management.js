import { auth, db } from '../configs/firebase.js';
import { ref, push, set, get, update, remove, onValue, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

let allProjects = [];
let allUsers = [];

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

async function fetchProjects() {
    showLoadingSpinner();
    const projectsRef = ref(db, 'projects');
    try {
        const snapshot = await get(projectsRef);
        allProjects = [];
        snapshot.forEach((childSnapshot) => {
            allProjects.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        renderProjects(allProjects);
    } catch (error) {
        console.error("Error fetching projects:", error);
    } finally {
        hideLoadingSpinner();
    }
}

async function fetchUsers() {
    const usersRef = ref(db, 'users');
    try {
        const snapshot = await get(usersRef);
        allUsers = [];
        snapshot.forEach((childSnapshot) => {
            allUsers.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        populateUserSelect();
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

function populateUserSelect() {
    const userSelect = document.getElementById('projectAssignedTo');
    if (userSelect) {
        userSelect.innerHTML = '<option value="">Select a user</option>';
        userSelect.innerHTML += '<option value="all">All Users</option>';
        allUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
    }
}

function renderProjects(projects) {
    const projectList = document.getElementById('projectList');
    if (projectList) {
        projectList.innerHTML = '';
        projects.forEach(project => {
            const row = document.createElement('tr');
            
            let description = project.description.replace(/^<br\/>/, '').trim();
            let firstLine = description.split('<br/>')[0];
            let truncatedFirstLine = truncateText(firstLine, 20);
            let truncatedName = truncateText(project.name, 8);
            
            // Calculate average progress
            let averageProgress = project.progress;
            if (project.assignedTo === 'all') {
                const assignedUsers = allUsers.filter(user => user.projects && user.projects[project.id]);
                if (assignedUsers.length > 0) {
                    const totalProgress = assignedUsers.reduce((sum, user) => sum + (user.projects[project.id].progress || 0), 0);
                    averageProgress = Math.round(totalProgress / assignedUsers.length);
                }
            } else if (project.assignedTo) {
                const assignedUser = allUsers.find(user => user.id === project.assignedTo);
                if (assignedUser && assignedUser.projects && assignedUser.projects[project.id]) {
                    averageProgress = assignedUser.projects[project.id].progress || 0;
                }
            }
            
            row.innerHTML = `
                <td class="p-2">${truncatedName}</td>
                <td class="p-2 relative" style="width:30%">
                    <div class="project-description pr-8" style="max-height: 3em; overflow: hidden; width: 300px; word-wrap: break-word;">      
                        ${truncatedFirstLine}
                    </div>
                    <button class="expand-btn absolute top-2 right-2  text-blue-500 hover:text-blue-700">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </td>
                <td class="p-2">${project.status}</td>
                <td class="p-2">${averageProgress}%</td>
                <td class="p-2">${getAssignedUsersText(project)}</td>
                <td class="p-2">
                    <button onclick="editProject('${project.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteProject('${project.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            projectList.appendChild(row);

            const descriptionElement = row.querySelector('.project-description');
            const expandBtn = row.querySelector('.expand-btn');
            expandBtn.addEventListener('click', () => {
                if (descriptionElement.style.maxHeight === '3em') {
                    descriptionElement.style.maxHeight = 'none';
                    descriptionElement.innerHTML = description.split('<br/>').map(line => `<span>${line}</span>`).join('<br/>');
                    expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                } else {
                    descriptionElement.style.maxHeight = '3em';
                    descriptionElement.innerHTML = truncatedFirstLine;
                    expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
                }
            });
        });
    }
}

function truncateText(text, maxWords) {
    const words = text;
    if (words.length <= maxWords) {
        return text;
    } else {
        return words.slice(0, maxWords) + '...';
    }
}

function getAssignedUsersText(project) {
    if (project.assignedTo === 'all') {
        return 'All Users';
    } else if (project.assignedTo) {
        const assignedUser = allUsers.find(u => u.id === project.assignedTo);
        return assignedUser ? assignedUser.name : 'Not assigned';
    } else {
        return 'Not assigned';
    }
}

function openProjectModal(project = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const title = document.getElementById('modalTitle');

    if (modal && form && title) {
        if (project) {
            title.textContent = 'Edit Project';
            form.elements['projectId'].value = project.id;
            form.elements['projectName'].value = project.name;
            form.elements['projectDescription'].value = project.description.replace(/<br\/>/g, '\n').replace(/&emsp;/g, '\t');
            form.elements['projectStatus'].value = project.status;
            form.elements['projectProgress'].value = project.progress;
            form.elements['projectAssignedTo'].value = project.assignedTo || '';
        } else {
            title.textContent = 'Add New Project';
            form.reset();
            form.elements['projectId'].value = '';
        }

        modal.classList.remove('hidden');
    }
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Show Notification Management Message again
    const notificationManagement = document.querySelector('.notification-management');
    if (notificationManagement) {
        notificationManagement.style.display = 'block';
    }
}

async function saveProject(event) {
    event.preventDefault();
    showLoadingSpinner();

    const form = event.target;
    const projectId = form.elements['projectId'].value;
    const assignedTo = form.elements['projectAssignedTo'].value;
    const projectData = {
        id: projectId || Date.now().toString(),
        name: form.elements['projectName'].value,
        description: form.elements['projectDescription'].value.replace(/\n/g, '<br/>').replace(/\t/g, '&emsp;'),
        status: form.elements['projectStatus'].value,
        progress: parseInt(form.elements['projectProgress'].value),
        assignedTo: assignedTo === 'all' ? 'all' : (assignedTo ? assignedTo : null),
    };

    try {
        let projectRef = ref(db, `projects/${projectData.id}`);
        await set(projectRef, projectData);

        // Update or remove project from previously assigned users
        if (projectId) {
            const oldProjectSnapshot = await get(projectRef);
            const oldProjectData = oldProjectSnapshot.val();
            if (oldProjectData && oldProjectData.assignedTo) {
                if (oldProjectData.assignedTo === 'all') {
                    await removeProjectFromAllUsers(projectId);
                } else if (oldProjectData.assignedTo !== assignedTo) {
                    await removeProjectFromUser(oldProjectData.assignedTo, projectId);
                }
            }
        }

        // Assign project to user(s)
        if (assignedTo === 'all') {
            await assignProjectToAllUsers(projectData.id, projectData);
        } else if (assignedTo) {
            await assignProjectToUser(assignedTo, projectData.id, projectData);
        }

        closeProjectModal();
        fetchProjects();
    } catch (error) {
        console.error('Error saving project:', error);
        alert('Failed to save project. Please try again.');
    } finally {
        hideLoadingSpinner();
    }
}

async function assignProjectToAllUsers(projectId, projectData) {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const updates = {};

    snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        updates[`users/${userId}/projects/${projectId}`] = projectData;
    });

    await update(ref(db), updates);
}

async function assignProjectToUser(userId, projectId, projectData) {
    const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
    await set(userProjectRef, projectData);
}

async function editProject(projectId) {
    // Hide Notification Management Message
    const notificationManagement = document.querySelector('.notification-management');
    if (notificationManagement) {
        notificationManagement.style.display = 'none';
    }

    const projectRef = ref(db, `projects/${projectId}`);
    const snapshot = await get(projectRef);
    if (snapshot.exists()) {
        const project = { id: projectId, ...snapshot.val() };
        openProjectModal(project);
    }
}

async function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        showLoadingSpinner();
        try {
            const projectRef = ref(db, `projects/${projectId}`);
            const projectSnapshot = await get(projectRef);
            const projectData = projectSnapshot.val();

            // Remove project from main projects list
            await remove(projectRef);

            // Remove project from assigned user(s)
            if (projectData.assignedTo === 'all') {
                await removeProjectFromAllUsers(projectId);
            } else if (projectData.assignedTo) {
                await removeProjectFromUser(projectData.assignedTo, projectId);
            }

            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
        } finally {
            hideLoadingSpinner();
        }
    }
}

async function removeProjectFromAllUsers(projectId) {
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const updates = {};

    snapshot.forEach((childSnapshot) => {
        const userId = childSnapshot.key;
        updates[`users/${userId}/projects/${projectId}`] = null;
    });

    await update(ref(db), updates);
}

async function removeProjectFromUser(userId, projectId) {
    const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
    await remove(userProjectRef);
}

async function initProjectManagement() {
    await fetchUsers();
    fetchProjects();
    const addProjectBtn = document.getElementById('addProjectBtn');
    const projectForm = document.getElementById('projectForm');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => openProjectModal());
    }
    if (projectForm) {
        projectForm.addEventListener('submit', saveProject);
    }
}

window.openProjectModal = openProjectModal;
window.closeProjectModal = closeProjectModal;
window.editProject = editProject;
window.deleteProject = deleteProject;

export { initProjectManagement };