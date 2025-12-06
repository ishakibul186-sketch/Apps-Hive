
import React, { useEffect } from 'react';
import { Message } from '../types';
import { CloseIcon, InboxIcon } from './icons/Icons';

interface ToastNotificationProps {
    message: Message;
    onDismiss: () => void;
    onNavigate: () => void;
}

const truncateMessage = (text: string, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
        return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
};

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, onDismiss, onNavigate }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div 
            onClick={onNavigate}
            className="w-full max-w-sm bg-secondary rounded-xl shadow-2xl border border-accent overflow-hidden cursor-pointer animate-fade-in-right"
            role="alert"
            aria-live="assertive"
        >
            <div className="p-4 flex items-start space-x-4">
                <div className="flex-shrink-0 bg-brand/20 p-3 rounded-full mt-1">
                    <InboxIcon className="w-6 h-6 text-brand" />
                </div>
                <div className="flex-grow overflow-hidden">
                    <h4 className="font-bold text-text-primary">{message.title}</h4>
                    <p className="text-sm text-text-secondary mt-1">{truncateMessage(message.message, 10)}</p>
                </div>
                <div className="flex-shrink-0">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDismiss();
                        }}
                        className="p-1 text-text-secondary hover:text-white rounded-full hover:bg-accent/50"
                        aria-label="Dismiss notification"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToastNotification;
