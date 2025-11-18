/**
 * Firebase Admin SDK Configuration
 *
 * This module initializes the Firebase Admin SDK to interact with Firestore
 * and manage user data for push notifications.
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin SDK
let db;
let adminApp;

/**
 * Initialize Firebase Admin with service account credentials
 *
 * IMPORTANT: You need to download your Firebase service account key:
 * 1. Go to Firebase Console → Project Settings → Service Accounts
 * 2. Click "Generate New Private Key"
 * 3. Save the JSON file as 'serviceAccountKey.json' in the config folder
 */
export function initializeFirebase() {
  try {
    // Read service account key from file
    const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    // Initialize Firebase Admin
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    // Get Firestore instance
    db = admin.firestore();

    console.log('✅ Firebase Admin initialized successfully');
    return { db, admin: adminApp };
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    console.error('\nMake sure you have:');
    console.error('1. Downloaded your Firebase service account key');
    console.error('2. Saved it as config/serviceAccountKey.json');
    console.error('3. Set FIREBASE_DATABASE_URL in your .env file');
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
export function getFirestore() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
}

/**
 * Get Firebase Admin instance
 */
export function getAdmin() {
  if (!adminApp) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return adminApp;
}

export { db, adminApp };
