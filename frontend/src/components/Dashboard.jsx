import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import Phase2Features from './Phase2Features';
import Phase3Features from './Phase3Features';
import { useToast } from './Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function DashboardHome({ token, user }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeId, setResumeId] = useState(localStorage.getItem('current_resume_id'));
  
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const { addToast } = useToast();

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ text: 'Hi! Ask me anything about your uploaded resume.', sender: 'bot' }]);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/resume/upload`, formData);
      setResumeId(res.data.resume_id);
      localStorage.setItem('current_resume_id', res.data.resume_id);
      addToast('Upload successful!', 'success');
    } catch (err) {
      addToast('Upload failed: ' + (err.response?.data?.detail || err.message), 'error');
    }
    setIsUploading(false);
  };

  const handleAnalyze = async () => {
    if (!resumeId) return;
    setIsAnalyzing(true);
    try {
      const res = await api.post(`/analyze/resume`, {
        resume_id: resumeId,
        job_description: jobDescription
      });
      setAnalysis(res.data);
      if (res.data.error) {
        addToast('Warning: Backend Error: ' + res.data.error, 'error');
      } else {
        addToast('Analysis Complete!', 'success');
      }
    } catch (err) {
      addToast('Analysis failed: ' + (err.response?.data?.detail || err.message), 'error');
    }
    setIsAnalyzing(false);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !resumeId) return;
    
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { text: msg, sender: 'user' }]);
    setChatInput('');

    try {
      const res = await api.post(`/chat/resume`, {
        resume_id: resumeId,
        message: msg
      });
      setChatMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { text: 'Error connecting to chat service.', sender: 'bot' }]);
    }
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return { text: "Excellent Match", color: "var(--success)" };
    if (score >= 60) return { text: "Good Match", color: "#eab308" };
    return { text: "Needs Improvement", color: "var(--danger)" };
  };

  const getSuggestionsList = (text) => {
    if (!text) return [];
    return text.split('. ').filter(s => s.trim().length > 0).map(s => s.endsWith('.') ? s : s + '.');
  };

  return (
    <div>
      <div className="dashboard-header">
        <h2>Welcome back, <span>{user?.name}</span></h2>
      </div>
      <div className="dashboard-grid">
        <div className="card upload-card">
          <h3>Upload Resume</h3>
          <form onSubmit={handleUpload}>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
            <button type="submit" className="btn secondary-btn" disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              {isUploading && <span className="spinner spinner-sm"></span>}
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </button>
          </form>
        </div>

        {resumeId && (
          <div className="card analyze-card">
            <h3>Analyze Resume</h3>
            <textarea placeholder="Paste Job Description here (Optional)..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows="4" />
            <button onClick={handleAnalyze} className="btn primary-btn" disabled={isAnalyzing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
              {isAnalyzing && <span className="spinner spinner-sm"></span>}
              {isAnalyzing ? 'Analyzing...' : 'Run AI Analysis'}
            </button>
          </div>
        )}
      </div>

      {analysis && (
        <div className="results-grid">
          <div className="card score-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>ATS Score</h3>
            <div className="modern-score-circle">
              <span className="score-value">{analysis.ats_score}</span>
              <span className="score-symbol">%</span>
            </div>
            {(() => {
              const status = getScoreStatus(analysis.ats_score);
              return (
                <div style={{ marginTop: '1.5rem' }}>
                  <span style={{ 
                    padding: '0.5rem 1rem', 
                    borderRadius: '99px', 
                    backgroundColor: `${status.color}20`, 
                    color: status.color,
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    {status.text}
                  </span>
                </div>
              );
            })()}
          </div>
          
          <div className="card details-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Extracted Skills</h3>
              <div className="modern-tags-container">
                {(analysis.skills || []).length > 0 ? (
                  analysis.skills.map((s, i) => <span key={i} className="skill-pill">{s}</span>)
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No skills detected.</p>
                )}
              </div>
            </div>

            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Missing Skills</h3>
              <div className="modern-tags-container">
                {(analysis.missing_skills || []).length > 0 ? (
                  analysis.missing_skills.map((s, i) => <span key={i} className="missing-skill-pill">{s}</span>)
                ) : (
                  <p style={{ color: 'var(--success)', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>✨</span> No major missing skills detected.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="card ai-suggestions-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>AI Suggestions</h3>
            <ul className="suggestions-list">
              {getSuggestionsList(analysis.suggestions).length > 0 ? (
                getSuggestionsList(analysis.suggestions).map((item, idx) => (
                  <li key={idx}>
                    <span className="bullet-icon">💡</span>
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>No suggestions available.</p>
              )}
            </ul>
          </div>
          
          <div className="card chat-card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Resume Chatbot</h3>
            <div className="chat-window" ref={chatWindowRef}>
              {chatMessages.map((msg, i) => <div key={i} className={`chat-msg ${msg.sender}`}>{msg.text}</div>)}
            </div>
            <div className="chat-input-area">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} placeholder="Ask a question..." />
              <button onClick={handleSendChat} className="btn primary-btn">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ token, user }) {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="dashboard-layout">
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span>Home</span>
        </Link>
        <Link to="/dashboard/features" className={`sidebar-link ${isActive('/dashboard/features') ? 'active' : ''}`}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          <span>Advanced Features</span>
        </Link>
        <Link to="/dashboard/analytics" className={`sidebar-link ${isActive('/dashboard/analytics') ? 'active' : ''}`}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          <span>Analytics & Exports</span>
        </Link>
      </nav>
      <div className="dashboard-content">
        <Routes>
          <Route path="/" element={<DashboardHome token={token} user={user} />} />
          <Route path="/features" element={<Phase2Features token={token} />} />
          <Route path="/analytics" element={<Phase3Features token={token} />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;
