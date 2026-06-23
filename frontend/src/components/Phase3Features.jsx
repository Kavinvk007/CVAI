import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from './Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_V3 = `${API_BASE}/api/v3`;

export default function Phase3Features() {
  const is_admin = localStorage.getItem('is_admin') === 'true';
  const [activeTab, setActiveTab] = useState(is_admin ? 'analytics' : 'versions');
  const resumeId = localStorage.getItem('current_resume_id');
  const token = localStorage.getItem('token');

  const tabs = [
    { id: 'analytics', label: 'Admin Analytics', adminOnly: true },
    { id: 'versions', label: 'Resume Versions' },
    { id: 'exports', label: 'Reports & Exports' },
  ].filter(t => !t.adminOnly || is_admin);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="feature-tabs-container">
        {tabs.map(t => (
          <button 
            key={t.id} 
            className={`feature-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <div className="card">
        {activeTab === 'analytics' && <AnalyticsDashboard token={token} />}
        {activeTab === 'versions' && <ResumeVersions token={token} resumeId={resumeId} />}
        {activeTab === 'exports' && <ReportsExports token={token} resumeId={resumeId} />}
      </div>
    </div>
  );
}

function AnalyticsDashboard({ token }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    api.get(`/api/v3/analytics/dashboard`)
      .then(res => setData(res.data))
      .catch(err => {
        if (err.response) {
          if (err.response.status === 403) {
            setError("Admin access required. Please login with an admin account.");
          } else if (err.response.status === 401) {
            setError("Session expired. Please login again.");
          } else if (err.response.status === 500) {
            setError(`Backend Error: ${err.response.data?.detail || err.response.data?.message || "Internal Server Error"}`);
          } else {
            setError(err.response.data?.detail || "An error occurred fetching analytics.");
          }
        } else {
          setError(err.message);
        }
      });
  }, [token]);

  if (error) return <div style={{color:'var(--danger)'}}>{error}</div>;
  if (!data) return (
    <div>
      <h3>Admin Analytics Dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className="skeleton-loader skeleton-text title"></div>
          <div className="skeleton-loader skeleton-box" style={{ height: '40px' }}></div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div className="skeleton-loader skeleton-text title"></div>
          <div className="skeleton-loader skeleton-box" style={{ height: '40px' }}></div>
        </div>
      </div>
    </div>
  );

  if (data.total_resumes === 0 && Object.keys(data.events || {}).length === 0) {
    return (
      <div>
        <h3>Admin Analytics Dashboard</h3>
        <p style={{marginTop: '1rem', color: 'var(--text-muted)'}}>No analytics data yet. Use the app features to generate analytics.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Admin Analytics Dashboard</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <h4>Total Resumes Processed</h4>
          <p style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 'bold' }}>{data.total_resumes}</p>
        </div>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
          <h4>Average ATS Score</h4>
          <p style={{ fontSize: '2rem', color: 'var(--success)', fontWeight: 'bold' }}>{data.average_ats_score}%</p>
        </div>
      </div>
      <div style={{ marginTop: '2rem' }}>
        <h4>Feature Usage Events</h4>
        <ul>
          {Object.entries(data.events || {}).map(([event, count]) => (
            <li key={event}>{event}: {count}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ResumeVersions({ token, resumeId }) {
  const [versions, setVersions] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    if (!resumeId) return;
    api.get(`/api/v3/resume/${resumeId}/versions`)
      .then(res => setVersions(res.data))
      .catch(err => {
        if (err.response?.status !== 401) {
          addToast("Failed to fetch versions", "error");
        }
      });
  }, [token, resumeId, addToast]);

  if (!resumeId) return <div>Please upload a resume first to view its versions.</div>;

  return (
    <div>
      <h3>Resume Version History</h3>
      {versions.length === 0 ? <p>No versions found.</p> : (
        <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', textAlign: 'left' }}>
              <th style={{ padding: '0.5rem' }}>Version ID</th>
              <th style={{ padding: '0.5rem' }}>File Name</th>
              <th style={{ padding: '0.5rem' }}>ATS Score</th>
              <th style={{ padding: '0.5rem' }}>Uploaded At</th>
            </tr>
          </thead>
          <tbody>
            {versions.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <td style={{ padding: '0.5rem' }}>{v.id} {v.id == resumeId ? '(Current)' : ''}</td>
                <td style={{ padding: '0.5rem' }}>{v.file_name}</td>
                <td style={{ padding: '0.5rem' }}>{v.ats_score || 'N/A'}%</td>
                <td style={{ padding: '0.5rem' }}>{new Date(v.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function ReportsExports({ token, resumeId }) {
  const { addToast } = useToast();
  
  const handlePdfExport = () => {
    if (!resumeId) {
      addToast("Please upload and analyze a resume first.", "error");
      return;
    }
    window.open(`${API_V3}/export/pdf/${resumeId}?token=${token}`, '_blank');
  };

  const handleCsvExport = () => {
    window.open(`${API_V3}/export/csv/users?token=${token}`, '_blank');
  };

  return (
    <div>
      <h3>Reports & Exports</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>Download Analysis PDF</h4>
            <p style={{ color: 'var(--text-muted)' }}>Get a formatted PDF report of your latest resume analysis.</p>
          </div>
          <button className="btn primary-btn" onClick={handlePdfExport}>Export PDF</button>
        </div>
        
        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4>Admin CSV Export</h4>
            <p style={{ color: 'var(--text-muted)' }}>Download all registered users and basic data. (Admin only)</p>
          </div>
          <button className="btn secondary-btn" onClick={handleCsvExport}>Export CSV</button>
        </div>
      </div>
    </div>
  );
}
