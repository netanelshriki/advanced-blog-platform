/**
 * BlogFolio - Advanced Blog Platform
 * Data Module
 * 
 * This file handles data management, storage, and retrieval.
 * It provides an interface for working with blog posts, comments, and user data.
 */

// Data namespace to avoid global scope pollution
const BlogData = {
    // Firestore database instance
    db: null,
    
    // Storage instance
    storage: null,
    
    // Cache for posts
    postsCache: {},
    
    // Cache for categories and tags
    categoriesCache: [],
    tagsCache: [],
    
    /**
     * Initialize the data module
     * @return {Promise} Promise that resolves when initialization is complete
     */
    init: async () => {
        try {
            // Wait for Firebase to be initialized
            if (!firebase || !firebase.firestore) {
                console.error('Firebase is not initialized');
                return;
            }
            
            // Get database instance
            BlogData.db = firebase.firestore();
            
            // Get storage instance
            BlogData.storage = firebase.storage();
            
            // Initialize caches
            await BlogData.initializeCache();
            
            // Initialize sample data if needed
            await BlogData.initializeSampleData();
            
            console.log('Data module initialized');
        } catch (error) {
            console.error('Failed to initialize data module:', error);
        }
    },
    
    /**
     * Initialize cache with categories and tags
     * @return {Promise} Promise that resolves when cache is initialized
     */
    initializeCache: async () => {
        try {
            // Get categories
            const categoriesSnapshot = await BlogData.db.collection('categories').get();
            BlogData.categoriesCache = categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Generate tags from posts
            const tagsSet = new Set();
            const postsSnapshot = await BlogData.db.collection('posts').get();
            
            postsSnapshot.docs.forEach(doc => {
                const post = doc.data();
                if (post.tags && Array.isArray(post.tags)) {
                    post.tags.forEach(tag => tagsSet.add(tag));
                }
            });
            
            BlogData.tagsCache = Array.from(tagsSet);
            
            // Populate the UI with categories and tags
            BlogData.updateCategoriesUI();
            BlogData.updateTagsUI();
        } catch (error) {
            console.error('Error initializing cache:', error);
        }
    },
    
    /**
     * Initialize sample data if the database is empty
     * @return {Promise} Promise that resolves when sample data is initialized
     */
    initializeSampleData: async () => {
        try {
            // Check if posts collection is empty
            const postsSnapshot = await BlogData.db.collection('posts').limit(1).get();
            
            if (!postsSnapshot.empty) {
                // We already have data, no need to initialize
                return;
            }
            
            console.log('Initializing sample data...');
            
            // Sample categories
            const categories = [
                { name: 'Technology', slug: 'technology', description: 'Tech news and tutorials' },
                { name: 'Design', slug: 'design', description: 'Design inspiration and tips' },
                { name: 'Programming', slug: 'programming', description: 'Programming tutorials and tips' },
                { name: 'Lifestyle', slug: 'lifestyle', description: 'Personal development and lifestyle topics' },
                { name: 'Business', slug: 'business', description: 'Business strategy and entrepreneurship' }
            ];
            
            // Add categories
            for (const category of categories) {
                await BlogData.db.collection('categories').doc(category.slug).set(category);
            }
            
            // Sample authors (use default admin user if available)
            let adminUser = null;
            try {
                const usersSnapshot = await BlogData.db.collection('users').where('role', '==', 'admin').limit(1).get();
                
                if (!usersSnapshot.empty) {
                    adminUser = {
                        id: usersSnapshot.docs[0].id,
                        ...usersSnapshot.docs[0].data()
                    };
                }
            } catch (error) {
                console.error('Error getting admin user:', error);
            }
            
            // Default author if no admin is found
            const defaultAuthor = adminUser || {
                id: 'sample-author',
                displayName: 'John Doe',
                email: 'john@example.com',
                bio: 'Sample author bio',
                photoURL: 'assets/images/default-avatar.svg'
            };
            
            // Sample posts
            const samplePosts = [
                {
                    title: 'Getting Started with Modern JavaScript',
                    slug: 'getting-started-with-modern-javascript',
                    excerpt: 'Learn the basics of modern JavaScript and its ecosystem.',
                    content: `
# Getting Started with Modern JavaScript

JavaScript has evolved dramatically over the years, transforming from a simple scripting language into a powerful tool for building complex applications. In this post, we'll explore the fundamentals of modern JavaScript and how to get started.

## ES6 and Beyond

ECMAScript 6 (ES6), also known as ECMAScript 2015, introduced many features that have become essential for modern JavaScript development:

### Let and Const

Unlike the traditional \`var\`, \`let\` and \`const\` provide block-scoping:

\`\`\`javascript
// Using let for variables that change
let count = 0;
count++; // Now 1

// Using const for variables that shouldn't change
const API_URL = 'https://api.example.com';
// API_URL = 'something else'; // This would throw an error
\`\`\`

### Arrow Functions

Arrow functions provide a concise syntax and lexical \`this\` binding:

\`\`\`javascript
// Traditional function
function add(a, b) {
    return a + b;
}

// Arrow function
const add = (a, b) => a + b;

// With objects and this
const counter = {
    count: 0,
    increment() {
        // The arrow function preserves 'this' from the parent scope
        setInterval(() => {
            this.count++;
            console.log(this.count);
        }, 1000);
    }
};
\`\`\`

### Template Literals

Template literals make string interpolation more readable:

\`\`\`javascript
const name = 'World';
console.log(\`Hello, \${name}!\`); // "Hello, World!"
\`\`\`

## Modern JavaScript Tools

The modern JavaScript ecosystem includes several essential tools:

1. **npm** - The Node Package Manager for installing libraries
2. **webpack** - A module bundler for modern JavaScript applications
3. **Babel** - A JavaScript compiler for using next-gen JavaScript today
4. **ESLint** - A tool for identifying and reporting patterns in JavaScript

## Getting Started with a Project

Here's a simple way to start a modern JavaScript project:

\`\`\`bash
# Create a new directory
mkdir my-project
cd my-project

# Initialize a new npm project
npm init -y

# Install essential dependencies
npm install webpack webpack-cli babel-loader @babel/core @babel/preset-env --save-dev

# Create source files
mkdir src
touch src/index.js
\`\`\`

## Conclusion

Modern JavaScript offers powerful features and a rich ecosystem of tools. By understanding the basics outlined in this post, you're well on your way to building effective JavaScript applications.
                    `,
                    category: 'programming',
                    tags: ['javascript', 'programming', 'web-development'],
                    coverImage: 'assets/images/posts/javascript.jpg',
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
                    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
                    author: {
                        id: defaultAuthor.id,
                        name: defaultAuthor.displayName,
                        profileImage: defaultAuthor.photoURL
                    },
                    featured: true,
                    comments: [],
                    likes: 24,
                    views: 356
                },
                {
                    title: 'Responsive Design Best Practices',
                    slug: 'responsive-design-best-practices',
                    excerpt: 'Learn how to create websites that look great on any device.',
                    content: `
# Responsive Design Best Practices

In today's multi-device world, creating responsive websites that work well on desktops, tablets, and phones is essential. This post covers the best practices for responsive web design.

## Fluid Grids

Use proportional-based grids instead of fixed-width layouts:

\`\`\`css
.container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.column {
    float: left;
    width: 33.33%;
    padding: 15px;
    box-sizing: border-box;
}

@media (max-width: 768px) {
    .column {
        width: 50%;
    }
}

@media (max-width: 480px) {
    .column {
        width: 100%;
    }
}
\`\`\`

## Flexible Images

Ensure images scale correctly within their containers:

\`\`\`css
img {
    max-width: 100%;
    height: auto;
}
\`\`\`

## Media Queries

Use media queries to apply different styles based on the device characteristics:

\`\`\`css
/* Base styles for all devices */
body {
    font-size: 16px;
}

/* Styles for tablets */
@media (max-width: 768px) {
    body {
        font-size: 14px;
    }
}

/* Styles for phones */
@media (max-width: 480px) {
    body {
        font-size: 12px;
    }
}
\`\`\`

## Mobile-First Approach

Start with the mobile design and then progressively enhance for larger screens:

\`\`\`css
/* Base styles for mobile */
.navigation {
    display: none;
}

.mobile-menu {
    display: block;
}

/* Override for larger screens */
@media (min-width: 768px) {
    .navigation {
        display: block;
    }
    
    .mobile-menu {
        display: none;
    }
}
\`\`\`

## Testing Across Devices

Test your design on real devices whenever possible. Tools like BrowserStack or Chrome's Device Mode can help if you don't have access to physical devices.

## Conclusion

Responsive design isn't just about making your website fit different screen sizes—it's about creating an optimal user experience regardless of device. By following these best practices, you'll be well on your way to creating websites that look and function beautifully everywhere.
                    `,
                    category: 'design',
                    tags: ['design', 'responsive', 'css', 'web-development'],
                    coverImage: 'assets/images/posts/responsive.jpg',
                    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
                    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
                    author: {
                        id: defaultAuthor.id,
                        name: defaultAuthor.displayName,
                        profileImage: defaultAuthor.photoURL
                    },
                    featured: true,
                    comments: [],
                    likes: 38,
                    views: 412
                },
                {
                    title: 'Introduction to Machine Learning',
                    slug: 'introduction-to-machine-learning',
                    excerpt: 'A beginner-friendly guide to machine learning concepts.',
                    content: `
# Introduction to Machine Learning

Machine learning is transforming industries around the world. This guide introduces you to the fundamental concepts and approaches in machine learning.

## What is Machine Learning?

Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. The system learns patterns from data and makes decisions with minimal human intervention.

## Types of Machine Learning

### Supervised Learning

The algorithm learns from labeled training data:

\`\`\`python
# Simple linear regression example with scikit-learn
from sklearn.linear_model import LinearRegression
import numpy as np

# Sample data: hours studied vs. exam score
X = np.array([[1], [2], [3], [4], [5]])  # Hours studied
y = np.array([60, 70, 75, 82, 90])        # Exam scores

# Create and train the model
model = LinearRegression()
model.fit(X, y)

# Predict score for 6 hours of study
prediction = model.predict([[6]])
print(f"Predicted score for 6 hours of study: {prediction[0]:.2f}")
\`\`\`

### Unsupervised Learning

The algorithm finds patterns in unlabeled data:

\`\`\`python
# K-means clustering example
from sklearn.cluster import KMeans
import numpy as np

# Sample customer data (spending, frequency)
X = np.array([
    [10, 2], [15, 3], [20, 1], [50, 3], [45, 4], [55, 2]
])

# Create and fit the model
kmeans = KMeans(n_clusters=2)
kmeans.fit(X)

# Get cluster labels
clusters = kmeans.labels_
print("Customer segments:", clusters)
\`\`\`

### Reinforcement Learning

The algorithm learns by interacting with an environment and receiving rewards:

\`\`\`python
# Conceptual example of Q-learning
import numpy as np

# Initialize Q-table for a simple 4x4 grid world
q_table = np.zeros([16, 4])  # 16 states, 4 actions (up, right, down, left)

# Q-learning parameters
alpha = 0.1     # Learning rate
gamma = 0.9     # Discount factor
epsilon = 0.1   # Exploration rate

# Learning loop (pseudocode)
# for episode in range(1000):
#     state = get_initial_state()
#     while not done:
#         if random() < epsilon:
#             action = random_action()  # Explore
#         else:
#             action = action_with_max_q_value(state)  # Exploit
#         
#         next_state, reward, done = take_action(action)
#         
#         # Update Q-value
#         old_value = q_table[state, action]
#         next_max = np.max(q_table[next_state])
#         new_value = (1 - alpha) * old_value + alpha * (reward + gamma * next_max)
#         q_table[state, action] = new_value
#         
#         state = next_state
\`\`\`

## Common Algorithms

1. **Linear Regression** - For predicting continuous values
2. **Logistic Regression** - For binary classification problems
3. **Decision Trees** - For classification and regression
4. **Random Forests** - Ensemble of decision trees
5. **Support Vector Machines** - For classification and regression
6. **Neural Networks** - For complex pattern recognition

## Getting Started

If you're new to machine learning, here's how to begin:

1. **Learn the basics of Python** - It's the most popular language for ML
2. **Study statistics and probability** - The foundation of ML algorithms
3. **Start with scikit-learn** - A user-friendly library for beginners
4. **Work on sample datasets** - Kaggle offers many datasets with tutorials
5. **Build simple projects** - Apply what you've learned to real problems

## Conclusion

Machine learning is a powerful tool that continues to evolve. By understanding these fundamental concepts, you're taking the first step toward harnessing its potential.
                    `,
                    category: 'technology',
                    tags: ['machine-learning', 'technology', 'programming', 'ai'],
                    coverImage: 'assets/images/posts/machine-learning.jpg',
                    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
                    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days ago
                    author: {
                        id: defaultAuthor.id,
                        name: defaultAuthor.displayName,
                        profileImage: defaultAuthor.photoURL
                    },
                    featured: false,
                    comments: [],
                    likes: 42,
                    views: 520
                },
                {
                    title: 'Productivity Tips for Developers',
                    slug: 'productivity-tips-for-developers',
                    excerpt: 'Boost your productivity with these practical tips for software developers.',
                    content: `
# Productivity Tips for Developers

As a developer, your time and focus are precious resources. Here are some practical tips to boost your productivity and work more efficiently.

## Optimize Your Environment

### Keyboard Shortcuts

Learning keyboard shortcuts for your editor can save you hours over time:

**VS Code Essential Shortcuts:**
- \`Ctrl+P\` / \`Cmd+P\`: Quick file navigation
- \`Ctrl+Shift+F\` / \`Cmd+Shift+F\`: Search across all files
- \`Alt+Up/Down\` / \`Option+Up/Down\`: Move line up/down
- \`Ctrl+D\` / \`Cmd+D\`: Select next occurrence of current selection

### Multiple Monitors

If possible, use multiple monitors:
- Primary screen for coding
- Secondary screen for documentation or testing

### Terminal Setup

Customize your terminal with helpful aliases:

\`\`\`bash
# Git shortcuts
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'

# Navigation shortcuts
alias ..='cd ..'
alias ...='cd ../..'
\`\`\`

## Time Management

### The Pomodoro Technique

Break work into focused intervals:
1. Work for 25 minutes
2. Take a 5-minute break
3. After 4 cycles, take a longer 15-30 minute break

\`\`\`javascript
// Simple Pomodoro timer in JavaScript
function startPomodoro() {
    let workMinutes = 25;
    let seconds = 0;
    
    const timer = setInterval(() => {
        if (seconds === 0) {
            if (workMinutes === 0) {
                console.log("Time for a break!");
                clearInterval(timer);
                return;
            }
            workMinutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        
        console.log(\`\${workMinutes}:\${seconds < 10 ? '0' + seconds : seconds}\`);
    }, 1000);
}
\`\`\`

### Time Blocking

Schedule specific blocks of time for different types of work:
- Deep work (coding, problem-solving)
- Meetings and communication
- Learning and research
- Administrative tasks

## Automation

### Scripts for Repetitive Tasks

Create scripts for tasks you perform regularly:

\`\`\`python
# Example: Script to set up a new project
import os
import sys

def create_project(name):
    folders = ['src', 'tests', 'docs', 'config']
    
    # Create project directory
    os.makedirs(name)
    os.chdir(name)
    
    # Create subdirectories
    for folder in folders:
        os.makedirs(folder)
    
    # Create basic files
    with open('README.md', 'w') as f:
        f.write(f'# {name}\\n\\nA new project.')
    
    with open('.gitignore', 'w') as f:
        f.write('node_modules/\\n.env\\n*.log')
    
    print(f'Project {name} created successfully!')

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: create_project.py PROJECT_NAME')
    else:
        create_project(sys.argv[1])
\`\`\`

### Code Snippets

Use code snippets in your editor for commonly used patterns:

\`\`\`json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "import React from 'react';",
      "",
      "const $1 = ({ $2 }) => {",
      "  return (",
      "    <div>",
      "      $0",
      "    </div>",
      "  );",
      "};",
      "",
      "export default $1;"
    ],
    "description": "React Functional Component"
  }
}
\`\`\`

## Minimize Distractions

### Notification Management

- Set specific times to check email and messages
- Use "Do Not Disturb" mode during focused work
- Consider tools like [Freedom](https://freedom.to/) to block distracting websites

### Workspace Organization

- Keep your desk clean and organized
- Use a minimalist desktop background
- Close unnecessary browser tabs and applications

## Continuous Learning

### Deliberate Practice

Allocate time for deliberate practice:
- Solve algorithm challenges on platforms like LeetCode
- Build small projects to learn new technologies
- Contribute to open source projects

### Knowledge Management

Create a personal knowledge base:
- Use tools like Notion, Obsidian, or a simple GitHub repo
- Document solutions to problems you've solved
- Save useful code snippets and resources

## Conclusion

Productivity isn't about working longer hours—it's about working smarter. By optimizing your environment, managing your time effectively, automating repetitive tasks, minimizing distractions, and continuously learning, you can significantly boost your productivity as a developer.
                    `,
                    category: 'programming',
                    tags: ['productivity', 'programming', 'developer-tips'],
                    coverImage: 'assets/images/posts/productivity.jpg',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
                    author: {
                        id: defaultAuthor.id,
                        name: defaultAuthor.displayName,
                        profileImage: defaultAuthor.photoURL
                    },
                    featured: true,
                    comments: [],
                    likes: 17,
                    views: 203
                },
                {
                    title: 'Building a Personal Brand as a Developer',
                    slug: 'building-a-personal-brand-as-a-developer',
                    excerpt: 'Learn why and how to build your personal brand in the tech industry.',
                    content: `
# Building a Personal Brand as a Developer

In today's competitive tech landscape, building a personal brand can help you stand out, attract opportunities, and advance your career. This guide explores how to develop your personal brand as a developer.

## Why Personal Branding Matters

A strong personal brand can:
- Make you more visible to potential employers and clients
- Position you as an authority in your niche
- Create a network of valuable connections
- Open doors to speaking engagements, writing opportunities, and more

## Identifying Your Unique Value

### Find Your Niche

Consider what makes you unique:
- Do you have expertise in a specific technology?
- Have you solved interesting problems in a particular industry?
- Do you bring a unique perspective to technical challenges?

### Define Your Core Message

What do you want to be known for? For example:
- "Making complex cloud architecture simple for startups"
- "Bridging the gap between design and development"
- "Building sustainable, maintainable code for the long term"

## Building Your Online Presence

### Create a Professional Website

Your website is your digital home base:

\`\`\`html
<!-- Example of a simple developer portfolio hero section -->
<section class="hero">
  <div class="container">
    <h1>Jane Doe</h1>
    <h2>Full-Stack Developer specializing in React & Node.js</h2>
    <p>I build scalable web applications that solve real business problems.</p>
    <div class="cta-buttons">
      <a href="#projects" class="btn primary">View My Work</a>
      <a href="#contact" class="btn secondary">Get In Touch</a>
    </div>
  </div>
</section>
\`\`\`

Key elements to include:
- Clean, professional design
- Portfolio of projects with case studies
- Blog section for sharing knowledge
- About page that tells your story
- Clear contact information

### Content Creation

Share your knowledge through:

1. **Blog posts** - Technical tutorials, case studies, or industry insights
2. **Open source contributions** - Showcase your code and collaborate with others
3. **Social media** - Share insights and engage with the community
4. **Videos or podcasts** - Demonstrate complex concepts or interview other experts

### GitHub Profile

Your GitHub profile is your technical resume:

\`\`\`markdown
# GitHub Profile README.md Example

## Hi there 👋 I'm Jane Doe

I'm a full-stack developer passionate about building scalable web applications and sharing what I learn.

### 🔭 Current Projects
- Building a React component library for e-commerce
- Contributing to TensorFlow.js documentation
- Weekend project: Spotify playlist analyzer

### 💻 Tech Stack
- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, MongoDB
- DevOps: Docker, AWS, GitHub Actions

### 📫 Get In Touch
- Personal website: [janedoe.dev](https://janedoe.dev)
- Twitter: [@jane_codes](https://twitter.com/jane_codes)
- LinkedIn: [Jane Doe](https://linkedin.com/in/janedoe)
\`\`\`

## Engaging with the Community

### Contribute to Open Source

- Fix bugs or add features to projects you use
- Create documentation or tutorials
- Start your own open source projects

### Attend and Speak at Events

- Participate in local meetups and hackathons
- Present at conferences (start with lightning talks)
- Join online communities and webinars

### Network Meaningfully

- Focus on building genuine relationships
- Offer help before asking for favors
- Follow up after meetings and events

## Consistency is Key

### Create a Content Calendar

Plan your content in advance:
- Weekly: Social media posts
- Bi-weekly: Blog articles
- Monthly: In-depth tutorials or case studies
- Quarterly: Major projects or speaking engagements

### Track Your Progress

Monitor key metrics:
- Website traffic and engagement
- Social media following and interaction
- Speaking and writing opportunities
- Job offers and client inquiries

## Conclusion

Building a personal brand takes time and consistent effort, but the rewards are well worth it. By sharing your knowledge, engaging with the community, and showcasing your work, you'll create opportunities that might otherwise never come your way.

Remember that the most effective personal brand is authentic to who you are and the value you provide. Focus on helping others and demonstrating your expertise, and your reputation will naturally grow.
                    `,
                    category: 'business',
                    tags: ['career', 'personal-brand', 'networking'],
                    coverImage: 'assets/images/posts/personal-brand.jpg',
                    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
                    updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days ago
                    author: {
                        id: defaultAuthor.id,
                        name: defaultAuthor.displayName,
                        profileImage: defaultAuthor.photoURL
                    },
                    featured: false,
                    comments: [],
                    likes: 29,
                    views: 348
                }
            ];
            
            // Add sample posts
            for (const post of samplePosts) {
                await BlogData.db.collection('posts').doc(post.slug).set(post);
            }
            
            console.log('Sample data initialized successfully');
            
            // Update cache after initializing sample data
            await BlogData.initializeCache();
            
            return true;
        } catch (error) {
            console.error('Error initializing sample data:', error);
            return false;
        }
    },
    
    /**
     * Update categories in the UI
     */
    updateCategoriesUI: () => {
        const categoriesMenu = document.getElementById('categories-menu');
        const footerCategories = document.getElementById('footer-categories');
        
        if (!BlogData.categoriesCache.length) return;
        
        // Update header categories menu
        if (categoriesMenu) {
            categoriesMenu.innerHTML = '';
            
            BlogData.categoriesCache.forEach(category => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `pages/category.html?slug=${category.slug}`;
                a.textContent = category.name;
                li.appendChild(a);
                categoriesMenu.appendChild(li);
            });
        }
        
        // Update footer categories
        if (footerCategories) {
            footerCategories.innerHTML = '';
            
            BlogData.categoriesCache.forEach(category => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `pages/category.html?slug=${category.slug}`;
                a.textContent = category.name;
                li.appendChild(a);
                footerCategories.appendChild(li);
            });
        }
    },
    
    /**
     * Update tags in the UI
     */
    updateTagsUI: () => {
        const popularTags = document.getElementById('popular-tags');
        
        if (!BlogData.tagsCache.length || !popularTags) return;
        
        // Get top 5 tags (in a real app, these would be sorted by popularity)
        const topTags = BlogData.tagsCache.slice(0, 5);
        
        popularTags.innerHTML = '';
        
        // Add "All" tag
        const allTag = document.createElement('a');
        allTag.href = '#';
        allTag.className = 'tag tag-filter active';
        allTag.setAttribute('data-tag', 'all');
        allTag.textContent = 'All';
        popularTags.appendChild(allTag);
        
        // Add top tags
        topTags.forEach(tag => {
            const tagElement = document.createElement('a');
            tagElement.href = '#';
            tagElement.className = 'tag tag-filter';
            tagElement.setAttribute('data-tag', tag);
            tagElement.textContent = tag;
            popularTags.appendChild(tagElement);
        });
        
        // Re-attach event listeners (using event delegation)
        popularTags.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-filter')) {
                e.preventDefault();
                const tag = e.target.getAttribute('data-tag');
                BlogUI.filterPostsByTag(tag);
            }
        });
    },
    
    /**
     * Fetch featured posts
     * @param {number} limit - Maximum number of posts to fetch
     * @return {Promise<Array>} Promise that resolves with an array of posts
     */
    getFeaturedPosts: async (limit = 3) => {
        try {
            const postsRef = BlogData.db.collection('posts');
            const query = postsRef.where('featured', '==', true).orderBy('createdAt', 'desc').limit(limit);
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching featured posts:', error);
            return [];
        }
    },
    
    /**
     * Fetch recent posts
     * @param {number} limit - Maximum number of posts to fetch
     * @return {Promise<Array>} Promise that resolves with an array of posts
     */
    getRecentPosts: async (limit = 6) => {
        try {
            const postsRef = BlogData.db.collection('posts');
            const query = postsRef.orderBy('createdAt', 'desc').limit(limit);
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching recent posts:', error);
            return [];
        }
    },
    
    /**
     * Fetch posts by category
     * @param {string} category - Category slug
     * @param {number} limit - Maximum number of posts to fetch
     * @return {Promise<Array>} Promise that resolves with an array of posts
     */
    getPostsByCategory: async (category, limit = 10) => {
        try {
            const postsRef = BlogData.db.collection('posts');
            const query = postsRef.where('category', '==', category).orderBy('createdAt', 'desc').limit(limit);
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error fetching posts for category ${category}:`, error);
            return [];
        }
    },
    
    /**
     * Fetch posts by tag
     * @param {string} tag - Tag name
     * @param {number} limit - Maximum number of posts to fetch
     * @return {Promise<Array>} Promise that resolves with an array of posts
     */
    getPostsByTag: async (tag, limit = 10) => {
        try {
            const postsRef = BlogData.db.collection('posts');
            const query = postsRef.where('tags', 'array-contains', tag).orderBy('createdAt', 'desc').limit(limit);
            
            const snapshot = await query.get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`Error fetching posts for tag ${tag}:`, error);
            return [];
        }
    },
    
    /**
     * Search posts
     * @param {string} query - Search query
     * @param {number} limit - Maximum number of posts to fetch
     * @return {Promise<Array>} Promise that resolves with an array of posts
     */
    searchPosts: async (query, limit = 10) => {
        try {
            // Note: Firestore doesn't support full-text search natively
            // This is a simple implementation that searches titles and content
            // For a real app, consider using Algolia, Elasticsearch, or Firebase Cloud Functions
            
            const postsRef = BlogData.db.collection('posts');
            const snapshot = await postsRef.orderBy('createdAt', 'desc').limit(limit * 3).get();
            
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
            
            const results = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(post => {
                    const titleLower = post.title.toLowerCase();
                    const contentLower = post.content.toLowerCase();
                    const excerptLower = post.excerpt ? post.excerpt.toLowerCase() : '';
                    
                    return searchTerms.some(term => 
                        titleLower.includes(term) || 
                        contentLower.includes(term) || 
                        excerptLower.includes(term)
                    );
                })
                .slice(0, limit);
            
            return results;
        } catch (error) {
            console.error(`Error searching posts for query ${query}:`, error);
            return [];
        }
    },
    
    /**
     * Get a single post by slug
     * @param {string} slug - Post slug
     * @return {Promise<Object|null>} Promise that resolves with the post object or null if not found
     */
    getPostBySlug: async (slug) => {
        try {
            // Check cache first
            if (BlogData.postsCache[slug]) {
                return BlogData.postsCache[slug];
            }
            
            const postDoc = await BlogData.db.collection('posts').doc(slug).get();
            
            if (!postDoc.exists) {
                return null;
            }
            
            const post = { id: postDoc.id, ...postDoc.data() };
            
            // Cache the post
            BlogData.postsCache[slug] = post;
            
            return post;
        } catch (error) {
            console.error(`Error fetching post with slug ${slug}:`, error);
            return null;
        }
    },
    
    /**
     * Create a new post
     * @param {Object} postData - Post data
     * @return {Promise<string|null>} Promise that resolves with the new post ID or null if failed
     */
    createPost: async (postData) => {
        try {
            if (!BlogAuth.currentUser) {
                throw new Error('You must be logged in to create a post');
            }
            
            if (!BlogAuth.hasRole(BlogAuth.roles.WRITER)) {
                throw new Error('You do not have permission to create posts');
            }
            
            // Generate slug from title if not provided
            if (!postData.slug) {
                postData.slug = BlogUtils.generateSlug(postData.title);
            }
            
            // Add author information
            postData.author = {
                id: BlogAuth.currentUser.uid,
                name: BlogAuth.currentUser.displayName,
                profileImage: BlogAuth.currentUser.photoURL
            };
            
            // Add timestamps
            const now = new Date().toISOString();
            postData.createdAt = now;
            postData.updatedAt = now;
            
            // Initialize other fields
            postData.comments = [];
            postData.likes = 0;
            postData.views = 0;
            
            // Upload cover image if it's a File object
            if (postData.coverImage instanceof File) {
                const imageUrl = await BlogData.uploadImage(postData.coverImage, `posts/${postData.slug}`);
                postData.coverImage = imageUrl;
            }
            
            // Save the post
            await BlogData.db.collection('posts').doc(postData.slug).set(postData);
            
            // Cache the new post
            BlogData.postsCache[postData.slug] = { id: postData.slug, ...postData };
            
            // Extract tags and update tags cache
            if (postData.tags && Array.isArray(postData.tags)) {
                postData.tags.forEach(tag => {
                    if (!BlogData.tagsCache.includes(tag)) {
                        BlogData.tagsCache.push(tag);
                    }
                });
                
                // Update tags UI
                BlogData.updateTagsUI();
            }
            
            return postData.slug;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    },
    
    /**
     * Update an existing post
     * @param {string} slug - Post slug
     * @param {Object} postData - Updated post data
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    updatePost: async (slug, postData) => {
        try {
            if (!BlogAuth.currentUser) {
                throw new Error('You must be logged in to update a post');
            }
            
            // Get the existing post
            const existingPost = await BlogData.getPostBySlug(slug);
            
            if (!existingPost) {
                throw new Error('Post not found');
            }
            
            // Check permissions
            const isAuthor = existingPost.author.id === BlogAuth.currentUser.uid;
            const isAdmin = BlogAuth.hasRole(BlogAuth.roles.ADMIN);
            
            if (!isAuthor && !isAdmin) {
                throw new Error('You do not have permission to update this post');
            }
            
            // Upload cover image if it's a File object
            if (postData.coverImage instanceof File) {
                const imageUrl = await BlogData.uploadImage(postData.coverImage, `posts/${slug}`);
                postData.coverImage = imageUrl;
            }
            
            // Update timestamp
            postData.updatedAt = new Date().toISOString();
            
            // Update the post
            await BlogData.db.collection('posts').doc(slug).update(postData);
            
            // Update cache
            if (BlogData.postsCache[slug]) {
                BlogData.postsCache[slug] = { ...BlogData.postsCache[slug], ...postData };
            }
            
            // Extract tags and update tags cache
            if (postData.tags && Array.isArray(postData.tags)) {
                postData.tags.forEach(tag => {
                    if (!BlogData.tagsCache.includes(tag)) {
                        BlogData.tagsCache.push(tag);
                    }
                });
                
                // Update tags UI
                BlogData.updateTagsUI();
            }
            
            return true;
        } catch (error) {
            console.error(`Error updating post ${slug}:`, error);
            throw error;
        }
    },
    
    /**
     * Delete a post
     * @param {string} slug - Post slug
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    deletePost: async (slug) => {
        try {
            if (!BlogAuth.currentUser) {
                throw new Error('You must be logged in to delete a post');
            }
            
            // Get the existing post
            const existingPost = await BlogData.getPostBySlug(slug);
            
            if (!existingPost) {
                throw new Error('Post not found');
            }
            
            // Check permissions
            const isAuthor = existingPost.author.id === BlogAuth.currentUser.uid;
            const isAdmin = BlogAuth.hasRole(BlogAuth.roles.ADMIN);
            
            if (!isAuthor && !isAdmin) {
                throw new Error('You do not have permission to delete this post');
            }
            
            // Delete the post
            await BlogData.db.collection('posts').doc(slug).delete();
            
            // Remove from cache
            if (BlogData.postsCache[slug]) {
                delete BlogData.postsCache[slug];
            }
            
            return true;
        } catch (error) {
            console.error(`Error deleting post ${slug}:`, error);
            throw error;
        }
    },
    
    /**
     * Add a comment to a post
     * @param {string} slug - Post slug
     * @param {string} content - Comment content
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    addComment: async (slug, content) => {
        try {
            if (!BlogAuth.currentUser) {
                throw new Error('You must be logged in to add a comment');
            }
            
            if (!content || !content.trim()) {
                throw new Error('Comment content cannot be empty');
            }
            
            const comment = {
                id: BlogUtils.generateUniqueId('comment-'),
                content: content.trim(),
                createdAt: new Date().toISOString(),
                author: {
                    id: BlogAuth.currentUser.uid,
                    name: BlogAuth.currentUser.displayName,
                    profileImage: BlogAuth.currentUser.photoURL
                }
            };
            
            // Get the post
            const postRef = BlogData.db.collection('posts').doc(slug);
            
            // Add the comment to the post's comments array
            await postRef.update({
                comments: firebase.firestore.FieldValue.arrayUnion(comment)
            });
            
            // Update cache if the post is cached
            if (BlogData.postsCache[slug]) {
                if (!BlogData.postsCache[slug].comments) {
                    BlogData.postsCache[slug].comments = [];
                }
                BlogData.postsCache[slug].comments.push(comment);
            }
            
            return true;
        } catch (error) {
            console.error(`Error adding comment to post ${slug}:`, error);
            throw error;
        }
    },
    
    /**
     * Delete a comment from a post
     * @param {string} slug - Post slug
     * @param {string} commentId - Comment ID
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    deleteComment: async (slug, commentId) => {
        try {
            if (!BlogAuth.currentUser) {
                throw new Error('You must be logged in to delete a comment');
            }
            
            // Get the post
            const post = await BlogData.getPostBySlug(slug);
            
            if (!post || !post.comments) {
                throw new Error('Post or comment not found');
            }
            
            // Find the comment
            const comment = post.comments.find(c => c.id === commentId);
            
            if (!comment) {
                throw new Error('Comment not found');
            }
            
            // Check permissions
            const isCommentAuthor = comment.author.id === BlogAuth.currentUser.uid;
            const isPostAuthor = post.author.id === BlogAuth.currentUser.uid;
            const isAdmin = BlogAuth.hasRole(BlogAuth.roles.ADMIN);
            
            if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
                throw new Error('You do not have permission to delete this comment');
            }
            
            // Remove the comment
            const updatedComments = post.comments.filter(c => c.id !== commentId);
            
            // Update the post
            await BlogData.db.collection('posts').doc(slug).update({
                comments: updatedComments
            });
            
            // Update cache if the post is cached
            if (BlogData.postsCache[slug]) {
                BlogData.postsCache[slug].comments = updatedComments;
            }
            
            return true;
        } catch (error) {
            console.error(`Error deleting comment ${commentId} from post ${slug}:`, error);
            throw error;
        }
    },
    
    /**
     * Like or unlike a post
     * @param {string} slug - Post slug
     * @param {boolean} like - True to like, false to unlike
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    toggleLike: async (slug, like = true) => {
        try {
            if (!BlogAuth.currentUser) {
                throw new Error('You must be logged in to like a post');
            }
            
            const userId = BlogAuth.currentUser.uid;
            const postRef = BlogData.db.collection('posts').doc(slug);
            const likeRef = BlogData.db.collection('likes').doc(`${slug}_${userId}`);
            
            // Check if the user has already liked the post
            const likeDoc = await likeRef.get();
            const hasLiked = likeDoc.exists;
            
            // If the action matches the current state, do nothing
            if ((like && hasLiked) || (!like && !hasLiked)) {
                return true;
            }
            
            // Start a batch operation
            const batch = BlogData.db.batch();
            
            if (like) {
                // Add like document
                batch.set(likeRef, {
                    userId,
                    postId: slug,
                    createdAt: new Date().toISOString()
                });
                
                // Increment post likes count
                batch.update(postRef, {
                    likes: firebase.firestore.FieldValue.increment(1)
                });
            } else {
                // Remove like document
                batch.delete(likeRef);
                
                // Decrement post likes count
                batch.update(postRef, {
                    likes: firebase.firestore.FieldValue.increment(-1)
                });
            }
            
            // Commit the batch
            await batch.commit();
            
            // Update cache if the post is cached
            if (BlogData.postsCache[slug]) {
                const currentLikes = BlogData.postsCache[slug].likes || 0;
                BlogData.postsCache[slug].likes = like ? currentLikes + 1 : Math.max(0, currentLikes - 1);
            }
            
            return true;
        } catch (error) {
            console.error(`Error toggling like for post ${slug}:`, error);
            throw error;
        }
    },
    
    /**
     * Check if a user has liked a post
     * @param {string} slug - Post slug
     * @return {Promise<boolean>} Promise that resolves with like status
     */
    hasLiked: async (slug) => {
        try {
            if (!BlogAuth.currentUser) {
                return false;
            }
            
            const userId = BlogAuth.currentUser.uid;
            const likeRef = BlogData.db.collection('likes').doc(`${slug}_${userId}`);
            
            const likeDoc = await likeRef.get();
            return likeDoc.exists;
        } catch (error) {
            console.error(`Error checking like status for post ${slug}:`, error);
            return false;
        }
    },
    
    /**
     * Increment post view count
     * @param {string} slug - Post slug
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    incrementViews: async (slug) => {
        try {
            const postRef = BlogData.db.collection('posts').doc(slug);
            
            await postRef.update({
                views: firebase.firestore.FieldValue.increment(1)
            });
            
            // Update cache if the post is cached
            if (BlogData.postsCache[slug]) {
                const currentViews = BlogData.postsCache[slug].views || 0;
                BlogData.postsCache[slug].views = currentViews + 1;
            }
            
            return true;
        } catch (error) {
            console.error(`Error incrementing views for post ${slug}:`, error);
            return false;
        }
    },
    
    /**
     * Upload an image to Firebase Storage
     * @param {File} file - The image file to upload
     * @param {string} path - Storage path
     * @return {Promise<string>} Promise that resolves with the image URL
     */
    uploadImage: async (file, path = 'images') => {
        try {
            if (!file || !(file instanceof File)) {
                throw new Error('Invalid file');
            }
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }
            
            // Generate a unique filename
            const fileExtension = file.name.split('.').pop();
            const fileName = `${BlogUtils.generateUniqueId()}.${fileExtension}`;
            const storagePath = `${path}/${fileName}`;
            
            // Create storage reference
            const storageRef = BlogData.storage.ref();
            const fileRef = storageRef.child(storagePath);
            
            // Upload file
            const snapshot = await fileRef.put(file);
            
            // Get download URL
            const downloadUrl = await snapshot.ref.getDownloadURL();
            
            return downloadUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    },
    
    /**
     * Subscribe to newsletter
     * @param {string} email - Email address
     * @return {Promise<boolean>} Promise that resolves with success status
     */
    subscribeToNewsletter: async (email) => {
        try {
            if (!email || !BlogUtils.isValidEmail(email)) {
                throw new Error('Invalid email address');
            }
            
            // Check if already subscribed
            const subscriberRef = BlogData.db.collection('newsletter').doc(email);
            const subscriberDoc = await subscriberRef.get();
            
            if (subscriberDoc.exists) {
                return true; // Already subscribed
            }
            
            // Add to subscribers
            await subscriberRef.set({
                email,
                subscribedAt: new Date().toISOString(),
                active: true
            });
            
            return true;
        } catch (error) {
            console.error('Error subscribing to newsletter:', error);
            throw error;
        }
    },
    
    /**
     * Render posts to the UI
     * @param {Array} posts - Array of post objects
     * @param {string} containerId - ID of the container element
     * @param {boolean} isFeatured - Whether these are featured posts
     */
    renderPosts: (posts, containerId, isFeatured = false) => {
        const container = document.getElementById(containerId);
        
        if (!container || !posts || !posts.length) return;
        
        // Clear any skeleton loaders
        container.innerHTML = '';
        
        // Render each post
        posts.forEach(post => {
            const postCard = BlogUI.createPostCard(post, isFeatured);
            if (postCard) {
                container.appendChild(postCard);
            }
        });
    }
};

// Initialize data module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', BlogData.init);
