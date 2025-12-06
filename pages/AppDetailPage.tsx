
import React, { useState } from 'react';
import { AppInfo } from '../types';
import { BackIcon, DownloadIcon, AppsIcon } from '../components/icons/Icons';

interface AppDetailPageProps {
    app: AppInfo;
    onBack: () => void;
}

const AppDetailPage: React.FC<AppDetailPageProps> = ({ app, onBack }) => {
    const [imageError, setImageError] = useState(false);
    const featuresList = app.features.split(',').map(f => f.trim()).filter(f => f);

    return (
        <div className="h-full flex flex-col bg-primary text-text-primary">
            <div className="flex-shrink-0 w-full p-2 bg-secondary shadow-md z-10">
                <button
                    onClick={onBack}
                    className="flex items-center text-text-primary hover:text-brand transition-colors p-2 rounded-lg"
                    aria-label="Back to App List"
                >
                    <BackIcon />
                    <span className="ml-2 font-medium">Back to App List</span>
                </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-shrink-0 w-full md:w-32 flex flex-col items-center">
                            <div className="w-32 h-32 rounded-3xl bg-accent flex items-center justify-center overflow-hidden shadow-lg border-2 border-accent">
                                {!imageError && app.icon ? (
                                    <img 
                                        src={app.icon} 
                                        alt={`${app.name} icon`} 
                                        className="w-full h-full object-cover" 
                                        onError={() => setImageError(true)} 
                                    />
                                ) : (
                                    <AppsIcon className="w-16 h-16 text-text-secondary" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-center mt-4 text-text-primary">{app.name}</h1>
                            <a 
                                href={app.apkurl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-brand/50"
                            >
                                <DownloadIcon className="w-5 h-5 mr-2" />
                                Download
                            </a>
                        </div>
                        <div className="flex-grow mt-6 md:mt-0">
                            <div className="bg-secondary p-6 rounded-xl border border-accent">
                                <h2 className="text-2xl font-semibold border-b border-accent pb-3 mb-4 text-brand">Description</h2>
                                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{app.description}</p>
                            </div>
                            <div className="bg-secondary p-6 rounded-xl border border-accent mt-6">
                                <h2 className="text-2xl font-semibold border-b border-accent pb-3 mb-4 text-brand">Features</h2>
                                {featuresList.length > 0 ? (
                                    <ul className="list-disc list-inside space-y-2 text-text-secondary">
                                        {featuresList.map((feature, index) => (
                                            <li key={index}>{feature}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-text-secondary">No features listed.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppDetailPage;