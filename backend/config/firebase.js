const admin = require('firebase-admin');

try {
  // If private key has escaped newlines, replace them
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log('Firebase Admin SDK Initialized Successfully');
  } else {
    // Fallback: local development/testing or standard auth
    // In local dev, if Google Application Credentials is set, it will use that.
    console.warn('Firebase Admin env variables missing. Running without production Firebase config.');
    admin.initializeApp();
  }
} catch (error) {
  console.error('Firebase Admin SDK Initialization failed:', error.message);
}

module.exports = admin;
