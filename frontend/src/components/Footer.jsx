export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logo">
          CVAI <span className="version-badge">v2</span>
        </div>
        <p className="footer-tagline">AI Resume Analyzer & Interview Assistant</p>
        <p className="footer-tech">Built with React, FastAPI, & Gemini AI</p>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} CVAI. All rights reserved.
      </div>
    </footer>
  );
}
