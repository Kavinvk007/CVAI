import { Link } from 'react-router-dom';

function Landing() {
  return (
    <header className="hero">
      <h1>AI Resume Analyzer & Interview Assistant</h1>
      <p>Upload your resume, get an ATS score, skill gap analysis, AI suggestions, and interview prep in seconds.</p>
      <Link to="/auth?mode=register" className="btn primary-btn" style={{textDecoration: 'none', display: 'inline-block', marginTop: '1rem'}}>
        Get Started
      </Link>
    </header>
  );
}

export default Landing;
