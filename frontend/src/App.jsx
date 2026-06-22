import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import { ToastProvider } from './components/Toast';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState({
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('name'),
    is_admin: localStorage.getItem('is_admin') === 'true'
  });

  const handleLogin = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user_id', data.user_id);
    localStorage.setItem('name', data.name);
    localStorage.setItem('is_admin', data.is_admin);
    setToken(data.access_token);
    setUser({ id: data.user_id, name: data.name, is_admin: data.is_admin });
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <ToastProvider>
      <Router>
        <Navbar token={token} onLogout={handleLogout} />
        <div className="page active">
          <Routes>
            <Route path="/" element={!token ? <Landing /> : <Navigate to="/dashboard" />} />
            <Route path="/auth" element={!token ? <Auth onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard/*" element={token ? <Dashboard token={token} user={user} /> : <Navigate to="/auth" />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
