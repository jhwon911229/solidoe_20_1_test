// TripSync Configuration
const CONFIG = {
    // API URLs
    API_BASE_URL: 'http://localhost:5000',
    GRAPHQL_ENDPOINT: 'http://localhost:5000/graphql',
    RECOMMENDATION_API: 'http://localhost:8000',

    // Google Maps API Key
    GOOGLE_MAPS_API_KEY: 'AIzaSyAMGooquPgD4C4lNL9sEdKr--2DTCr8djk',

    // Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'tripsync_token',
        USER: 'tripsync_user',
        CURRENT_TRIP: 'tripsync_current_trip'
    },

    // Default Values
    DEFAULTS: {
        CURRENCY: 'KRW',
        TRAVEL_STYLE: 'balanced',
        BUDGET_RANGE: 'medium'
    },

    // Transportation Costs (KRW per km)
    TRANSPORT_COSTS: {
        DRIVING: 150,
        WALKING: 0,
        TRANSIT: 50,
        BICYCLING: 0
    }
};

// Utility Functions
const utils = {
    // Format currency
    formatCurrency: (amount, currency = 'KRW') => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },

    // Format date
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
    },

    // Calculate days between dates
    daysBetween: (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    // Format duration
    formatDuration: (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}시간 ${mins}분`;
        }
        return `${mins}분`;
    },

    // Format distance
    formatDistance: (km) => {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        }
        return `${km.toFixed(1)}km`;
    },

    // Show toast notification
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'error' ? '#FF3B30' : type === 'success' ? '#34C759' : '#007AFF'};
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Validate email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Generate UUID
    generateUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
