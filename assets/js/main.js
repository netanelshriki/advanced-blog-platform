/**
 * BlogFolio - Advanced Blog Platform
 * Main Application Script
 * 
 * This file is the entry point for the application.
 * It initializes all modules and handles page-specific functionality.
 */

// Main application namespace
const BlogApp = {
    /**
     * Initialize the application
     */
    init: async function() {
        console.log('Initializing BlogFolio application...');
        
        // Set copyright year
        document.getElementById('current-year').textContent = new Date().getFullYear();
        
        // Determine current page
        const currentPage = BlogApp.getCurrentPage();
        
        // Initialize modules
        await BlogApp.initModules();
        
        // Run page-specific code
        BlogApp.initPageFunctionality(currentPage);
        
        // Add event listeners
        BlogApp.addEventListeners();
        
        console.log('BlogFolio application initialized successfully');
    },
    
    /**
     * Initialize application modules
     */
    initModules: async function() {
        try {
            // Ensure utility functions are initialized
            if (typeof BlogUtils !== 'undefined') {
                BlogUtils.init();
            }
            
            // Initialize auth (wait for it to complete)
            if (typeof BlogAuth !== 'undefined') {
                await BlogAuth.init();
            }
            
            // Initialize UI components
            if (typeof BlogUI !== 'undefined') {
                BlogUI.init();
            }
            
            // Initialize data module (wait for it to complete)
            if (typeof BlogData !== 'undefined') {
                await BlogData.init();
            }
        } catch (error) {
            console.error('Error initializing modules:', error);
            BlogUtils.showToast('Error initializing application. Please refresh the page.', 'error');
        }
    },
    
    /**
     * Get the current page based on the URL
     * @return {string} The current page name
     */
    getCurrentPage: function() {
        const path = window.location.pathname;
        
        // Extract page name from the path
        let pageName = 'home';
        
        if (path.includes('/')) {
            const segments = path.split('/');
            const fileName = segments[segments.length - 1];
            
            if (fileName && fileName !== '' && fileName !== 'index.html') {
                pageName = fileName.split('.')[0];
            }
        }
        
        document.body.dataset.page = pageName;
        return pageName;
    },
    
    /**
     * Initialize page-specific functionality
     * @param {string} pageName - The current page name
     */
    initPageFunctionality: function(pageName) {
        // Run common functionality for all pages
        BlogApp.initCommonFunctionality();
        
        // Run page-specific initialization
        switch (pageName) {
            case 'home':
                BlogApp.initHomePage();
                break;
                
            case 'post':
                BlogApp.initPostPage();
                break;
                
            case 'category':
                BlogApp.initCategoryPage();
                break;
                
            case 'login':
                BlogApp.initLoginPage();
                break;
                
            case 'profile':
                BlogApp.initProfilePage();
                break;
                
            case 'new-post':
                BlogApp.initNewPostPage();
                break;
                
            case 'edit-post':
                BlogApp.initEditPostPage();
                break;
                
            case 'dashboard':
                BlogApp.initDashboardPage();
                break;
                
            case 'about':
                BlogApp.initAboutPage();
                break;
                
            default:
                // For pages without specific initialization
                console.log(`No specific initialization for page: ${pageName}`);
        }
    },
    
    /**
     * Initialize functionality common to all pages
     */
    initCommonFunctionality: function() {
        // Initialize newsletter form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const emailInput = document.getElementById('newsletter-email');
                const feedbackEl = document.getElementById('newsletter-feedback');
                
                if (!emailInput || !feedbackEl) return;
                
                const email = emailInput.value.trim();
                
                if (!email || !BlogUtils.isValidEmail(email)) {
                    feedbackEl.textContent = 'Please enter a valid email address.';
                    feedbackEl.style.color = 'var(--color-danger)';
                    return;
                }
                
                try {
                    BlogUtils.toggleLoading(true);
                    await BlogData.subscribeToNewsletter(email);
                    
                    // Show success message
                    feedbackEl.textContent = 'Thank you for subscribing!';
                    feedbackEl.style.color = 'var(--color-success)';
                    
                    // Clear the input
                    emailInput.value = '';
                    
                    // Show toast notification
                    BlogUtils.showToast('Successfully subscribed to the newsletter!', 'success');
                } catch (error) {
                    console.error('Error subscribing to newsletter:', error);
                    feedbackEl.textContent = 'Failed to subscribe. Please try again.';
                    feedbackEl.style.color = 'var(--color-danger)';
                    BlogUtils.showToast('Failed to subscribe to the newsletter.', 'error');
                } finally {
                    BlogUtils.toggleLoading(false);
                }
            });
        }
    },
    
    /**
     * Initialize home page functionality
     */
    initHomePage: async function() {
        try {
            // Fetch featured posts
            const featuredPosts = await BlogData.getFeaturedPosts(3);
            
            // Render featured posts
            if (featuredPosts && featuredPosts.length > 0) {
                BlogData.renderPosts(featuredPosts, 'featured-posts-container', true);
            }
            
            // Fetch recent posts
            const recentPosts = await BlogData.getRecentPosts(6);
            
            // Render recent posts
            if (recentPosts && recentPosts.length > 0) {
                BlogData.renderPosts(recentPosts, 'posts-container', false);
            }
        } catch (error) {
            console.error('Error initializing home page:', error);
            BlogUtils.showToast('Error loading posts. Please refresh the page.', 'error');
        }
    },
    
    /**
     * Initialize post page functionality
     */
    initPostPage: async function() {
        try {
            // Get post slug from URL
            const params = BlogUtils.getUrlParams();
            const slug = params.id || params.slug;
            
            if (!slug) {
                window.location.href = 'index.html';
                return;
            }
            
            // Fetch the post
            const post = await BlogData.getPostBySlug(slug);
            
            if (!post) {
                // Post not found, redirect to home
                BlogUtils.showToast('Post not found.', 'error');
                window.location.href = 'index.html';
                return;
            }
            
            // Increment view count
            BlogData.incrementViews(slug);
            
            // Update page title
            document.title = `${post.title} - BlogFolio`;
            
            // Render post content
            const postTitle = document.getElementById('post-title');
            const postMeta = document.getElementById('post-meta');
            const postContent = document.getElementById('post-content');
            const postTags = document.getElementById('post-tags');
            const postAuthor = document.getElementById('post-author');
            const postComments = document.getElementById('post-comments');
            
            if (postTitle) postTitle.textContent = post.title;
            
            if (postMeta) {
                const dateElement = postMeta.querySelector('.post-date');
                const readTimeElement = postMeta.querySelector('.post-read-time');
                const viewsElement = postMeta.querySelector('.post-views');
                const likesElement = postMeta.querySelector('.post-likes');
                
                if (dateElement) {
                    dateElement.textContent = BlogUtils.formatDate(post.createdAt, 'long');
                }
                
                if (readTimeElement) {
                    const readTime = BlogUtils.calculateReadingTime(post.content);
                    readTimeElement.textContent = `${readTime} min read`;
                }
                
                if (viewsElement) {
                    viewsElement.textContent = post.views || 0;
                }
                
                if (likesElement) {
                    likesElement.textContent = post.likes || 0;
                }
            }
            
            if (postContent) {
                // Convert Markdown to HTML
                if (typeof marked !== 'undefined') {
                    // Set up marked options
                    marked.setOptions({
                        renderer: new marked.Renderer(),
                        highlight: function(code, lang) {
                            if (Prism && Prism.highlight && Prism.languages[lang]) {
                                return Prism.highlight(code, Prism.languages[lang], lang);
                            }
                            return code;
                        },
                        pedantic: false,
                        gfm: true,
                        breaks: true,
                        sanitize: false,
                        smartLists: true,
                        smartypants: true,
                        xhtml: false
                    });
                    
                    // Convert and sanitize the content
                    let htmlContent = marked(post.content);
                    
                    if (typeof DOMPurify !== 'undefined') {
                        htmlContent = DOMPurify.sanitize(htmlContent);
                    }
                    
                    postContent.innerHTML = htmlContent;
                    
                    // Initialize code highlighting
                    BlogUI.initCodeHighlighting();
                } else {
                    // Fallback if marked is not available
                    postContent.textContent = post.content;
                }
            }
            
            if (postTags && post.tags) {
                postTags.innerHTML = '';
                
                post.tags.forEach(tag => {
                    const tagElement = document.createElement('a');
                    tagElement.href = `category.html?tag=${tag}`;
                    tagElement.className = 'tag';
                    tagElement.textContent = tag;
                    postTags.appendChild(tagElement);
                });
            }
            
            if (postAuthor && post.author) {
                const authorImage = postAuthor.querySelector('.author-image');
                const authorName = postAuthor.querySelector('.author-name');
                const authorBio = postAuthor.querySelector('.author-bio');
                
                if (authorImage) {
                    authorImage.src = post.author.profileImage || 'assets/images/default-avatar.svg';
                    authorImage.alt = post.author.name;
                }
                
                if (authorName) {
                    authorName.textContent = post.author.name;
                }
                
                if (authorBio && post.author.bio) {
                    authorBio.textContent = post.author.bio;
                }
            }
            
            // Render comments
            if (postComments && post.comments) {
                const commentsCount = document.getElementById('comments-count');
                if (commentsCount) {
                    commentsCount.textContent = post.comments.length;
                }
                
                const commentsContainer = document.getElementById('comments-container');
                if (commentsContainer) {
                    commentsContainer.innerHTML = '';
                    
                    if (post.comments.length === 0) {
                        commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
                    } else {
                        post.comments.forEach(comment => {
                            const commentElement = document.createElement('div');
                            commentElement.className = 'comment';
                            commentElement.dataset.id = comment.id;
                            
                            const isCurrentUser = BlogAuth.currentUser && comment.author.id === BlogAuth.currentUser.uid;
                            
                            commentElement.innerHTML = `
                                <div class="comment-header">
                                    <div class="comment-author">
                                        <img src="${comment.author.profileImage || 'assets/images/default-avatar.svg'}" alt="${comment.author.name}" class="author-avatar">
                                        <div>
                                            <span class="author-name">${comment.author.name}</span>
                                            <span class="comment-date">${BlogUtils.formatDate(comment.createdAt, 'relative')}</span>
                                        </div>
                                    </div>
                                    ${isCurrentUser ? `
                                        <button class="btn-text delete-comment" data-id="${comment.id}">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    ` : ''}
                                </div>
                                <div class="comment-content">
                                    ${BlogUtils.sanitizeHtml(comment.content)}
                                </div>
                            `;
                            
                            commentsContainer.appendChild(commentElement);
                        });
                        
                        // Add event listeners to delete buttons
                        document.querySelectorAll('.delete-comment').forEach(button => {
                            button.addEventListener('click', async () => {
                                const commentId = button.getAttribute('data-id');
                                
                                if (!commentId) return;
                                
                                const confirmed = await BlogUtils.showConfirmation(
                                    'Delete Comment',
                                    'Are you sure you want to delete this comment?',
                                    {
                                        confirmText: 'Delete',
                                        confirmClass: 'btn-danger',
                                        cancelText: 'Cancel'
                                    }
                                );
                                
                                if (!confirmed) return;
                                
                                try {
                                    BlogUtils.toggleLoading(true);
                                    
                                    await BlogData.deleteComment(slug, commentId);
                                    
                                    // Remove the comment from the UI
                                    const commentElement = document.querySelector(`.comment[data-id="${commentId}"]`);
                                    if (commentElement) {
                                        commentElement.remove();
                                    }
                                    
                                    // Update the comment count
                                    if (commentsCount) {
                                        const count = parseInt(commentsCount.textContent) - 1;
                                        commentsCount.textContent = count;
                                        
                                        if (count === 0) {
                                            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
                                        }
                                    }
                                    
                                    BlogUtils.showToast('Comment deleted successfully.', 'success');
                                } catch (error) {
                                    console.error('Error deleting comment:', error);
                                    BlogUtils.showToast('Failed to delete comment. Please try again.', 'error');
                                } finally {
                                    BlogUtils.toggleLoading(false);
                                }
                            });
                        });
                    }
                }
            }
            
            // Initialize comment form
            const commentForm = document.getElementById('comment-form');
            if (commentForm) {
                // Show/hide comment form based on authentication
                const commentFormContainer = document.getElementById('comment-form-container');
                const loginToComment = document.getElementById('login-to-comment');
                
                if (BlogAuth.currentUser) {
                    if (commentFormContainer) commentFormContainer.classList.remove('hidden');
                    if (loginToComment) loginToComment.classList.add('hidden');
                    
                    // Set user avatar
                    const userAvatar = document.getElementById('comment-user-avatar');
                    if (userAvatar && BlogAuth.currentUser.photoURL) {
                        userAvatar.src = BlogAuth.currentUser.photoURL;
                        userAvatar.alt = BlogAuth.currentUser.displayName;
                    }
                } else {
                    if (commentFormContainer) commentFormContainer.classList.add('hidden');
                    if (loginToComment) loginToComment.classList.remove('hidden');
                }
                
                // Handle comment submission
                commentForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    if (!BlogAuth.currentUser) {
                        BlogUtils.showToast('Please log in to leave a comment.', 'warning');
                        return;
                    }
                    
                    const commentInput = document.getElementById('comment-input');
                    if (!commentInput) return;
                    
                    const content = commentInput.value.trim();
                    
                    if (!content) {
                        BlogUtils.showToast('Comment cannot be empty.', 'warning');
                        return;
                    }
                    
                    try {
                        BlogUtils.toggleLoading(true);
                        
                        await BlogData.addComment(slug, content);
                        
                        // Clear the input
                        commentInput.value = '';
                        
                        // Reload the page to show the new comment
                        window.location.reload();
                    } catch (error) {
                        console.error('Error adding comment:', error);
                        BlogUtils.showToast('Failed to add comment. Please try again.', 'error');
                    } finally {
                        BlogUtils.toggleLoading(false);
                    }
                });
            }
            
            // Initialize like button
            const likeButton = document.getElementById('like-button');
            if (likeButton) {
                // Check if user has already liked the post
                const hasLiked = await BlogData.hasLiked(slug);
                
                if (hasLiked) {
                    likeButton.classList.add('active');
                }
                
                likeButton.addEventListener('click', async () => {
                    if (!BlogAuth.currentUser) {
                        BlogUtils.showToast('Please log in to like posts.', 'warning');
                        return;
                    }
                    
                    try {
                        const isActive = likeButton.classList.contains('active');
                        
                        // Toggle like status
                        await BlogData.toggleLike(slug, !isActive);
                        
                        // Update UI
                        likeButton.classList.toggle('active');
                        
                        const likesElement = document.querySelector('.post-likes');
                        if (likesElement) {
                            const currentLikes = parseInt(likesElement.textContent);
                            likesElement.textContent = isActive ? currentLikes - 1 : currentLikes + 1;
                        }
                    } catch (error) {
                        console.error('Error toggling like:', error);
                        BlogUtils.showToast('Failed to update like status. Please try again.', 'error');
                    }
                });
            }
            
            // Fetch and render related posts
            const relatedPostsContainer = document.getElementById('related-posts');
            if (relatedPostsContainer && post.tags && post.tags.length > 0) {
                // Select a random tag from the post
                const randomTag = post.tags[Math.floor(Math.random() * post.tags.length)];
                
                // Fetch posts with the same tag
                const relatedPosts = await BlogData.getPostsByTag(randomTag, 3);
                
                // Filter out the current post
                const filteredRelatedPosts = relatedPosts.filter(relatedPost => relatedPost.slug !== slug);
                
                // Render related posts
                if (filteredRelatedPosts.length > 0) {
                    const relatedPostsTitle = document.getElementById('related-posts-title');
                    if (relatedPostsTitle) {
                        relatedPostsTitle.textContent = `More posts about "${randomTag}"`;
                    }
                    
                    BlogData.renderPosts(filteredRelatedPosts.slice(0, 3), 'related-posts', false);
                } else {
                    // If no related posts, hide the section
                    const relatedPostsSection = document.getElementById('related-posts-section');
                    if (relatedPostsSection) {
                        relatedPostsSection.style.display = 'none';
                    }
                }
            }
        } catch (error) {
            console.error('Error initializing post page:', error);
            BlogUtils.showToast('Error loading post. Please try again.', 'error');
        }
    },
    
    /**
     * Initialize category page functionality
     */
    initCategoryPage: async function() {
        try {
            // Get category slug or tag from URL
            const params = BlogUtils.getUrlParams();
            const categorySlug = params.slug;
            const tag = params.tag;
            
            const categoryTitle = document.getElementById('category-title');
            const categoryDescription = document.getElementById('category-description');
            const categoryImage = document.getElementById('category-image');
            
            let posts = [];
            
            if (categorySlug) {
                // Get category information
                const category = BlogData.categoriesCache.find(cat => cat.slug === categorySlug);
                
                if (!category) {
                    BlogUtils.showToast('Category not found.', 'error');
                    window.location.href = 'index.html';
                    return;
                }
                
                // Update page title and SEO
                document.title = `${category.name} - BlogFolio`;
                
                // Update category information
                if (categoryTitle) categoryTitle.textContent = category.name;
                if (categoryDescription) categoryDescription.textContent = category.description;
                if (categoryImage) categoryImage.src = category.image || 'assets/images/categories/default.jpg';
                
                // Fetch posts for this category
                posts = await BlogData.getPostsByCategory(categorySlug);
            } else if (tag) {
                // Update page title and SEO
                document.title = `Posts tagged "${tag}" - BlogFolio`;
                
                // Update category information
                if (categoryTitle) categoryTitle.textContent = `Posts tagged "${tag}"`;
                if (categoryDescription) categoryDescription.textContent = `Explore all posts related to "${tag}"`;
                if (categoryImage) categoryImage.src = 'assets/images/categories/default.jpg';
                
                // Fetch posts for this tag
                posts = await BlogData.getPostsByTag(tag);
            } else {
                BlogUtils.showToast('Invalid category or tag.', 'error');
                window.location.href = 'index.html';
                return;
            }
            
            // Render posts
            const postsContainer = document.getElementById('category-posts');
            
            if (postsContainer) {
                if (posts.length === 0) {
                    postsContainer.innerHTML = '<p class="no-posts">No posts found in this category.</p>';
                } else {
                    BlogData.renderPosts(posts, 'category-posts', false);
                }
            }
        } catch (error) {
            console.error('Error initializing category page:', error);
            BlogUtils.showToast('Error loading category. Please try again.', 'error');
        }
    },
    
    /**
     * Initialize login page functionality
     */
    initLoginPage: function() {
        // Login page is handled by the BlogAuth module
        console.log('Login page initialized');
    },
    
    /**
     * Initialize profile page functionality
     */
    initProfilePage: function() {
        // Most profile functionality is handled by the BlogAuth module
        console.log('Profile page initialized');
        
        // Initialize profile stats
        BlogApp.initProfileStats();
    },
    
    /**
     * Initialize profile statistics
     */
    initProfileStats: async function() {
        if (!BlogAuth.currentUser) return;
        
        try {
            // Get user's posts
            const postsRef = BlogData.db.collection('posts');
            const postsQuery = postsRef.where('author.id', '==', BlogAuth.currentUser.uid);
            const postsSnapshot = await postsQuery.get();
            
            const postsCount = postsSnapshot.size;
            const posts = postsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Calculate total views and likes
            let totalViews = 0;
            let totalLikes = 0;
            
            posts.forEach(post => {
                totalViews += post.views || 0;
                totalLikes += post.likes || 0;
            });
            
            // Update profile stats UI
            const postCountElement = document.getElementById('profile-posts-count');
            const viewsCountElement = document.getElementById('profile-views-count');
            const likesCountElement = document.getElementById('profile-likes-count');
            
            if (postCountElement) postCountElement.textContent = postsCount;
            if (viewsCountElement) viewsCountElement.textContent = totalViews;
            if (likesCountElement) likesCountElement.textContent = totalLikes;
            
            // Render user's recent posts
            const recentPostsContainer = document.getElementById('user-recent-posts');
            
            if (recentPostsContainer && posts.length > 0) {
                // Sort by date (newest first) and take first 3
                const recentPosts = posts
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 3);
                
                BlogData.renderPosts(recentPosts, 'user-recent-posts', false);
            } else if (recentPostsContainer) {
                recentPostsContainer.innerHTML = '<p class="no-posts">You haven\'t published any posts yet.</p>';
            }
        } catch (error) {
            console.error('Error initializing profile stats:', error);
        }
    },
    
    /**
     * Initialize new post page functionality
     */
    initNewPostPage: function() {
        // Check if user is logged in and has permission
        if (!BlogAuth.currentUser) {
            window.location.href = 'login.html?redirect=new-post';
            return;
        }
        
        if (!BlogAuth.hasRole(BlogAuth.roles.WRITER)) {
            BlogUtils.showToast('You do not have permission to create posts.', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        // Initialize the post editor
        BlogApp.initPostEditor();
    },
    
    /**
     * Initialize edit post page functionality
     */
    initEditPostPage: async function() {
        // Check if user is logged in and has permission
        if (!BlogAuth.currentUser) {
            window.location.href = 'login.html?redirect=edit-post';
            return;
        }
        
        if (!BlogAuth.hasRole(BlogAuth.roles.WRITER)) {
            BlogUtils.showToast('You do not have permission to edit posts.', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        // Get post slug from URL
        const params = BlogUtils.getUrlParams();
        const slug = params.id || params.slug;
        
        if (!slug) {
            BlogUtils.showToast('No post specified for editing.', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        try {
            // Fetch the post
            const post = await BlogData.getPostBySlug(slug);
            
            if (!post) {
                BlogUtils.showToast('Post not found.', 'error');
                window.location.href = 'index.html';
                return;
            }
            
            // Check if user is the author or an admin
            const isAuthor = post.author.id === BlogAuth.currentUser.uid;
            const isAdmin = BlogAuth.hasRole(BlogAuth.roles.ADMIN);
            
            if (!isAuthor && !isAdmin) {
                BlogUtils.showToast('You do not have permission to edit this post.', 'error');
                window.location.href = 'index.html';
                return;
            }
            
            // Set page title
            document.title = `Edit: ${post.title} - BlogFolio`;
            
            // Initialize the post editor with existing post data
            BlogApp.initPostEditor(post);
        } catch (error) {
            console.error('Error initializing edit post page:', error);
            BlogUtils.showToast('Error loading post for editing. Please try again.', 'error');
        }
    },
    
    /**
     * Initialize the post editor
     * @param {Object} post - Existing post data (for editing)
     */
    initPostEditor: function(post = null) {
        const isEditing = !!post;
        const editorTitle = document.getElementById('editor-title');
        const postForm = document.getElementById('post-form');
        
        if (editorTitle) {
            editorTitle.textContent = isEditing ? 'Edit Post' : 'Create New Post';
        }
        
        if (!postForm) return;
        
        // Set form fields if editing an existing post
        if (isEditing) {
            const titleInput = document.getElementById('post-title');
            const excerptInput = document.getElementById('post-excerpt');
            const contentInput = document.getElementById('post-content');
            const categorySelect = document.getElementById('post-category');
            const tagsInput = document.getElementById('post-tags');
            const featuredCheckbox = document.getElementById('post-featured');
            
            if (titleInput) titleInput.value = post.title;
            if (excerptInput) excerptInput.value = post.excerpt || '';
            if (contentInput) contentInput.value = post.content;
            if (categorySelect) categorySelect.value = post.category || '';
            if (tagsInput) tagsInput.value = post.tags ? post.tags.join(', ') : '';
            if (featuredCheckbox) featuredCheckbox.checked = post.featured || false;
            
            // Add hidden field for slug
            const slugInput = document.createElement('input');
            slugInput.type = 'hidden';
            slugInput.name = 'slug';
            slugInput.id = 'post-slug';
            slugInput.value = post.slug;
            postForm.appendChild(slugInput);
        }
        
        // Initialize content editor if using a rich text editor
        // This is a placeholder for implementing a Markdown editor, WYSIWYG, etc.
        
        // Handle form submission
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                BlogUtils.toggleLoading(true);
                
                // Get form values
                const formData = new FormData(postForm);
                const postData = {
                    title: formData.get('title'),
                    excerpt: formData.get('excerpt'),
                    content: formData.get('content'),
                    category: formData.get('category'),
                    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
                    featured: formData.has('featured')
                };
                
                // Validate required fields
                if (!postData.title || !postData.content || !postData.category) {
                    BlogUtils.showToast('Please fill in all required fields.', 'error');
                    return;
                }
                
                // Handle cover image
                const coverImageInput = document.getElementById('post-cover-image');
                if (coverImageInput && coverImageInput.files.length > 0) {
                    postData.coverImage = coverImageInput.files[0];
                }
                
                let result;
                
                if (isEditing) {
                    // Get the slug
                    const slug = document.getElementById('post-slug').value;
                    
                    // Update existing post
                    result = await BlogData.updatePost(slug, postData);
                    
                    if (result) {
                        BlogUtils.showToast('Post updated successfully!', 'success');
                        window.location.href = `post.html?slug=${slug}`;
                    }
                } else {
                    // Create new post
                    const slug = await BlogData.createPost(postData);
                    
                    if (slug) {
                        BlogUtils.showToast('Post created successfully!', 'success');
                        window.location.href = `post.html?slug=${slug}`;
                    }
                }
            } catch (error) {
                console.error('Error saving post:', error);
                BlogUtils.showToast('Error saving post. Please try again.', 'error');
            } finally {
                BlogUtils.toggleLoading(false);
            }
        });
        
        // Initialize category select
        const categorySelect = document.getElementById('post-category');
        if (categorySelect && BlogData.categoriesCache.length > 0) {
            categorySelect.innerHTML = '<option value="">Select a category</option>';
            
            BlogData.categoriesCache.forEach(category => {
                const option = document.createElement('option');
                option.value = category.slug;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
        
        // Initialize preview button
        const previewButton = document.getElementById('preview-button');
        if (previewButton) {
            previewButton.addEventListener('click', (e) => {
                e.preventDefault();
                
                const contentInput = document.getElementById('post-content');
                const titleInput = document.getElementById('post-title');
                
                if (!contentInput || !titleInput) return;
                
                const content = contentInput.value;
                const title = titleInput.value || 'Post Preview';
                
                if (!content) {
                    BlogUtils.showToast('Please enter some content to preview.', 'warning');
                    return;
                }
                
                // Show preview modal
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                
                if (!modalTitle || !modalBody) return;
                
                modalTitle.textContent = title;
                
                // Convert Markdown to HTML
                if (typeof marked !== 'undefined') {
                    let htmlContent = marked(content);
                    
                    if (typeof DOMPurify !== 'undefined') {
                        htmlContent = DOMPurify.sanitize(htmlContent);
                    }
                    
                    modalBody.innerHTML = `<div class="preview-content">${htmlContent}</div>`;
                    
                    // Initialize code highlighting in preview
                    BlogUI.initCodeHighlighting();
                } else {
                    modalBody.innerHTML = `<div class="preview-content"><pre>${content}</pre></div>`;
                }
                
                // Show the modal
                const modal = document.getElementById('global-modal');
                if (modal) modal.classList.add('active');
            });
        }
    },
    
    /**
     * Initialize dashboard page functionality
     */
    initDashboardPage: async function() {
        // Check if user is logged in and has permission
        if (!BlogAuth.currentUser) {
            window.location.href = 'login.html?redirect=dashboard';
            return;
        }
        
        if (!BlogAuth.hasRole(BlogAuth.roles.ADMIN)) {
            BlogUtils.showToast('You do not have permission to access the dashboard.', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        try {
            // Fetch all posts
            const postsRef = BlogData.db.collection('posts');
            const postsSnapshot = await postsRef.get();
            
            const posts = postsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Calculate statistics
            const totalPosts = posts.length;
            let totalViews = 0;
            let totalLikes = 0;
            let totalComments = 0;
            
            posts.forEach(post => {
                totalViews += post.views || 0;
                totalLikes += post.likes || 0;
                totalComments += (post.comments ? post.comments.length : 0);
            });
            
            // Update statistics UI
            const postsCountElement = document.getElementById('stats-posts');
            const viewsCountElement = document.getElementById('stats-views');
            const likesCountElement = document.getElementById('stats-likes');
            const commentsCountElement = document.getElementById('stats-comments');
            
            if (postsCountElement) postsCountElement.textContent = totalPosts;
            if (viewsCountElement) viewsCountElement.textContent = totalViews;
            if (likesCountElement) likesCountElement.textContent = totalLikes;
            if (commentsCountElement) commentsCountElement.textContent = totalComments;
            
            // Fetch users
            const usersRef = BlogData.db.collection('users');
            const usersSnapshot = await usersRef.get();
            
            const users = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Update users count
            const usersCountElement = document.getElementById('stats-users');
            if (usersCountElement) usersCountElement.textContent = users.length;
            
            // Render recent posts
            const recentPostsTable = document.getElementById('recent-posts-table');
            if (recentPostsTable) {
                const tbody = recentPostsTable.querySelector('tbody');
                
                if (tbody) {
                    tbody.innerHTML = '';
                    
                    // Sort by date (newest first) and take first 5
                    const recentPosts = posts
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 5);
                    
                    recentPosts.forEach(post => {
                        const tr = document.createElement('tr');
                        
                        tr.innerHTML = `
                            <td>
                                <a href="post.html?slug=${post.slug}" class="post-title-link">${post.title}</a>
                            </td>
                            <td>${post.author ? post.author.name : 'Unknown'}</td>
                            <td>${BlogUtils.formatDate(post.createdAt, 'short')}</td>
                            <td>${post.views || 0}</td>
                            <td>
                                <div class="table-actions">
                                    <a href="post.html?slug=${post.slug}" class="btn-icon" title="View Post">
                                        <i class="fas fa-eye"></i>
                                    </a>
                                    <a href="edit-post.html?slug=${post.slug}" class="btn-icon" title="Edit Post">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <button class="btn-icon delete-post" data-slug="${post.slug}" title="Delete Post">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        `;
                        
                        tbody.appendChild(tr);
                    });
                    
                    // Add event listeners to delete buttons
                    document.querySelectorAll('.delete-post').forEach(button => {
                        button.addEventListener('click', async () => {
                            const slug = button.getAttribute('data-slug');
                            
                            if (!slug) return;
                            
                            const confirmed = await BlogUtils.showConfirmation(
                                'Delete Post',
                                'Are you sure you want to delete this post? This action cannot be undone.',
                                {
                                    confirmText: 'Delete',
                                    confirmClass: 'btn-danger',
                                    cancelText: 'Cancel'
                                }
                            );
                            
                            if (!confirmed) return;
                            
                            try {
                                BlogUtils.toggleLoading(true);
                                
                                await BlogData.deletePost(slug);
                                
                                // Remove the row from the table
                                const row = button.closest('tr');
                                if (row) {
                                    row.remove();
                                }
                                
                                BlogUtils.showToast('Post deleted successfully.', 'success');
                            } catch (error) {
                                console.error('Error deleting post:', error);
                                BlogUtils.showToast('Failed to delete post. Please try again.', 'error');
                            } finally {
                                BlogUtils.toggleLoading(false);
                            }
                        });
                    });
                }
            }
            
            // Render recent users
            const recentUsersTable = document.getElementById('recent-users-table');
            if (recentUsersTable) {
                const tbody = recentUsersTable.querySelector('tbody');
                
                if (tbody) {
                    tbody.innerHTML = '';
                    
                    // Sort by join date (newest first) and take first 5
                    const recentUsers = users
                        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
                        .slice(0, 5);
                    
                    recentUsers.forEach(user => {
                        const tr = document.createElement('tr');
                        
                        tr.innerHTML = `
                            <td>
                                <div class="user-info">
                                    <img src="${user.photoURL || 'assets/images/default-avatar.svg'}" alt="${user.displayName}" class="user-avatar">
                                    <span>${user.displayName}</span>
                                </div>
                            </td>
                            <td>${user.email}</td>
                            <td>${user.role || 'reader'}</td>
                            <td>${BlogUtils.formatDate(user.joinDate, 'short')}</td>
                        `;
                        
                        tbody.appendChild(tr);
                    });
                }
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            BlogUtils.showToast('Error loading dashboard data. Please try again.', 'error');
        }
    },
    
    /**
     * Initialize about page functionality
     */
    initAboutPage: function() {
        // No special functionality needed for the about page
        console.log('About page initialized');
    },
    
    /**
     * Add general event listeners
     */
    addEventListeners: function() {
        // Close modal when clicking backdrop or close button
        const modal = document.getElementById('global-modal');
        
        if (modal) {
            const modalClose = modal.querySelector('.modal-close');
            const modalBackdrop = modal.querySelector('.modal-backdrop');
            
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            }
            
            if (modalBackdrop) {
                modalBackdrop.addEventListener('click', () => {
                    modal.classList.remove('active');
                });
            }
        }
    }
};

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', BlogApp.init);

// Update current year
window.addEventListener('load', function() {
    const currentYearElements = document.querySelectorAll('.current-year');
    const currentYear = new Date().getFullYear();
    
    currentYearElements.forEach(element => {
        element.textContent = currentYear;
    });
});
