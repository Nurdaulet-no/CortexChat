// src/components/InfoPanel.jsx
import React, { useState, useEffect } from 'react'; // Добавь useEffect, если он нужен, хотя в этом коде его нет
import { stringToHslColor } from '../utils/colors';
import '../styles/info-panel.css'; // Этот файл импортируем

// InfoPanel теперь получает проп isOpen
function InfoPanel({ selectedChat, currentUser, onClose, onRemoveParticipant, isOpen }) {
    console.log('[InfoPanel Component] Received isOpen prop:', isOpen, typeof isOpen); 
  // Состояние для индикации загрузки при удалении участника и ошибки
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);
  const [deleteError, setDeleteError] = useState(null); // Состояние ошибки удаления

  // ChatPage уже контролирует рендеринг, поэтому эта проверка не нужна здесь:
  // if (!selectedChat) { return null; }

  // --- Подготовка данных для отображения ---
  let panelDisplayName = selectedChat.name;
  let participants = selectedChat.participantUsernames || [];

  if (selectedChat.type === 'PRIVATE' && participants.length >= 1 && currentUser) {
      const otherParticipantUsername = participants.find(username => username !== currentUser.username);
      panelDisplayName = otherParticipantUsername || 'Приватный чат';
  } else if (selectedChat.type === 'GROUP' && !panelDisplayName) {
       panelDisplayName = `Группа ${selectedChat.id}`;
  }
  const finalPanelDisplayName = panelDisplayName || (selectedChat.type === 'GROUP' ? 'Групповой чат' : 'Приватный чат');

  // Подготовка данных для аватара панели
  const avatarSaturation = 50;
  const avatarLightness = 60;
  const avatarColorKey = finalPanelDisplayName || selectedChat.id.toString();
  const avatarColor = stringToHslColor(avatarColorKey, avatarSaturation, avatarLightness);
  const avatarInitial = finalPanelDisplayName ? finalPanelDisplayName.substring(0, 1).toUpperCase() : (selectedChat.type === 'GROUP' ? 'Г' : (selectedChat.type === 'PRIVATE' ? 'П' : '?'));


  // --- Обработчик клика по кнопке удаления участника ---
  const handleDeleteClick = async (usernameToDelete) => {
      if (!window.confirm(`Вы уверены, что хотите удалить пользователя ${usernameToDelete} из этой группы?`)) {
          return;
      }

      setIsDeletingParticipant(true);
      setDeleteError(null);

      try {
          // Вызываем обработчик из ChatPage
          await onRemoveParticipant(selectedChat.id, usernameToDelete);
          console.log(`InfoPanel: Delete request for ${usernameToDelete} sent to handler.`);
          // Состояние ChatPage обновится, и панель, возможно, перерисуется с новым списком участников
          // Или даже закроется, если удалили последнего участника или себя
          // Если нужно сбросить ошибку после успешного удаления (на случай, если она была), сделай это здесь:
          // setDeleteError(null);

      } catch (err) {
          console.error("InfoPanel: Error reported by delete handler:", err);
          // Показываем ошибку пользователю прямо в InfoPanel
          setDeleteError(err.message || 'Не удалось удалить участника.');
      } finally {
          setIsDeletingParticipant(false);
      }
  };

  // Функция рендеринга одного участника списка
  const renderParticipant = (participantUsername) => {
    console.log("Rendering participant in InfoPanel:", participantUsername);
        const canRemove = currentUser &&
                          participantUsername !== currentUser.username &&
                          selectedChat?.type === 'GROUP' &&
                          onRemoveParticipant; // Убедимся, что проп onRemoveParticipant передан

        // Определяем, является ли участник текущим пользователем
        const isCurrentUser = currentUser && participantUsername === currentUser.username;

        return (
        <li key={participantUsername} className="info-participant-item">
            {/* Optional: Small avatar */}
            <div className="chat-avatar" style={{
                backgroundColor: stringToHslColor(participantUsername, 50, 60),
                minWidth: '40px', // Use minWidth/minHeight if flex-shrink is an issue
                width: '40px',
                height: '40px',
                fontSize: '16px',
                marginRight: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {participantUsername ? participantUsername.substring(0, 1).toUpperCase() : '?'}
            </div>

            {/* Container for username and (You) label */}
            <div className="participant-details"> {/* New wrapper div */}
                <span className="participant-username">{participantUsername}</span>
                {isCurrentUser && <span className="participant-you-label">(You)</span>}
            </div>

            {/* Remove button will be pushed to the right by participant-details */}
            {canRemove && (
                <button
                    className="remove-participant-button"
                    type="button"
                    onClick={() => handleDeleteClick(participantUsername)}
                    title={`Remove ${participantUsername}`}
                    disabled={isDeletingParticipant}
                >
                   {isDeletingParticipant && participantUsername === window.currentlyDeletingUsername ? <i className="fas fa-spinner fa-spin"></i> : '×'}
                </button>
            )}
        </li>
    );
    };

  // Определяем классы для оверлея: добавляем 'active' если isOpen === true
  const overlayClasses = `info-panel-overlay ${isOpen ? 'active' : ''}`;
  console.log('[InfoPanel Component] Generated overlayClasses:', overlayClasses);

  return (
      // Используем динамические классы для оверлея
      <div className={overlayClasses}>
          <div className="info-panel">
               <div className="info-panel-header">
                   {/* Кнопка закрытия - вызывает onClose проп */}
                   <div className="info-panel-close" onClick={onClose}>
                       <i className="fas fa-arrow-left"></i>
                   </div>
                   {/* Используем finalPanelDisplayName для заголовка */}
                   <div className="info-panel-title">{finalPanelDisplayName}</div>
                   <div className="info-panel-actions">
                       {/* Здесь можно добавить иконку добавления участника, если это группа */}
                       {selectedChat.type === 'GROUP' && currentUser && ( // Только для групп и авторизованного пользователя
                           <i className="fas fa-user-plus" title="Add Participant"></i>
                       )}
                       <i className="fas fa-ellipsis-v" title="More Options"></i>
                   </div>
               </div>
               <div className="info-panel-content">
                   {/* Отображение ошибки удаления участника */}
                   {deleteError && (
                       <div style={{ color: 'var(--color-danger)', padding: '10px 20px' }}>
                            {deleteError}
                       </div>
                   )}

                   {/* Информация о чате */}
                   <div className="info-section chat-info-overview"> {/* Добавил info-section для консистентности отступов */}
                        {/* Аватар/иконка чата - добавим рендеринг аватара */}
                        <div className="info-chat-avatar" style={{ backgroundColor: avatarColor }}>
                             {selectedChat.type === 'GROUP' && <i className="fas fa-users" style={{ color: 'white', fontSize: '32px' }}></i>}
                             {selectedChat.type === 'PRIVATE' && <span>{avatarInitial}</span>}
                        </div>
                        {/* Имя и статус/количество участников */}
                        <div className="info-chat-details">
                            <div className="info-chat-name">{finalPanelDisplayName}</div> {/* Используем finalPanelDisplayName */}
                            <div className="info-chat-count">
                                {selectedChat.type === 'GROUP' && `${selectedChat.participantUsernames?.length || 0} participants`}
                                {selectedChat.type === 'PRIVATE' && 'Private Chat'}
                            </div>
                        </div>
                   </div>

                   {/* Раздел Описание (если есть) */}
                   {/* Добавить поле description в ChatRoomDto и рендерить его здесь */}
                   {/* selectedChat.description && selectedChat.description.trim() && (
                       <div className="info-section info-description">
                           <div className="info-section-header">Description</div>
                           <p>{selectedChat.description}</p>
                       </div>
                   )*/}


                   {/* Раздел Участники */}
                    {selectedChat.type === 'GROUP' && (
                       // Это уже секция, не нужно оборачивать в .info-section
                       <div className="info-members"> {/* Используем info-members */}
                            <div className="info-members-header"> {/* Заголовок внутри секции */}
                                <span>Participants ({selectedChat.participantUsernames?.length || 0})</span>
                                {/* Возможно иконка для добавления участника рядом с заголовком секции */}
                            </div>
                            {/* Список участников ul */}
                            <ul className="info-members-list"> {/* Класс для списка */}
                                {/* Рендерим список участников */}
                                {selectedChat.participantUsernames?.map(renderParticipant)}
                            </ul>
                       </div>
                    )}

                   {/* Кнопки действий: Выйти из группы, Покинуть канал, Заблокировать (для приватных чатов) */}
                    <div className="info-section"> {/* Оборачиваем кнопки действий в секцию */}
                     {selectedChat.type === 'GROUP' && (
                         // Добавь кнопку "Выйти из группы"
                         <button className="info-action-button leave-group">Leave Group</button>
                     )}
                     {selectedChat.type === 'PRIVATE' && (
                         // Добавь кнопку "Заблокировать пользователя"
                         <button className="info-action-button block-user">Block User</button>
                     )}
                    </div>


               </div> {/* Конец .info-panel-content */}
            </div> {/* Конец .info-panel */}
        </div> // Конец .info-panel-overlay
    );
}

export default InfoPanel;