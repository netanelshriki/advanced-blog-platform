/**
 * BlogFolio - Advanced Blog Platform
 * Authentication Module
 * 
 * This file handles user authentication, authorization, and user management.
 * It uses Firebase Authentication for secure user management.
 */

// Auth namespace to avoid global scope pollution
const BlogAuth = {
    // Firebase auth instance
    auth: null,
    
    // Current user data cache
    currentUser: null,
    
    // User roles (default is reader)
    roles: {
        ADMIN: 'admin',
        WRITER: 'writer',
        READER: 'reader'
    },
    
    /**
     * Initialize the authentication module
     * @return {Promise} Promise that resolves when initialization is complete
     */
    init: async () => {
        try {
            // Wait for Firebase to be initialized
            if (!firebase || !firebase.auth) {
                console.error('Firebase is not initialized');
                return;
            }
            
            // Get auth instance
            BlogAuth.auth = firebase.auth();
            
            // Set up auth state change listener
            BlogAuth.auth.onAuthStateChanged(BlogAuth.handleAuthStateChange);
            
            // Setup UI elements
            BlogAuth.setupAuthUI();
            
            console.log('Auth module initialized');
        } catch (error) {
            console.error('Failed to initialize auth module:', error);
        }
    },
    
    /**
     * Handle authentication state changes
     * @param {Object} user - Firebase user object or null if signed out
     */
    handleAuthStateChange: async (user) => {
        if (user) {
            // User is signed in
            console.log('User signed in:', user.uid);
            
            try {
                // Get additional user data from Firestore
                const userData = await BlogAuth.getUserData(user.uid);
                
                // Cache the current user data
                BlogAuth.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || userData?.displayName || 'User',
                    photoURL: user.photoURL || userData?.photoURL || 'assets/images/default-avatar.svg',
                    role: userData?.role || BlogAuth.roles.READER,
                    bio: userData?.bio || '',
                    joinDate: userData?.joinDate || new Date().toISOString(),
                    ...userData // Spread any additional user data
                };
                
                // Update UI for authenticated user
                BlogAuth.updateAuthUI(true);
                
                // Set the profile image
                const profileImage = document.getElementById('profile-image');
                if (profileImage) {
                    profileImage.src = BlogAuth.currentUser.photoURL;
                    profileImage.alt = BlogAuth.currentUser.displayName;
                }
                
                // Check for redirects based on auth state
                BlogAuth.handleAuthRedirects(true);
                
                // Dispatch auth state event
                document.dispatchEvent(new CustomEvent('blog:auth:signin', { 
                    detail: { user: BlogAuth.currentUser }
                }));
            } catch (error) {
                console.error('Error getting user data:', error);
                BlogAuth.signOut();
            }
        } else {
            // User is signed out
            console.log('User signed out');
            
            // Clear current user
            BlogAuth.currentUser = null;
            
            // Update UI for unauthenticated user
            BlogAuth.updateAuthUI(false);
            
            // Check for redirects based on auth state
            BlogAuth.handleAuthRedirects(false);
            
            // Dispatch auth state event
            document.dispatchEvent(new CustomEvent('blog:auth:signout'));
        }
    },
    
    /**
     * Sign in with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @return {Promise} Promise that resolves with user credential
     */
    signInWithEmailAndPassword: async (email, password) => {
        try {
            BlogUtils.toggleLoading(true);
            const userCredential = await BlogAuth.auth.signInWithEmailAndPassword(email, password);
            BlogUtils.showToast('Signed in successfully!', 'success');
            return userCredential;
        } catch (error) {
            console.error('Error signing in:', error);
            let errorMessage = 'Failed to sign in. Please try again.';
            
            // Provide more specific error messages
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            }
            
            BlogUtils.showToast(errorMessage, 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Sign up with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} displayName - User display name
     * @return {Promise} Promise that resolves with user credential
     */
    signUpWithEmailAndPassword: async (email, password, displayName) => {
        try {
            BlogUtils.toggleLoading(true);
            
            // Create user in Firebase Auth
            const userCredential = await BlogAuth.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update the user profile
            await user.updateProfile({
                displayName: displayName
            });
            
            // Create user document in Firestore
            await BlogAuth.createUserData(user.uid, {
                email: email,
                displayName: displayName,
                role: BlogAuth.roles.READER, // Default role
                joinDate: new Date().toISOString(),
                photoURL: 'assets/images/default-avatar.svg',
                bio: ''
            });
            
            BlogUtils.showToast('Account created successfully!', 'success');
            return userCredential;
        } catch (error) {
            console.error('Error signing up:', error);
            let errorMessage = 'Failed to create account. Please try again.';
            
            // Provide more specific error messages
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already in use. Please sign in or use a different email.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please provide a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            }
            
            BlogUtils.showToast(errorMessage, 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Sign in with Google
     * @return {Promise} Promise that resolves with user credential
     */
    signInWithGoogle: async () => {
        try {
            BlogUtils.toggleLoading(true);
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await BlogAuth.auth.signInWithPopup(provider);
            
            // Check if this is the first time signing in
            const isNewUser = userCredential.additionalUserInfo.isNewUser;
            
            if (isNewUser) {
                // Create user document in Firestore for new users
                const user = userCredential.user;
                await BlogAuth.createUserData(user.uid, {
                    email: user.email,
                    displayName: user.displayName,
                    role: BlogAuth.roles.READER, // Default role
                    joinDate: new Date().toISOString(),
                    photoURL: user.photoURL || 'assets/images/default-avatar.svg',
                    bio: ''
                });
            }
            
            BlogUtils.showToast('Signed in successfully with Google!', 'success');
            return userCredential;
        } catch (error) {
            console.error('Error signing in with Google:', error);
            BlogUtils.showToast('Failed to sign in with Google. Please try again.', 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Sign out the current user
     * @return {Promise} Promise that resolves when sign out is complete
     */
    signOut: async () => {
        try {
            await BlogAuth.auth.signOut();
            BlogUtils.showToast('Signed out successfully!', 'success');
        } catch (error) {
            console.error('Error signing out:', error);
            BlogUtils.showToast('Failed to sign out. Please try again.', 'error');
            throw error;
        }
    },
    
    /**
     * Reset password for a user
     * @param {string} email - User email
     * @return {Promise} Promise that resolves when password reset email is sent
     */
    resetPassword: async (email) => {
        try {
            BlogUtils.toggleLoading(true);
            await BlogAuth.auth.sendPasswordResetEmail(email);
            BlogUtils.showToast('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            console.error('Error resetting password:', error);
            let errorMessage = 'Failed to send password reset email. Please try again.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please check the email address.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please provide a valid email address.';
            }
            
            BlogUtils.showToast(errorMessage, 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Update user profile
     * @param {Object} profileData - Profile data to update
     * @return {Promise} Promise that resolves when profile is updated
     */
    updateUserProfile: async (profileData) => {
        try {
            BlogUtils.toggleLoading(true);
            
            if (!BlogAuth.currentUser) {
                throw new Error('No authenticated user');
            }
            
            const user = BlogAuth.auth.currentUser;
            const updateData = {};
            
            // Update Firebase Auth profile data
            const authUpdate = {};
            
            if (profileData.displayName) {
                authUpdate.displayName = profileData.displayName;
                updateData.displayName = profileData.displayName;
            }
            
            if (profileData.photoURL) {
                authUpdate.photoURL = profileData.photoURL;
                updateData.photoURL = profileData.photoURL;
            }
            
            if (Object.keys(authUpdate).length > 0) {
                await user.updateProfile(authUpdate);
            }
            
            // Update additional profile data in Firestore
            if (profileData.bio !== undefined) {
                updateData.bio = profileData.bio;
            }
            
            await BlogAuth.updateUserData(user.uid, updateData);
            
            // Update cached user data
            BlogAuth.currentUser = {
                ...BlogAuth.currentUser,
                ...updateData
            };
            
            // Update UI components
            const profileImage = document.getElementById('profile-image');
            if (profileImage && profileData.photoURL) {
                profileImage.src = profileData.photoURL;
            }
            
            BlogUtils.showToast('Profile updated successfully!', 'success');
            
            // Dispatch profile update event
            document.dispatchEvent(new CustomEvent('blog:auth:profileupdate', { 
                detail: { user: BlogAuth.currentUser }
            }));
            
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            BlogUtils.showToast('Failed to update profile. Please try again.', 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Update user password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @return {Promise} Promise that resolves when password is updated
     */
    updatePassword: async (currentPassword, newPassword) => {
        try {
            BlogUtils.toggleLoading(true);
            
            if (!BlogAuth.currentUser) {
                throw new Error('No authenticated user');
            }
            
            const user = BlogAuth.auth.currentUser;
            
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email, 
                currentPassword
            );
            
            await user.reauthenticateWithCredential(credential);
            
            // Update password
            await user.updatePassword(newPassword);
            
            BlogUtils.showToast('Password updated successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error updating password:', error);
            let errorMessage = 'Failed to update password. Please try again.';
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Current password is incorrect. Please try again.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'New password is too weak. Please use a stronger password.';
            }
            
            BlogUtils.showToast(errorMessage, 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Delete user account
     * @param {string} password - User password for confirmation
     * @return {Promise} Promise that resolves when account is deleted
     */
    deleteAccount: async (password) => {
        try {
            BlogUtils.toggleLoading(true);
            
            if (!BlogAuth.currentUser) {
                throw new Error('No authenticated user');
            }
            
            const user = BlogAuth.auth.currentUser;
            
            // Re-authenticate user if using email/password
            if (user.providerData.some(provider => provider.providerId === 'password')) {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email, 
                    password
                );
                
                await user.reauthenticateWithCredential(credential);
            }
            
            // Delete user data from Firestore
            await BlogAuth.deleteUserData(user.uid);
            
            // Delete user account
            await user.delete();
            
            BlogUtils.showToast('Account deleted successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error deleting account:', error);
            let errorMessage = 'Failed to delete account. Please try again.';
            
            if (error.code === 'auth/wrong-password') {
                errorMessage = 'Password is incorrect. Please try again.';
            } else if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'This operation requires recent authentication. Please sign in again.';
                BlogAuth.signOut();
            }
            
            BlogUtils.showToast(errorMessage, 'error');
            throw error;
        } finally {
            BlogUtils.toggleLoading(false);
        }
    },
    
    /**
     * Check if user has a specific role
     * @param {string} role - Role to check
     * @return {boolean} True if user has the role
     */
    hasRole: (role) => {
        if (!BlogAuth.currentUser) return false;
        
        if (role === BlogAuth.roles.ADMIN) {
            return BlogAuth.currentUser.role === BlogAuth.roles.ADMIN;
        }
        
        if (role === BlogAuth.roles.WRITER) {
            return BlogAuth.currentUser.role === BlogAuth.roles.ADMIN || 
                   BlogAuth.currentUser.role === BlogAuth.roles.WRITER;
        }
        
        return true; // Everyone has reader role
    },
    
    /**
     * Create user data in Firestore
     * @param {string} uid - User ID
     * @param {Object} userData - User data
     * @return {Promise} Promise that resolves when user data is created
     */
    createUserData: async (uid, userData) => {
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(uid).set(userData);
            return true;
        } catch (error) {
            console.error('Error creating user data:', error);
            throw error;
        }
    },
    
    /**
     * Get user data from Firestore
     * @param {string} uid - User ID
     * @return {Promise} Promise that resolves with user data
     */
    getUserData: async (uid) => {
        try {
            const db = firebase.firestore();
            const userDoc = await db.collection('users').doc(uid).get();
            
            if (!userDoc.exists) {
                console.log('No user data found, creating default data');
                const defaultData = {
                    email: BlogAuth.auth.currentUser.email,
                    displayName: BlogAuth.auth.currentUser.displayName || 'User',
                    role: BlogAuth.roles.READER,
                    joinDate: new Date().toISOString(),
                    photoURL: BlogAuth.auth.currentUser.photoURL || 'assets/images/default-avatar.svg',
                    bio: ''
                };
                
                await BlogAuth.createUserData(uid, defaultData);
                return defaultData;
            }
            
            return userDoc.data();
        } catch (error) {
            console.error('Error getting user data:', error);
            throw error;
        }
    },
    
    /**
     * Update user data in Firestore
     * @param {string} uid - User ID
     * @param {Object} userData - User data to update
     * @return {Promise} Promise that resolves when user data is updated
     */
    updateUserData: async (uid, userData) => {
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(uid).update(userData);
            return true;
        } catch (error) {
            console.error('Error updating user data:', error);
            throw error;
        }
    },
    
    /**
     * Delete user data from Firestore
     * @param {string} uid - User ID
     * @return {Promise} Promise that resolves when user data is deleted
     */
    deleteUserData: async (uid) => {
        try {
            const db = firebase.firestore();
            await db.collection('users').doc(uid).delete();
            return true;
        } catch (error) {
            console.error('Error deleting user data:', error);
            throw error;
        }
    },
    
    /**
     * Set up authentication UI elements
     */
    setupAuthUI: () => {
        // Set up event listeners for auth-related elements
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                BlogAuth.signOut();
            });
        }
        
        // Handle login form if on login page
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = loginForm.querySelector('#email').value;
                const password = loginForm.querySelector('#password').value;
                
                try {
                    await BlogAuth.signInWithEmailAndPassword(email, password);
                    // Redirect to home page after successful login
                    window.location.href = 'index.html';
                } catch (error) {
                    // Error is already handled in signInWithEmailAndPassword
                }
            });
        }
        
        // Handle signup form if on login page
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = signupForm.querySelector('#signup-email').value;
                const displayName = signupForm.querySelector('#signup-name').value;
                const password = signupForm.querySelector('#signup-password').value;
                
                try {
                    await BlogAuth.signUpWithEmailAndPassword(email, password, displayName);
                    // Redirect to home page after successful signup
                    window.location.href = 'index.html';
                } catch (error) {
                    // Error is already handled in signUpWithEmailAndPassword
                }
            });
        }
        
        // Handle reset password form
        const resetForm = document.getElementById('reset-password-form');
        if (resetForm) {
            resetForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = resetForm.querySelector('#reset-email').value;
                
                try {
                    await BlogAuth.resetPassword(email);
                    // Show success message (already shown in toast)
                } catch (error) {
                    // Error is already handled in resetPassword
                }
            });
        }
        
        // Handle Google sign-in button
        const googleSignInButton = document.getElementById('google-signin');
        if (googleSignInButton) {
            googleSignInButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    await BlogAuth.signInWithGoogle();
                    // Redirect to home page after successful login
                    window.location.href = 'index.html';
                } catch (error) {
                    // Error is already handled in signInWithGoogle
                }
            });
        }
        
        // Handle profile update form
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const displayName = profileForm.querySelector('#profile-name').value;
                const bio = profileForm.querySelector('#profile-bio').value;
                
                // Get profile image file if there's a file input
                let photoURL = null;
                const profileImageInput = profileForm.querySelector('#profile-image-upload');
                
                if (profileImageInput && profileImageInput.files.length > 0) {
                    const file = profileImageInput.files[0];
                    // Simple mime type validation
                    if (!file.type.startsWith('image/')) {
                        BlogUtils.showToast('Please select a valid image file', 'error');
                        return;
                    }
                    
                    // Upload image to Firebase Storage
                    try {
                        const storageRef = firebase.storage().ref();
                        const fileRef = storageRef.child(`profile-images/${BlogAuth.currentUser.uid}/${file.name}`);
                        
                        const snapshot = await fileRef.put(file);
                        photoURL = await snapshot.ref.getDownloadURL();
                    } catch (error) {
                        console.error('Error uploading profile image:', error);
                        BlogUtils.showToast('Failed to upload profile image', 'error');
                        return;
                    }
                }
                
                try {
                    await BlogAuth.updateUserProfile({
                        displayName,
                        bio,
                        ...(photoURL && { photoURL })
                    });
                    
                    // Show success message (already shown in toast)
                } catch (error) {
                    // Error is already handled in updateUserProfile
                }
            });
        }
        
        // Handle password change form
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = passwordForm.querySelector('#current-password').value;
                const newPassword = passwordForm.querySelector('#new-password').value;
                const confirmPassword = passwordForm.querySelector('#confirm-password').value;
                
                if (newPassword !== confirmPassword) {
                    BlogUtils.showToast('New passwords do not match', 'error');
                    return;
                }
                
                try {
                    await BlogAuth.updatePassword(currentPassword, newPassword);
                    // Reset form
                    passwordForm.reset();
                } catch (error) {
                    // Error is already handled in updatePassword
                }
            });
        }
        
        // Handle account deletion
        const deleteAccountButton = document.getElementById('delete-account-btn');
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const confirmed = await BlogUtils.showConfirmation(
                    'Delete Account',
                    'Are you sure you want to delete your account? This action cannot be undone.',
                    {
                        confirmText: 'Delete Account',
                        confirmClass: 'btn-danger',
                        cancelText: 'Cancel'
                    }
                );
                
                if (!confirmed) return;
                
                const passwordPrompt = await BlogUtils.showConfirmation(
                    'Confirm with Password',
                    `
                    <p>Please enter your password to confirm account deletion.</p>
                    <div class="form-group mt-4">
                        <input type="password" id="delete-account-password" class="form-control" placeholder="Password" required>
                    </div>
                    `,
                    {
                        confirmText: 'Confirm',
                        confirmClass: 'btn-danger',
                        cancelText: 'Cancel'
                    }
                );
                
                if (!passwordPrompt) return;
                
                const password = document.getElementById('delete-account-password').value;
                
                if (!password) {
                    BlogUtils.showToast('Password is required', 'error');
                    return;
                }
                
                try {
                    await BlogAuth.deleteAccount(password);
                    window.location.href = 'index.html';
                } catch (error) {
                    // Error is already handled in deleteAccount
                }
            });
        }
        
        // Check and setup forms based on URL parameters
        const params = BlogUtils.getUrlParams();
        if (params.register === 'true' && loginForm && signupForm) {
            // Show signup form instead of login
            document.getElementById('login-container').classList.add('hidden');
            document.getElementById('signup-container').classList.remove('hidden');
            document.getElementById('auth-tabs-signup').classList.add('active');
            document.getElementById('auth-tabs-login').classList.remove('active');
        }
        
        // Handle auth tabs if they exist
        const authTabs = document.querySelectorAll('.auth-tab');
        if (authTabs.length > 0) {
            authTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const targetId = tab.getAttribute('data-target');
                    
                    // Hide all containers
                    document.querySelectorAll('.auth-container').forEach(container => {
                        container.classList.add('hidden');
                    });
                    
                    // Remove active class from all tabs
                    authTabs.forEach(tab => {
                        tab.classList.remove('active');
                    });
                    
                    // Show target container and add active class to clicked tab
                    document.getElementById(targetId).classList.remove('hidden');
                    tab.classList.add('active');
                    
                    // Update URL parameter
                    const isRegister = targetId === 'signup-container';
                    const url = new URL(window.location.href);
                    if (isRegister) {
                        url.searchParams.set('register', 'true');
                    } else {
                        url.searchParams.delete('register');
                    }
                    window.history.replaceState({}, '', url);
                });
            });
        }
    },
    
    /**
     * Update authentication UI based on auth state
     * @param {boolean} isAuthenticated - Whether the user is authenticated
     */
    updateAuthUI: (isAuthenticated) => {
        // Update auth buttons and user profile
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        
        if (authButtons && userProfile) {
            if (isAuthenticated) {
                authButtons.classList.add('hidden');
                userProfile.classList.remove('hidden');
            } else {
                authButtons.classList.remove('hidden');
                userProfile.classList.add('hidden');
            }
        }
        
        // Update hero write button
        const heroWriteBtn = document.getElementById('hero-write-btn');
        if (heroWriteBtn) {
            if (isAuthenticated) {
                heroWriteBtn.href = 'pages/new-post.html';
            } else {
                heroWriteBtn.href = 'pages/login.html?redirect=new-post';
            }
        }
        
        // Update other UI elements based on user role
        if (isAuthenticated) {
            // Show/hide admin elements
            document.querySelectorAll('[data-auth-role]').forEach(element => {
                const requiredRole = element.getAttribute('data-auth-role');
                const hasRequiredRole = BlogAuth.hasRole(requiredRole);
                
                if (hasRequiredRole) {
                    element.classList.remove('hidden');
                } else {
                    element.classList.add('hidden');
                }
            });
        } else {
            // Hide all role-specific elements when not authenticated
            document.querySelectorAll('[data-auth-role]').forEach(element => {
                element.classList.add('hidden');
            });
        }
    },
    
    /**
     * Handle redirects based on authentication state
     * @param {boolean} isAuthenticated - Whether the user is authenticated
     */
    handleAuthRedirects: (isAuthenticated) => {
        // Get current page
        const pathname = window.location.pathname;
        const isAuthPage = pathname.includes('login.html');
        const isProfilePage = pathname.includes('profile.html');
        const isDashboardPage = pathname.includes('dashboard.html');
        const isNewPostPage = pathname.includes('new-post.html');
        const isEditPostPage = pathname.includes('edit-post.html');
        
        // Handle redirects for authenticated users
        if (isAuthenticated) {
            // Redirect from login page to home or specified redirect
            if (isAuthPage) {
                const params = BlogUtils.getUrlParams();
                const redirectPath = params.redirect ? `pages/${params.redirect}.html` : 'index.html';
                window.location.href = redirectPath;
                return;
            }
            
            // Check for role requirements on protected pages
            if (isDashboardPage && !BlogAuth.hasRole(BlogAuth.roles.ADMIN)) {
                BlogUtils.showToast('You do not have permission to access the dashboard', 'error');
                window.location.href = 'index.html';
                return;
            }
            
            if ((isNewPostPage || isEditPostPage) && !BlogAuth.hasRole(BlogAuth.roles.WRITER)) {
                BlogUtils.showToast('You do not have permission to create or edit posts', 'error');
                window.location.href = 'index.html';
                return;
            }
        } 
        // Handle redirects for unauthenticated users
        else {
            // Redirect from protected pages to login
            if (isProfilePage || isDashboardPage || isNewPostPage || isEditPostPage) {
                // Extract the current page name from pathname
                const pageName = pathname.split('/').pop().split('.')[0];
                window.location.href = `login.html?redirect=${pageName}`;
                return;
            }
        }
    }
};

// Initialize auth module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', BlogAuth.init);
