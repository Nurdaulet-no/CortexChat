// src/components/Message.jsx
import React from 'react';
// You might import FontAwesomeIcon for status ticks later

function Message({ message, currentUser, chatType }) { // Added chatType
  const { id, senderUsername, content, createdAt, isMe } = message;

  // Format time
  const timeString = new Date(createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`message-row ${isMe ? 'my-message' : 'other-message'}`}>
      {/* Render sender's name only for 'other' messages in a 'GROUP' chat */}
      {!isMe && chatType === 'GROUP' && (
        <div className="message-sender-name">{senderUsername}</div>
      )}
      <div className="message-bubble">
        <div className="message-content">{content}</div>
        <div className="message-meta">
          <span className="message-time">{timeString}</span>
          {/* Placeholder for message status icons (e.g., sent, delivered, read) */}
          {isMe && (
            <span className="message-status">
              {/* Example: <FontAwesomeIcon icon={faCheckDouble} /> */}
               {/* Placeholder icons - styles are in chat-layout.css */}
               {/* Assuming 'sent' state by default for optimistic/first send */}
               {/* Add logic here to show one check, two checks, or blue checks based on actual status */}
              <i className="fas fa-check"></i>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Message;