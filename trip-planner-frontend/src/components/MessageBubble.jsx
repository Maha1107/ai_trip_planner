import React from 'react';

const MessageBubble = ({ message, type }) => {
  const isUser = type === 'user';
  
  return (
    <div className={`message-bubble ${isUser ? 'user' : 'bot'}`}>
      <div className="bubble-content">
        {message.split('\n').map((line, idx) => (
          <div key={idx} className="message-line">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageBubble;
