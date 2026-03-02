const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_CREDENTIALS_PATH;

try {
  if (serviceAccountPath && require('fs').existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase credentials not found. Push notifications will not work.');
  }
} catch (error) {
  console.warn('Firebase initialization error:', error.message);
}

const sendNotification = async (deviceToken, title, body, data = {}) => {
  if (!admin.apps.length) {
    console.warn('Firebase not initialized');
    return;
  }

  try {
    const message = {
      notification: { title, body },
      data: data,
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendNotification };
