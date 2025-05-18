// src/components/OverlayMenu.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useNavigate } from 'react-router-dom'; 
import CreateGroupModal from './CreateGroupModal'; 
import '../styles/OverlayMenu.css';

function OverlayMenu({ isOpen, onClose, onGroupCreated }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  console.log('OverlayMenu isOpen prop:', isOpen);

  const [isCreateGroupModalOpen, setCreateGroupModalOpen] = useState(false);

  if (!isOpen) {
    return null; // Don't render if not open
  }

  const handleNavigateToProfile = () => {
    navigate('/profile');
    onClose();
  };

  // Placeholder for user avatar - replace with actual logic if you have avatar URLs
  const userAvatar = user?.avatarUrl /* || defaultAvatar */;
  const userName = user?.userFirstName || user?.username || 'User'; // Display name preference
  const userHandle = user?.username ? `@${user.username}` : '';

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleOpenCreateGroupModal = () => {
    setCreateGroupModalOpen(true);
  };

  const handleModalClose = () => {
    setCreateGroupModalOpen(false);
  };

  const handleActualGroupCreated = (newGroup) => {
    setCreateGroupModalOpen(false); // Close modal
    onClose(); // Close the overlay menu itself

    if (onGroupCreated) { // This callback is from ChatPage
      onGroupCreated(newGroup); // This will trigger chat list refresh and navigation in ChatPage
    } 
    // else if (newGroup && newGroup.id) {
    //   // Fallback navigation if onGroupCreated is not provided, though less ideal
    //   navigate(`/chat/${newGroup.id}`);
    // }
  };

  return (
    <>
      {/* Clickable background to close the menu */}
      <div className="overlay-menu-background" onClick={onClose}></div>

      <div className={`overlay-menu-panel ${isOpen ? 'open' : ''}`}>
        <div className="overlay-menu-header">
          {userAvatar ? (
            <img src={userAvatar} alt="User Avatar" className="menu-user-avatar" />
          ) : (
            <div className="menu-user-avatar placeholder-avatar">
              {userName.substring(0, 1).toUpperCase()}
            </div>
          )}
          <div className="menu-user-info">
            <div className="menu-user-name">{userName}</div>
            <div className="menu-user-handle">{userHandle}</div>
          </div>
        </div>

        <div className="overlay-menu-content">
          {/* Example Items - customize these */}
          <button className="menu-item" onClick={() => alert('Set Emoji Status clicked!')}>
            <i className="fas fa-smile"></i> {/* Placeholder icon */}
            <span>Set emoji status</span>
          </button>

          <button className="menu-item" onClick={handleNavigateToProfile}>
          <i className="fas fa-user-circle"></i>
          <span>My profile</span>
        </button>

          <button className="menu-item" onClick={handleOpenCreateGroupModal}>
            <i className="fas fa-users"></i> {/* Placeholder icon */}
            <span>Create a group</span>
          </button>

          <button className="menu-item" onClick={() => alert('Create Channel clicked!')}>
            <i className="fas fa-bullhorn"></i> {/* Placeholder icon */}
            <span>Create a channel</span>
          </button>

          {/* Night Mode Toggle - You'll need state for this if you implement it fully */}
          <div className="menu-item menu-item-toggle">
            <span>
              <i className="fas fa-moon"></i>
              Night mode
            </span>
            <label className="switch">
              <input
                type="checkbox"
                checked={theme === 'dark'} // <-- SET CHECKED STATE
                onChange={handleToggleTheme} // <-- USE HANDLER
              />
              <span className="slider round"></span>
            </label>
          </div>

          {/* Logout Button */}
          <button className="menu-item menu-item-logout" onClick={() => { logout(); onClose(); }}>
            <i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i> {/* Placeholder icon */}
            <span style={{ color: 'red' }}>Logout</span>
          </button>
        </div>
      </div>

      {isCreateGroupModalOpen && (
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={handleModalClose} // Separate close for modal itself
          onGroupCreated={handleActualGroupCreated} // This handles post-creation logic
        />
      )}
    </>
  );
}

export default OverlayMenu;