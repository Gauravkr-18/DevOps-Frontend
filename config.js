// Backend URL Configuration for Production
// This file is automatically updated during deployment

// Production backend URL (will be replaced during deployment)
window.BACKEND_URL = 'http://65.1.93.203:8000/api';

// Environment-specific configurations
if (window.location.hostname.includes('staging')) {
    window.BACKEND_URL = 'http://65.1.93.203:8000/api';
    console.log('Staging environment detected');
} else if (window.location.hostname.includes('dev')) {
    window.BACKEND_URL = 'http://65.1.93.203:8000/api';
    console.log('Development environment detected');
} else {
    console.log('Production environment detected');
}

// For local development, this file is ignored and localhost backend is used
console.log('Backend URL configured:', window.BACKEND_URL);
