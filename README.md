# Workshop Platform Frontend 🎨

Modern, responsive frontend for the Workshop Platform - providing an intuitive interface for technology workshop discovery and enrollment.

## 🏗️ Architecture

- **Technology**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Styling**: Custom CSS with CSS Grid & Flexbox
- **Deployment**: AWS S3 + CloudFront CDN
- **API Integration**: RESTful communication with Django backend
- **CI/CD**: GitHub Actions

## ✨ Features

- 🎨 **Modern UI/UX** - Clean, responsive design
- 📱 **Mobile Responsive** - Works on all device sizes
- 🔐 **User Authentication** - Login/register functionality
- 📚 **Workshop Discovery** - Browse and search workshops
- 🔍 **Smart Filtering** - Category, difficulty, and search filters
- 📝 **Enrollment System** - Easy workshop enrollment
- ⭐ **Reviews & Ratings** - User feedback display
- 👤 **Profile Management** - User dashboard and settings
- 🚀 **Progressive Enhancement** - Works without JavaScript

## 🚀 Quick Start

### Local Development

1. **Clone & Setup**
   ```bash
   cd frontend
   # Ensure you have the backend running on http://127.0.0.1:8000
   ```

2. **Start Development Server**
   ```bash
   # Option 1: VS Code Live Server
   # Right-click index.html -> "Open with Live Server"
   
   # Option 2: Python HTTP Server
   python -m http.server 8080
   
   # Option 3: Node.js HTTP Server
   npx http-server -p 8080
   ```

3. **Access Application**
   - Frontend: http://localhost:8080 (or your Live Server port)
   - Backend API: http://127.0.0.1:8000/api/

### Smart API Detection
The frontend automatically detects the environment:
- **Local Development**: Uses `http://127.0.0.1:8000`
- **Production**: Uses `https://your-backend-domain.com`

## 🎨 Design System

### Color Palette
```css
:root {
    --primary-color: #3498db;      /* Blue */
    --secondary-color: #2c3e50;    /* Dark Blue */
    --accent-color: #e74c3c;       /* Red */
    --success-color: #27ae60;      /* Green */
    --warning-color: #f39c12;      /* Orange */
    --background: #f8f9fa;         /* Light Gray */
    --text-dark: #2c3e50;          /* Dark Text */
    --text-light: #7f8c8d;        /* Light Text */
}
```

### Typography
- **Headers**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif
- **Body**: System font stack for optimal performance
- **Responsive**: Fluid typography with clamp()

### Layout
- **Desktop**: CSS Grid with sidebar navigation
- **Tablet**: Responsive grid adaptation
- **Mobile**: Stack layout with hamburger menu

## 🛠️ Development

### Project Structure
```
frontend/
├── index.html              # Main HTML file
├── style.css              # Main stylesheet
├── script.js              # Main JavaScript file
├── config.js              # Configuration & API detection
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions CI/CD
└── build/                 # Optional build output
```

### Key Components

#### Authentication System
```javascript
// Login form handling
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
});
```

#### Workshop Display
```javascript
// Dynamic workshop loading
async function loadWorkshops(filters = {}) {
    const workshops = await api.get('/workshops/', filters);
    displayWorkshops(workshops.results);
}
```

#### Responsive Navigation
```javascript
// Mobile menu toggle
function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    nav.classList.toggle('nav-open');
}
```

### Configuration Management
```javascript
// config.js - Smart environment detection
const API_BASE_URL = (() => {
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1') {
        return 'http://127.0.0.1:8000';
    }
    return 'https://your-backend-domain.com';
})();
```

## 🚀 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to S3
1. **Set up GitHub Secrets** (see DEPLOYMENT.md)
2. **Update API Configuration** in config.js
3. **Push to main branch** - automatic deployment via GitHub Actions
4. **Configure CloudFront** - for global CDN distribution

### Build Process
```bash
# No build step required for vanilla JS
# Files are deployed directly to S3
```

