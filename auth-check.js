import { auth, db } from '../configs/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export async function checkUserRole() {
    const user = auth.currentUser;
    if (!user) {
        return null;
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.role || 'user'; // Default to 'user' if role is not set
        } else {
            console.error('User document does not exist');
            return 'user'; // Default to 'user' if document doesn't exist
        }
    } catch (error) {
        console.error('Error checking user role:', error);
        return null;
    }
}

export async function isAdmin() {
    const role = await checkUserRole();
    return role === 'admin';
}