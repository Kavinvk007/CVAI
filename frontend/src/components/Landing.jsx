import { Link } from 'react-router-dom';

function Landing() {
  return (
    <header className="hero">
      <img src="/logo.png" alt="CVAI Logo" style={{ width: '100%', maxWidth: '300px', height: 'auto', marginBottom: '1.5rem' }} />
      <h1>AI Resume Analyzer & Interview Assistant</h1>
      <p>Upload your resume, get an ATS score, skill gap analysis, AI suggestions, and interview prep in seconds.</p>
      <Link to="/auth?mode=register" className="btn primary-btn" style={{textDecoration: 'none', display: 'inline-block', marginTop: '1rem'}}>
        Get Started
      </Link>
    </header>
  );
}

export default Landing;
