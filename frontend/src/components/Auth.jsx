import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useToast } from './Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Auth({ onLogin }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorFields, setErrorFields] = useState([]);

  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        const res = await axios.post(`${API_BASE}/auth/login`, formData);
        
        // Clear forms and state
        setEmail('');
        setPassword('');
        addToast('Login successful!', 'success');
        
        onLogin(res.data);
      } else {
        await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        addToast('Registration successful! Please login.', 'success');
        setMode('login');
        setSearchParams({ mode: 'login' });
        setPassword('');
      }
    } catch (err) {
      if (err.response) {
        if (err.response.data && err.response.data.detail) {
          const d = err.response.data.detail;
          if (Array.isArray(d)) {
            const fields = [];
            const messages = [];
            d.forEach(e => {
              const field = e.loc[e.loc.length - 1];
              fields.push(field);
              let msg = e.msg;
              if (msg.startsWith('Value error, ')) {
                msg = msg.replace('Value error, ', '');
              } else if (e.type === 'missing') {
                msg = `Missing required field: ${field}`;
              }
              messages.push(msg);
            });
            setErrorFields(fields);
            addToast(messages.join(" | "), 'error');
          } else {
            if (d === 'Email already registered') {
              addToast("An account with this email already exists.", "error");
              setErrorFields(['email']);
            } else {
              addToast(d, 'error');
            }
          }
        } else {
          addToast(`Server Error: ${err.response.statusText}`, 'error');
        }
      } else if (err.request) {
        addToast('Network Error: Could not reach the backend server.', 'error');
      } else {
        addToast('Error: ' + err.message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
    setPassword('');
    setErrorFields([]);
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
            onChange={e => { setName(e.target.value); setErrorFields(prev => prev.filter(f => f !== 'name')); }} 
            disabled={isLoading}
            style={errorFields.includes('name') ? { border: '2px solid var(--danger)' } : {}}
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          required 
          value={email} 
          onChange={e => { setEmail(e.target.value); setErrorFields(prev => prev.filter(f => f !== 'email')); }} 
          disabled={isLoading}
          style={errorFields.includes('email') ? { border: '2px solid var(--danger)' } : {}}
        />
        <input 
          type="password" 
          placeholder="Password" 
          required 
          value={password} 
          onChange={e => { setPassword(e.target.value); setErrorFields(prev => prev.filter(f => f !== 'password')); }} 
          disabled={isLoading}
          style={errorFields.includes('password') ? { border: '2px solid var(--danger)' } : {}}
        />
        <button type="submit" className="btn primary-btn" disabled={isLoading}>
          {isLoading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Register')}
        </button>
        
        {mode === 'login' ? (
          <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleMode('register'); }}>Register here</a></p>
        ) : (
          <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); toggleMode('login'); }}>Login here</a></p>
        )}
      </form>
    </div>
  );
}

export default Auth;