### Environment Configuration
```javascript
// Production API endpoint
const PRODUCTION_API = 'https://your-ec2-backend.com';

// Optional: Environment-specific features
const FEATURES = {
    analytics: !isDevelopment,
    errorTracking: !isDevelopment,
    serviceWorker: !isDevelopment
};
```

## 🎯 User Experience

### Performance Features
- **Fast Loading** - Vanilla JS, no frameworks
- **Lazy Loading** - Images and content on demand
- **Local Storage** - User preferences and auth tokens
- **Offline Ready** - Service worker for basic offline functionality
- **SEO Friendly** - Semantic HTML structure

### Accessibility Features
- **ARIA Labels** - Screen reader support
- **Keyboard Navigation** - Full keyboard accessibility
- **Color Contrast** - WCAG AA compliance
- **Focus Management** - Proper focus handling
- **Semantic HTML** - Meaningful markup structure

### User Flow
1. **Landing Page** → Browse workshops without authentication
2. **Registration** → Quick account creation
3. **Workshop Discovery** → Search, filter, and explore
4. **Enrollment** → Simple enrollment process
5. **Dashboard** → Manage enrollments and profile

## 🔌 API Integration

### Authentication Flow
```javascript
// Login and store token
const login = async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    localStorage.setItem('authToken', response.token);
    updateAuthState(true);
};

// Include token in requests
const authenticatedFetch = (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': token ? `Token ${token}` : '',
        }
    });
};
```

### Error Handling
```javascript
// Global error handler
const handleApiError = (error, context) => {
    console.error(`API Error in ${context}:`, error);
    
    if (error.status === 401) {
        // Redirect to login
        logout();
        showError('Please log in to continue');
    } else if (error.status >= 500) {
        showError('Server error. Please try again later.');
    } else {
        showError(error.message || 'An error occurred');
    }
};
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] **Authentication**: Login, logout, registration
- [ ] **Navigation**: All links and menus work
- [ ] **Responsive**: Test on mobile, tablet, desktop
- [ ] **Forms**: All forms submit correctly
- [ ] **API Integration**: Data loads and updates
- [ ] **Error Handling**: Network errors handled gracefully

### Browser Compatibility
- ✅ **Chrome** 80+
- ✅ **Firefox** 75+
- ✅ **Safari** 13+
- ✅ **Edge** 80+
- ⚠️ **IE11** - Basic functionality only

### Performance Testing
```bash
# Lighthouse CI (optional)
npm install -g @lhci/cli
lhci autorun
```

## 🔒 Security Features

- **XSS Protection** - Content sanitization
- **CORS Handling** - Proper cross-origin requests
- **Token Storage** - Secure localStorage usage
- **Input Validation** - Client-side validation
- **HTTPS Redirect** - Automatic HTTPS in production

## 📱 Mobile Experience

### Touch Interactions
- **Tap Targets** - Minimum 44px touch targets
- **Swipe Navigation** - Touch-friendly navigation
- **Pull-to-Refresh** - Native-like interactions
- **Haptic Feedback** - Where supported

### Progressive Web App Features
- **App Manifest** - Installable web app
- **Service Worker** - Offline functionality
- **App Icons** - Home screen icons
- **Splash Screen** - App-like loading

## 🎨 Customization

### Theming
```css
/* Custom theme variables */
:root {
    --brand-primary: #your-brand-color;
    --brand-secondary: #your-secondary-color;
    --font-family: 'Your Font', sans-serif;
}
```

### Feature Toggles
```javascript
// Enable/disable features
const FEATURES = {
    darkMode: true,
    notifications: true,
    analytics: false
};
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Test your changes across browsers
4. Commit changes (`git commit -m 'Add new feature'`)
5. Push to branch (`git push origin feature/new-feature`)
6. Open Pull Request

### Code Style
- **JavaScript**: ES6+ features, async/await
- **CSS**: BEM methodology, CSS custom properties
- **HTML**: Semantic markup, accessibility first

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: See DEPLOYMENT.md for deployment help
- **Issues**: GitHub Issues for bug reports
- **Browser Issues**: Include browser version and steps to reproduce
- **Mobile Issues**: Include device type and OS version