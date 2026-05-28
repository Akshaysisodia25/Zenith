const ZENITH_SUPABASE_URL = 'https://ghmhqlfmxdxebcuqzior.supabase.co';
const ZENITH_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_btGsxzju4OTmHRV--VhglQ_NTqEEgJh';

const zenithSupabase = supabase.createClient(ZENITH_SUPABASE_URL, ZENITH_SUPABASE_PUBLISHABLE_KEY);

let authMode = 'signin';
let currentSession = null;

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
    if (subtitle) subtitle.textContent = isSignup ? 'Join Zenith and save your focus progress' : 'Sign in to your Zenith account';
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
        }
        if (roomName && !roomName.value) roomName.value = displayName;
        if (joinName && !joinName.value) joinName.value = displayName;
    } else {
        localStorage.removeItem('zenith_auth_user');
        if (loginBtn) {
            loginBtn.textContent = 'Login';
            loginBtn.classList.remove('logged-in');
        }
    }
}

async function handleAuthButton() {
    if (currentSession && currentSession.user) {
        await zenithSupabase.auth.signOut();
        return;
    }
    setAuthMode('signin');
    openModal('loginModal');
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
            setAuthMessage('Account created. Check your email to confirm your signup, then sign in.', 'success');
            setAuthMode('signin');
            return;
        }

        setAuthMessage('Signed in successfully.', 'success');
        closeModal(null, 'loginModal');
        if (event.target) event.target.reset();
    } catch (err) {
        setAuthMessage(err.message || 'Authentication failed. Please try again.', 'error');
    } finally {
        setAuthLoading(false);
    }
}

async function handlePasswordReset(event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    if (!email) {
        setAuthMessage('Enter your email first, then click forgot password.', 'error');
        return;
    }

    const { error } = await zenithSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href
    });

    if (error) {
        setAuthMessage(error.message, 'error');
        return;
    }

    setAuthMessage('Password reset email sent.', 'success');
}

async function initAuth() {
    setAuthMode('signin');
    const { data } = await zenithSupabase.auth.getSession();
    updateAuthUI(data.session);
    zenithSupabase.auth.onAuthStateChange(function(_event, session) {
        updateAuthUI(session);
    });
}

document.addEventListener('DOMContentLoaded', initAuth);
