import { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = 'info', message, title, duration = 5000 }) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message, title, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Convenience methods
    const success = useCallback((message, title, duration) => {
        return addToast({ type: 'success', message, title, duration });
    }, [addToast]);

    const error = useCallback((message, title, duration) => {
        return addToast({ type: 'error', message, title, duration });
    }, [addToast]);

    const warning = useCallback((message, title, duration) => {
        return addToast({ type: 'warning', message, title, duration });
    }, [addToast]);

    const info = useCallback((message, title, duration) => {
        return addToast({ type: 'info', message, title, duration });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 left-4 z-[9999] pointer-events-none">
                <div className="flex flex-col items-end pointer-events-auto">
                    {toasts.map(toast => (
                        <Toast
                            key={toast.id}
                            {...toast}
                            onClose={removeToast}
                        />
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    );
};