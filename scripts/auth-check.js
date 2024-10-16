import { auth, db } from '../configs/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

export function checkAdminOrModeratorAccess() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Unsubscribe immediately after first call
            console.log("Current user:", user);

            if (user) {
                console.log("User is logged in. UID:", user.uid);
                const userRef = ref(db, `users/${user.uid}`);
                try {
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        console.log("User data:", userData);
                        const hasAccess = userData.role === 'admin' || userData.role === 'moderator';
                        console.log("Has access:", hasAccess);
                        resolve(hasAccess);
                    } else {
                        console.log("User document does not exist in the database");
                        resolve(false);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    reject(error);
                }
            } else {
                console.log("No user is logged in");
                resolve(false);
            }
        });
    });
}

export function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Unsubscribe immediately after first call
            console.log("getCurrentUser - Current user:", user); // Log the current user

            if (user) {
                console.log("getCurrentUser - User is logged in. UID:", user.uid);
                const userRef = ref(db, `users/${user.uid}`);
                try {
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        console.log("getCurrentUser - User data:", userData);
                        resolve({
                            uid: user.uid,
                            email: user.email,
                            ...userData
                        });
                    } else {
                        console.log("getCurrentUser - User document does not exist in the database");
                        resolve(null);
                    }
                } catch (error) {
                    console.error("getCurrentUser - Error fetching user data:", error);
                    resolve(null);
                }
            } else {
                console.log("getCurrentUser - No user is logged in");
                resolve(null);
            }
        });
    });
}