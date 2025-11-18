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
 * Supports two methods:
 * 1. Environment variable FIREBASE_SERVICE_ACCOUNT (for Vercel/serverless)
 * 2. File-based serviceAccountKey.json (for Railway/Render/local)
 */
export function initializeFirebase() {
  try {
    let serviceAccount;

    // Method 1: Try to get from environment variable (Vercel/serverless)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('📦 Loading Firebase credentials from environment variable');
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    // Method 2: Try to read from file (Railway/Render/local)
    else {
      console.log('📁 Loading Firebase credentials from file');
      const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    }

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
    console.error('\nMake sure you have EITHER:');
    console.error('1. FIREBASE_SERVICE_ACCOUNT environment variable set (for Vercel)');
    console.error('   OR');
    console.error('2. config/serviceAccountKey.json file (for Railway/Render/local)');
    console.error('3. FIREBASE_DATABASE_URL environment variable set');
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
