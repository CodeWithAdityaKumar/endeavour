import { db} from "../configs/firebase.js"
import { ref,onValue } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";
// firebase.initializeApp(firebaseConfig);

// const database = firebase.database();
const database = db;

function showPopup(title, message, link) {
    const popup = document.getElementById('popup');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const popupBtn = document.getElementById('popup-btn');

    popupTitle.textContent = title || "Announcement";
    popupMessage.textContent = message;
    if(link){
        popupBtn.style.display = "inline";
        popupBtn.href = link;
    }
    popup.style.display = 'flex';
}

function fetchPopupData() {
    const popupRef = ref(database, 'popup');

    onValue(popupRef, (snapshot) => {
        try {
            let popupData = snapshot.val();
            if(popupData.isTrue){
            showPopup(popupData.title, popupData.message, popupData.link);
            }
        } catch (error) {
            console.error("Error fetching or processing users:", error);
        } finally {
            // hideLoadingSpinner();
        }
    }, (error) => {
        console.error("Error fetching users:", error);
    });

    
    // popupRef.once('value').then((snapshot) => {
    //     const popupData = snapshot.val();
    //     if (popupData && popupData.show) {
    //         showPopup(popupData.title, popupData.message, popupData.link);
    //     }
    // }).catch((error) => {
    //     console.error("Error fetching popup data:", error);
    // });
}

document.addEventListener('DOMContentLoaded', fetchPopupData);
