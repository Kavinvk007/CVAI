import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Auth({ onLogin }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (mode === 'login') {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post(`${API_BASE}/auth/login`, formData);
        onLogin(res.data);
      } else {
        await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        // Switch to login after successful register
        setMode('login');
        setSearchParams({ mode: 'login' });
        setPassword('');
      }
    } catch (err) {
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          const d = err.response.data.detail;
          if (Array.isArray(d)) {
            // Pydantic validation error
            setError(d.map(e => e.msg).join(", "));
          } else {
            setError(d);
          }
        } else {
          setError(`Server Error: ${err.response.statusText}`);
        }
      } else if (err.request) {
        setError('Network Error: Could not reach the backend server.');
      } else {
        setError('Error: ' + err.message);
      }
    }
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
    setError('');
  };

  return (
    <div className="auth-container" style={{display: 'block'}}>
      <h2>{mode === 'login' ? 'Login to CVAI' : 'Create an Account'}</h2>
      <form onSubmit={handleSubmit}>
        {mode === 'register' && (
          <input 
            type="text" 
            placeholder="Full Name" 
            required 
            value={name} 
            onChange={e => setName(e.target.value)} 
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          required 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
        />
        <button type="submit" className="btn primary-btn">
          {mode === 'login' ? 'Login' : 'Register'}
        </button>
        
        {mode === 'login' ? (
          <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleMode('register'); }}>Register here</a></p>
        ) : (
          <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleMode('login'); }}>Login here</a></p>
        )}
      </form>
      {error && <div className="error-msg">{error}</div>}
    </div>
  );
}

export default Auth;
