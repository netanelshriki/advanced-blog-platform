/**
 * BlogFolio - Advanced Blog Platform
 * UI Module
 * 
 * This file handles UI interactions, animations, and dynamic UI updates.
 */

// UI namespace to avoid global scope pollution
const BlogUI = {
    // Current view mode (grid or list)
    viewMode: 'grid',
    
    // Current sort mode
    sortMode: 'date-desc',
    
    // UI state
    state: {
        isMobileMenuOpen: false,
        currentPage: 1,
        searchQuery: '',
        selectedTag: 'all',
        isSearching: false
    },
    
    /**
     * Initialize the UI module
     */
    init: () => {
        // Set up UI elements
        BlogUI.setupEventListeners();
        BlogUI.initMobileMenu();
        BlogUI.initViewToggle();
        BlogUI.initCodeHighlighting();
        BlogUI.initScrollToTop();
        BlogUI.initSearchFunctionality();
        BlogUI.initSortDropdown();
        BlogUI.initPageTransitions();
        
        console.log('UI module initialized');
    },
    
    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners: () => {
        // Toggle mobile menu
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', BlogUI.toggleMobileMenu);
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (
                BlogUI.state.isMobileMenuOpen && 
                !e.target.closest('.mobile-menu-toggle') && 
                !e.target.closest('.main-nav')
            ) {
                BlogUI.closeMobileMenu();
            }
        });
        
        // Add event listeners for tag filters
        document.querySelectorAll('.tag-filter').forEach(tagFilter => {
            tagFilter.addEventListener('click', (e) => {
                e.preventDefault();
                const tag = tagFilter.getAttribute('data-tag');
                BlogUI.filterPostsByTag(tag);
            });
        });
        
        // Handle pagination clicks
        document.querySelectorAll('.pagination-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(item.getAttribute('data-page'));
                BlogUI.goToPage(page);
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', BlogUtils.debounce(() => {
            if (window.innerWidth >= 768 && BlogUI.state.isMobileMenuOpen) {
                BlogUI.closeMobileMenu();
            }
        }, 250));
        
        // Handle post card clicks
        document.querySelectorAll('.post').forEach(post => {
            post.addEventListener('click', (e) => {
                // Allow clicking on links within the card without triggering the card click
                if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a')) {
                    return;
                }
                
                const postId = post.getAttribute('data-id');
                if (postId) {
                    window.location.href = `pages/post.html?id=${postId}`;
                }
            });
        });
        
        // Initialize form validation
        BlogUI.initFormValidation();
    },
    
    /**
     * Initialize form validation
     */
    initFormValidation: () => {
        document.querySelectorAll('form[data-validate="true"]').forEach(form => {
            form.addEventListener('submit', (e) => {
                const isValid = BlogUI.validateForm(form);
                
                if (!isValid) {
                    e.preventDefault();
                }
            });
            
            // Add input event listeners for real-time validation
            form.querySelectorAll('input, textarea, select').forEach(field => {
                field.addEventListener('input', () => {
                    BlogUI.validateField(field);
                });
                
                field.addEventListener('blur', () => {
                    BlogUI.validateField(field);
                });
            });
        });
    },
    
    /**
     * Validate an entire form
     * @param {HTMLFormElement} form - The form to validate
     * @return {boolean} True if valid, false otherwise
     */
    validateForm: (form) => {
        let isValid = true;
        
        form.querySelectorAll('input, textarea, select').forEach(field => {
            const fieldValid = BlogUI.validateField(field);
            isValid = isValid && fieldValid;
        });
        
        // Password confirmation matching
        const password = form.querySelector('input[type="password"][id$="password"]');
        const confirmPassword = form.querySelector('input[type="password"][id$="confirm-password"]');
        
        if (password && confirmPassword) {
            if (password.value !== confirmPassword.value) {
                BlogUI.setFieldError(confirmPassword, 'Passwords do not match');
                isValid = false;
            }
        }
        
        return isValid;
    },
    
    /**
     * Validate a single form field
     * @param {HTMLElement} field - The field to validate
     * @return {boolean} True if valid, false otherwise
     */
    validateField: (field) => {
        // Skip disabled or hidden fields
        if (field.disabled || field.type === 'hidden') {
            return true;
        }
        
        const value = field.value.trim();
        const required = field.hasAttribute('required');
        const minLength = field.getAttribute('minlength');
        const maxLength = field.getAttribute('maxlength');
        const pattern = field.getAttribute('pattern');
        const fieldType = field.type;
        
        // Clear previous error
        BlogUI.clearFieldError(field);
        
        // Required validation
        if (required && value === '') {
            BlogUI.setFieldError(field, 'This field is required');
            return false;
        }
        
        // Skip further validation if field is empty and not required
        if (value === '' && !required) {
            return true;
        }
        
        // Minimum length validation
        if (minLength && value.length < parseInt(minLength)) {
            BlogUI.setFieldError(field, `Must be at least ${minLength} characters`);
            return false;
        }
        
        // Maximum length validation
        if (maxLength && value.length > parseInt(maxLength)) {
            BlogUI.setFieldError(field, `Must be less than ${maxLength} characters`);
            return false;
        }
        
        // Pattern validation
        if (pattern && !new RegExp(pattern).test(value)) {
            BlogUI.setFieldError(field, 'Please enter a valid format');
            return false;
        }
        
        // Type-specific validation
        switch (fieldType) {
            case 'email':
                if (!BlogUtils.isValidEmail(value)) {
                    BlogUI.setFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
                
            case 'password':
                // Password strength validation for password fields with data-validate-strength attribute
                if (field.hasAttribute('data-validate-strength')) {
                    const result = BlogUtils.validatePassword(value);
                    if (!result.isValid) {
                        BlogUI.setFieldError(field, result.messages[0] || 'Password is too weak');
                        return false;
                    }
                }
                break;
                
            case 'url':
                try {
                    new URL(value);
                } catch (e) {
                    BlogUI.setFieldError(field, 'Please enter a valid URL');
                    return false;
                }
                break;
        }
        
        // Custom validation from data-validate-fn attribute
        const validateFn = field.getAttribute('data-validate-fn');
        if (validateFn && typeof window[validateFn] === 'function') {
            const customValidation = window[validateFn](value, field);
            if (customValidation !== true) {
                BlogUI.setFieldError(field, customValidation || 'Invalid value');
                return false;
            }
        }
        
        return true;
    },
    
    /**
     * Set error for a form field
     * @param {HTMLElement} field - The field with error
     * @param {string} message - The error message
     */
    setFieldError: (field, message) => {
        field.classList.add('is-invalid');
        
        let errorContainer = field.nextElementSibling;
        
        // If the next element is not an error container, create one
        if (!errorContainer || !errorContainer.classList.contains('field-error')) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'field-error';
            field.parentNode.insertBefore(errorContainer, field.nextSibling);
        }
        
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    },
    
    /**
     * Clear error for a form field
     * @param {HTMLElement} field - The field to clear error for
     */
    clearFieldError: (field) => {
        field.classList.remove('is-invalid');
        
        const errorContainer = field.nextElementSibling;
        if (errorContainer && errorContainer.classList.contains('field-error')) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }
    },
    
    /**
     * Toggle mobile menu
     */
    toggleMobileMenu: () => {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (!menuToggle || !nav) return;
        
        if (BlogUI.state.isMobileMenuOpen) {
            menuToggle.classList.remove('mobile-menu-open');
            nav.classList.remove('show');
            document.body.classList.remove('menu-open');
            BlogUI.state.isMobileMenuOpen = false;
        } else {
            menuToggle.classList.add('mobile-menu-open');
            nav.classList.add('show');
            document.body.classList.add('menu-open');
            BlogUI.state.isMobileMenuOpen = true;
        }
    },
    
    /**
     * Close mobile menu
     */
    closeMobileMenu: () => {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('.main-nav');
        
        if (!menuToggle || !nav) return;
        
        menuToggle.classList.remove('mobile-menu-open');
        nav.classList.remove('show');
        document.body.classList.remove('menu-open');
        BlogUI.state.isMobileMenuOpen = false;
    },
    
    /**
     * Initialize view toggle (grid/list view)
     */
    initViewToggle: () => {
        const viewToggleButtons = document.querySelectorAll('.view-btn');
        const postsContainer = document.getElementById('posts-container');
        
        if (!viewToggleButtons.length || !postsContainer) return;
        
        // Load saved view mode from localStorage
        const savedViewMode = localStorage.getItem('viewMode');
        if (savedViewMode) {
            BlogUI.viewMode = savedViewMode;
            
            // Apply saved view mode
            if (savedViewMode === 'list') {
                postsContainer.classList.add('posts-list');
                postsContainer.classList.remove('posts-grid');
                
                // Update active button
                viewToggleButtons.forEach(button => {
                    if (button.getAttribute('data-view') === 'list') {
                        button.classList.add('active');
                    } else {
                        button.classList.remove('active');
                    }
                });
            }
        }
        
        // Set up click handlers for view toggle buttons
        viewToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const viewMode = button.getAttribute('data-view');
                
                // Update active button
                viewToggleButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Update view mode
                if (viewMode === 'list') {
                    postsContainer.classList.add('posts-list');
                    postsContainer.classList.remove('posts-grid');
                    BlogUI.viewMode = 'list';
                } else {
                    postsContainer.classList.add('posts-grid');
                    postsContainer.classList.remove('posts-list');
                    BlogUI.viewMode = 'grid';
                }
                
                // Save preference
                localStorage.setItem('viewMode', BlogUI.viewMode);
            });
        });
    },
    
    /**
     * Initialize code highlighting
     */
    initCodeHighlighting: () => {
        // Check if Prism is available
        if (typeof Prism !== 'undefined') {
            // Add toolbar to code blocks (for copy button)
            document.querySelectorAll('pre:not(.toolbar-added)').forEach(pre => {
                pre.classList.add('toolbar-added');
                
                // Get the language if available
                let language = '';
                const codeElement = pre.querySelector('code');
                if (codeElement) {
                    const classNames = Array.from(codeElement.classList);
                    const languageClass = classNames.find(className => className.startsWith('language-'));
                    
                    if (languageClass) {
                        language = languageClass.replace('language-', '');
                    }
                }
                
                // Create header
                const header = document.createElement('div');
                header.className = 'code-header';
                
                // Add language badge if available
                if (language) {
                    const languageBadge = document.createElement('span');
                    languageBadge.className = 'code-language';
                    languageBadge.textContent = language;
                    header.appendChild(languageBadge);
                }
                
                // Add copy button
                const copyButton = document.createElement('button');
                copyButton.className = 'code-copy-button';
                copyButton.textContent = 'Copy';
                copyButton.setAttribute('aria-label', 'Copy code');
                
                copyButton.addEventListener('click', async () => {
                    const code = codeElement ? codeElement.textContent : pre.textContent;
                    const success = await BlogUtils.copyToClipboard(code);
                    
                    if (success) {
                        copyButton.textContent = 'Copied!';
                        copyButton.classList.add('copied');
                        
                        setTimeout(() => {
                            copyButton.textContent = 'Copy';
                            copyButton.classList.remove('copied');
                        }, 2000);
                    }
                });
                
                header.appendChild(copyButton);
                
                // Insert header before pre
                pre.parentNode.insertBefore(header, pre);
            });
            
            // Highlight all code elements
            Prism.highlightAll();
        }
    },
    
    /**
     * Initialize scroll to top functionality
     */
    initScrollToTop: () => {
        // Create scroll to top button if it doesn't exist
        let scrollToTopBtn = document.querySelector('.scroll-to-top');
        
        if (!scrollToTopBtn) {
            scrollToTopBtn = document.createElement('button');
            scrollToTopBtn.className = 'scroll-to-top';
            scrollToTopBtn.setAttribute('aria-label', 'Scroll to top');
            scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            document.body.appendChild(scrollToTopBtn);
            
            // Add event listener
            scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
        
        // Show/hide button based on scroll position
        const toggleScrollToTopBtn = () => {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        };
        
        // Add scroll event listener
        window.addEventListener('scroll', BlogUtils.throttle(toggleScrollToTopBtn, 200));
        
        // Initial check
        toggleScrollToTopBtn();
    },
    
    /**
     * Initialize search functionality
     */
    initSearchFunctionality: () => {
        const searchInput = document.getElementById('search-input');
        const clearSearchButton = document.getElementById('clear-search');
        
        if (!searchInput) return;
        
        // Add event listener for search input
        searchInput.addEventListener('input', BlogUtils.debounce(() => {
            const query = searchInput.value.trim().toLowerCase();
            BlogUI.state.searchQuery = query;
            BlogUI.state.currentPage = 1;
            
            if (query) {
                BlogUI.state.isSearching = true;
                clearSearchButton.style.display = 'block';
            } else {
                BlogUI.state.isSearching = false;
                clearSearchButton.style.display = 'none';
            }
            
            BlogUI.updatePostsDisplay();
        }, 300));
        
        // Add event listener for clear search button
        if (clearSearchButton) {
            clearSearchButton.addEventListener('click', () => {
                searchInput.value = '';
                BlogUI.state.searchQuery = '';
                BlogUI.state.isSearching = false;
                clearSearchButton.style.display = 'none';
                BlogUI.updatePostsDisplay();
            });
        }
    },
    
    /**
     * Initialize sort dropdown
     */
    initSortDropdown: () => {
        const sortSelect = document.getElementById('sort-select');
        
        if (!sortSelect) return;
        
        // Load saved sort mode from localStorage
        const savedSortMode = localStorage.getItem('sortMode');
        if (savedSortMode) {
            BlogUI.sortMode = savedSortMode;
            sortSelect.value = savedSortMode;
        }
        
        // Add event listener for sort change
        sortSelect.addEventListener('change', () => {
            BlogUI.sortMode = sortSelect.value;
            localStorage.setItem('sortMode', BlogUI.sortMode);
            BlogUI.updatePostsDisplay();
        });
    },
    
    /**
     * Filter posts by tag
     * @param {string} tag - The tag to filter by
     */
    filterPostsByTag: (tag) => {
        // Update state
        BlogUI.state.selectedTag = tag;
        BlogUI.state.currentPage = 1;
        
        // Update active tag in UI
        document.querySelectorAll('.tag-filter').forEach(tagFilter => {
            if (tagFilter.getAttribute('data-tag') === tag) {
                tagFilter.classList.add('active');
            } else {
                tagFilter.classList.remove('active');
            }
        });
        
        document.querySelectorAll('.tag').forEach(tagElement => {
            if (tagElement.getAttribute('data-tag') === tag) {
                tagElement.classList.add('active');
            } else {
                tagElement.classList.remove('active');
            }
        });
        
        // Update posts display
        BlogUI.updatePostsDisplay();
    },
    
    /**
     * Update posts display based on current filters, sort, and page
     */
    updatePostsDisplay: () => {
        // This is a placeholder for the actual implementation
        // In a real application, this would call the data layer to fetch posts
        // For now, we'll simulate filtering and sorting on the existing posts
        
        const postsContainer = document.getElementById('posts-container');
        const noResults = document.getElementById('no-results');
        
        if (!postsContainer) return;
        
        // Get all posts
        const allPosts = Array.from(postsContainer.querySelectorAll('.post'));
        
        // Apply tag filter
        let filteredPosts = allPosts;
        
        if (BlogUI.state.selectedTag !== 'all') {
            filteredPosts = allPosts.filter(post => {
                const postTags = post.getAttribute('data-tags');
                return postTags && postTags.split(',').includes(BlogUI.state.selectedTag);
            });
        }
        
        // Apply search filter
        if (BlogUI.state.searchQuery) {
            filteredPosts = filteredPosts.filter(post => {
                const title = post.querySelector('.post-title').textContent.toLowerCase();
                const excerpt = post.querySelector('.post-excerpt').textContent.toLowerCase();
                const author = post.querySelector('.post-author-name')?.textContent.toLowerCase() || '';
                
                return (
                    title.includes(BlogUI.state.searchQuery) || 
                    excerpt.includes(BlogUI.state.searchQuery) ||
                    author.includes(BlogUI.state.searchQuery)
                );
            });
        }
        
        // Apply sorting
        filteredPosts.sort((a, b) => {
            switch (BlogUI.sortMode) {
                case 'date-desc':
                    return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
                case 'date-asc':
                    return new Date(a.getAttribute('data-date')) - new Date(b.getAttribute('data-date'));
                case 'title-asc':
                    return a.querySelector('.post-title').textContent.localeCompare(
                        b.querySelector('.post-title').textContent
                    );
                case 'title-desc':
                    return b.querySelector('.post-title').textContent.localeCompare(
                        a.querySelector('.post-title').textContent
                    );
                default:
                    return 0;
            }
        });
        
        // Determine if we have results
        if (filteredPosts.length === 0) {
            if (noResults) {
                noResults.classList.remove('hidden');
            }
        } else {
            if (noResults) {
                noResults.classList.add('hidden');
            }
        }
        
        // Apply pagination
        const postsPerPage = 6;
        const start = (BlogUI.state.currentPage - 1) * postsPerPage;
        const end = start + postsPerPage;
        const paginatedPosts = filteredPosts.slice(start, end);
        
        // Update pagination UI
        BlogUI.updatePagination(filteredPosts.length, postsPerPage);
        
        // Hide all posts first
        allPosts.forEach(post => {
            post.style.display = 'none';
        });
        
        // Show only the paginated posts
        paginatedPosts.forEach(post => {
            post.style.display = 'block';
        });
        
        // Add animation classes
        paginatedPosts.forEach((post, index) => {
            post.classList.add('animated', 'fade-in');
            post.style.animationDelay = `${index * 0.1}s`;
            
            // Remove animation classes after animation completes
            setTimeout(() => {
                post.classList.remove('animated', 'fade-in');
                post.style.animationDelay = '';
            }, 1000 + index * 100);
        });
    },
    
    /**
     * Update pagination UI
     * @param {number} totalItems - Total number of items
     * @param {number} itemsPerPage - Number of items per page
     */
    updatePagination: (totalItems, itemsPerPage) => {
        const paginationContainer = document.getElementById('pagination');
        
        if (!paginationContainer) return;
        
        // Calculate total pages
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Clear previous pagination
        paginationContainer.innerHTML = '';
        
        // Hide pagination if there's only one page
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        // Create pagination items
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-item pagination-prev';
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevButton.disabled = BlogUI.state.currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (BlogUI.state.currentPage > 1) {
                BlogUI.goToPage(BlogUI.state.currentPage - 1);
            }
        });
        paginationContainer.appendChild(prevButton);
        
        // Page numbers
        let startPage = Math.max(1, BlogUI.state.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust start page if end page is maxed out
        if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // First page
        if (startPage > 1) {
            const firstPageItem = document.createElement('button');
            firstPageItem.className = 'pagination-item';
            firstPageItem.textContent = '1';
            firstPageItem.setAttribute('data-page', '1');
            firstPageItem.addEventListener('click', () => {
                BlogUI.goToPage(1);
            });
            paginationContainer.appendChild(firstPageItem);
            
            if (startPage > 2) {
                const ellipsisItem = document.createElement('span');
                ellipsisItem.className = 'pagination-ellipsis';
                ellipsisItem.textContent = '...';
                paginationContainer.appendChild(ellipsisItem);
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('button');
            pageItem.className = 'pagination-item';
            if (i === BlogUI.state.currentPage) {
                pageItem.classList.add('active');
            }
            pageItem.textContent = i.toString();
            pageItem.setAttribute('data-page', i.toString());
            pageItem.addEventListener('click', () => {
                BlogUI.goToPage(i);
            });
            paginationContainer.appendChild(pageItem);
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsisItem = document.createElement('span');
                ellipsisItem.className = 'pagination-ellipsis';
                ellipsisItem.textContent = '...';
                paginationContainer.appendChild(ellipsisItem);
            }
            
            const lastPageItem = document.createElement('button');
            lastPageItem.className = 'pagination-item';
            lastPageItem.textContent = totalPages.toString();
            lastPageItem.setAttribute('data-page', totalPages.toString());
            lastPageItem.addEventListener('click', () => {
                BlogUI.goToPage(totalPages);
            });
            paginationContainer.appendChild(lastPageItem);
        }
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-item pagination-next';
        nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextButton.disabled = BlogUI.state.currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (BlogUI.state.currentPage < totalPages) {
                BlogUI.goToPage(BlogUI.state.currentPage + 1);
            }
        });
        paginationContainer.appendChild(nextButton);
    },
    
    /**
     * Go to a specific page
     * @param {number} page - The page number to go to
     */
    goToPage: (page) => {
        BlogUI.state.currentPage = page;
        BlogUI.updatePostsDisplay();
        
        // Scroll to posts container
        const postsContainer = document.getElementById('posts-container');
        if (postsContainer) {
            window.scrollTo({
                top: postsContainer.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    },
    
    /**
     * Initialize page transitions
     */
    initPageTransitions: () => {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('page-loaded');
        });
        
        // Add transition class to all internal links
        document.querySelectorAll('a').forEach(link => {
            // Skip external links, hash links, and links with the no-transition class
            if (
                link.hostname !== window.location.hostname || 
                link.getAttribute('href').startsWith('#') ||
                link.classList.contains('no-transition')
            ) {
                return;
            }
            
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Skip if ctrl/cmd is pressed or if it's an anchor link
                if (e.ctrlKey || e.metaKey || href.startsWith('#')) {
                    return;
                }
                
                e.preventDefault();
                
                document.body.classList.add('page-transition-out');
                
                setTimeout(() => {
                    window.location.href = href;
                }, 300);
            });
        });
        
        // Add transition-in class when the page loads
        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                // Page is loaded from back/forward cache
                document.body.classList.remove('page-transition-out');
            }
            
            setTimeout(() => {
                document.body.classList.add('page-transition-in');
            }, 0);
        });
    },
    
    /**
     * Create and render a post card
     * @param {Object} post - Post data
     * @param {boolean} isFeatured - Whether this is a featured post
     * @return {HTMLElement} The post card element
     */
    createPostCard: (post, isFeatured = false) => {
        const templateId = isFeatured ? 'featured-post-template' : 'post-template';
        const template = document.getElementById(templateId);
        
        if (!template) {
            console.error(`Template not found: ${templateId}`);
            return null;
        }
        
        const postCard = template.content.cloneNode(true).querySelector(isFeatured ? '.featured-post' : '.post');
        
        // Set post data
        postCard.setAttribute('data-id', post.id);
        postCard.setAttribute('data-date', post.createdAt);
        postCard.setAttribute('data-tags', post.tags.join(','));
        
        // Set image
        const imgElement = postCard.querySelector('.post-image img');
        if (imgElement) {
            imgElement.src = post.coverImage || 'assets/images/placeholder.jpg';
            imgElement.alt = post.title;
        }
        
        // Set title
        postCard.querySelector('.post-title').textContent = post.title;
        
        // Set excerpt
        postCard.querySelector('.post-excerpt').textContent = BlogUtils.truncateText(post.excerpt || post.content, isFeatured ? 150 : 100);
        
        // Set author
        const authorElement = postCard.querySelector('.post-author-name');
        if (authorElement) {
            authorElement.textContent = post.author.name;
        }
        
        const authorImgElement = postCard.querySelector('.author-avatar img');
        if (authorImgElement) {
            authorImgElement.src = post.author.profileImage || 'assets/images/default-avatar.svg';
            authorImgElement.alt = post.author.name;
        }
        
        // Set date
        const dateElement = postCard.querySelector('.post-date');
        if (dateElement) {
            dateElement.textContent = BlogUtils.formatDate(post.createdAt, 'short');
            dateElement.setAttribute('title', BlogUtils.formatDate(post.createdAt, 'long'));
        }
        
        // Set tags
        const tagsContainer = postCard.querySelector('.post-tags');
        if (tagsContainer && post.tags) {
            tagsContainer.innerHTML = '';
            
            post.tags.forEach(tag => {
                const tagElement = document.createElement('a');
                tagElement.href = '#';
                tagElement.className = 'tag';
                tagElement.textContent = tag;
                tagElement.setAttribute('data-tag', tag);
                
                tagElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    BlogUI.filterPostsByTag(tag);
                });
                
                tagsContainer.appendChild(tagElement);
            });
        }
        
        // Set read time
        const readTimeElement = postCard.querySelector('.post-read-time');
        if (readTimeElement) {
            const readTime = BlogUtils.calculateReadingTime(post.content);
            readTimeElement.textContent = `${readTime} min read`;
        }
        
        // Set stats
        const likesElement = postCard.querySelector('.post-likes');
        if (likesElement) {
            likesElement.textContent = post.likes || 0;
        }
        
        const commentsElement = postCard.querySelector('.post-comments');
        if (commentsElement) {
            commentsElement.textContent = post.comments?.length || 0;
        }
        
        return postCard;
    }
};

// Initialize UI module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', BlogUI.init);
