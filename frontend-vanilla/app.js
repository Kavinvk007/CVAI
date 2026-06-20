const API_BASE = 'http://localhost:8000';

// State
let token = localStorage.getItem('token');
let currentUserId = localStorage.getItem('user_id');
let currentUserName = localStorage.getItem('name');
let currentResumeId = null;

// DOM Elements
const pages = {
    landing: document.getElementById('landing-page'),
    auth: document.getElementById('auth-page'),
    dashboard: document.getElementById('dashboard-page')
};

const navLinks = {
    login: document.getElementById('nav-login'),
    register: document.getElementById('nav-register'),
    logout: document.getElementById('nav-logout')
};

// Navigation
function showPage(pageId) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    pages[pageId].classList.add('active');
    updateNav();
}

function updateNav() {
    if (token) {
        navLinks.login.style.display = 'none';
        navLinks.register.style.display = 'none';
        navLinks.logout.style.display = 'block';
    } else {
        navLinks.login.style.display = 'block';
        navLinks.register.style.display = 'block';
        navLinks.logout.style.display = 'none';
    }
}

// Event Listeners for Nav
document.getElementById('get-started-btn').addEventListener('click', () => {
    token ? showPage('dashboard') : showPage('auth');
});
navLinks.login.addEventListener('click', () => {
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('register-form-container').style.display = 'none';
    showPage('auth');
});
navLinks.register.addEventListener('click', () => {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('register-form-container').style.display = 'block';
    showPage('auth');
});
document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.register.click();
});
document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.login.click();
});
navLinks.logout.addEventListener('click', () => {
    localStorage.clear();
    token = null;
    currentResumeId = null;
    showPage('landing');
});

// Auth Forms
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errDiv = document.getElementById('auth-error');
    errDiv.textContent = '';

    try {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            token = data.access_token;
            currentUserId = data.user_id;
            currentUserName = data.name;
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', currentUserId);
            localStorage.setItem('name', currentUserName);
            initDashboard();
        } else {
            errDiv.textContent = data.detail || 'Login failed';
        }
    } catch (err) {
        errDiv.textContent = 'Server error. Is backend running?';
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errDiv = document.getElementById('auth-error');
    errDiv.textContent = '';

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            // auto login or switch to login
            document.getElementById('login-email').value = email;
            navLinks.login.click();
        } else {
            errDiv.textContent = data.detail || 'Registration failed';
        }
    } catch (err) {
        errDiv.textContent = 'Server error.';
    }
});

// Dashboard
function initDashboard() {
    document.getElementById('user-name-display').textContent = currentUserName;
    showPage('dashboard');
    document.getElementById('analyze-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('upload-status').textContent = '';
}

// Upload Resume
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('resume-file');
    const file = fileInput.files[0];
    if (!file) return;

    const btn = document.getElementById('upload-btn');
    const statusDiv = document.getElementById('upload-status');
    btn.disabled = true;
    btn.textContent = 'Uploading...';
    statusDiv.textContent = '';
    statusDiv.style.color = 'var(--text-main)';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_BASE}/resume/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            currentResumeId = data.resume_id;
            statusDiv.textContent = 'Upload successful!';
            statusDiv.style.color = 'var(--success)';
            document.getElementById('analyze-section').style.display = 'block';
        } else {
            statusDiv.textContent = data.detail || 'Upload failed';
            statusDiv.style.color = 'var(--danger)';
        }
    } catch (err) {
        statusDiv.textContent = 'Server error.';
        statusDiv.style.color = 'var(--danger)';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Upload PDF';
    }
});

// Analyze Resume
document.getElementById('analyze-btn').addEventListener('click', async () => {
    if (!currentResumeId) return;
    
    const jd = document.getElementById('job-description').value;
    const btn = document.getElementById('analyze-btn');
    const statusDiv = document.getElementById('analyze-status');
    
    btn.disabled = true;
    btn.textContent = 'Analyzing... (This may take a minute)';
    statusDiv.textContent = '';

    try {
        const res = await fetch(`${API_BASE}/analyze/resume`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resume_id: currentResumeId, job_description: jd })
        });
        const data = await res.json();
        if (res.ok) {
            renderResults(data);
        } else {
            statusDiv.textContent = data.detail || 'Analysis failed';
            statusDiv.style.color = 'var(--danger)';
        }
    } catch (err) {
        statusDiv.textContent = 'Server error.';
        statusDiv.style.color = 'var(--danger)';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Run AI Analysis';
    }
});

function renderResults(data) {
    document.getElementById('results-section').style.display = 'grid';
    
    // Scores
    document.getElementById('ats-score-val').textContent = data.ats_score;
    if (data.job_match_score > 0) {
        document.getElementById('job-match-container').style.display = 'block';
        document.getElementById('job-match-bar').style.width = `${data.job_match_score}%`;
        document.getElementById('job-match-val').textContent = data.job_match_score;
    } else {
        document.getElementById('job-match-container').style.display = 'none';
    }

    // Skills
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = '';
    (data.skills || []).forEach(s => {
        const span = document.createElement('span');
        span.textContent = s;
        skillsList.appendChild(span);
    });

    const missingSkillsList = document.getElementById('missing-skills-list');
    missingSkillsList.innerHTML = '';
    (data.missing_skills || []).forEach(s => {
        const span = document.createElement('span');
        span.textContent = s;
        missingSkillsList.appendChild(span);
    });

    // Suggestions & Qs
    document.getElementById('ai-suggestions-text').textContent = data.suggestions || 'No suggestions.';
    
    const qsList = document.getElementById('interview-questions-list');
    qsList.innerHTML = '';
    (data.interview_questions || []).forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        qsList.appendChild(li);
    });
}

// Chatbot
document.getElementById('chat-send-btn').addEventListener('click', sendChatMessage);
document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

async function sendChatMessage() {
    if (!currentResumeId) return;
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    appendChatMsg(msg, 'user');
    input.value = '';

    try {
        const res = await fetch(`${API_BASE}/chat/resume`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ resume_id: currentResumeId, message: msg })
        });
        const data = await res.json();
        if (res.ok) {
            appendChatMsg(data.reply, 'bot');
        } else {
            appendChatMsg('Error: ' + data.detail, 'bot');
        }
    } catch (err) {
        appendChatMsg('Error connecting to chat service.', 'bot');
    }
}

function appendChatMsg(text, sender) {
    const window = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = `chat-msg ${sender}`;
    div.textContent = text;
    window.appendChild(div);
    window.scrollTop = window.scrollHeight;
}

// Init
if (token) {
    initDashboard();
} else {
    showPage('landing');
}
