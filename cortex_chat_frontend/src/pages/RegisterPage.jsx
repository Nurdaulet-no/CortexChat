// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link for internal navigation
// Note: No need to import useAuth here unless you need to check authentication status
import { apiFetch } from '../api/api.js'; // Import the API fetch helper

import '../styles/auth-shared.css';
import '../styles/RegisterPage.css'; 

function RegisterPage() {
  // State for form inputs
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState(''); // Assuming this maps to backend userFirstName
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // State for UI feedback
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null); // State for showing success message

  const navigate = useNavigate(); // Hook for navigation

  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(null); // Clear previous errors
    setSuccessMessage(null); // Clear previous success messages
    setLoading(true); // Start loading indicator

    // --- Basic Frontend Validation (from your old register.js) ---
    if (password !== confirmPassword) {
      setError(new Error('Passwords do not match!'));
      setLoading(false);
      return;
    }
    if (password.length < 8 || password.length > 25) {
      setError(new Error('Password must be between 8 and 25 characters long.'));
      setLoading(false);
      return;
    }

    const userData = {
      username: username.trim(),
      userFirstName: firstName.trim(), // Ensure field name matches your backend DTO
      email: email.trim(),
      password: password, // Send the plain password
    };

    try {
      // Call your backend registration endpoint using the apiFetch helper
      // Ensure your backend registration endpoint is POST /api/auth/register
      // and expects a body matching your registration DTO (e.g., RegisterRequest)
      const responseData = await apiFetch('/auth/register', { // Assuming '/auth/register' is the endpoint
        method: 'POST',
        // apiFetch handles JSON stringification and setting Content-Type for object bodies
        body: userData,
      });

      // Assuming your backend returns a success status (like 200 OK or 201 Created)
      // and possibly a confirmation message or the created user details in the body
      console.log('Registration successful!', responseData);
      setSuccessMessage('Account created successfully! Redirecting to login...'); // Show success message

      // Redirect to login page after a delay
      setTimeout(() => {
        // Navigate to the login page, passing state to trigger success message display
        navigate('/login', { replace: true, state: { fromRegisterSuccess: true } });
      }, 2000); // Redirect after 2 seconds

    } catch (err) {
      // Handle registration API errors (e.g., 409 Conflict, validation errors)
      console.error('Registration failed:', err);
       // apiFetch throws errors with a 'status' property if it's an HTTP error
       if (err.status === 409) {
            setError(new Error(`Registration failed: Username or email already exists.`));
       } else if (err.status === 400) {
            // Handle backend validation errors - your backend DTO might return error details
            // err.message might contain details from apiFetch if backend sends JSON error
             setError(new Error(`Registration failed: ${err.message || 'Invalid data provided.'}`));
       }
      else {
         setError(new Error(`Registration error: ${err.message || 'Something went wrong during registration.'}`));
      }
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // Render the registration form
  return (
    <div className="register-page-wrapper">
      <div className="register-container"> {/* Use a class for your container, integrate register.css */}
          <h2>Register</h2>

          {/* Display success message */}
          {successMessage && (
              <div style={{
                  background: 'rgba(46, 204, 113, 0.9)',
                  color: '#fff',
                  textAlign: 'center',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)'
              }}>{successMessage}</div>
          )}

          {/* Display error message */}
          {error && <div className="error">{error.message}</div>}

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading || !!successMessage}
                // Add autocomplete for username
                autoComplete="username"
              />
              <label htmlFor="username">Username</label>
            </div>

            <div className="input-group">
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading || !!successMessage}
                // Optional: Add autocomplete for given-name or name
                // autocomplete="given-name"
              />
              <label htmlFor="firstName">First Name</label>
            </div>

            <div className="input-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || !!successMessage}
                // Add autocomplete for email
                autoComplete="email"
              />
              <label htmlFor="email">Email</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !!successMessage}
                // Add autocomplete for new password
                autoComplete="new-password"
              />
              <label htmlFor="password">Password</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !!successMessage}
                // Add autocomplete for new password (or sometimes "off")
                autoComplete="new-password" // Or autocomplete="off"
              />
              <label htmlFor="confirmPassword">Confirm Password</label>
            </div>

            <button type="submit" disabled={loading || !!successMessage}>
              {loading ? 'Registering...' : 'Register'}
            </button>

            <p>
                Already have an account?
                {/* Use <Link> for internal navigation to the /login route */}
                <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
    </div>
  );
}

export default RegisterPage;