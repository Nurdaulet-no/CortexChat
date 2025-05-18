// src/pages/ChatPage.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiFetch, getOrCreatePrivateChat, searchUsers, createGroupChat, deleteParticipantFromRoom } from '../api/api.js'; 
import { useStomp } from '../contexts/StompContext.jsx';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

import '../styles/chat-layout.css';

// Import Child Components
import ChatList from '../components/ChatList.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import InfoPanel from '../components/InfoPanel.jsx';
import SearchBar from '../components/SearchBar.jsx';

// Menu in section-1
import OverlayMenu from '../components/OverlayMenu.jsx';
import '../styles/OverlayMenu.css'; 
import '../styles/chat-layout.css';
import '../styles/info-panel.css';


const MIN_SECTION2_WIDTH = 280; // Minimum width for section-2
const MAX_SECTION2_WIDTH = 600; // Maximum width for section-2

function ChatPage() {
  const { user, logout, isAuthenticated, accessToken } = useAuth(); // Get isAuthenticated and accessToken
  const { stompClient, isConnected } = useStomp();
  const navigate = useNavigate(); 

  // State
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // Stores the full ChatRoomDto of the selected chat
  const [messages, setMessages] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatsError, setChatsError] = useState(null);
  const [messagesError, setMessagesError] = useState(null);
  const activeSubscription = useRef(null);

  // State for Info Panel visibility
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  // State for search results (if integrating user search directly here)
  const [searchResults, setSearchResults] = useState(null); // null = no search, [] = search done, no results

  const [section2Width, setSection2Width] = useState(320); // Initial width from CSS
  const isResizing = useRef(false);
  const chatAppContainerRef = useRef(null);

  const [isOverlayMenuOpen, setIsOverlayMenuOpen] = useState(false);

  const toggleOverlayMenu = () => {
    console.log('Toggling overlay menu. Current state:', isOverlayMenuOpen);
    setIsOverlayMenuOpen(prev => !prev);
  };

  const handleMouseDownOnSplitter = useCallback((e) => {
    e.preventDefault(); // Prevent text selection
    isResizing.current = true;
    // Add mousemove and mouseup listeners to the document
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing.current || !chatAppContainerRef.current) {
      return;
    }

    // Calculate new width based on mouse position relative to the app container's left edge
    // This assumes the splitter is between section-2 and section-3
    // and section-1 has a fixed width.
    const section1Width = 70; // Get this from CSS or state if it's dynamic
    const splitterWidth = 1;  // Get this from CSS

    // mouseX relative to the start of the chat-app-container
    const mouseX = e.clientX - chatAppContainerRef.current.getBoundingClientRect().left;

    let newSection2Width = mouseX - section1Width - (splitterWidth / 2);

    // Apply constraints
    if (newSection2Width < MIN_SECTION2_WIDTH) {
      newSection2Width = MIN_SECTION2_WIDTH;
    }
    // Max width constraint might also consider the width of section-3 not becoming too small
    const totalWidth = chatAppContainerRef.current.offsetWidth;
    const minSection3Width = 200; // Example minimum for section-3
    if (newSection2Width > totalWidth - section1Width - splitterWidth - minSection3Width) {
        newSection2Width = totalWidth - section1Width - splitterWidth - minSection3Width;
    }
    // Or a simpler max width
    if (newSection2Width > MAX_SECTION2_WIDTH) {
      newSection2Width = MAX_SECTION2_WIDTH;
    }


    setSection2Width(newSection2Width);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (isResizing.current) {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);


  // --- Load User's Chat Rooms ---
  const loadUserChats = useCallback(async () => {
    // Rely on isAuthenticated from useAuth
    if (!isAuthenticated) {
      console.log("ChatPage: Not authenticated, skipping chat load.");
      setLoadingChats(false);
      return;
    }

    console.log("ChatPage: User authenticated, loading chats...");
    setLoadingChats(true);
    setChatsError(null);
    // setChatRooms([]); // Optionally clear, or let the new data overwrite

    try {
      const chats = await apiFetch('/chats'); // GET /api/chats
      console.log("ChatPage: Fetched chats for list:", chats);
      setChatRooms(chats || []);
    } catch (err) {
      console.error('ChatPage: Failed to load user chats:', err);
      setChatsError(new Error(`Failed to load chats: ${err.message}`));
      if (err.status === 401 || err.status === 403) {
        console.log("ChatPage: Auth error during chat load, logging out.");
        logout();
      }
    } finally {
      setLoadingChats(false);
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    loadUserChats();
  }, [loadUserChats]);

  // --- Handle Selecting a Chat ---
  const handleSelectChat = useCallback((chatId) => {
    if (selectedChat?.id === chatId) {
      console.log("ChatPage: Chat already selected:", chatId);
      return; // Avoid re-selecting the same chat
    }

    const chatToSelect = chatRooms.find(chat => chat.id === chatId);
    if (chatToSelect) {
      console.log("ChatPage: Selecting chat:", chatToSelect);
      setSelectedChat(chatToSelect);
      setMessages([]); // Clear previous messages
      setMessagesError(null);
      setIsInfoPanelOpen(false); // Close info panel when selecting a new chat
      setSearchResults(null); // Clear search results when a chat is selected
    } else {
      console.warn("ChatPage: Attempted to select chat ID not found:", chatId);
      setSelectedChat(null);
      setMessages([]);
    }
  }, [chatRooms, selectedChat?.id]); // Dependencies

  // --- Load Messages when a Chat is Selected ---
  useEffect(() => {
    // Async function to load messages
    const loadMessages = async () => {
      if (!selectedChat || !isAuthenticated) {
        setMessages([]); // Clear messages if no chat selected or not authenticated
        setLoadingMessages(false);
        return;
      }

      console.log(`ChatPage: Loading messages for chat ${selectedChat.id}`);
      setLoadingMessages(true);
      setMessagesError(null);
      setMessages([]); // Clear previous messages before loading new ones

      try {
        const messagePage = await apiFetch(`/messages/history/${selectedChat.id}?page=0&size=50&sort=createdAt,asc`);
        console.log(`ChatPage: Fetched ${messagePage?.content?.length || 0} messages for chat ${selectedChat.id}.`);

        if (messagePage && messagePage.content) {
          const adaptedMessages = messagePage.content.map(msg => ({
            id: msg.id,
            senderUsername: msg.senderUsername,
            content: msg.content,
            createdAt: msg.createdAt,
            isMe: user && msg.senderUsername === user.username, // Check if user exists
            type: 'text', // Assume text
          }));
          setMessages(adaptedMessages);
        } else {
          setMessages([]); // No messages found
        }
      } catch (err) {
        console.error(`ChatPage: Failed to load messages for chat ${selectedChat.id}:`, err);
        setMessagesError(new Error(`Failed to load messages: ${err.message}`));
        if (err.status === 401 || err.status === 403) {
            logout();
        }
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages(); // Call the async function
  }, [selectedChat, isAuthenticated, user, logout]); // Re-run when selectedChat, isAuthenticated, or user changes

  // --- Send Message ---
  // src/pages/ChatPage.jsx

const handleSendMessage = (messageContent) => {
  if (!selectedChat || !user || !messageContent.trim()) {
    console.warn("Cannot send message: chat/user not selected or message empty.");
    return;
  }
  if (!isConnected || !stompClient) {
    console.error("STOMP client not connected. Cannot send message.");
    return;
  }

  const clientMessageId = uuidv4();
  const destination = `/app/chat.sendMessage/${selectedChat.id}`;
  const payload = {
    content: messageContent,
    clientMessageId: clientMessageId,
  };

  // Optimistic Update FIRST
  const optimisticMessage = {
    id: clientMessageId, // Use the clientMessageId for the optimistic ID
    temp: true,
    roomId: selectedChat.id,
    senderUsername: user.username,
    content: messageContent,
    createdAt: new Date().toISOString(),
    isMe: true,
    status: 'sending', // 'sending' is a good status for optimistic messages
    type: 'text',
  };
  setMessages(prevMessages => [...prevMessages, optimisticMessage]);

  // Then, try to publish ONCE
  try {
    stompClient.publish({
      destination: destination,
      body: JSON.stringify(payload),
    });
    console.log(`STOMP: Message published to ${destination}`, payload);
  } catch (error) {
    console.error("STOMP: Error publishing message", error);
    // If publishing fails, remove the optimistic message or mark it as failed
    setMessages(prevMessages => prevMessages.filter(m => m.id !== clientMessageId));
    // Optionally:
    // setMessages(prevMessages =>
    //   prevMessages.map(m =>
    //     m.id === clientMessageId ? { ...m, status: 'failed', temp: false } : m
    //   )
    // );
    }
  };

  // --- STOMP Subscription Logic ---
  useEffect(() => {
    if (!isConnected || !stompClient || !selectedChat || !selectedChat.id) {
      if (activeSubscription.current) {
        console.log(`STOMP: Conditions not met (isConnected: ${isConnected}, stompClient: ${!!stompClient}, selectedChat: ${!!selectedChat?.id}). Unsubscribing from ${activeSubscription.current.topic}`);
        activeSubscription.current.unsubscribe();
        activeSubscription.current = null;
      }
      return; // Exit early
    }

    // At this point, we are connected, have a client, and a chat is selected.
    const currentRoomId = selectedChat.id; // Capture the ID of the chat we are subscribing for
    const topic = `/topic/rooms/${currentRoomId}`;

    console.log(`STOMP: Attempting to subscribe to ${topic} for room ID: ${currentRoomId}`);

    // Unsubscribe from any previous room before subscribing to a new one
    if (activeSubscription.current && activeSubscription.current.topic !== topic) {
      console.log(`STOMP: Unsubscribing from previous topic: ${activeSubscription.current.topic}`);
      activeSubscription.current.unsubscribe();
      activeSubscription.current = null;
    }

    // If already subscribed to the correct topic, do nothing
    if (activeSubscription.current && activeSubscription.current.topic === topic) {
        console.log(`STOMP: Already subscribed to ${topic}.`);
        return;
    }

    const subscription = stompClient.subscribe(topic, (stompMessage) => {
      try {
        const parsedMessage = JSON.parse(stompMessage.body);
        console.log(`USER: ${user?.username}, STOMP: Message received on topic ${topic} for room ${currentRoomId}:`, parsedMessage);

        console.log(`STOMP: Received raw message body from server:`, stompMessage.body);
        console.log(`USER: ${user?.username}, STOMP: Message received on topic ${topic} for room ${currentRoomId}:`, parsedMessage);

        // Validate
        if (!parsedMessage || typeof parsedMessage.id === 'undefined') {
            console.error("STOMP: Received message DTO is missing required fields", parsedMessage);
            return;
         }

        // Adapt message
        const confirmedMessage = {
          id: parsedMessage.id,
          senderUsername: parsedMessage.senderUsername,
          content: parsedMessage.content,
          createdAt: parsedMessage.createdAt,
          isMe: user && parsedMessage.senderUsername === user.username,
          clientMessageId: parsedMessage.clientMessageId, // Assuming backend sends this back
          status: 'sent',
          type: 'text',
        };
        console.log(`STOMP: Constructed 'confirmedMessage':`, JSON.stringify(confirmedMessage));
        console.log(`STOMP: Value of confirmedMessage.clientMessageId:`, confirmedMessage.clientMessageId);

        setMessages(prevMessages => {
          console.log(`STOMP: setMessages. isMe: ${confirmedMessage.isMe}, clientMessageId from server: ${confirmedMessage.clientMessageId}`);
          prevMessages.forEach(msg => console.log(`STOMP: Existing msg: id=${msg.id}, temp=${msg.temp}, content=${msg.content.substring(0,10)}`));
          // Use 'confirmedMessage' which is derived from 'parsedMessage'
          if (confirmedMessage.isMe && confirmedMessage.clientMessageId) {
            const optimisticMessageIndex = prevMessages.findIndex(
              // Match the optimistic message by its ID which was the clientMessageId
              msg => msg.id === confirmedMessage.clientMessageId && msg.temp === true
            );

            if (optimisticMessageIndex > -1) {
              console.log(`STOMP: Replacing optimistic client ID ${confirmedMessage.clientMessageId} with DB ID ${confirmedMessage.id}`);
              const updatedMessages = [...prevMessages];
              updatedMessages[optimisticMessageIndex] = confirmedMessage; // Replace with the full confirmed message
              return updatedMessages;
            } else {
              // Optimistic message not found, but it's "isMe".
              // This could be a message from another session of the same user. Add if not present by permanent ID.
              if (prevMessages.some(msg => msg.id === confirmedMessage.id)) {
                  console.log("STOMP: Confirmed 'isMe' message already present by permanent ID:", confirmedMessage.id);
                  return prevMessages;
              }
              console.log("STOMP: Adding confirmed 'isMe' message (no optimistic match, new by permanent ID):", confirmedMessage);
              return [...prevMessages, confirmedMessage];
            }
          } else {
            // Message from another user
            if (prevMessages.some(msg => msg.id === confirmedMessage.id)) {
              console.log("STOMP: Other user's message already present by permanent ID:", confirmedMessage.id);
              return prevMessages;
            }
            console.log("STOMP: Adding other user's message:", confirmedMessage);
            return [...prevMessages, confirmedMessage];
          }
        });

      } catch (e) {
        console.error(`STOMP: Error in subscription callback for topic ${topic}. Error: ${e.message}. Raw body:`, stompMessage.body, e);
      }
    });

    activeSubscription.current = { topic, unsubscribe: () => subscription.unsubscribe() };
    console.log(`STOMP: Successfully subscribed to ${topic}`);

    return () => {
      if (activeSubscription.current) {
        console.log(`STOMP: useEffect cleanup, unsubscribing from ${activeSubscription.current.topic}`);
        activeSubscription.current.unsubscribe();
        activeSubscription.current = null;
      }
    };
  }, [isConnected, stompClient, selectedChat, user]); 

  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);


  // --- Handle Search ---
  const handleSearch = async (searchTerm) => {
      if (!searchTerm.trim()) {
          setSearchResults(null); // Clear results if search is empty
          loadUserChats(); // Reload normal chat list
          return;
      }
      console.log("ChatPage: Searching for users:", searchTerm);
      setLoadingChats(true); // Use loadingChats state for search indication
      setChatsError(null);
      setSelectedChat(null); // Deselect any chat when searching

      try {
          const usersFound = await apiFetch(`/users/search?usernameQuery=${encodeURIComponent(searchTerm)}`);
          console.log("ChatPage: Search results:", usersFound);
          setSearchResults(usersFound || []);
      } catch (err) {
          console.error("ChatPage: User search failed:", err);
          setChatsError(new Error("Failed to search users."));
          setSearchResults([]); // Empty array on error
      } finally {
          setLoadingChats(false);
      }
  };

  // --- Handle Clicking a User from Search Results ---
  const handleSelectUserFromSearch = async (usernameToChatWith) => {
      if (!user || usernameToChatWith === user.username) {
          console.warn("Cannot start chat with self or user not logged in.");
          return;
      }
      console.log("ChatPage: Creating/getting private chat with:", usernameToChatWith);
      // Show loading/spinner in chat list area
      setLoadingChats(true);
      setSearchResults(null); // Clear search results

      try {
          // This backend call is POST /api/chats/private/{username}
          // It creates the chat if not exists and returns ChatRoomDto
          const chatRoom = await apiFetch(`/chats/private/${encodeURIComponent(usernameToChatWith)}`, { method: 'POST' });
          await loadUserChats(); // Reload chat list to include the new/existing private chat
          // handleSelectChat will be called by ChatList when the user clicks the newly added chat
          // Or, we can select it directly if the DTO is complete
          if (chatRoom) {
              handleSelectChat(chatRoom.id); // Select the newly created/fetched chat
          }
      } catch (err) {
          console.error("ChatPage: Failed to create/get private chat:", err);
          setChatsError(new Error("Failed to start private chat."));
          loadUserChats(); // Reload original chat list on error
      } finally {
          setLoadingChats(false);
      }
  };

  const handleGroupCreated = useCallback(async (newGroup) => {
      console.log("ChatPage: handleGroupCreated received new group:", newGroup);
      // Перезагружаем список чатов, чтобы включить новую группу
      // Ждем, пока список загрузится, прежде чем пытаться выбрать чат
      await loadUserChats(); // <-- Добавляем await, чтобы дождаться обновления списка
      // Выбираем только что созданный групповой чат
      if (newGroup && newGroup.id) {
          console.log("ChatPage: Selecting newly created group chat ID:", newGroup.id);
          setSelectedChat(newGroup);
          setSearchResults(null);
          // Вызываем существующий обработчик выбора чата
          // handleSelectChat(newGroup.id);
          // Закрываем панель информации, если она была открыта
          setIsInfoPanelOpen(false);
      } else {
           console.warn("ChatPage: handleGroupCreated received invalid newGroup data:", newGroup);
           // Опционально показать ошибку или вернуться к виду "Все чаты"
           setSelectedChat(null);
           setMessages([]);
           setIsInfoPanelOpen(false);
           setSearchResults(null);
      }
  }, [loadUserChats, handleSelectChat, setSearchResults, setIsInfoPanelOpen]);


  // --- Toggle Info Panel ---
  const toggleInfoPanel = useCallback(() => {
       if (selectedChat) {
           setIsInfoPanelOpen(prev => {
               const newState = !prev;
               console.log(`ChatPage: Toggling Info Panel. New state: ${newState}`);
               return newState;
           });
       } else {
           setIsInfoPanelOpen(false);
           console.log("ChatPage: Info Panel not opened, no chat selected.");
       }
  }, [selectedChat]);

  // --- Обработчик удаления участника ---
  const handleRemoveParticipant = useCallback(async (chatId, usernameToRemove) => {
      if (!selectedChat || selectedChat.id !== chatId) {
          console.warn("Attempted to remove participant from non-selected chat.");
          return;
      }
       if (!user || usernameToRemove === user.username) {
           console.warn("Cannot remove self or user not logged in.");
           // Возможно, нужна отдельная логика для "выйти из группы"
           return;
       }
       if (selectedChat.type !== 'GROUP') {
            console.warn("Attempted to remove participant from non-group chat.");
            return;
       }


      console.log(`ChatPage: Attempting to remove participant ${usernameToRemove} from chat ${chatId}`);
      // Здесь можно добавить состояние загрузки/ошибки для InfoPanel

      try {
          // Вызываем новую API функцию
          await deleteParticipantFromRoom(chatId, usernameToRemove);
          console.log(`Participant ${usernameToRemove} removed from chat ${chatId}.`);

          // После успешного удаления нужно обновить данные чата
          // Можно перезагрузить список чатов, чтобы увидеть обновленный список участников в InfoPanel
           loadUserChats(); // Перезагружаем список чатов

           // Если текущий чат - тот, из которого удалили участника, обновить и его данные
          // Это может потребовать отдельного API вызова для получения детальной информации по чату
          // Или обновить state selectedChat вручную, удалив участника из списка participantUsernames
          setSelectedChat(prevChat => {
               if (prevChat && prevChat.id === chatId) {
                   return {
                       ...prevChat,
                       participantUsernames: prevChat.participantUsernames.filter(u => u !== usernameToRemove)
                   };
               }
               return prevChat;
           });


      } catch (err) {
          console.error(`ChatPage: Failed to remove participant ${usernameToRemove} from chat ${chatId}:`, err);
          // Показать ошибку пользователю, например, через state в InfoPanel
           // setErrorInInfoPanel(err.message || 'Failed to remove participant.'); // Нужен state для ошибок InfoPanel
      } finally {
          // Сбросить состояние загрузки/ошибки InfoPanel
      }
  }, [selectedChat, user, loadUserChats]); 

  // --- Conditional rendering if not authenticated (though ProtectedRoute should handle this) ---
  if (!isAuthenticated) {
    // This should ideally not be reached if ProtectedRoute is working.
    // It's a fallback or for cases where auth state changes unexpectedly.
    return <div style={{ padding: '20px', textAlign: 'center' }}>Authenticating or session expired. Please login.</div>;
  }

  // --- Main Render ---
  return (
    <div className="chat-app-container" ref={chatAppContainerRef}>
      <OverlayMenu
       isOpen={isOverlayMenuOpen}
        onClose={toggleOverlayMenu}
        onGroupCreated={handleGroupCreated}
         /> 
        <div className="section-1" style={{ width: '70px', flexShrink: 0}}>
             <div className="header">
                 <div className="menu-icon" onClick={toggleOverlayMenu}>
                     <i className="fas fa-bars"></i>
                 </div>
             </div>
             <div className="section-content">
                  <div className="message-counter-wrapper" onClick={() => { setSearchResults(null); loadUserChats(); setSelectedChat(null); }}>
                       <div className="message-icon-container">
                           <i className="fas fa-comment-dots message-icon"></i>
                           {/* <span className="counter">0</span> */}
                       </div>
                       <div className="message-label">All Chats</div>
                   </div>
                  {/* Other items for section-1, e.g., Folders, Contacts - currently empty */}
                  <div className="chat-list"> {/* This is for items *within* section-1, not the main chat list */}
                        {/* Example: <p style={{padding: '10px', color: '#8e9297'}}>Folders...</p> */}
                  </div>
             </div>
        </div>

        <div className="section-2" style={{ width: `${section2Width}px`, flexShrink: 0 /* ensure CSS also has this */ }}>
            <SearchBar onSearch={handleSearch} /> {/* Your SearchBar component */}
            <div className="chats-container"> {/* This div will scroll and contain ChatList items */}
              <ChatList
                // If searchResults is not null, display search results, otherwise display chatRooms
                chats={searchResults !== null ? searchResults : chatRooms}
                isUserSearch={searchResults !== null}
                loading={loadingChats}
                error={chatsError}
                selectedChatId={selectedChat ? selectedChat.id : null}
                onSelectChat={searchResults !== null ? handleSelectUserFromSearch : handleSelectChat}
                currentUser={user}
              />
            </div>
        </div>

        <div
          className="splitter"
          id="splitter2"
          onMouseDown={handleMouseDownOnSplitter}
          style={{ cursor: 'col-resize', width: '5px', backgroundColor: '#0d1620', flexShrink: 0 }} // Basic inline styles for visibility
        ></div>

      <div className="section-3" style={{ flex: 1 }}>
        <ChatWindow
          selectedChat={selectedChat}
          messages={messages}
          loadingMessages={loadingMessages}
          messagesError={messagesError}
          onSendMessage={handleSendMessage}
          currentUser={user}
          onHeaderClick={selectedChat ? toggleInfoPanel : null}
        />
      </div>

      {/* Conditionally render InfoPanel */}
      {isInfoPanelOpen && selectedChat && (
        <InfoPanel
          selectedChat={selectedChat} // Передаем выбранный чат
          currentUser={user} // Передаем текущего пользователя (нужен для определения "You" и прав на удаление)
          onClose={toggleInfoPanel} // Передаем функцию для закрытия панели (кликаем по стрелке "назад")
          onRemoveParticipant={handleRemoveParticipant} // Pass a function to close the panel
          isOpen={isInfoPanelOpen}
        />
      )}
    </div>
  );
}

export default ChatPage;