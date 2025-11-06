// Authentication Module

// Check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    return !!(token && user);
}

// Get current user
function getCurrentUser() {
    const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    return null;
}

// Login function
async function login(email, password) {
    try {
        const result = await api.login(email, password);

        // Save token and user data
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, result.token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(result.user));

        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: error.message || '로그인에 실패했습니다.'
        };
    }
}

// Register function
async function register(name, email, password) {
    try {
        const result = await api.register(name, email, password);

        // Save token and user data
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, result.token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(result.user));

        return {
            success: true,
            user: result.user
        };
    } catch (error) {
        console.error('Register error:', error);
        return {
            success: false,
            message: error.message || '회원가입에 실패했습니다.'
        };
    }
}

// Logout function
function logout() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_TRIP);
    window.location.href = '/webapp/index.html';
}

// Require auth middleware
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = '/webapp/pages/login.html';
        return false;
    }
    return true;
}

// Update UI based on auth status
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfo = document.getElementById('userInfo');
    const userName = document.getElementById('userName');

    if (isLoggedIn()) {
        const user = getCurrentUser();

        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('로그아웃 하시겠습니까?')) {
                    logout();
                }
            });
        }
        if (userInfo) userInfo.style.display = 'flex';
        if (userName) userName.textContent = user.name;
    } else {
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// Initialize auth UI on page load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
