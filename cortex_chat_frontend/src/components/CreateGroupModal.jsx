// src/components/CreateGroupModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { searchUsers, createGroupChat } from '../api/api.js';
import { useAuth } from '../hooks/useAuth.jsx';
import '../styles/CreateGroupModal.css';

function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
  const { user: currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [error, setError] = useState('');

  const debouncedSearch = useCallback(
    async (query) => {
      if (query.trim().length < 1) {
        setSearchResults([]);
        return;
      }
      setIsLoadingSearch(true);
      setError(''); // Clear previous search errors
      try {
        const users = await searchUsers(query); // Uses new API function
        setSearchResults(
          users.filter(
            (u) =>
              u.username !== currentUser?.username &&
              !selectedUsers.find((su) => su.username === u.username)
          )
        );
      } catch (err) {
        console.error('Failed to search users:', err);
        setError('Failed to search users. Please try again.');
        setSearchResults([]);
      }
      setIsLoadingSearch(false);
    },
    [currentUser, selectedUsers]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        debouncedSearch(searchTerm);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, debouncedSearch]);

  useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setSearchTerm('');
      setSearchResults([]);
      setSelectedUsers([]);
      setError('');
      setIsLoadingCreate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddUser = (userToAdd) => {
    if (!selectedUsers.find((u) => u.username === userToAdd.username)) {
      setSelectedUsers([...selectedUsers, userToAdd]);
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const handleRemoveUser = (userToRemove) => {
    setSelectedUsers(selectedUsers.filter((u) => u.username !== userToRemove.username));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Попытка отправки группы. groupName (до trim):', groupName, 'groupName (после trim):', groupName.trim()); 
    if (groupName.trim().length < 2 || groupName.trim().length > 50) {
      setError('Group name must be between 2 and 50 characters.');
      console.log('Фронтенд: Название группы не прошло проверку');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please add at least one participant to the group.');
      console.log('Фронтенд: Нет выбранных пользователей'); 
      return;
    }
    setError('');
    setIsLoadingCreate(true);

    const participantUsernames = selectedUsers.map((u) => u.username);

    try {
      const newGroup = await createGroupChat(groupName.trim(), participantUsernames);
      setIsLoadingCreate(false);
      onGroupCreated(newGroup); // Propagate new group data
      onClose();
    } catch (err) {
      setIsLoadingCreate(false);
      setError(err.message || 'Failed to create group. Please try again.');
      console.error('Group creation failed:', err);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button onClick={onClose} className="modal-close-button">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <p className="error-message">{error}</p>}
            <div className="form-group">
              <label htmlFor="groupName">Group Name</label>
              <input
                type="text"
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name (2-50 characters)"
                required
                minLength="2"
                maxLength="50"
                disabled={isLoadingCreate}
              />
            </div>

            <div className="form-group">
              <label htmlFor="userSearch">Add Participants</label>
              <input
                type="text"
                id="userSearch"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for users to add"
                disabled={isLoadingCreate}
              />
              {isLoadingSearch && <p className="empty-state-message">Searching...</p>}
              {searchResults.length > 0 && (
                <ul className="search-results-list">
                  {searchResults.map((user) => (
                    <li key={user.id || user.username} onClick={() => handleAddUser(user)}> {/* Use ID if available */}
                      {user.username}
                    </li>
                  ))}
                </ul>
              )}
              {!isLoadingSearch && searchTerm && searchResults.length === 0 && (
                 <p className="empty-state-message">No users found matching "{searchTerm}".</p>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="selected-users-container">
                <h4>Selected Participants:</h4>
                <ul className="selected-users-list">
                  {selectedUsers.map((user) => (
                    <li key={user.id || user.username} className="selected-user-item">
                      <span>{user.username}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(user)}
                        className="remove-user-button"
                        title={`Remove ${user.username}`}
                        disabled={isLoadingCreate}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
             {!selectedUsers.length && !isLoadingSearch && ( // Show only if not searching and no users selected
                <p className="empty-state-message">No participants added yet.</p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="modal-button secondary" disabled={isLoadingCreate}>
              Cancel
            </button>
            <button type="submit" className="modal-button primary" disabled={isLoadingCreate || groupName.trim().length < 2 || selectedUsers.length === 0}>
              {isLoadingCreate ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGroupModal;