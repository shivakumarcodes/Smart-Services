import React from 'react';
import '../styles/Toast.css';

const Toast = ({ id, message, type, onClose }) => {
  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={() => onClose(id)}>×</button>
    </div>
  );
};

export default Toast;