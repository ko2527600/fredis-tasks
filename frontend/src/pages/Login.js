import React, { useState, useEffect } from 'react';
import { login, register } from '../api';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    '/fredrica1.jpeg',
    '/frefrica2.jpeg',
    '/fredrica3.jpeg',
    '/fredrica4.jpeg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = () => {
    const errors = {};
    if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    if (username.length > 50) errors.username = 'Username must be less than 50 characters';
    if (!/^[a-zA-Z0-9]*$/.test(username)) errors.username = 'Username must be alphanumeric';
    if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (password.length > 100) errors.password = 'Password must be less than 100 characters';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = isRegister
        ? await register(username, password)
        : await login(username, password);

      localStorage.setItem('token', response.data.access_token);
      onLogin();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'An error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundImage: `url(${images[currentImageIndex]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-image 1s ease-in-out',
      position: 'relative'
    }}>
      {/* Dark overlay for better text visibility */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1
      }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
              <div className="card-body">
                <h2 className="card-title text-center mb-2" style={{ color: '#ff69b4', fontWeight: 'bold' }}>
                  💕 Fredrica's Tasks 💕
                </h2>
                <p className="text-center text-muted mb-4" style={{ fontSize: '14px' }}>
                  Made with love by Ohene
                </p>

                {error && <div className="alert alert-danger alert-dismissible fade show">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Username</label>
                    <input
                      id="username"
                      type="text"
                      className={`form-control ${validationErrors.username ? 'is-invalid' : ''}`}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      disabled={loading}
                    />
                    {validationErrors.username && (
                      <div className="invalid-feedback d-block">{validationErrors.username}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      id="password"
                      type="password"
                      className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      disabled={loading}
                    />
                    {validationErrors.password && (
                      <div className="invalid-feedback d-block">{validationErrors.password}</div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn w-100"
                    style={{ backgroundColor: '#ff69b4', color: 'white', fontWeight: 'bold' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Loading...
                      </>
                    ) : isRegister ? 'Register' : 'Login'}
                  </button>
                </form>

                <div className="text-center mt-3">
                  <button
                    className="btn btn-link"
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError('');
                      setValidationErrors({});
                    }}
                    disabled={loading}
                  >
                    {isRegister
                      ? 'Already have an account? Login'
                      : "Don't have an account? Register"}
                  </button>
                </div>
              </div>
            </div>

            {/* Image indicator dots */}
            <div className="text-center mt-4">
              {images.map((_, index) => (
                <span
                  key={index}
                  style={{
                    height: '10px',
                    width: '10px',
                    margin: '0 5px',
                    backgroundColor: index === currentImageIndex ? '#ff69b4' : 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '50%',
                    display: 'inline-block',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                  onClick={() => setCurrentImageIndex(index)}
                ></span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
