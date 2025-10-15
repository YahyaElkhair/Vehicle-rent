import { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';

const Toast = ({ id, type = 'info', message, title, duration = 5000, onClose }) => {
    useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    const variants = {
        success: {
            bg: 'bg-green-50',
            border: 'border-green-500',
            text: 'text-green-800',
            icon: <FaCheckCircle className="text-green-500" />,
            progressBg: 'bg-green-500'
        },
        error: {
            bg: 'bg-red-50',
            border: 'border-red-500',
            text: 'text-red-800',
            icon: <FaTimesCircle className="text-red-500" />,
            progressBg: 'bg-red-500'
        },
        warning: {
            bg: 'bg-yellow-50',
            border: 'border-yellow-500',
            text: 'text-yellow-800',
            icon: <FaExclamationCircle className="text-yellow-500" />,
            progressBg: 'bg-yellow-500'
        },
        info: {
            bg: 'bg-blue-50',
            border: 'border-blue-500',
            text: 'text-blue-800',
            icon: <FaInfoCircle className="text-blue-500" />,
            progressBg: 'bg-blue-500'
        }
    };

    const variant = variants[type] || variants.info;

    return (
        <div
            className={`
                ${variant.bg} ${variant.border} ${variant.text}
                border-l-4 rounded-lg shadow-lg p-4 mb-4 
                max-w-md w-full
                animate-slideInRight
                hover:shadow-xl transition-all duration-300
            `}
        >
            <div className="flex items-start">
                {/* Icon */}
                <div className="flex-shrink-0 text-xl mr-3 mt-0.5">
                    {variant.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h4 className="font-bold text-sm mb-1">
                            {title}
                        </h4>
                    )}
                    <p className="text-sm break-words">
                        {message}
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => onClose(id)}
                    className={`
                        flex-shrink-0 ml-3 text-lg
                        hover:opacity-70 transition-opacity
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-500
                        rounded
                    `}
                    aria-label="Close"
                >
                    <FaTimes />
                </button>
            </div>

            {/* Progress Bar */}
            {duration > 0 && (
                <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${variant.progressBg} animate-shrink`}
                        style={{ animationDuration: `${duration}ms` }}
                    />
                </div>
            )}
        </div>
    );
};

export default Toast;