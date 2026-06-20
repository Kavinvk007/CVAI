import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_V2 = `${API_BASE}/api/v2`;

export default function Phase2Features({ token }) {
  const [activeTab, setActiveTab] = useState('recommendations');
  const resumeId = localStorage.getItem('current_resume_id');

  const tabs = [
    { id: 'compare', label: 'Compare Resumes' },
    { id: 'recommendations', label: 'Job Recommendations' },
    { id: 'coverletter', label: 'Cover Letter Gen' },
    { id: 'linkedin', label: 'LinkedIn Analyzer' },
    { id: 'mockinterview', label: 'Mock Interview' },
  ];

  if (!resumeId && activeTab !== 'compare' && activeTab !== 'linkedin') {
    return <div className="card">Please upload a resume on the Home tab first.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button 
            key={t.id} 
            className={`btn ${activeTab === t.id ? 'primary-btn' : 'secondary-btn'}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <div className="card">
        {activeTab === 'compare' && <CompareResumes token={token} />}
        {activeTab === 'recommendations' && <JobRecommendations token={token} resumeId={resumeId} />}
        {activeTab === 'coverletter' && <CoverLetter token={token} resumeId={resumeId} />}
        {activeTab === 'linkedin' && <LinkedInAnalyzer token={token} />}
        {activeTab === 'mockinterview' && <MockInterview token={token} resumeId={resumeId} />}
      </div>
    </div>
  );
}

function CompareResumes({ token }) {
  const [resumes, setResumes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [jd, setJd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user's resumes
    axios.get(`${API_BASE}/user/resumes`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setResumes(res.data))
      .catch(err => console.log(err));
  }, [token]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      alert("Please select at least 2 resumes to compare.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_V2}/compare`, { resume_ids: selectedIds, job_description: jd }, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      alert("Error comparing resumes: " + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Compare Resumes</h3>
      <p style={{ color: 'var(--text-muted)' }}>Select at least 2 resumes you have uploaded:</p>
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexWrap: 'wrap' }}>
        {resumes.map(r => (
          <label key={r.id} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}>
            <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} style={{ marginRight: '0.5rem' }} />
            {r.file_name}
          </label>
        ))}
      </div>
      <textarea placeholder="Paste Job Description to evaluate them against..." value={jd} onChange={e => setJd(e.target.value)} rows="3" style={{ width: '100%', marginBottom: '1rem' }} />
      <button className="btn primary-btn" onClick={handleCompare} disabled={loading || selectedIds.length < 2}>
        {loading ? 'Comparing...' : 'Run Comparison'}
      </button>

      {data && !data.error && (
        <div style={{ marginTop: '2rem' }}>
          <h4>Summary</h4>
          <p style={{ margin: '1rem 0' }}>{data.summary}</p>
          <h4>Rankings</h4>
          {(data.ranked_resumes || []).map((r, i) => (
            <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
              <h5>Rank {r.rank}: Resume #{r.resume_id} (Match: {r.match_score}%)</h5>
              <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <h6 style={{ color: 'var(--success)' }}>Strengths:</h6>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>{(r.strengths || []).map((s, j) => <li key={j}>{s}</li>)}</ul>
                </div>
                <div style={{ flex: 1 }}>
                  <h6 style={{ color: 'var(--danger)' }}>Weaknesses:</h6>
                  <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>{(r.weaknesses || []).map((w, j) => <li key={j}>{w}</li>)}</ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {data?.error && <div style={{ color: 'var(--danger)', marginTop: '1rem' }}>{data.error}</div>}
    </div>
  );
}

function JobRecommendations({ token, resumeId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_V2}/recommend-jobs/${resumeId}`, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      alert("Error fetching recommendations");
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>AI Job Recommendations</h3>
      <button className="btn primary-btn" onClick={handleFetch} disabled={loading} style={{ margin: '1rem 0' }}>
        {loading ? 'Generating...' : 'Get Recommendations'}
      </button>
      {data?.roles && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.roles.map((r, i) => (
            <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <h4>{r.title} ({r.match_percentage}%)</h4>
              <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>{r.reason}</p>
              <h5>Learning Roadmap:</h5>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-muted)' }}>
                {(r.learning_roadmap || []).map((step, j) => <li key={j}>{step}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CoverLetter({ token, resumeId }) {
  const [jd, setJd] = useState('');
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!jd) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_V2}/cover-letter`, { resume_id: resumeId, job_description: jd }, { headers: { Authorization: `Bearer ${token}` } });
      setLetter(res.data.cover_letter);
    } catch (err) {
      alert("Error generating cover letter");
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Generate Cover Letter</h3>
      <textarea placeholder="Paste Job Description here..." value={jd} onChange={e => setJd(e.target.value)} rows="5" style={{ width: '100%', marginBottom: '1rem' }} />
      <button className="btn primary-btn" onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate'}
      </button>
      {letter && (
        <div style={{ marginTop: '1rem' }}>
          <textarea value={letter} readOnly rows="15" style={{ width: '100%', background: 'rgba(0,0,0,0.2)', color: 'white', padding: '1rem' }} />
        </div>
      )}
    </div>
  );
}

function LinkedInAnalyzer({ token }) {
  const [profile, setProfile] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_V2}/linkedin-analyzer`, { profile_text: profile }, { headers: { Authorization: `Bearer ${token}` } });
      setData(res.data);
    } catch (err) {
      alert("Error analyzing LinkedIn");
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>LinkedIn Profile Analyzer</h3>
      <textarea placeholder="Paste your LinkedIn About section/Profile text here..." value={profile} onChange={e => setProfile(e.target.value)} rows="5" style={{ width: '100%', marginBottom: '1rem' }} />
      <button className="btn primary-btn" onClick={handleAnalyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze Profile'}
      </button>
      {data && (
        <div style={{ marginTop: '1rem' }}>
          <h4>Profile Strength: {data.profile_strength}%</h4>
          <div style={{ marginTop: '1rem' }}>
            <h5>Headline Suggestions</h5>
            <ul>{(data.headline_suggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <h5>About Suggestions</h5>
            <p>{data.about_suggestions}</p>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <h5>Skills to Add</h5>
            <div className="tags-container">{(data.skills_to_add || []).map((s, i) => <span key={i}>{s}</span>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MockInterview({ token, resumeId }) {
  const [jd, setJd] = useState('');
  const [question, setQuestion] = useState('Tell me about yourself and your background.');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!answer) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_V2}/mock-interview/evaluate`, {
        resume_id: resumeId, job_description: jd, question, answer
      }, { headers: { Authorization: `Bearer ${token}` } });
      setFeedback(res.data);
    } catch (err) {
      alert("Error evaluating answer");
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>AI Mock Interview</h3>
      <textarea placeholder="Paste Job Description (Optional)..." value={jd} onChange={e => setJd(e.target.value)} rows="3" style={{ width: '100%', marginBottom: '1rem' }} />
      
      <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '1rem' }}>
        <h4>Question:</h4>
        <p style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{question}</p>
      </div>

      <textarea placeholder="Type your answer here..." value={answer} onChange={e => setAnswer(e.target.value)} rows="5" style={{ width: '100%', marginBottom: '1rem' }} />
      <button className="btn primary-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? 'Evaluating...' : 'Submit Answer'}
      </button>

      {feedback && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
          <h4>Score: {feedback.score}/10</h4>
          <div style={{ margin: '1rem 0' }}>
            <h5>Feedback:</h5>
            <p>{feedback.feedback}</p>
          </div>
          <div>
            <h5>Improved Answer:</h5>
            <p>{feedback.improved_answer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
