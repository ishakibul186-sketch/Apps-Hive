
import React from 'react';
import { Tool, UserProfile } from '../types';
import { ArrowRightIcon, EditIcon, TrashIcon, ShareIcon } from './icons/Icons';

interface ToolCardProps {
    tool: Tool;
    userProfile: UserProfile | null;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onShare: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, userProfile, onSelect, onEdit, onDelete, onShare }) => {
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

    return (
        <div
            onClick={onSelect}
            className="group relative bg-secondary rounded-xl shadow-lg overflow-hidden border border-accent hover:border-brand hover:shadow-brand/20 hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300 cursor-pointer flex flex-col"
        >
            <div className="absolute top-2 right-2 flex items-center space-x-2 z-10">
                <button
                    onClick={handleShareClick}
                    className="p-2 bg-accent/80 rounded-full text-text-secondary hover:bg-blue-500 hover:text-white transition-colors duration-200"
                    aria-label="Share tool"
                >
                    <ShareIcon className="w-4 h-4" />
                </button>
                {userProfile?.role === 'Admin' && (
                    <>
                        <button
                            onClick={handleEditClick}
                            className="p-2 bg-accent/80 rounded-full text-text-secondary hover:bg-brand hover:text-white transition-colors duration-200"
                            aria-label="Edit tool"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="p-2 bg-accent/80 rounded-full text-text-secondary hover:bg-red-500 hover:text-white transition-colors duration-200"
                            aria-label="Delete tool"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
            <div className="p-6 flex-grow">
                <h3 className="text-xl font-bold text-text-primary mb-2 pr-16">{tool.name}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                    {truncateDescription(tool.description, 20)}
                </p>
            </div>
            <div className="bg-accent/50 p-4 mt-auto flex justify-between items-center transition-colors duration-300 group-hover:bg-brand">
                <span className="text-brand font-semibold group-hover:text-white">Launch Tool</span>
                <ArrowRightIcon className="w-5 h-5 text-brand group-hover:text-white transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </div>
    );
};

export default ToolCard;