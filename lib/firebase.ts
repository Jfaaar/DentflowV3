/**
 * Firebase Configuration
 * Used for Phone OTP authentication
 */
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDIK84IaM83G-5Oit6DuXUcGN17XbUqoDI',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dentflow-e5383.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dentflow-e5383',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dentflow-e5383.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '853245617032',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:853245617032:web:3f05528fa476b893cb103d',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-L20F7BED57'
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

// Configure auth settings
firebaseAuth.useDeviceLanguage();

// Debug: Log auth configuration
console.log('Firebase Auth initialized with:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    currentHost: window.location.hostname
});

// Export types and functions for phone auth
export { RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };

