const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated and has admin privileges
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const callerUid = context.auth.uid;
  const callerRef = admin.database().ref(`users/${callerUid}`);
  const callerSnapshot = await callerRef.once('value');
  const callerData = callerSnapshot.val();

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'The caller does not have admin privileges.');
  }

  const userId = data.userId;

  try {
    // Delete user from Authentication
    await admin.auth().deleteUser(userId);

    // Delete user from Realtime Database
    await admin.database().ref(`users/${userId}`).remove();

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while deleting the user.');
  }
});