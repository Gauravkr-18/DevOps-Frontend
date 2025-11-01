// API Configuration - Smart detection for local vs production
const API_BASE_URL = (() => {
    // Check if we're in development (localhost or file://)
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.protocol === 'file:') {
        console.log('Development mode detected - using local backend');
        return 'http://127.0.0.1:8000/api';
    }
    
    // Production: Use configured backend URL or fallback
    const backendUrl = window.BACKEND_URL || 'http://65.1.93.203:8000/api';
    console.log('Production mode detected - using backend:', backendUrl);
    return backendUrl;
})();

// Log configuration for debugging
console.log('Frontend Configuration:');
console.log('   Frontend URL:', window.location.origin);
console.log('   Backend API:', API_BASE_URL);
console.log('   Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');

// State Management
let currentUser = null;
let authToken = null;
let workshops = [];
let categories = [];
let currentCategory = 'all';
let currentDifficulty = '';
let searchQuery = '';
let currentWorkshopForReview = null;
let passwordResetToken = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCategories();
    loadWorkshops();
    setupEventListeners();
});

// Check if user is logged in
function checkAuth() {
    authToken = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (authToken && userData) {
        currentUser = JSON.parse(userData);
        updateUIForLoggedInUser();
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    document.getElementById('navAuth').style.display = 'none';
    document.getElementById('navUser').style.display = 'flex';
    document.getElementById('dashboardLink').style.display = 'block';
    document.getElementById('wishlistLink').style.display = 'block';
    document.getElementById('userName').textContent = `Hello, ${currentUser.username}!`;
}

// Update UI for logged out user
function updateUIForLoggedOutUser() {
    document.getElementById('navAuth').style.display = 'flex';
    document.getElementById('navUser').style.display = 'none';
    document.getElementById('dashboardLink').style.display = 'none';
    document.getElementById('wishlistLink').style.display = 'none';
    showPage('home');
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
        });
    });

    // Auth Buttons
    document.getElementById('loginBtn').addEventListener('click', () => openModal('loginModal'));
    document.getElementById('signupBtn').addEventListener('click', () => openModal('signupModal'));
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Modal Close Buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.dataset.modal);
        });
    });

    // Modal Switch Links
    document.getElementById('switchToSignup').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('signupModal');
    });

    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('signupModal');
        openModal('loginModal');
    });

    // Forgot Password Links
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('forgotPasswordModal');
    });

    document.getElementById('backToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('forgotPasswordModal');
        openModal('loginModal');
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
    document.getElementById('resetPasswordForm').addEventListener('submit', handleResetPassword);
    document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);

    // Star Rating
    document.querySelectorAll('#starRating .star').forEach(star => {
        star.addEventListener('click', handleStarClick);
        star.addEventListener('mouseenter', handleStarHover);
    });
    
    document.getElementById('starRating').addEventListener('mouseleave', resetStarHover);

    // Filters
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value;
        filterWorkshops();
    });

    document.getElementById('difficultyFilter').addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        filterWorkshops();
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
}

// Page Navigation
function showPage(pageName) {
    console.log('Navigating to page:', pageName);
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    const targetPage = document.getElementById(`${pageName}Page`);
    if (targetPage) {
        targetPage.classList.add('active');
        console.log('Page activated:', pageName);
    } else {
        console.error('Page not found:', pageName + 'Page');
    }
    
    const targetLink = document.querySelector(`[data-page="${pageName}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }

    if (pageName === 'dashboard') {
        if (!currentUser) {
            openModal('loginModal');
            return;
        }
        loadUserDashboard();
    } else if (pageName === 'wishlist') {
        if (!currentUser) {
            openModal('loginModal');
            return;
        }
        loadWishlist();
    }
}

// Modal Functions
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    // Clear error messages
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeModal('loginModal');
            e.target.reset();
            loadWorkshops(); // Reload to show enrollment status
        } else {
            showError('loginError', result.error || 'Login failed');
        }
    } catch (error) {
        showError('loginError', 'Connection error. Make sure server is running!');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        password: formData.get('password'),
        password2: formData.get('password2')
    };

    if (data.password !== data.password2) {
        showError('signupError', "Passwords don't match!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            authToken = result.token;
            currentUser = result.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userData', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            closeModal('signupModal');
            e.target.reset();
            loadWorkshops();
        } else {
            const errorMsg = Object.values(result).flat().join(', ');
            showError('signupError', errorMsg || 'Registration failed');
        }
    } catch (error) {
        showError('signupError', 'Connection error. Make sure server is running!');
    }
}

async function logout() {
    try {
        if (authToken) {
            await fetch(`${API_BASE_URL}/auth/logout/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    updateUIForLoggedOutUser();
    loadWorkshops(); // Reload to hide enrollment status
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`);
        categories = await response.json();
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render Categories
function renderCategories() {
    const container = document.getElementById('categoryTabs');
    const allBtn = container.querySelector('[data-category="all"]');
    
    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.dataset.category = category.slug;
        btn.textContent = `${category.name}`;
        btn.addEventListener('click', () => selectCategory(category.slug));
        container.appendChild(btn);
    });
}

// Select Category
function selectCategory(categorySlug) {
    currentCategory = categorySlug;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${categorySlug}"]`).classList.add('active');
    filterWorkshops();
}

