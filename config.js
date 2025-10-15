// Backend URL Configuration for Production
// This file is automatically updated during deployment

// Production backend URL (will be replaced during deployment)
window.BACKEND_URL = 'https://your-backend-domain.com/api';

// Environment-specific configurations
if (window.location.hostname.includes('staging')) {
    window.BACKEND_URL = 'https://staging-backend-domain.com/api';
    console.log('Staging environment detected');
} else if (window.location.hostname.includes('dev')) {
    window.BACKEND_URL = 'https://dev-backend-domain.com/api';
    console.log('Development environment detected');
} else {
    console.log('Production environment detected');
}

// For local development, this file is ignored and localhost backend is used
console.log('Backend URL configured:', window.BACKEND_URL);