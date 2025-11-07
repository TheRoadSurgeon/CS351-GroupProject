import { useState } from 'react';
import '../Auth.css';

function Signup({ onSignup, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    password: '',
    confirmPassword: '',
    userType: 'donor' // 'donor' or 'foodbank'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    // TODO: Implement actual signup logic
    console.log('Signup attempt:', formData);
    
    // Placeholder - replace with actual API call
    onSignup(formData);
  };

  const handleGoogleSignup = () => {
    // TODO: Implement Google OAuth
    console.log('Google signup clicked');
  };

  return (
    <div className="auth-container">
      <div className="auth-card signup-card">
        <div className="auth-header">
          <h1>Food Bank Helper</h1>
          <h2>Create Your Account</h2>
          <p>Join us in making a difference in your community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dob">Date of Birth</label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
            />
          </div>

          <div className="form-group">
            <label>I am a:</label>
            <div className="user-type-selector">
              <label className={`type-option ${formData.userType === 'donor' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="donor"
                  checked={formData.userType === 'donor'}
                  onChange={handleChange}
                />
                <span className="type-card">
                  <strong>Donor</strong>
                  <small>I want to donate food items</small>
                </span>
              </label>
              <label className={`type-option ${formData.userType === 'foodbank' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="foodbank"
                  checked={formData.userType === 'foodbank'}
                  onChange={handleChange}
                />
                <span className="type-card">
                  <strong>Food Bank</strong>
                  <small>I represent a food bank organization</small>
                </span>
              </label>
            </div>
          </div>

          <div className="terms-agreement">
            <label className="checkbox-label">
              <input type="checkbox" required />
              <span>
                I agree to the{' '}
                <a href="#" className="terms-link">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="terms-link">Privacy Policy</a>
              </span>
            </label>
          </div>

          <button type="submit" className="btn-primary">
            Create Account
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button type="button" className="btn-google" onClick={handleGoogleSignup}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Sign up with Google
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="link-button">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;