import { useState, useRef, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { useToast } from './Toast';
import { Sparkles, BrainCircuit, Rocket, Lightbulb, FileText, Zap, Briefcase, Mic, FileUp, CheckCircle2 } from 'lucide-react';
import { mockAtsAnalysis } from '../fallbackData';

const Phase2Features = lazy(() => import('./Phase2Features'));
const Phase3Features = lazy(() => import('./Phase3Features'));

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
        if (res.data.error.toLowerCase().includes('quota') || res.data.error.toLowerCase().includes('unavailable') || res.data.error.toLowerCase().includes('demand')) {
          addToast("AI quota limit reached. Showing demo results for preview.", "error");
          setAnalysis(mockAtsAnalysis);
        } else {
          addToast('Warning: Backend Error: ' + res.data.error, 'error');
        }
      } else {
        addToast('Analysis Complete!', 'success');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || '';
      if (err.response?.status === 429 || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('exhausted')) {
        addToast("AI quota limit reached. Showing demo results for preview.", "error");
        setAnalysis(mockAtsAnalysis);
      } else {
        addToast('Analysis failed: ' + errorMsg, 'error');
      }
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
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          Welcome back, <span className="logo">{user?.name}</span> 
          <BrainCircuit size={36} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.6))' }} />
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Resume Analysis Dashboard</p>
      </div>

      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}><FileText size={24} /></div>
          <div className="stat-content">
            <h4>Resumes Uploaded</h4>
            <p className="stat-value">12</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}><Zap size={24} /></div>
          <div className="stat-content">
            <h4>ATS Analyses</h4>
            <p className="stat-value">34</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--secondary)' }}><Briefcase size={24} /></div>
          <div className="stat-content">
            <h4>Job Recs Generated</h4>
            <p className="stat-value">8</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}><Mic size={24} /></div>
          <div className="stat-content">
            <h4>Mock Interviews</h4>
            <p className="stat-value">5</p>
          </div>
        </div>
      </div>
      <div className="dashboard-grid">
        <div className="card upload-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Upload Resume</h3>
          <form onSubmit={handleUpload}>
            <div className="file-upload-wrapper">
              <input type="file" id="resume-upload" accept=".pdf" onChange={e => setFile(e.target.files[0])} required className="hidden-file-input" />
              <label htmlFor="resume-upload" className="file-upload-label">
                <FileUp size={48} className="upload-icon" />
                <span className="upload-text">{file ? file.name : 'Drag & drop or click to select PDF'}</span>
              </label>
            </div>
            <button type="submit" className="btn primary-btn" disabled={isUploading || !file} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              {isUploading ? <><span className="spinner spinner-sm"></span> Uploading...</> : 'Upload PDF'}
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

      {!resumeId && (
        <div className="empty-state-card glass-card">
          <Rocket size={64} className="empty-state-icon" style={{ color: 'var(--primary)' }} />
          <h3>Ready to boost your career?</h3>
          <p>Upload your resume to get an instant ATS score, job recommendations, and start your AI mock interviews!</p>
        </div>
      )}

      {analysis && (
        <div className="results-grid" style={{ position: 'relative' }}>
          {analysis.is_demo && (
            <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
              Demo Preview
            </div>
          )}
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
                    <CheckCircle2 size={20} color="var(--success)" /> No major missing skills detected.
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
                    <span className="bullet-icon"><Lightbulb size={20} color="var(--primary)" /></span>
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
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}><div className="spinner"></div></div>}>
          <Routes>
            <Route path="/" element={<DashboardHome token={token} user={user} />} />
            <Route path="/features" element={<Phase2Features token={token} />} />
            <Route path="/analytics" element={<Phase3Features token={token} />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default Dashboard;