// Load Workshops
async function loadWorkshops() {
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Token ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/workshops/`, { headers });
        workshops = await response.json();
        filterWorkshops();
    } catch (error) {
        console.error('Error loading workshops:', error);
        document.getElementById('workshopsGrid').innerHTML = 
            '<p class="error-message show">Failed to load workshops. Make sure the server is running!</p>';
    }
}

// Filter Workshops
function filterWorkshops() {
    let filtered = workshops;

    // Filter by category
    if (currentCategory !== 'all') {
        filtered = filtered.filter(w => w.category === categories.find(c => c.slug === currentCategory)?.id);
    }

    // Filter by difficulty
    if (currentDifficulty) {
        filtered = filtered.filter(w => w.difficulty === currentDifficulty);
    }

    // Filter by search
    if (searchQuery) {
        filtered = filtered.filter(w => 
            w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            w.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    renderWorkshops(filtered);
}

// Render Workshops
function renderWorkshops(workshopsToRender) {
    const container = document.getElementById('workshopsGrid');
    const noWorkshops = document.getElementById('noWorkshops');

    if (workshopsToRender.length === 0) {
        container.innerHTML = '';
        noWorkshops.style.display = 'block';
        return;
    }

    noWorkshops.style.display = 'none';
    container.innerHTML = workshopsToRender.map(workshop => {
        const isWishlisted = workshop.is_wishlisted || false;
        const wishlistIcon = isWishlisted ? '♥' : '♡';
        const wishlistClass = isWishlisted ? 'active' : '';
        
        return `
        <div class="workshop-card ${workshop.is_full ? 'workshop-full' : ''}" onclick="showWorkshopDetail('${workshop.slug}')">
            ${currentUser ? `<button class="wishlist-btn ${wishlistClass}" onclick="toggleWishlist(${workshop.id}, event)">
                ${wishlistIcon}
            </button>` : ''}
            <div class="workshop-icon">${getWorkshopIcon(workshop.category_name)}</div>
            <h3 class="workshop-title">${workshop.title}</h3>
            <span class="workshop-category">${workshop.category_name}</span>
            ${workshop.average_rating ? `
                <div class="workshop-rating">
                    <span class="stars">${'★'.repeat(Math.round(workshop.average_rating))}</span>
                    <span class="rating-text">${workshop.average_rating.toFixed(1)} (${workshop.review_count} reviews)</span>
                </div>
            ` : ''}
            <p class="workshop-description">${truncateText(workshop.description, 100)}</p>
            <div class="workshop-meta">
                <span class="meta-item">Duration: ${workshop.duration}</span>
                <span class="meta-item">Instructor: ${workshop.instructor}</span>
                <span class="difficulty-badge difficulty-${workshop.difficulty}">${capitalize(workshop.difficulty)}</span>
            </div>
            <div class="workshop-footer">
                <span class="enrollment-info">
                    ${workshop.enrolled_count}/${workshop.max_students} enrolled
                </span>
                ${workshop.is_full ? '<span class="full-badge">Full</span>' : ''}
                ${workshop.is_enrolled ? '<span class="full-badge" style="background: var(--success)">Enrolled</span>' : ''}
            </div>
        </div>
    `;
    }).join('');
}

// Show Workshop Detail
async function showWorkshopDetail(slug) {
    try {
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Token ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/workshops/${slug}/`, { headers });
        const workshop = await response.json();

        const detailHtml = `
            <div class="workshop-detail-header">
                <div class="workshop-detail-icon">${getWorkshopIcon(workshop.category_name)}</div>
                <div class="workshop-detail-info">
                    <h2>${workshop.title}</h2>
                    <span class="workshop-category">${workshop.category_name}</span>
                    ${workshop.average_rating ? `
                        <div class="workshop-rating" style="margin-top: 0.5rem;">
                            <span class="stars">${'★'.repeat(Math.round(workshop.average_rating))}</span>
                            <span class="rating-text">${workshop.average_rating.toFixed(1)} (${workshop.review_count} reviews)</span>
                        </div>
                    ` : ''}
                    <div class="workshop-meta" style="margin-top: 1rem;">
                        <span class="meta-item">Duration: ${workshop.duration}</span>
                        <span class="meta-item">Instructor: ${workshop.instructor}</span>
                        <span class="difficulty-badge difficulty-${workshop.difficulty}">${capitalize(workshop.difficulty)}</span>
                    </div>
                </div>
            </div>
            <div class="workshop-detail-body">
                <div class="detail-section">
                    <h3>About this Workshop</h3>
                    <p>${workshop.description}</p>
                </div>
                <div class="detail-section">
                    <h3>Enrollment</h3>
                    <p>${workshop.enrolled_count} out of ${workshop.max_students} students enrolled</p>
                </div>
            </div>
            <div class="workshop-actions">
                ${workshop.is_enrolled 
                    ? `
                    <p class="success-message">You are enrolled in this workshop!</p>
                    ${workshop.user_review 
                        ? '<p style="color: var(--text-gray); margin-top: 0.5rem;">You have already reviewed this workshop</p>'
                        : `<button class="btn btn-primary btn-block" style="margin-top: 1rem;" onclick="openReviewModal(${workshop.id}, '${workshop.title}')">Write a Review</button>`
                    }
                    `
                    : workshop.is_full
                    ? '<p class="error-message show">This workshop is full</p>'
                    : currentUser
                    ? `<button class="btn btn-primary btn-block" onclick="enrollInWorkshop(${workshop.id})">Enroll Now (Free)</button>`
                    : '<p class="error-message show">Please login to enroll</p>'
                }
            </div>
        `;

        document.getElementById('workshopDetail').innerHTML = detailHtml;
        openModal('workshopModal');
    } catch (error) {
        console.error('Error loading workshop detail:', error);
    }
}

