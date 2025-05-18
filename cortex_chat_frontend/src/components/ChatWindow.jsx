import React, { useState, useEffect, useRef } from 'react';
import Message from './Message';


function ChatWindow({ selectedChat, messages, loadingMessages, messagesError, onSendMessage, currentUser, onHeaderClick }) {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
  };

  const handleSend = () => {
    if (messageInput.trim() && selectedChat) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-window-placeholder">
        Select a chat to start messaging.
      </div>
    );
  }

  let chatDisplayName = selectedChat.name;
  if (selectedChat.type === 'PRIVATE' && selectedChat.participantUsernames && currentUser) {
    chatDisplayName = selectedChat.participantUsernames.find(username => username !== currentUser.username) || selectedChat.name;
  }

  return (
    <>
      <div 
        className="chat-area-header"
        onClick={onHeaderClick}
        style={{ cursor: onHeaderClick ? 'pointer' : 'default' }}
        >
        <div className="chat-header-info">
          <div className="chat-header-name">{chatDisplayName}</div>
          <div className="chat-header-status">
            {selectedChat.type === 'PRIVATE' && 'private chat'}
            {selectedChat.type === 'GROUP' && `${selectedChat.participantUsernames?.length || 0} participants`}
          </div>
        </div>
        <div className="chat-header-actions">
          <i className="fas fa-search" />
          <i className="fas fa-ellipsis-v" />
        </div>
      </div>

      <div className="message-list-container">
        {loadingMessages && <div className="chat-window-placeholder small">Loading messages...</div>}
        {messagesError && <div className="error chat-window-placeholder small">{messagesError.message}</div>}
        {!loadingMessages && !messagesError && messages.length === 0 && (
          <div className="chat-window-placeholder small">No messages yet in this chat.</div>
        )}
        {!loadingMessages && !messagesError && messages.length > 0 && (
          messages.map(msg => (
            <Message
                key={msg.id}
                message={msg}
                currentUser={currentUser}
                chatType={selectedChat.type} // Pass chatType
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <button className="attach-button" aria-label="Attach file">
          <i className="fas fa-paperclip" />
        </button>
        <div className="input-field-wrapper">
            <textarea
                placeholder="Message..."
                className="message-input-field" // This class will now primarily control text styling, no bg/border
                value={messageInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                disabled={!selectedChat}
                rows={1}
            />
        </div>
        <button
          className="send-button"
          onClick={handleSend}
          disabled={!selectedChat || !messageInput.trim()}
          aria-label={messageInput.trim() ? "Send message" : "Record audio"}
        >
          <i className={`fas ${messageInput.trim() ? 'fa-paper-plane' : 'fa-microphone'}`} />
        </button>
      </div>
    </>
  );
}

export default ChatWindow;