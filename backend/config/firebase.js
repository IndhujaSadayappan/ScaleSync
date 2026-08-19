const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

try {
  let serviceAccount = null;

  // 1. Check for raw JSON string in environment variable (Production on Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : process.env.FIREBASE_SERVICE_ACCOUNT;
  } 
  // 2. Check for local file path if specified in .env (Local Development)
  else if (process.env.FIREBASE_CREDENTIALS_PATH) {
    const serviceAccountPath = path.resolve(__dirname, '..', process.env.FIREBASE_CREDENTIALS_PATH);
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    }
  }

  // 3. Initialize Firebase if credentials exist
  if (serviceAccount) {
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
    // Ensure all values in 'data' payload are converted to strings (FCM Requirement)
    const stringifiedData = Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {});

    const message = {
      notification: { title, body },
      data: stringifiedData,
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