// src/contexts/StompContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../hooks/useAuth'; // To get accessToken for connectHeaders

const StompContext = createContext({
  stompClient: null,
  isConnected: false,
});

export const useStomp = () => useContext(StompContext);

export const StompProvider = ({ children }) => {
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { accessToken } = useAuth(); // Get accessToken from your auth hook

  useEffect(() => {
    if (!accessToken) { // Don't try to connect if not authenticated
      if (stompClient && stompClient.active) {
        console.log('STOMP Provider: No access token, deactivating client.');
        stompClient.deactivate();
        setStompClient(null);
        setIsConnected(false);
      }
      return;
    }

    if (stompClient && stompClient.active) {
        console.log("STOMP Provider: Client already active.");
        // Potentially update connectHeaders if token changed, then force reconnect
        // For simplicity, we'll assume token at connection time is sufficient,
        // or that a new client is created if the token changes significantly (e.g., after re-login)
        return;
    }


    console.log('STOMP Provider: Creating new STOMP client.');
    const client = new Client({
      brokerURL: 'ws://localhost:8080/ws', // Your backend WebSocket endpoint
      connectHeaders: {
        // Pass the access token for authentication by your ChannelInterceptor
        Authorization: `Bearer ${accessToken}`,
      },
      debug: function (str) {
        console.log('STOMP DEBUG:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('STOMP Provider: Connected to server -', frame.headers.server);
      setIsConnected(true);
      setStompClient(client); // Set the client instance AFTER it's connected
    };

    client.onStompError = (frame) => {
      console.error('STOMP Provider: Broker reported error: ' + frame.headers['message']);
      console.error('STOMP Provider: Additional details: ' + frame.body);
      setIsConnected(false);
      // Optionally, try to deactivate and nullify client to allow re-connection attempt on next token change
      // client.deactivate();
      // setStompClient(null);
    };

    client.onWebSocketError = (event) => {
      console.error('STOMP Provider: WebSocket error', event);
      setIsConnected(false);
    };

    client.onDisconnect = () => {
        console.log('STOMP Provider: Disconnected.');
        setIsConnected(false);
        // No need to setStompClient(null) here as it might be due to a reconnect attempt
    };


    console.log('STOMP Provider: Activating client...');
    client.activate();
    // Set the client instance immediately so it can be used for subscriptions
    // even if onConnect hasn't fired yet (subscriptions will queue)
    // However, it's safer to set it in onConnect to ensure it's truly ready.
    // Let's keep setStompClient(client) in onConnect. For initial setup, pass client for potential early use:
    // setStompClient(client); // This was the previous thought, but onConnect is better.

    return () => {
      if (client && client.active) {
        console.log('STOMP Provider: Deactivating client on unmount or token change.');
        client.deactivate();
        setIsConnected(false);
        setStompClient(null); // Clear the client
      }
    };
  }, [accessToken]); // Re-run effect if accessToken changes

  return (
    <StompContext.Provider value={{ stompClient, isConnected }}>
      {children}
    </StompContext.Provider>
  );
};