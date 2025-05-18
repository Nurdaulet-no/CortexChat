// src/components/ChatItem.jsx

import React from 'react';
import { stringToHslColor } from '../utils/colors';
// import { formatDistanceToNowStrict } from 'date-fns';

function ChatItem({ itemData, onSelect, isSelected, currentUser, isUserSearchItem }) {

  // Helper to get theme-dependent avatar lightness/saturation
  // You would need to read the theme context here or pass it down,
  // but for simplicity, let's keep fixed S/L for now, which might look okay
  // in both themes depending on the colors generated.
  const avatarSaturation = 50;
  const avatarLightness = 60; // Adjust if needed for dark mode visibility

  if (isUserSearchItem) {
    // This is a UserDto from search results
    const userFromSearch = itemData;
    // Use stringToHslColor with consistent S and L
    const avatarColor = stringToHslColor(userFromSearch.username, avatarSaturation, avatarLightness);
    const defaultInitial = userFromSearch.username ? userFromSearch.username.substring(0, 1).toUpperCase() : '?';

    return (
      <div
        className={`chat-item search-result-item ${isSelected ? 'active' : ''}`}
        onClick={() => onSelect(userFromSearch.username)}
        data-item-type="user-search-result"
        data-username={userFromSearch.username}
      >
        <div className="chat-avatar" style={{ backgroundColor: avatarColor }}>
          <span>{defaultInitial}</span>
        </div>
        <div className="chat-info">
          <div className="chat-name" style={{ justifyContent: 'flex-start' }}>
            {userFromSearch.username}
          </div>
        </div>
      </div>
    );
  }

  // This is a ChatRoomDto
  const chatRoom = itemData;
  // console.log(`ChatItem rendering for ID: ${chatRoom?.id}, Type: ${chatRoom?.type}`);
  // console.log("Full itemData (chatRoom):", JSON.stringify(itemData, null, 2));
  // console.log("chatLastMessageData directly from itemData:", JSON.stringify(itemData?.lastMessage, null, 2));
  const { id, name, type, participantUsernames, lastMessage: chatLastMessageData } = chatRoom;

  // console.log("chatLastMessageData after destructuring:", JSON.stringify(chatLastMessageData, null, 2));
  // console.log("chatLastMessageData.content:", chatLastMessageData?.content);

  let displayName = name;
  if (type === 'PRIVATE' && participantUsernames && participantUsernames.length >= 1 && currentUser) {
    // Find the other participant's username
    const otherUsername = participantUsernames.find(username => username !== currentUser.username);
    displayName = otherUsername || name || 'Private Chat'; // Use other username, fallback to name, then default
  } else if (type === 'GROUP' && !name) {
    displayName = `Group ${id}`; // Fallback name for unnamed groups
  }
  const finalDisplayName = displayName || (type === 'GROUP' ? 'Group Chat' : (type === 'PRIVATE' ? 'Private Chat' : 'Chat')); // Final display name fallback

  const defaultInitial = finalDisplayName ? finalDisplayName.substring(0, 1).toUpperCase() : (type === 'GROUP' ? 'G' : (type === 'PRIVATE' ? 'P' : '?'));

  // Use stringToHslColor with consistent S and L, based on display name or ID
  const avatarColorKey = finalDisplayName || id.toString();
  const avatarColor = stringToHslColor(avatarColorKey, avatarSaturation, avatarLightness);


  const avatarJsx = (
    <div className="chat-avatar" style={{ backgroundColor: avatarColor }}>
      <span>{defaultInitial}</span>
    </div>
  );

  let chatIconJsx = null;
  if (type === 'GROUP') chatIconJsx = <i className="fas fa-users chat-icon"></i>;
  else if (type === 'PRIVATE') chatIconJsx = <i className="fas fa-user chat-icon"></i>;

  let lastMessageText = "No messages yet..."; // More user-friendly initial text
  let lastMessageTime = "";
  let lastMessageSenderPrefix = "";

  if (chatLastMessageData && chatLastMessageData.content) {
      if (currentUser && chatLastMessageData.senderUsername === currentUser.username) {
        lastMessageSenderPrefix = "You: ";
      } else if (type === 'GROUP' && chatLastMessageData.senderUsername) {
        // For group chats, show sender's name if it's not the current user
        lastMessageSenderPrefix = `${chatLastMessageData.senderUsername}: `;
      }
      // Use message content, truncate if necessary
      const displayContent = chatLastMessageData.content.length > 40 // Adjusted length slightly
          ? chatLastMessageData.content.substring(0, 37) + '...'
          : chatLastMessageData.content;

      lastMessageText = `${lastMessageSenderPrefix}${displayContent}`;

      if (chatLastMessageData.createdAt) {
        try {
          const date = new Date(chatLastMessageData.createdAt);
          const now = new Date();
          // Simple time formatting
          if (date.toDateString() === now.toDateString()) {
              lastMessageTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          } else {
              lastMessageTime = date.toLocaleDateString([], { day: '2-digit', month: 'numeric' });
          }
        } catch (e) { console.error("Error formatting date:", e); lastMessageTime = ""; }
      }
    } else {
         // Handle case where lastMessage is null or content is empty
         lastMessageText = "No messages yet...";
         lastMessageTime = ""; // No time if no message
    }


  return (
    <div
      className={`chat-item ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(id)}
      data-chat-id={id}
    >
      {avatarJsx}
      <div className="chat-info">
        <div className="chat-header">
          <div className="chat-name">{chatIconJsx}{finalDisplayName}</div>
          <div className="chat-time">{lastMessageTime}</div>
        </div>
        <div className="chat-message">
          {/* Sender name prefix is already included in lastMessageText */}
          <span className="message-text">{lastMessageText}</span>
          {/* Optional: add unread count here later */}
          {/* <span className="message-counter">3</span> */}
          {/* Optional: add mute icon here later */}
          {/* <i className="fas fa-volume-slash muted-icon"></i> */}
        </div>
      </div>
    </div>
  );
}

export default ChatItem;