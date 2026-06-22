import { Link } from 'react-router-dom';
// Navigation bar component

function Navbar({ token, onLogout }) {
  return (
    <nav className="navbar">
      <div className="logo">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo1.png" alt="CVAI Logo" style={{ width: '36px', height: '36px' }} />
          CVAI
        </Link>
      </div>
      <div className="nav-links">
        {token ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>Logout</a>
          </>
        ) : (
          <>
            <Link to="/auth?mode=login">Login</Link>
            <Link to="/auth?mode=register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
