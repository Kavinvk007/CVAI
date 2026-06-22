import { Link } from 'react-router-dom';

function Landing() {
  return (
    <>
      <header className="hero">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/logo3.png" alt="CVAI Logo" style={{ width: '100%', maxWidth: '280px', height: 'auto', background: 'transparent', boxShadow: 'none', border: 'none', marginBottom: '1.5rem' }} />
        </div>
        <h1>AI Resume Analyzer & Interview Assistant</h1>
        <p>Upload your resume, get an ATS score, skill gap analysis, AI suggestions, and interview prep in seconds.</p>
        <Link to="/auth?mode=register" className="btn primary-btn" style={{textDecoration: 'none', display: 'inline-block', marginTop: '1rem'}}>
          Get Started
        </Link>
      </header>

      <footer style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.6)', fontSize: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'transparent', marginTop: '4rem' }}>
        © 2026 CVAI. All Rights Reserved.
      </footer>
    </>
  );
}

export default Landing;
