import { Link } from 'react-router-dom';

function Navbar({ token, onLogout }) {
  return (
    <nav className="navbar">
      <div className="logo"><Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>CVAI v2</Link></div>
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