// Enroll in Workshop
async function enrollInWorkshop(workshopId) {
    if (!authToken) {
        closeModal('workshopModal');
        openModal('loginModal');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ workshop_id: workshopId })
        });

        if (response.ok) {
            closeModal('workshopModal');
            await loadWorkshops();
            alert('Successfully enrolled! Check your dashboard.');
        } else {
            const error = await response.json();
            alert(error.workshop_id?.[0] || 'Enrollment failed');
        }
    } catch (error) {
        alert('Connection error. Please try again.');
    }
}

// Load User Dashboard
async function loadUserDashboard() {
    if (!authToken) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
            headers: { 'Authorization': `Token ${authToken}` }
        });

        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Render Dashboard
function renderDashboard(data) {
    const enrollments = data.enrollments || [];
    const enrolledCount = enrollments.filter(e => e.status === 'enrolled').length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;

    document.getElementById('totalEnrollments').textContent = data.total_enrollments || 0;
    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('activeCount').textContent = enrolledCount;

    const container = document.getElementById('enrolledWorkshops');
    const noEnrollments = document.getElementById('noEnrollments');

    if (enrollments.length === 0) {
        container.style.display = 'none';
        noEnrollments.style.display = 'block';
        return;
    }

    container.style.display = 'grid';
    noEnrollments.style.display = 'none';

    container.innerHTML = enrollments.map(enrollment => `
        <div class="enrolled-card">
            <div class="enrolled-info">
                <h4>${enrollment.workshop.title}</h4>
                <p>${enrollment.workshop.category_name} • ${enrollment.workshop.duration}</p>
                <p><small>Enrolled on ${new Date(enrollment.enrolled_at).toLocaleDateString()}</small></p>
            </div>
            <div class="enrolled-actions">
                <button class="btn btn-outline btn-small" onclick="showWorkshopDetail('${enrollment.workshop.slug}')">
                    View Details
                </button>
                ${enrollment.status === 'enrolled' ? `
                    <button class="btn btn-danger btn-small" onclick="cancelEnrollment(${enrollment.id})">
                        Cancel
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Cancel Enrollment
async function cancelEnrollment(enrollmentId) {
    if (!confirm('Are you sure you want to cancel this enrollment?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollmentId}/cancel/`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            loadUserDashboard();
            loadWorkshops();
        } else {
            alert('Failed to cancel enrollment');
        }
    } catch (error) {
        alert('Connection error. Please try again.');
    }
}

// Utility Functions
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getWorkshopIcon(categoryName) {
    // Category icons removed for cleaner UI
    return '';
}

// Wishlist Functions
async function toggleWishlist(workshopId, event) {
    event.stopPropagation();
    
    if (!currentUser) {
        openModal('loginModal');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/wishlist/toggle/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`
            },
            body: JSON.stringify({ workshop: workshopId })
        });

        if (response.ok) {
            const result = await response.json();
            // Update the wishlist button
            const wishlistBtn = event.target.closest('.wishlist-btn');
            if (wishlistBtn) {
                if (result.action === 'added') {
                    wishlistBtn.classList.add('active');
                    wishlistBtn.textContent = '♥';
                } else {
                    wishlistBtn.classList.remove('active');
                    wishlistBtn.textContent = '♡';
                }
            }
            
            // If we're on wishlist page, reload it
            const wishlistPage = document.getElementById('wishlistPage');
            if (wishlistPage && wishlistPage.classList.contains('active')) {
                loadWishlist();
            } else {
                // Reload workshops to update wishlist status
                loadWorkshops();
            }
        } else {
            const error = await response.json();
            console.error('Error toggling wishlist:', error);
            alert(error.error || 'Failed to update wishlist');
        }
    } catch (error) {
        console.error('Error toggling wishlist:', error);
        alert('Connection error. Please try again.');
    }
}

async function loadWishlist() {
    console.log('Loading wishlist...');
    const emptyState = document.getElementById('emptyWishlist');
    const wishlistGrid = document.getElementById('wishlistGrid');
    
    // Show loading state
    emptyState.innerHTML = '<p>Loading wishlist...</p>';
    emptyState.style.display = 'block';
    wishlistGrid.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE_URL}/wishlist/`, {
            headers: {
                'Authorization': `Token ${authToken}`
            }
        });

        console.log('Wishlist response status:', response.status);
        
        if (response.ok) {
            const wishlistItems = await response.json();
            console.log('Wishlist items:', wishlistItems);
            renderWishlist(wishlistItems);
        } else {
            const error = await response.json();
            console.error('Error response:', error);
            emptyState.innerHTML = '<p class="error-message show">Failed to load wishlist. Please try again.</p>';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading wishlist:', error);
        emptyState.innerHTML = '<p class="error-message show">Connection error. Make sure the server is running!</p>';
        emptyState.style.display = 'block';
    }
}

function renderWishlist(wishlistItems) {
    console.log('Rendering wishlist with', wishlistItems.length, 'items');
    const emptyState = document.getElementById('emptyWishlist');
    const wishlistGrid = document.getElementById('wishlistGrid');

    if (wishlistItems.length === 0) {
        emptyState.innerHTML = '<p>Your wishlist is empty. Add some workshops to get started!</p><button class="btn btn-primary" onclick="showPage(\'home\')">Browse Workshops</button>';
        emptyState.style.display = 'block';
        wishlistGrid.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    wishlistGrid.style.display = 'grid';

    wishlistGrid.innerHTML = wishlistItems.map(item => {
        const workshop = item.workshop;
        return `
            <div class="workshop-card" onclick="showWorkshopDetail('${workshop.slug}')">
                <button class="wishlist-btn active" onclick="toggleWishlist(${workshop.id}, event)">
                    ♥
                </button>
                <div class="workshop-icon">${getWorkshopIcon(workshop.category_name)}</div>
                <div class="workshop-header">
                    <div>
                        <h3 class="workshop-title">${workshop.title}</h3>
                        <span class="workshop-category">${workshop.category_name}</span>
                    </div>
                </div>
                ${workshop.average_rating ? `
                    <div class="workshop-rating">
                        <span class="stars">${'★'.repeat(Math.round(workshop.average_rating))}</span>
                        <span class="rating-text">${workshop.average_rating.toFixed(1)} (${workshop.review_count} reviews)</span>
                    </div>
                ` : ''}
                <p class="workshop-description">${truncateText(workshop.description, 100)}</p>
                <div class="workshop-meta">
                    <span class="meta-item">Instructor: ${workshop.instructor}</span>
                    <span class="meta-item">Duration: ${workshop.duration}</span>
                    <span class="difficulty-badge difficulty-${workshop.difficulty.toLowerCase()}">${capitalize(workshop.difficulty)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Review Functions
function openReviewModal(workshopId, workshopTitle) {
    if (!currentUser) {
        openModal('loginModal');
        return;
    }
    
    currentWorkshopForReview = workshopId;
    document.getElementById('reviewWorkshopTitle').textContent = workshopTitle;
    document.getElementById('ratingValue').value = '';
    document.getElementById('reviewComment').value = '';
    resetStars();
    openModal('reviewModal');
}

function handleStarClick(e) {
    const rating = parseInt(e.target.dataset.rating);
    document.getElementById('ratingValue').value = rating;
    updateStars(rating);
}

function handleStarHover(e) {
    const rating = parseInt(e.target.dataset.rating);
    updateStars(rating);
}

function resetStarHover() {
    const currentRating = parseInt(document.getElementById('ratingValue').value) || 0;
    updateStars(currentRating);
}

function updateStars(rating) {
    document.querySelectorAll('#starRating .star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
}

function resetStars() {
    document.querySelectorAll('#starRating .star').forEach(star => {
        star.classList.remove('active');
        star.textContent = '☆';
    });
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const rating = document.getElementById('ratingValue').value;
    const comment = document.getElementById('reviewComment').value;

    if (!rating) {
        showError('reviewError', 'Please select a rating');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`
            },
            body: JSON.stringify({
                workshop: currentWorkshopForReview,
                rating: parseInt(rating),
                comment: comment
            })
        });

        const result = await response.json();

        if (response.ok) {
            closeModal('reviewModal');
            alert('Review submitted successfully!');
            loadWorkshops(); // Reload to show updated ratings
            loadUserDashboard(); // Reload dashboard if active
        } else {
            showError('reviewError', result.error || 'Failed to submit review');
        }
    } catch (error) {
        showError('reviewError', 'Connection error. Please try again.');
    }
}

// Forgot Password Functions
async function handleForgotPassword(e) {
    e.preventDefault();
    const username = document.getElementById('forgotUsername').value;
    const email = document.getElementById('forgotEmail').value;

    const errorElement = document.getElementById('forgotPasswordError');
    errorElement.textContent = '';

    try {
        const response = await fetch(`${API_BASE_URL}/auth/request-password-reset/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email })
        });

        const result = await response.json();

        if (response.ok) {
            // Store the token and show step 2
            passwordResetToken = result.token;
            document.getElementById('forgotPasswordStep1').style.display = 'none';
            document.getElementById('forgotPasswordStep2').style.display = 'block';
        } else {
            errorElement.textContent = result.error || 'Verification failed';
        }
    } catch (error) {
        errorElement.textContent = 'Connection error. Please try again.';
    }
}

async function handleResetPassword(e) {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    const messageElement = document.getElementById('resetPasswordMessage');
    const errorElement = document.getElementById('resetPasswordError');
    
    messageElement.style.display = 'none';
    errorElement.textContent = '';

    if (newPassword !== confirmPassword) {
        errorElement.textContent = "Passwords don't match!";
        return;
    }

    if (newPassword.length < 6) {
        errorElement.textContent = "Password must be at least 6 characters long";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                token: passwordResetToken,
                new_password: newPassword 
            })
        });

        const result = await response.json();

        if (response.ok) {
            messageElement.textContent = result.message;
            messageElement.style.display = 'block';
            
            // Reset form and show step 1 after 2 seconds, then close modal
            setTimeout(() => {
                document.getElementById('forgotPasswordStep2').style.display = 'none';
                document.getElementById('forgotPasswordStep1').style.display = 'block';
                document.getElementById('forgotPasswordForm').reset();
                document.getElementById('resetPasswordForm').reset();
                passwordResetToken = null;
                closeModal('forgotPasswordModal');
                openModal('loginModal');
            }, 2000);
        } else {
            errorElement.textContent = result.error || 'Password reset failed';
        }
    } catch (error) {
        errorElement.textContent = 'Connection error. Please try again.';
    }
}

console.log('Workshop Enrollment Platform loaded successfully!');
console.log('Make sure Django backend is running on http://127.0.0.1:8000');
