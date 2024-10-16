import { auth, db } from '../configs/firebase.js';
import { ref, push, set, get, update, remove, query, orderByChild } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

let allNotifications = [];
let allUsers = [];

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

async function fetchNotifications() {
    showLoadingSpinner();
    const notificationsRef = ref(db, 'notifications');
    try {
        const snapshot = await get(query(notificationsRef, orderByChild('createdAt')));
        allNotifications = [];
        if (snapshot.exists()) {
            snapshot.forEach((childSnapshot) => {
                allNotifications.unshift({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                });
            });
        }
        renderNotifications(allNotifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
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
    } catch (error) {
        console.error("Error fetching users:", error);
    }
}

function renderNotifications(notifications) {
    const notificationList = document.getElementById('notificationList');
    if (notificationList) {
        notificationList.innerHTML = '';
        notifications.forEach(notification => {
            const row = document.createElement('tr');
            
            let message = notification.message.replace(/^<br\/>/, '').trim();
            let firstLine = message.split('<br/>')[0];
            let truncatedFirstLine = truncateText(firstLine, 20);
            let truncatedTitle = truncateText(notification.title, 8);
            
            row.innerHTML = `
                <td class="p-2">${truncatedTitle}</td>
                <td class="p-2 relative" style="width:30%">
                    <div class="notification-message pr-8" style="max-height: 3em; overflow: hidden; width: 300px; word-wrap: break-word;">      
                        ${truncatedFirstLine}
                    </div>
                    <button class="expand-btn absolute top-2 right-2 text-blue-500 hover:text-blue-700">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </td>
                <td class="p-2">${notification.targetUsers}</td>
                <td class="p-2">${new Date(notification.createdAt).toLocaleString()}</td>
                <td class="p-2">
                    <button onclick="editNotification('${notification.id}')" class="text-blue-500 hover:text-blue-700 mr-2">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteNotification('${notification.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            notificationList.appendChild(row);

            const messageElement = row.querySelector('.notification-message');
            const expandBtn = row.querySelector('.expand-btn');
            expandBtn.addEventListener('click', () => {
                if (messageElement.style.maxHeight === '3em') {
                    messageElement.style.maxHeight = 'none';
                    messageElement.innerHTML = message.split('<br/>').map(line => `<span>${line}</span>`).join('<br/>');
                    expandBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
                } else {
                    messageElement.style.maxHeight = '3em';
                    messageElement.innerHTML = truncatedFirstLine;
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

function openNotificationModal(notification = null) {
    const modal = document.getElementById('notificationModal');
    const form = document.getElementById('notificationForm');
    const title = document.getElementById('notificationModalTitle');

    if (notification) {
        title.textContent = 'Edit Notification';
        form.elements['notificationId'].value = notification.id;
        form.elements['notificationTitle'].value = notification.title;
        form.elements['notificationMessage'].value = notification.message.replace(/<br\/>/g, '\n').replace(/&emsp;/g, '\t');
        form.elements['notificationTargetUsers'].value = notification.targetUsers;
    } else {
        title.textContent = 'Add New Notification';
        form.reset();
        form.elements['notificationId'].value = '';
    }

    modal.classList.remove('hidden');
}

function closeNotificationModal() {
    document.getElementById('notificationModal').classList.add('hidden');
}

async function saveNotification(event) {
    event.preventDefault();
    showLoadingSpinner();

    const form = event.target;
    const notificationId = form.elements['notificationId'].value;
    const notificationData = {
        title: form.elements['notificationTitle'].value,
        message: form.elements['notificationMessage'].value.replace(/\n/g, '<br/>').replace(/\t/g, '&emsp;'),
        targetUsers: form.elements['notificationTargetUsers'].value,
        createdAt: Date.now(),
    };

    try {
        let notificationRef;
        if (notificationId) {
            notificationRef = ref(db, `notifications/${notificationId}`);
            await update(notificationRef, notificationData);
        } else {
            notificationRef = push(ref(db, 'notifications'));
            await set(notificationRef, notificationData);
        }

        // Assign notification to users
        await assignNotificationToUsers(notificationRef.key, notificationData);

        closeNotificationModal();
        fetchNotifications();
    } catch (error) {
        console.error('Error saving notification:', error);
        alert('Failed to save notification. Please try again.');
    } finally {
        hideLoadingSpinner();
    }
}

async function assignNotificationToUsers(notificationId, notificationData) {
    const updates = {};

    if (notificationData.targetUsers === 'all') {
        allUsers.forEach(user => {
            updates[`users/${user.id}/notifications/${notificationId}`] = notificationData;
        });
    } else {
        allUsers.forEach(user => {
            if (user.role === notificationData.targetUsers) {
                updates[`users/${user.id}/notifications/${notificationId}`] = notificationData;
            }
        });
    }

    await update(ref(db), updates);
}

async function editNotification(notificationId) {
    const notificationRef = ref(db, `notifications/${notificationId}`);
    const snapshot = await get(notificationRef);
    if (snapshot.exists()) {
        const notification = { id: notificationId, ...snapshot.val() };
        openNotificationModal(notification);
    }
}

async function deleteNotification(notificationId) {
    if (confirm('Are you sure you want to delete this notification?')) {
        showLoadingSpinner();
        try {
            const notificationRef = ref(db, `notifications/${notificationId}`);
            await remove(notificationRef);

            // Remove notification from all users
            const updates = {};
            allUsers.forEach(user => {
                updates[`users/${user.id}/notifications/${notificationId}`] = null;
            });
            await update(ref(db), updates);

            fetchNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Failed to delete notification. Please try again.');
        } finally {
            hideLoadingSpinner();
        }
    }
}

async function initNotificationManagement() {
    await fetchUsers();
    fetchNotifications();
    document.getElementById('addNotificationBtn').addEventListener('click', () => openNotificationModal());
    document.getElementById('notificationForm').addEventListener('submit', saveNotification);
}

window.openNotificationModal = openNotificationModal;
window.closeNotificationModal = closeNotificationModal;
window.editNotification = editNotification;
window.deleteNotification = deleteNotification;

export { initNotificationManagement };