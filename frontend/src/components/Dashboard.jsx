import { useState, useRef, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Phase2Features from './Phase2Features';
import Phase3Features from './Phase3Features';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function DashboardHome({ token, user }) {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [resumeId, setResumeId] = useState(localStorage.getItem('current_resume_id'));
  
  const [jobDescription, setJobDescription] = useState('');
  const [analyzeStatus, setAnalyzeStatus] = useState('');
  const [analysis, setAnalysis] = useState(null);

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

    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API_BASE}/resume/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResumeId(res.data.resume_id);
      localStorage.setItem('current_resume_id', res.data.resume_id);
      setUploadStatus('Upload successful!');
    } catch (err) {
      setUploadStatus('Upload failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleAnalyze = async () => {
    if (!resumeId) return;
    setAnalyzeStatus('Analyzing... (This may take a minute)');
    try {
      const res = await axios.post(`${API_BASE}/analyze/resume`, {
        resume_id: resumeId,
        job_description: jobDescription
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalysis(res.data);
      if (res.data.error) {
        setAnalyzeStatus('Warning: Backend Error: ' + res.data.error);
      } else {
        setAnalyzeStatus('');
      }
    } catch (err) {
      setAnalyzeStatus('Analysis failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !resumeId) return;
    
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { text: msg, sender: 'user' }]);
    setChatInput('');

    try {
      const res = await axios.post(`${API_BASE}/chat/resume`, {
        resume_id: resumeId,
        message: msg
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { text: 'Error connecting to chat service.', sender: 'bot' }]);
    }
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
            <button type="submit" className="btn secondary-btn" disabled={uploadStatus === 'Uploading...'}>Upload PDF</button>
          </form>
          <div style={{ marginTop: '1rem', color: uploadStatus.includes('success') ? 'var(--success)' : 'inherit' }}>{uploadStatus}</div>
        </div>

        {resumeId && (
          <div className="card analyze-card">
            <h3>Analyze Resume</h3>
            <textarea placeholder="Paste Job Description here (Optional)..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} rows="4" />
            <button onClick={handleAnalyze} className="btn primary-btn" disabled={analyzeStatus.includes('Analyzing')}>Run AI Analysis</button>
            <div style={{ marginTop: '1rem' }}>{analyzeStatus}</div>
          </div>
        )}
      </div>

      {analysis && (
        <div className="results-grid" style={{ display: 'grid' }}>
          <div className="card score-card">
            <h3>ATS Score</h3>
            <div className="score-circle"><span>{analysis.ats_score}</span>%</div>
          </div>
          <div className="card details-card">
            <h3>Extracted Skills</h3>
            <div className="tags-container">{(analysis.skills || []).map((s, i) => <span key={i}>{s}</span>)}</div>
            <h3 style={{ marginTop: '1rem' }}>Missing Skills</h3>
            <div className="tags-container error-tags">{(analysis.missing_skills || []).map((s, i) => <span key={i}>{s}</span>)}</div>
          </div>
          <div className="card ai-suggestions-card">
            <h3>AI Suggestions</h3>
            <p>{analysis.suggestions || 'No suggestions.'}</p>
          </div>
          <div className="card chat-card">
            <h3>Resume Chatbot</h3>
            <div className="chat-window" ref={chatWindowRef}>
              {chatMessages.map((msg, i) => <div key={i} className={`chat-msg ${msg.sender}`}>{msg.text}</div>)}
            </div>
            <div className="chat-input-area">
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendChat()} />
              <button onClick={handleSendChat} className="btn primary-btn">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ token, user }) {
  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '1rem' }}>
        <Link to="/dashboard" className="btn secondary-btn" style={{textAlign:'center', textDecoration:'none'}}>Home</Link>
        <Link to="/dashboard/features" className="btn secondary-btn" style={{textAlign:'center', textDecoration:'none'}}>Advanced Features</Link>
        <Link to="/dashboard/analytics" className="btn secondary-btn" style={{textAlign:'center', textDecoration:'none'}}>Analytics & Exports</Link>
      </div>
      <div style={{ flex: 1 }}>
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
