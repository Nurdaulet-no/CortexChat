// src/hooks/useAuth.jsx
import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/api.js'; // Используем наш обновленный apiFetch

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  // isAuthenticated и user теперь полностью зависят от accessToken
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [user, setUser] = useState(null); // Для хранения { username: '...' }
  const navigate = useNavigate();

  const decodeJwtPayload = (token) => {
      try {
          if (!token) return null;
          const base64Url = token.split('.')[1];
          if (!base64Url) return null;
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          return JSON.parse(jsonPayload);
      } catch (e) {
          console.error('Could not decode JWT payload', e);
          return null;
      }
  };

  // Используем useCallback для logoutUser, чтобы его можно было безопасно передавать в зависимости useEffect
  const logoutUser = useCallback(async (options = { navigateToLogin: true }) => {
    console.log("AuthContext: Initiating logout...");
    const currentToken = localStorage.getItem('accessToken'); // Проверяем, есть ли вообще токен

    // В любом случае очищаем клиентское состояние
    localStorage.removeItem('accessToken');
    setAccessToken(null); // Это вызовет useEffect ниже и обновит isAuthenticated и user

    if (currentToken) { // Пытаемся вызвать бэкенд /logout только если токен был
        try {
            // apiFetch теперь не требует токен для /auth/logout, так как он public
            // Но если бы требовал, он бы попытался его обновить, что не нужно для logout
            // Передаем пустой объект опций, так как /logout не требует тела
            await apiFetch('/auth/logout', { method: 'POST' });
            console.log("AuthContext: Backend logout successful.");
        } catch (error) {
            console.error("AuthContext: Error during backend logout, client-side cleanup already done.", error);
            // Ошибку с бэкенда logout можно проигнорировать для клиента,
            // так как локально мы уже вышли. Главное, что кука refresh токена будет очищена.
        }
    }

    if (options.navigateToLogin) {
        console.log("AuthContext: Navigating to /login after logout.");
        navigate('/login', { replace: true });
    }
  }, [navigate]); // navigate - стабильная функция

  // Эффект для обновления isAuthenticated и user при изменении accessToken
  useEffect(() => {
    const hasToken = !!accessToken;
    setIsAuthenticated(hasToken);

    if (hasToken) {
      const payload = decodeJwtPayload(accessToken);
      if (payload && payload.sub) { // 'sub' - стандартное поле для username в JWT
        setUser({ username: payload.sub });
      } else {
        // Если токен есть, но он невалидный (не удалось декодировать или нет sub)
        console.warn("AuthContext: Access token exists but is invalid or missing 'sub' claim. Logging out.");
        logoutUser({ navigateToLogin: false }); // Вызываем logout, но не редиректим сразу, если мы уже не на /login
      }
    } else {
      setUser(null);
    }
  }, [accessToken, logoutUser]); // Добавляем logoutUser в зависимости


  const loginUser = (newAccessToken) => {
    console.log("AuthContext: Storing new access token.");
    localStorage.setItem('accessToken', newAccessToken);
    setAccessToken(newAccessToken); // Обновляем состояние, что вызовет useEffect
    // Редирект на /chat будет обработан в LoginPage или через ProtectedRoute
  };

  const value = {
    accessToken,
    isAuthenticated,
    user,
    login: loginUser,
    logout: logoutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};