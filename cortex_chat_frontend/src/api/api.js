// src/api/api.js

const API_BASE_URL = '/api'; // Используем относительный путь для Vite proxy

// --- Глобальные переменные для отслеживания состояния обновления токена ---
let isRefreshing = false;
let failedQueue = []; // Очередь для "зависших" запросов

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token); // Передаем новый токен для повторного запроса
    }
  });
  failedQueue = [];
};

// Helper для получения access token. Он будет читать из localStorage.
// useAuth будет отвечать за запись актуального токена в localStorage.
const getAccessTokenFromStorage = () => {
  return localStorage.getItem('accessToken');
};

// --- ОСНОВНАЯ МОДИФИКАЦИЯ apiFetch ---
const apiFetch = async (url, options = {}, isRetry = false) => {
  const currentAccessToken = getAccessTokenFromStorage();

  // Эндпоинты, не требующие access token
  const publicEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isPublicRequest = publicEndpoints.includes(url);

  const headers = {
    ...options.headers,
  };

  // Добавляем Authorization header, если токен есть и это не публичный эндпоинт
  if (currentAccessToken && !isPublicRequest) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }

  // Устанавливаем Content-Type для JSON, если тело - объект
  if (options.body && typeof options.body === 'object' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);

    // Если токен истек (401) И это НЕ повторный запрос И НЕ запрос на /auth/refresh
    if (response.status === 401 && !isRetry && url !== '/auth/refresh') {
      console.warn(`API call to ${url} returned 401. Attempting token refresh.`);

      if (!isRefreshing) {
        isRefreshing = true; // Помечаем, что процесс обновления начался

        return new Promise((resolve, reject) => {
          // Пытаемся обновить токен (POST /api/auth/refresh)
          // Куки с refresh token отправятся автоматически браузером
          fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' })
            .then(async (refreshResponse) => {
              if (!refreshResponse.ok) {
                // Если /refresh вернул ошибку (например, refresh token недействителен)
                console.error("Token refresh failed with status:", refreshResponse.status);
                // Очищаем очередь с ошибкой
                processQueue(new Error('Session expired or refresh failed. Please login again.'), null);
                // Сигнализируем о необходимости выхода (например, через кастомное событие или выброс ошибки)
                // Глобальный logout лучше инициировать из useAuth или компонента верхнего уровня
                localStorage.removeItem('accessToken'); // Важно очистить старый access token
                // Выбрасываем ошибку, чтобы вызывающий код (в useAuth) мог ее обработать и сделать редирект
                const refreshError = new Error('Session expired or refresh failed. Please login again.');
                refreshError.status = refreshResponse.status; // Сохраняем статус ошибки для дальнейшей обработки
                reject(refreshError);
                return; // Выход из then
              }

              // Если /refresh успешен, получаем новый accessToken
              const newAuthData = await refreshResponse.json(); // Ожидаем { accessToken: "..." }
              if (newAuthData && newAuthData.accessToken) {
                console.log("Access token refreshed successfully via /refresh.");
                localStorage.setItem('accessToken', newAuthData.accessToken); // Сохраняем новый access token
                // Обрабатываем очередь "зависших" запросов, передавая им новый токен
                processQueue(null, newAuthData.accessToken);
                // Повторяем оригинальный запрос с новым токеном
                // Создаем новые заголовки с актуальным токеном
                const newHeaders = { ...config.headers, 'Authorization': `Bearer ${newAuthData.accessToken}` };
                const newConfig = { ...config, headers: newHeaders };
                // Удаляем тело, если оно уже было использовано (некоторые запросы не могут повторно использовать body stream)
                // Для простоты, если это был GET, тело не нужно. Для POST/PUT может понадобиться клонирование.
                // Этот момент может потребовать доработки в зависимости от сложности запросов.
                // Пока предполагаем, что повторный вызов apiFetch с новым токеном сработает.
                resolve(apiFetch(url, { ...options, headers: { 'Authorization': `Bearer ${newAuthData.accessToken}` } }, true)); // Устанавливаем isRetry = true
              } else {
                throw new Error("Refresh response did not contain new access token.");
              }
            })
            .catch((err) => {
              console.error("Error during token refresh HTTP request:", err);
              processQueue(err, null);
              localStorage.removeItem('accessToken'); // Очищаем токен при любой ошибке обновления
              reject(err); // Перебрасываем ошибку
            })
            .finally(() => {
              isRefreshing = false; // Сбрасываем флаг обновления
            });
        });
      } else {
        // Если уже идет процесс обновления, добавляем текущий запрос в очередь
        console.log(`Request to ${url} queued while token is refreshing.`);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(newAccessTokenFromQueue => {
          // Повторяем запрос с новым токеном, полученным из очереди
          console.log(`Retrying ${url} with new token from queue.`);
          return apiFetch(url, { ...options, headers: { ...options.headers, 'Authorization': `Bearer ${newAccessTokenFromQueue}` } }, true);
        })
        .catch(err => {
          console.error(`Error retrying ${url} from queue:`, err);
          throw err; // Перебрасываем ошибку
        });
      }
    }


    // Обработка других HTTP ошибок (не 401, или 401 на /refresh или повторном запросе)
    if (!response.ok) {
      let errorData = `Status: ${response.status} ${response.statusText}`;
      let backendMessage = `API Error: ${response.status}`; // Сообщение по умолчанию
      try {
        const json = await response.json();
        errorData += `, Details: ${JSON.stringify(json)}`;
        // Попытаемся извлечь более конкретное сообщение об ошибке от бэкенда
        backendMessage = json.message || json.error || backendMessage;
      } catch (e) { /* Игнорируем, если тело ответа не JSON */ }

      console.error(`API Error for ${url}:`, errorData);
      const httpError = new Error(backendMessage); // Используем сообщение от бэкенда, если есть
      httpError.status = response.status; // Сохраняем статус для дальнейшей обработки
      throw httpError;
    }

    // Обработка ответа 204 No Content
    if (response.status === 204 || (response.headers.has("content-length") && response.headers.get("content-length") === "0")) {
        return null; // Возвращаем null для 204
    }

    // Парсим JSON ответ по умолчанию
    const data = await response.json();
    return data;

  } catch (error) {
    // Логируем только если это не ошибка, которую мы уже обработали и перебросили
    // (т.е. у нее нет поля status, добавленного нами)
    if (!error.status) {
        console.error(`Network or unexpected error during fetch to ${API_BASE_URL}${url}:`, error);
    }
    throw error; // Перебрасываем ошибку для обработки в компонентах или хуках
  }
};

