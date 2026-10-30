/**
 * Zenith Authentication Engine & Toast System
 * Integrated with Supabase Auth for Multi-Page Architecture
 */

const ZENITH_SUPABASE_URL = 'https://ghmhqlfmxdxebcuqzior.supabase.co';
const ZENITH_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_btGsxzju4OTmHRV--VhglQ_NTqEEgJh';

const zenithSupabase = supabase.createClient(ZENITH_SUPABASE_URL, ZENITH_SUPABASE_PUBLISHABLE_KEY);

let authMode = 'signin';
let currentSession = null;

// Global Toast System (Architectural & Minimal)
function showToast(message, type = 'info', duration = 3200) {
    let container = document.getElementById('zenithToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'zenithToastContainer';
        container.className = 'zenith-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `zenith-toast toast-${type}`;
    
    toast.innerHTML = `
        <span class="toast-dot" style="display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor;"></span>
        <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

function getAuthDisplayName(user) {
    if (!user) return '';
    return user.user_metadata && user.user_metadata.full_name
        ? user.user_metadata.full_name
        : (user.email || 'User').split('@')[0];
}

function setAuthMessage(message, type) {
    const el = document.getElementById('authMessage');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'auth-message' + (type ? ' ' + type : '');
    el.style.display = message ? 'block' : 'none';
    if (type === 'error') {
        el.style.color = 'var(--status-danger)';
        el.style.fontSize = '0.85rem';
        el.style.marginTop = '8px';
    } else if (type === 'success') {
        el.style.color = 'var(--status-active)';
        el.style.fontSize = '0.85rem';
        el.style.marginTop = '8px';
    }
}

function setAuthLoading(isLoading) {
    const submit = document.getElementById('authSubmit');
    if (!submit) return;
    submit.disabled = isLoading;
    submit.textContent = isLoading
        ? 'Please wait...'
        : (authMode === 'signup' ? 'Create Account' : 'Sign In');
}

function setAuthMode(mode) {
    authMode = mode;
    const isSignup = authMode === 'signup';
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const nameGroup = document.getElementById('authNameGroup');
    const submit = document.getElementById('authSubmit');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitchLink');

    if (title) title.textContent = isSignup ? 'Create Account' : 'Welcome Back';
    if (subtitle) subtitle.textContent = isSignup ? 'Join Zenith and save your focus progress' : 'Sign in to continue your focus routine';
    if (nameGroup) nameGroup.style.display = isSignup ? 'flex' : 'none';
    if (submit) submit.textContent = isSignup ? 'Create Account' : 'Sign In';
    if (switchText) switchText.textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
    if (switchLink) {
        switchLink.textContent = isSignup ? 'Sign in' : 'Create one';
        if (switchLink.getAttribute('href') && switchLink.getAttribute('href').includes('.html')) {
            switchLink.href = isSignup ? 'login.html' : 'signup.html';
        }
    }
    setAuthMessage('', '');
}

function toggleAuthMode(event) {
    if (event) event.preventDefault();
    setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
}

function togglePasswordVisibility(btn) {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    if (btn) {
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
        btn.textContent = isPassword ? '👁' : '🔒';
    }
}

function updateAuthUI(session) {
    currentSession = session;
    const loginBtns = document.querySelectorAll('.login-btn, #authButton');
    const roomName = document.getElementById('roomName');
    const joinName = document.getElementById('joinName');

    if (session && session.user) {
        const displayName = getAuthDisplayName(session.user);
        localStorage.setItem('zenith_auth_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: displayName
        }));

        loginBtns.forEach(btn => {
            btn.textContent = 'Logout (' + displayName + ')';
            btn.classList.add('logged-in');
        });

        if (roomName && !roomName.value) roomName.value = displayName;
        if (joinName && !joinName.value) joinName.value = displayName;
    } else {
        localStorage.removeItem('zenith_auth_user');
        loginBtns.forEach(btn => {
            btn.textContent = 'Login';
            btn.classList.remove('logged-in');
        });
    }
}

async function handleAuthButton() {
    if (currentSession && currentSession.user) {
        try {
            await zenithSupabase.auth.signOut();
            showToast('Signed out of Zenith', 'info');
        } catch (err) {
            console.error('Sign out error:', err);
        }
        return;
    }

    // If modal exists on page, open it
    const modal = document.getElementById('loginModal');
    if (modal && typeof openModal === 'function') {
        setAuthMode('signin');
        openModal('loginModal');
    } else {
        // Multi-page navigation to dedicated login page
        window.location.href = 'login.html';
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const emailEl = document.getElementById('email');
    const passwordEl = document.getElementById('password');
    const nameEl = document.getElementById('authFullName');

    const email = emailEl ? emailEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const fullName = nameEl ? nameEl.value.trim() : '';

    setAuthLoading(true);
    setAuthMessage('', '');

    try {
        const isSignup = authMode === 'signup' || window.location.pathname.includes('signup.html');

        const result = isSignup
            ? await zenithSupabase.auth.signUp({
                email: email,
                password: password,
                options: { data: { full_name: fullName || email.split('@')[0] } }
            })
            : await zenithSupabase.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (result.error) throw result.error;

        if (isSignup && !result.data.session) {
            setAuthMessage('Account created. Check your email to confirm signup, then sign in.', 'success');
            showToast('Confirmation email sent.', 'success');
            return;
        }

        setAuthMessage('Signed in successfully.', 'success');
        showToast('Welcome to Zenith', 'success');

        if (typeof closeModal === 'function') {
            closeModal(null, 'loginModal');
        }

        // If on dedicated login or signup page, navigate to rooms.html
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
            setTimeout(() => {
                window.location.href = 'rooms.html';
            }, 500);
        }
    } catch (err) {
        setAuthMessage(err.message || 'Authentication failed. Please check credentials.', 'error');
    } finally {
        setAuthLoading(false);
    }
}

async function handlePasswordReset(event) {
    if (event) event.preventDefault();
    const emailEl = document.getElementById('email');
    const email = emailEl ? emailEl.value.trim() : '';
    if (!email) {
        setAuthMessage('Enter your email address first, then click forgot password.', 'error');
        if (emailEl) emailEl.focus();
        return;
    }

    try {
        const { error } = await zenithSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
        });

        if (error) {
            setAuthMessage(error.message, 'error');
            return;
        }

        setAuthMessage('Password reset link sent to your email.', 'success');
        showToast('Password reset email sent', 'info');
    } catch (err) {
        setAuthMessage('Failed to send reset email.', 'error');
    }
}

async function initAuth() {
    // Detect page mode
    if (window.location.pathname.includes('signup.html')) {
        authMode = 'signup';
    } else {
        authMode = 'signin';
    }

    try {
        const { data } = await zenithSupabase.auth.getSession();
        updateAuthUI(data.session);
        zenithSupabase.auth.onAuthStateChange(function(_event, session) {
            updateAuthUI(session);
        });
    } catch (e) {
        console.warn('Auth init note:', e);
    }
}

document.addEventListener('DOMContentLoaded', initAuth);
