/**
 * Zenith Authentication & Toast System
 * Integrated with Supabase Auth
 */

const ZENITH_SUPABASE_URL = 'https://ghmhqlfmxdxebcuqzior.supabase.co';
const ZENITH_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_btGsxzju4OTmHRV--VhglQ_NTqEEgJh';

const zenithSupabase = supabase.createClient(ZENITH_SUPABASE_URL, ZENITH_SUPABASE_PUBLISHABLE_KEY);

let authMode = 'signin';
let currentSession = null;

// Global Toast System
function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('zenithToastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'zenithToastContainer';
        container.className = 'zenith-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `zenith-toast toast-${type}`;
    
    const iconMap = {
        success: '✓',
        error: '✕',
        info: '◈',
        warning: '⚠'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${iconMap[type] || '◈'}</span>
        <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
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
}

function setAuthLoading(isLoading) {
    const submit = document.getElementById('authSubmit');
    if (!submit) return;
    submit.disabled = isLoading;
    submit.innerHTML = isLoading
        ? '<span class="btn-spinner"></span> <span>Please wait...</span>'
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
    if (subtitle) subtitle.textContent = isSignup ? 'Join Zenith and save your focus progress' : 'Sign in to your Zenith workspace';
    if (nameGroup) nameGroup.style.display = isSignup ? 'flex' : 'none';
    if (submit) submit.textContent = isSignup ? 'Create Account' : 'Sign In';
    if (switchText) switchText.textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
    if (switchLink) switchLink.textContent = isSignup ? 'Sign in' : 'Create one';
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
        btn.classList.toggle('active', isPassword);
    }
}

function updateAuthUI(session) {
    currentSession = session;
    const loginBtn = document.getElementById('authButton');
    const roomName = document.getElementById('roomName');
    const joinName = document.getElementById('joinName');

    if (session && session.user) {
        const displayName = getAuthDisplayName(session.user);
        localStorage.setItem('zenith_auth_user', JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: displayName
        }));

        if (loginBtn) {
            loginBtn.textContent = 'Logout';
            loginBtn.classList.add('logged-in');
            loginBtn.setAttribute('title', `Signed in as ${displayName}`);
        }
        if (roomName && !roomName.value) roomName.value = displayName;
        if (joinName && !joinName.value) joinName.value = displayName;
    } else {
        localStorage.removeItem('zenith_auth_user');
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.classList.remove('logged-in');
            loginBtn.removeAttribute('title');
        }
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
    setAuthMode('signin');
    if (typeof openModal === 'function') {
        openModal('loginModal');
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('authFullName')
        ? document.getElementById('authFullName').value.trim()
        : '';

    setAuthLoading(true);
    setAuthMessage('', '');

    try {
        const result = authMode === 'signup'
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

        if (authMode === 'signup' && !result.data.session) {
            setAuthMessage('Account created. Check your email to confirm signup, then sign in.', 'success');
            showToast('Account created! Please check your email.', 'success');
            setAuthMode('signin');
            return;
        }

        setAuthMessage('Signed in successfully.', 'success');
        showToast('Welcome back to Zenith', 'success');
        if (typeof closeModal === 'function') {
            closeModal(null, 'loginModal');
        }
        if (event.target) event.target.reset();
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
        setAuthMessage('Enter your email above first, then click forgot password.', 'error');
        if (emailEl) emailEl.focus();
        return;
    }

    try {
        const { error } = await zenithSupabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.href
        });

        if (error) {
            setAuthMessage(error.message, 'error');
            return;
        }

        setAuthMessage('Password reset instructions sent to your email.', 'success');
        showToast('Reset email sent', 'info');
    } catch (err) {
        setAuthMessage('Failed to send reset email.', 'error');
    }
}

async function initAuth() {
    setAuthMode('signin');
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
