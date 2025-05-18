// src/components/ChatList.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth.jsx'; // Needed to determine private chat display name
import ChatItem from './ChatItem.jsx'; 


// ChatList Component
function ChatList({ chats, isUserSearch, loading, error, selectedChatId, onSelectChat, currentUser }) {
  const { user } = useAuth(); // Get current user to pass to ChatItem for private chat naming

  // Render loading, error, or the list
  if (loading) {
    return <div style={{ textAlign: 'center', color: '#8e9297', padding: '20px' }}>Loading chats...</div>;
  }

  if (error) {
    return <div className="error" style={{ textAlign: 'center', padding: '20px' }}>{error.message}</div>;
  }

  if (!chats || chats.length === 0) {
    return <div style={{ textAlign: 'center', color: '#8e9297', padding: '20px' }}>No chats found.</div>;
  }

  if (!loading && !error && (!chats || chats.length === 0)) {
    return <div style={{ textAlign: 'center', color: '#8e9297', padding: '20px' }}>
             {isUserSearch ? "No users found matching your search." : "No chats found."}
           </div>;
  }

  // Sort chats (optional, based on your preference or backend sort)
  // You might sort by last message time later
   const sortedChats = [...chats].sort((a, b) => {
       // Example sort: Groups first, then by name
       if (a.type === 'GROUP' && b.type !== 'GROUP') return -1;
       if (a.type !== 'GROUP' && b.type === 'GROUP') return 1;
       const nameA = a.name || `Chat ${a.id}`;
       const nameB = b.name || `Chat ${b.id}`;
       return nameA.localeCompare(nameB);
   });


  return (
    // Render the list of ChatItem components
    <> {/* Use a Fragment or div if you need a container */}
      {sortedChats.map(item => (
        <ChatItem
          key={item.id} // Important for React lists
          itemData={item} // Pass the chat object
          onSelect={onSelectChat} // Pass the handler function
          isSelected={!isUserSearch && selectedChatId === item.id} // Determine if this item is selected
          currentUser={currentUser} // Pass the current user
          isUserSearchItem={isUserSearch} 
        />
      ))}
    </>
  );
}

export default ChatList;