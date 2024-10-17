import { auth, db } from '/configs/firebase.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

const editPopupMessageBtn = document.getElementById('editPopupMessageBtn');
const popupMessageModal = document.getElementById('popupMessageModal');
const popupMessageForm = document.getElementById('popupMessageForm');
const currentPopupTitle = document.getElementById('currentPopupTitle');
const currentPopupMessage = document.getElementById('currentPopupMessage');
const currentPopupLink = document.getElementById('currentPopupLink');
const currentPopupShow = document.getElementById('currentPopupShow');

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

// Function to open the popup message modal
function openPopupMessageModal() {
    popupMessageModal.classList.remove('hidden');
    fetchCurrentPopupMessage();
}

// Function to close the popup message modal
function closePopupMessageModal() {
    popupMessageModal.classList.add('hidden');
}

// Function to fetch the current popup message
async function fetchCurrentPopupMessage() {
    const popupRef = ref(db, 'popup');
    try {
        const snapshot = await get(popupRef);
        const popupData = snapshot.val();
        console.log(popupData);
        
        if (popupData) {
            document.getElementById('popupTitle').value = popupData.title || '';
            document.getElementById('popupMessage').value = popupData.message || '';
            document.getElementById('popupLink').value = popupData.link || '';
            document.getElementById('popupShow').value = popupData.isTrue.toString();

            currentPopupTitle.textContent = `Title: ${popupData.title || 'N/A'}`;
            currentPopupMessage.textContent = `Message: ${popupData.message || 'N/A'}`;
            currentPopupLink.textContent = `Link: ${popupData.link || 'N/A'}`;
            currentPopupShow.textContent = `Show: ${popupData.isTrue ? 'Yes' : 'No'}`;
        }
    } catch (error) {
        console.error("Error fetching popup message:", error);
    }
}

// Function to update the popup message
async function updatePopupMessage(event) {
    event.preventDefault();
    const title = document.getElementById('popupTitle').value;
    const message = document.getElementById('popupMessage').value;
    const link = document.getElementById('popupLink').value;
    const isTrue = document.getElementById('popupShow').value === 'true';

    const popupRef = ref(db, 'popup');
    try {
        showLoadingSpinner()
        await set(popupRef, {
            title,
            message,
            link,
            isTrue
        });
        hideLoadingSpinner()
        alert('Popup message updated successfully!');
        closePopupMessageModal();
        fetchCurrentPopupMessage();
    } catch (error) {
        console.error("Error updating popup message:", error);
        alert('Failed to update popup message. Please try again.');
    }
}

// Event listeners
editPopupMessageBtn.addEventListener('click', openPopupMessageModal);
popupMessageForm.addEventListener('submit', updatePopupMessage);

// Fetch current popup message on page load
document.addEventListener('DOMContentLoaded', fetchCurrentPopupMessage);

// Make closePopupMessageModal function global
window.closePopupMessageModal = closePopupMessageModal;
