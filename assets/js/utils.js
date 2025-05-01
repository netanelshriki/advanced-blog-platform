/**
 * BlogFolio - Advanced Blog Platform
 * Utility Functions
 * 
 * This file contains reusable utility functions for the blog platform.
 */

// Namespace to avoid global scope pollution
const BlogUtils = {
    /**
     * Format a date in a user-friendly way
     * @param {Date|string|number} date - The date to format
     * @param {string} format - The format type ('relative', 'short', 'long')
     * @return {string} Formatted date string
     */
    formatDate: (date, format = 'relative') => {
        const dateObj = date instanceof Date ? date : new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            console.error('Invalid date provided to formatDate');
            return 'Invalid date';
        }
        
        // For relative time format (e.g., "2 days ago")
        if (format === 'relative') {
            const now = new Date();
            const diffMs = now - dateObj;
            const diffSec = Math.round(diffMs / 1000);
            const diffMin = Math.round(diffSec / 60);
            const diffHour = Math.round(diffMin / 60);
            const diffDay = Math.round(diffHour / 24);
            const diffMonth = Math.round(diffDay / 30);
            const diffYear = Math.round(diffDay / 365);
            
            if (diffSec < 60) return 'just now';
            if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
            if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
            if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
            if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
            return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
        }
        
        // For short date format (e.g., "Jan 1, 2023")
        if (format === 'short') {
            const options = { month: 'short', day: 'numeric', year: 'numeric' };
            return dateObj.toLocaleDateString(undefined, options);
        }
        
        // For long date format (e.g., "January 1, 2023 at 12:00 PM")
        if (format === 'long') {
            const options = { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            };
            return dateObj.toLocaleDateString(undefined, options);
        }
        
        // Default to ISO format
        return dateObj.toISOString();
    },
    
    /**
     * Generate a slug from a string
     * @param {string} str - The string to convert to a slug
     * @return {string} The slug
     */
    generateSlug: (str) => {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    /**
     * Truncate text to a specified length
     * @param {string} text - The text to truncate
     * @param {number} length - Maximum length
     * @return {string} Truncated text
     */
    truncateText: (text, length = 100) => {
        if (!text || text.length <= length) return text;
        return text.substring(0, length).trim() + '...';
    },
    
    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - The function to debounce
     * @param {number} wait - The debounce wait time in milliseconds
     * @return {Function} Debounced function
     */
    debounce: (func, wait = 300) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },
    
    /**
     * Throttle function to limit how often a function can be called
     * @param {Function} func - The function to throttle
     * @param {number} limit - The throttle limit time in milliseconds
     * @return {Function} Throttled function
     */
    throttle: (func, limit = 300) => {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Get a random integer between min and max (inclusive)
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @return {number} Random integer
     */
    getRandomInt: (min, max) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * Generate a unique ID
     * @param {string} prefix - Optional prefix for the ID
     * @return {string} Unique ID
     */
    generateUniqueId: (prefix = '') => {
        return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).substr(2)}`;
    },
    
    /**
     * Safely parse JSON with error handling
     * @param {string} jsonString - The JSON string to parse
     * @param {*} fallback - Fallback value if parsing fails
     * @return {*} Parsed object or fallback value
     */
    safeJsonParse: (jsonString, fallback = null) => {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return fallback;
        }
    },
    
    /**
     * Set an item in local storage with optional expiration
     * @param {string} key - The storage key
     * @param {*} value - The value to store
     * @param {number} ttl - Time to live in milliseconds (optional)
     */
    setStorageItem: (key, value, ttl = null) => {
        const item = {
            value: value,
            timestamp: Date.now()
        };
        
        if (ttl) {
            item.expiry = Date.now() + ttl;
        }
        
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    /**
     * Get an item from local storage with expiration check
     * @param {string} key - The storage key
     * @param {*} defaultValue - Default value if key doesn't exist or has expired
     * @return {*} The stored value or default value
     */
    getStorageItem: (key, defaultValue = null) => {
        const itemStr = localStorage.getItem(key);
        
        // Return default value if item doesn't exist
        if (!itemStr) return defaultValue;
        
        try {
            const item = JSON.parse(itemStr);
            
            // Check if the item has expired
            if (item.expiry && Date.now() > item.expiry) {
                localStorage.removeItem(key);
                return defaultValue;
            }
            
            return item.value;
        } catch (error) {
            console.error('Error retrieving from storage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Validate an email address
     * @param {string} email - The email to validate
     * @return {boolean} True if valid, false otherwise
     */
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validate a password strength
     * @param {string} password - The password to validate
     * @return {Object} Validation result with strength and messages
     */
    validatePassword: (password) => {
        const result = {
            isValid: false,
            strength: 0, // 0-4 scale
            messages: []
        };
        
        if (!password || password.length < 8) {
            result.messages.push('Password must be at least 8 characters long');
            return result;
        }
        
        // Check for uppercase letters
        if (!/[A-Z]/.test(password)) {
            result.messages.push('Password should contain at least one uppercase letter');
        } else {
            result.strength += 1;
        }
        
        // Check for lowercase letters
        if (!/[a-z]/.test(password)) {
            result.messages.push('Password should contain at least one lowercase letter');
        } else {
            result.strength += 1;
        }
        
        // Check for numbers
        if (!/[0-9]/.test(password)) {
            result.messages.push('Password should contain at least one number');
        } else {
            result.strength += 1;
        }
        
        // Check for special characters
        if (!/[^A-Za-z0-9]/.test(password)) {
            result.messages.push('Password should contain at least one special character');
        } else {
            result.strength += 1;
        }
        
        // Password is valid if it has at least medium strength (2)
        result.isValid = result.strength >= 2;
        
        return result;
    },
    
    /**
     * Sanitize HTML content to prevent XSS attacks
     * Very basic implementation - use a library like DOMPurify in production
     * @param {string} html - The HTML to sanitize
     * @return {string} Sanitized HTML
     */
    sanitizeHtml: (html) => {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html);
        }
        
        // Very basic fallback sanitizer
        const element = document.createElement('div');
        element.textContent = html;
        return element.innerHTML;
    },
    
    /**
     * Get URL parameters as an object
     * @return {Object} URL parameters
     */
    getUrlParams: () => {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
    },
    
    /**
     * Check if the device is mobile or tablet
     * @return {boolean} True if mobile or tablet
     */
    isMobileOrTablet: () => {
        return /(android|iphone|ipad|mobile|tablet)/i.test(navigator.userAgent);
    },
    
    /**
     * Get the user's preferred color scheme
     * @return {string} 'dark' or 'light'
     */
    getPreferredColorScheme: () => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    },
    
    /**
     * Toggle dark mode
     * @param {boolean} enable - Force enable/disable, or toggle if not provided
     * @return {boolean} Current dark mode state
     */
    toggleDarkMode: (enable = null) => {
        const body = document.body;
        const isDarkMode = body.classList.contains('dark-mode');
        
        if (enable === null) {
            // Toggle mode
            body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', !isDarkMode);
            return !isDarkMode;
        } else {
            // Set specific mode
            if (enable) {
                body.classList.add('dark-mode');
            } else {
                body.classList.remove('dark-mode');
            }
            localStorage.setItem('darkMode', enable);
            return enable;
        }
    },
    
    /**
     * Initialize dark mode based on user preference or system setting
     */
    initDarkMode: () => {
        const savedDarkMode = localStorage.getItem('darkMode');
        
        if (savedDarkMode !== null) {
            // Use saved preference
            const enableDarkMode = savedDarkMode === 'true';
            BlogUtils.toggleDarkMode(enableDarkMode);
        } else {
            // Use system preference
            const prefersDark = BlogUtils.getPreferredColorScheme() === 'dark';
            BlogUtils.toggleDarkMode(prefersDark);
        }
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - The text to copy
     * @return {Promise} Promise that resolves when copying is done
     */
    copyToClipboard: async (text) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const result = document.execCommand('copy');
                document.body.removeChild(textArea);
                return result;
            }
        } catch (error) {
            console.error('Failed to copy text: ', error);
            return false;
        }
    },
    
    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast ('success', 'error', 'warning', 'info')
     * @param {number} duration - Duration in milliseconds
     */
    showToast: (message, type = 'info', duration = 3000) => {
        const toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            console.error('Toast container not found');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Get the appropriate icon based on type
        let icon = '';
        switch (type) {
            case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
            case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
            case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
            default: icon = '<i class="fas fa-info-circle"></i>';
        }
        
        // Create the toast content
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add the toast to the container
        toastContainer.appendChild(toast);
        
        // Trigger the show animation after a small delay
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Set up the close button
        const closeButton = toast.querySelector('.toast-close');
        closeButton.addEventListener('click', () => {
            toast.classList.remove('show');
            
            // Remove the toast after the animation completes
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        });
        
        // Auto-remove the toast after the specified duration
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentNode === toastContainer) {
                    toast.classList.remove('show');
                    
                    setTimeout(() => {
                        if (toast.parentNode === toastContainer) {
                            toastContainer.removeChild(toast);
                        }
                    }, 300);
                }
            }, duration);
        }
    },
    
    /**
     * Show a confirmation modal
     * @param {string} title - The modal title
     * @param {string} message - The modal message
     * @param {Object} options - Additional options
     * @return {Promise} Promise that resolves with the user's choice
     */
    showConfirmation: (title, message, options = {}) => {
        return new Promise((resolve) => {
            const modal = document.getElementById('global-modal');
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            const modalFooter = document.getElementById('modal-footer');
            
            if (!modal || !modalTitle || !modalBody || !modalFooter) {
                console.error('Modal elements not found');
                resolve(false);
                return;
            }
            
            const defaultOptions = {
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                confirmClass: 'btn-primary',
                cancelClass: 'btn-outline'
            };
            
            const finalOptions = { ...defaultOptions, ...options };
            
            // Set up the modal content
            modalTitle.textContent = title;
            modalBody.innerHTML = `<p>${message}</p>`;
            modalFooter.innerHTML = `
                <button class="btn ${finalOptions.cancelClass}" id="modal-cancel">${finalOptions.cancelText}</button>
                <button class="btn ${finalOptions.confirmClass}" id="modal-confirm">${finalOptions.confirmText}</button>
            `;
            
            // Show the modal
            modal.classList.add('active');
            
            // Set up event listeners
            const closeModal = () => {
                modal.classList.remove('active');
            };
            
            const confirmButton = document.getElementById('modal-confirm');
            const cancelButton = document.getElementById('modal-cancel');
            const closeButton = modal.querySelector('.modal-close');
            
            confirmButton.addEventListener('click', () => {
                closeModal();
                resolve(true);
            });
            
            cancelButton.addEventListener('click', () => {
                closeModal();
                resolve(false);
            });
            
            closeButton.addEventListener('click', () => {
                closeModal();
                resolve(false);
            });
            
            modal.querySelector('.modal-backdrop').addEventListener('click', () => {
                closeModal();
                resolve(false);
            });
        });
    },
    
    /**
     * Show a loading spinner
     * @param {boolean} show - Whether to show or hide the spinner
     */
    toggleLoading: (show = true) => {
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (!loadingOverlay) {
            console.error('Loading overlay not found');
            return;
        }
        
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    },
    
    /**
     * Calculate reading time for a text
     * @param {string} text - The text to calculate reading time for
     * @param {number} wordsPerMinute - Words per minute reading speed
     * @return {number} Reading time in minutes
     */
    calculateReadingTime: (text, wordsPerMinute = 200) => {
        if (!text) return 0;
        
        const wordCount = text.trim().split(/\s+/).length;
        const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
        
        return readingTimeMinutes;
    },
    
    /**
     * Auto-resize a textarea based on content
     * @param {HTMLElement} textarea - The textarea element
     */
    autoResizeTextarea: (textarea) => {
        if (!textarea) return;
        
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set the height to the scrollHeight
        textarea.style.height = textarea.scrollHeight + 'px';
    },
    
    /**
     * Add event listener for auto-resizing textareas
     */
    initAutoResizeTextareas: () => {
        document.querySelectorAll('textarea[data-autoresize]').forEach(textarea => {
            // Initial resize
            BlogUtils.autoResizeTextarea(textarea);
            
            // Add event listeners for input changes
            textarea.addEventListener('input', () => {
                BlogUtils.autoResizeTextarea(textarea);
            });
        });
    },
    
    /**
     * Initialize intersection observers for animations
     */
    initIntersectionObserver: () => {
        if (!('IntersectionObserver' in window)) return;
        
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        const handleIntersect = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-animated');
                    observer.unobserve(entry.target);
                }
            });
        };
        
        const observer = new IntersectionObserver(handleIntersect, observerOptions);
        
        document.querySelectorAll('.will-animate').forEach(element => {
            observer.observe(element);
        });
    },
    
    /**
     * Find elements that have data-action attributes and attach event listeners
     */
    initDataActionHandlers: () => {
        document.querySelectorAll('[data-action]').forEach(element => {
            const action = element.getAttribute('data-action');
            const event = element.getAttribute('data-event') || 'click';
            
            if (action && BlogUtils.actionHandlers[action]) {
                element.addEventListener(event, (e) => {
                    BlogUtils.actionHandlers[action](e, element);
                });
            }
        });
    },
    
    /**
     * Action handlers for data-action elements
     */
    actionHandlers: {
        // Example: <button data-action="toggleDarkMode">Toggle Dark Mode</button>
        toggleDarkMode: (event, element) => {
            event.preventDefault();
            BlogUtils.toggleDarkMode();
        },
        
        // Example: <button data-action="copyToClipboard" data-clipboard-text="Text to copy">Copy</button>
        copyToClipboard: async (event, element) => {
            event.preventDefault();
            const text = element.getAttribute('data-clipboard-text');
            
            if (!text) return;
            
            const success = await BlogUtils.copyToClipboard(text);
            
            if (success) {
                // Optional: change button text temporarily
                const originalText = element.textContent;
                element.textContent = 'Copied!';
                element.classList.add('copied');
                
                setTimeout(() => {
                    element.textContent = originalText;
                    element.classList.remove('copied');
                }, 2000);
                
                // Show toast notification
                BlogUtils.showToast('Copied to clipboard!', 'success');
            } else {
                BlogUtils.showToast('Failed to copy to clipboard', 'error');
            }
        }
    },
    
    /**
     * Initialize all utility features
     */
    init: () => {
        // Initialize dark mode
        BlogUtils.initDarkMode();
        
        // Initialize auto-resize textareas
        BlogUtils.initAutoResizeTextareas();
        
        // Initialize intersection observer for animations
        BlogUtils.initIntersectionObserver();
        
        // Initialize data action handlers
        BlogUtils.initDataActionHandlers();
        
        // Add event listener for theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                BlogUtils.toggleDarkMode();
            });
        }
        
        // Add event listeners for code copy buttons
        document.querySelectorAll('.code-copy-button').forEach(button => {
            button.addEventListener('click', async () => {
                const codeBlock = button.closest('.code-header').nextElementSibling;
                const code = codeBlock ? codeBlock.textContent : '';
                
                if (code) {
                    const success = await BlogUtils.copyToClipboard(code);
                    
                    if (success) {
                        const originalText = button.textContent;
                        button.textContent = 'Copied!';
                        button.classList.add('copied');
                        
                        setTimeout(() => {
                            button.textContent = originalText;
                            button.classList.remove('copied');
                        }, 2000);
                    }
                }
            });
        });
    }
};

// Initialize utilities when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', BlogUtils.init);