// Function to search for users by username
const searchUsers = async (usernameQuery) => {
    if (!usernameQuery || usernameQuery.trim() === '') {
        // Return an empty array immediately if query is empty or whitespace
        return [];
    }
    const encodedQuery = encodeURIComponent(usernameQuery);
    // Assuming your backend endpoint is GET /api/users/search?usernameQuery=...
    return apiFetch(`/users/search?usernameQuery=${encodedQuery}`, { method: 'GET' });
};

// Function to create a new group chat
// participantUsernames should be an array of strings
const createGroupChat = async (name, participantUsernames) => {
    // Assuming your backend endpoint is POST /api/chats/group
    // and it expects a body like { name: "GroupName", participantUsernames: ["user1", "user2"] }
    // The backend should automatically include the creator in the group.
    return apiFetch('/chats/group', {
        method: 'POST',
        body: {
            groupName: name,
            participantUsernames: participantUsernames
        }
    });
};

// Function to get or create a private chat with a specific user
// Assuming your backend endpoint is POST /api/chats/private/{username}
const getOrCreatePrivateChat = async (username) => {
     if (!username || username.trim() === '') {
         throw new Error("Username is required to create/get a private chat.");
     }
     const encodedUsername = encodeURIComponent(username);
     return apiFetch(`/chats/private/${encodedUsername}`, { method: 'POST' });
};

// Функция для удаления участника из чата
const deleteParticipantFromRoom = async (roomId, usernameToDelete) => {
    // DELETE /api/chats/{roomId}/participants/{usernameToDelete}
    if (!roomId || !usernameToDelete) {
        throw new Error("Room ID and username are required to remove a participant.");
    }
    const encodedUsername = encodeURIComponent(usernameToDelete);
    return apiFetch(`/chats/${roomId}/participants/${encodedUsername}`, {
        method: 'DELETE',
        // DELETE запросы обычно не имеют тела, но могут иметь заголовки или параметры
    });
};


// Export all necessary functions
export {
    apiFetch,
    searchUsers,
    createGroupChat,
    getOrCreatePrivateChat,
    deleteParticipantFromRoom 
};