/**
 * BlogFolio - Advanced Blog Platform
 * Firebase Configuration
 * 
 * This file contains the Firebase configuration and initialization.
 * Replace the placeholders with your actual Firebase project details.
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-app.appspot.com",
    messagingSenderId: "your-messaging-sender-id",
    appId: "your-app-id",
    measurementId: "your-measurement-id"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
    
    // Enable Firestore offline persistence if supported
    if (firebase.firestore) {
        firebase.firestore().enablePersistence({ synchronizeTabs: true })
            .catch((err) => {
                if (err.code === 'failed-precondition') {
                    console.warn('Firebase persistence could not be enabled (multiple tabs open)');
                } else if (err.code === 'unimplemented') {
                    console.warn('Firebase persistence not available in this browser');
                }
            });
    }
} catch (error) {
    console.error('Error initializing Firebase:', error);
    
    // Show error notification
    if (typeof BlogUtils !== 'undefined' && BlogUtils.showToast) {
        BlogUtils.showToast('Error connecting to the database. Some features may not work properly.', 'error', 0);
    }
}

/**
 * NOTE TO DEVELOPERS:
 * 
 * For a real production application, you should:
 * 
 * 1. Never include API keys directly in your JavaScript files
 * 2. Use environment variables during the build process
 * 3. Implement proper Firebase security rules
 * 4. Set up authentication restrictions
 * 
 * The configuration above is for demonstration purposes only.
 * You can create a Firebase project at: https://console.firebase.google.com/
 */

// Export Firebase instances (for modules that import this file)
const BlogFirebase = {
    app: firebase.app(),
    auth: firebase.auth(),
    firestore: firebase.firestore(),
    storage: firebase.storage(),
    
    // Helper function to get server timestamp
    getServerTimestamp: () => firebase.firestore.FieldValue.serverTimestamp(),
    
    // Helper function to get a document reference
    getDocRef: (collection, docId) => firebase.firestore().collection(collection).doc(docId),
    
    // Helper function to get a collection reference
    getCollectionRef: (collection) => firebase.firestore().collection(collection),
    
    // Helper function to create a batch
    createBatch: () => firebase.firestore().batch(),
    
    // Helper function to create a transaction
    runTransaction: (callback) => firebase.firestore().runTransaction(callback)
};

// For backward compatibility with non-module code
window.BlogFirebase = BlogFirebase;
