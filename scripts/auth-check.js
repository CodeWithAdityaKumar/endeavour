import { auth, db } from '../configs/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

export function checkAdminOrModeratorAccess() {
    return new Promise((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Unsubscribe immediately after first call

            if (user) {
                const userRef = ref(db, `users/${user.uid}`);
                try {
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        const hasAccess = userData.role === 'admin' || userData.role === 'moderator';
                        resolve(hasAccess);
                    } else {
                        resolve(false);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    reject(error);
                }
            } else {
                resolve(false);
            }
        });
    });
}

export function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            unsubscribe(); // Unsubscribe immediately after first call

            if (user) {
                const userRef = ref(db, `users/${user.uid}`);
                try {
                    const snapshot = await get(userRef);
                    if (snapshot.exists()) {
                        const userData = snapshot.val();
                        resolve({
                            uid: user.uid,
                            email: user.email,
                            ...userData
                        });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    console.error("getCurrentUser - Error fetching user data:", error);
                    resolve(null);
                }
            } else {
                resolve(null);
            }
        });
    });
}