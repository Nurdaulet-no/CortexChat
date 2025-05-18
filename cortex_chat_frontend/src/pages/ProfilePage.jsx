// src/pages/ProfilePage.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
// You might want a specific CSS file for this page
// import './ProfilePage.css';

function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading profile...</div>; // Or redirect if not authenticated
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Profile</h1>
      <p><strong>Username:</strong> {user.username}</p>
      <p><strong>First Name:</strong> {user.userFirstName || 'Not set'}</p>
      <p><strong>Email:</strong> {user.email || 'Not set'}</p>
      {/* Add more profile information and editing capabilities later */}
      <button onClick={() => window.history.back()}>Back to Chat</button>
    </div>
  );
}

export default ProfilePage;