import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toastContext';

function useTimeout(callback: () => void, duration: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const functionId = setTimeout(() => savedCallback.current(), duration);
    return () => clearTimeout(functionId);
  }, [duration]);
}

type Message = {
  heading: string;
  content: string;
};

type ToastProperties = {
  message: Message;
  close: () => void;
  duration: number;
  position: string;
  color: 'info' | 'warning' | 'error' | 'success';
};

const positionClasses: Record<string, string> = {
  'top-left': 'fixed top-6 left-6 items-start',
  'top-center': 'fixed top-6 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'fixed top-6 right-6 items-end',
  'bottom-left': 'fixed bottom-6 left-6 items-start',
  'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'fixed bottom-6 right-6 items-end',
};

const toastColorClasses: Record<string, string> = {
  info: 'bg-blue-50 border border-blue-200 text-blue-900',
  success: 'bg-green-50 border border-green-200 text-green-900',
  error: 'bg-red-50 border border-red-200 text-red-900',
  warning: 'bg-yellow-50 border border-yellow-200 text-yellow-900',
};

export function Toast({ message, close, duration, color }: ToastProperties) {
  useTimeout(() => close(), duration);

  return (
    <div
      className={`
                relative flex w-80 max-w-full shadow-xl rounded-xl px-5 py-4 mb-2
                font-roboto transition-all duration-300
                ${toastColorClasses[color]}
                animate-fade-in-up
                backdrop-blur-sm
            `}
      style={{
        boxShadow: '0 8px 32px 0 rgba(30,94,255,0.10)',
        borderWidth: 1,
      }}
    >
      <div className="flex flex-col flex-1">
        <span className="font-semibold text-base mb-1">{message.heading}</span>
        <span className="text-sm opacity-90 whitespace-pre-line">{message.content}</span>
      </div>
      <button
        className="ml-4 text-xl text-gray-400 hover:text-gray-700 transition-colors"
        onClick={close}
        aria-label="Close"
        tabIndex={0}
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
          <path
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 6L6 18M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

type ToastProviderProperties = {
  children: React.ReactElement;
};

type ToastType = {
  message: Message;
  id: number;
  duration: number;
  position: string;
  color: 'info' | 'warning' | 'error' | 'success';
};

export function ToastProvider({ children }: ToastProviderProperties) {
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [position, setPosition] = useState('top-left');

  type Options = {
    message?: Message;
    duration?: number;
    position?: string;
    color?: 'info' | 'warning' | 'error' | 'success';
  };

  const openToast = useCallback(
    ({
      message = { heading: '', content: '' },
      duration = 5000,
      position = 'top-center',
      color = 'info',
    }: Options = {}) => {
      const newToast: ToastType = {
        message,
        id: Date.now() + Math.floor(Math.random() * 10000),
        duration,
        position,
        color,
      };
      setToasts((prevToast) => [...prevToast, newToast]);
      setPosition(position);
    },
    [],
  );

  const closeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const contextValue = useMemo(
    () => ({
      open: openToast,
      close: closeToast,
    }),
    [openToast, closeToast],
  );

  // Find the position of the last toast (so all toasts stack at the correct place)
  const currentPosition = toasts.length > 0 ? toasts[toasts.length - 1].position : position;

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className={`
                    z-[1000] flex flex-col gap-3 pointer-events-none
                    ${positionClasses[currentPosition] || positionClasses['top-center']}
                `}
        style={{ minWidth: '320px' }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              close={() => closeToast(toast.id)}
              duration={toast.duration}
              position={toast.position}
              color={toast.color}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
