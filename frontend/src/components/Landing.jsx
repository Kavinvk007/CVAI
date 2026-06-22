import { Link } from 'react-router-dom';

function Landing() {
  return (
    <header className="hero">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img src="/logo3.png" alt="CVAI Logo" style={{ width: '100%', maxWidth: '280px', height: 'auto', background: 'transparent', boxShadow: 'none', border: 'none', marginBottom: '1.5rem', mixBlendMode: 'screen' }} />
      </div>
      <h1>AI Resume Analyzer & Interview Assistant</h1>
      <p>Upload your resume, get an ATS score, skill gap analysis, AI suggestions, and interview prep in seconds.</p>
      <Link to="/auth?mode=register" className="btn primary-btn" style={{textDecoration: 'none', display: 'inline-block', marginTop: '1rem'}}>
        Get Started
      </Link>
    </header>
  );
}

export default Landing;
