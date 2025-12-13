import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  onClick: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, onClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setVisible(true);

    const timer = setTimeout(() => {
      handleClose();
    }, 10000); // Auto-dismiss after 10 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Allow animation to complete before removing from DOM
    setTimeout(onClose, 300);
  };
  
  const handleClick = () => {
      onClick();
      handleClose();
  }

  return (
    <div
      className={`
        w-80 max-w-sm bg-red-800/80 backdrop-blur-sm text-white rounded-lg shadow-2xl 
        border border-red-600 cursor-pointer
        transition-all duration-300 ease-in-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
      `}
      onClick={handleClick}
    >
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-semibold text-red-100">New Alert</p>
          <p className="mt-1 text-sm text-red-200">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={(e) => {
                e.stopPropagation(); // prevent click from triggering the main div's onClick
                handleClose();
            }}
            className="inline-flex text-red-200 hover:text-white"
          >
            <span className="sr-only">Close</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
