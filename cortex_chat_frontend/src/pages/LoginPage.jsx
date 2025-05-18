// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import { useAuth } from '../hooks/useAuth'; // Import the auth hook
import { apiFetch } from '../api/api.js'; // Import the API fetch helper

import '../styles/auth-shared.css';
import '../styles/LoginPage.css';

function LoginPage() {
  // State for form inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // State for UI feedback
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // State for registration success

  // Hooks for navigation and auth state
  const navigate = useNavigate();
  const location = useLocation(); // Hook to access current URL details, including state
  const { login, isAuthenticated } = useAuth(); // Get login function and auth state

  // Effect to check if redirected from registration
  // This runs once when the component mounts
  useEffect(() => {
      // Check if there's state passed from navigation, like after successful registration
      if (location.state?.fromRegisterSuccess) {
          setShowSuccessMessage(true);
          // Optionally hide the message after a few seconds
          const timer = setTimeout(() => {
              setShowSuccessMessage(false);
          }, 5000); // Hide after 5 seconds (adjust as needed)
          return () => clearTimeout(timer); // Cleanup the timer
      }
  }, [location.state]); // Re-run if location state changes

  // Effect to redirect if already authenticated
  useEffect(() => {
      if (isAuthenticated) {
          // Use navigate to go to the chat page, replacing the current history entry
          navigate('/chat', { replace: true });
      }
  }, [isAuthenticated, navigate]); // Re-run this effect if isAuthenticated or navigate changes

  // If isAuthenticated is true, the useEffect above will trigger a redirect,
  // so we don't need to render anything from this point in the component's initial render.
  // This avoids briefly showing the login form before the redirect happens.
  if (isAuthenticated) {
      return null; // Or a small loading spinner/message if redirect isn't instantaneous
  }


  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default browser form submission
    setError(null); // Clear previous errors
    setLoading(true); // Start loading indicator

    try {
      // Call your backend login endpoint using the apiFetch helper
      // apiFetch automatically handles JSON stringification and adding Authorization header (though not needed for login)
      // Ensure your backend login endpoint is POST /api/auth/login and expects { username, password }
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        // The body should match the expected RequestBody DTO on your backend (e.g., LoginRequest)
        body: {
          username: username,
          password: password,
        },
        // apiFetch sets Content-Type: application/json by default for object bodies, but explicit is fine too.
        // headers: { 'Content-Type': 'application/json' }
      });

      // Assuming your backend returns { token: '...' } or a similar structure on successful login
      if (data && data.accessToken) {
        login(data.accessToken); // Use the login function from useAuth hook to store token and update state
        // The useEffect above listening to isAuthenticated will handle the redirect to /chat
      } else {
        // Handle case where API call was technically successful (e.g., 200) but the response body is not as expected (e.g., no token field)
        console.error('Login successful but no token received in response:', data);
        setError(new Error('Login failed: Unexpected response from server.'));
      }

    } catch (err) {
      // Handle API errors (e.g., 401 Unauthorized, network errors)
      console.error('Login failed:', err);
      // Use err.message or err.status from apiFetch's thrown error
      if (err.status === 401) { // Check if the error has a status property from apiFetch
         setError(new Error('Invalid username or password.'));
      } else {
         // Provide a generic message for other errors or include error details
         setError(new Error(`Login error: ${err.message || 'Something went wrong.'}`));
      }
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };

  // Render the login form
  return (
    <div className="login-page-wrapper">
        <div className="login-container"> {/* Use a class for your container, integrate login.css */}
        <h2>Login</h2>

        {/* Display success message if redirected from registration */}
        {showSuccessMessage && (
            <div className={`success-message ${showSuccessMessage ? 'visible' : ''}`}>
                Account Created Successfully!
            </div>


        )}
        {error && <div className="error">{error.message}</div>}
        <form onSubmit={handleLogin}>
                <div className="input-group">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    // Add autocomplete for username
                    autoComplete="username"
                  />
                  <label htmlFor="username">Username</label>
                </div>

                <div className="input-group">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    // Add autocomplete for current password
                    autoComplete="current-password"
                  />
                  <label htmlFor="password">Password</label>
                </div>

          <button type="submit" disabled={loading}> {/* Disable button while loading */}
            {loading ? 'Logging in...' : 'Login'} {/* Change button text while loading */}
          </button>

          <p>
              Don't have an account?
              <a href="/register">Register</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;