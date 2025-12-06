
import React, { useState } from 'react';
import { AppInfo, UserProfile } from '../types';
import { DownloadIcon, EditIcon, TrashIcon, AppsIcon, ShareIcon } from './icons/Icons';

interface AppCardProps {
    app: AppInfo;
    userProfile: UserProfile | null;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onShare: () => void;
}

const AppCard: React.FC<AppCardProps> = ({ app, userProfile, onSelect, onEdit, onDelete, onShare }) => {
    const [imageError, setImageError] = useState(false);

    const truncateDescription = (text: string, wordLimit: number): string => {
        if (!text) return '';
        const words = text.split(' ');
        if (words.length > wordLimit) {
            return words.slice(0, wordLimit).join(' ') + '...';
        }
        return text;
    };

    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onShare();
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete();
    };

    const handleDownloadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (app.apkurl) {
            window.open(app.apkurl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div
            onClick={onSelect}
            className="group relative bg-secondary rounded-xl shadow-lg overflow-hidden border border-accent hover:border-brand hover:shadow-brand/20 hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 cursor-pointer flex flex-col"
        >
            <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                <button onClick={handleShareClick} className="p-2 bg-accent/80 rounded-full text-text-secondary hover:bg-blue-500 hover:text-white" aria-label="Share app"><ShareIcon className="w-4 h-4" /></button>
                {/* Admin Controls: Show Edit and Delete buttons only for Admin users */}
                {userProfile?.role === 'Admin' && (
                    <>
                        <button onClick={handleEditClick} className="p-2 bg-accent/80 rounded-full text-text-secondary hover:bg-brand hover:text-white" aria-label="Edit app"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={handleDeleteClick} className="p-2 bg-accent/80 rounded-full text-text-secondary hover:bg-red-500 hover:text-white" aria-label="Delete app"><TrashIcon className="w-4 h-4" /></button>
                    </>
                )}
            </div>
            <div className="p-6 flex-grow flex flex-col items-center text-center">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-accent flex items-center justify-center overflow-hidden shadow-inner">
                    {!imageError && app.icon ? (
                         <img 
                            src={app.icon} 
                            alt={`${app.name} icon`} 
                            className="w-full h-full object-cover" 
                            onError={() => setImageError(true)} 
                        />
                    ) : (
                        <AppsIcon className="w-8 h-8 text-text-secondary" />
                    )}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">{app.name}</h3>
                <p className="text-text-secondary text-sm leading-relaxed flex-grow">
                    {truncateDescription(app.description, 25)}
                </p>
            </div>
            <div
                onClick={handleDownloadClick}
                className="bg-accent/50 p-4 mt-auto flex justify-between items-center transition-colors duration-300 group-hover:bg-brand"
            >
                <span className="text-brand font-semibold group-hover:text-white">Download</span>
                <DownloadIcon className="w-5 h-5 text-brand group-hover:text-white" />
            </div>
        </div>
    );
};

export default AppCard;