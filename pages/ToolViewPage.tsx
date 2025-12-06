import React from 'react';
import { AppUser, Tool } from '../types';
import { BackIcon } from '../components/icons/Icons';

interface ToolViewPageProps {
    tool: Tool;
    user: AppUser;
    onBack: () => void;
}

const ToolViewPage: React.FC<ToolViewPageProps> = ({ tool, user, onBack }) => {
    const iframeSrc = `${tool.link}?token=${user.uid}`;

    return (
        <div className="h-full flex flex-col bg-primary">
            <div className="flex-shrink-0 w-full p-2 bg-secondary shadow-md z-10">
                <button
                    onClick={onBack}
                    className="flex items-center text-text-primary hover:text-brand transition-colors p-2 rounded-lg"
                    aria-label="Back to Tools Hub"
                >
                    <BackIcon />
                    <span className="ml-2 font-medium">Back to Tools Hub</span>
                </button>
            </div>
            
            <div className="relative flex-grow w-full h-full md:p-6">
                <iframe
                    src={iframeSrc}
                    title={tool.name}
                    className="w-full h-full border-0 md:rounded-xl shadow-lg bg-white"
                    allow="geolocation; microphone; camera; midi; encrypted-media;"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                ></iframe>
            </div>
        </div>
    );
};

export default ToolViewPage;