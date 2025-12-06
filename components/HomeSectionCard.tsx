import React from 'react';
import { HomeApp, HomeTool } from '../types';
import { AppsIcon, ArrowRightIcon, ToolsIcon } from './icons/Icons';

interface HomeSectionCardProps {
    title: string;
    items: (HomeApp | HomeTool)[];
    category: 'apps' | 'tools';
    onNavigate: () => void;
}

const ItemIcon: React.FC<{item: HomeApp; category: 'apps'}> = ({ item, category }) => {
    const [hasError, setHasError] = React.useState(false);
    
    if (item.iconurl && !hasError) {
        return (
            <img 
                src={item.iconurl} 
                alt={item.name || 'App Icon'} 
                className="w-full h-full object-cover rounded-lg" 
                onError={() => setHasError(true)}
            />
        );
    }
    
    // Fallback Icon
    return <AppsIcon className="w-6 h-6 text-text-secondary" />;
};


const HomeSectionCard: React.FC<HomeSectionCardProps> = ({ title, items, category, onNavigate }) => {

    const renderContent = () => {
        if (items.length === 0) {
            return (
                <div className="flex items-center justify-center h-full min-h-[160px] bg-accent/30 rounded-lg">
                    <p className="text-text-secondary">No {category} available yet.</p>
                </div>
            );
        }

        if (category === 'tools') {
            return (
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center p-3 bg-accent/60 rounded-lg transition-colors duration-300 group-hover:bg-accent/80">
                            <ToolsIcon className="w-5 h-5 text-text-secondary mr-4 flex-shrink-0" />
                            <p className="text-text-primary truncate" title={item.name}>{item.name}</p>
                        </div>
                    ))}
                </div>
            );
        }

        // Default: 'apps' grid view
        return (
            <div className="grid grid-cols-5 gap-2">
                {items.map((item) => (
                    <div key={item.id} className="aspect-square bg-accent/60 rounded-xl flex items-center justify-center p-1 shadow-inner transition-transform duration-300 group-hover:scale-105">
                        <ItemIcon item={item as HomeApp} category={category} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            onClick={onNavigate}
            className="group bg-secondary rounded-2xl shadow-lg border border-accent hover:border-brand/70 hover:shadow-brand/20 hover:shadow-2xl hover:-translate-y-2 transform transition-all duration-300 cursor-pointer flex flex-col overflow-hidden"
        >
            <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center mb-4">
                    {category === 'apps' ? <AppsIcon className="w-7 h-7 text-brand" /> : <ToolsIcon className="w-7 h-7 text-brand" />}
                    <h3 className="text-2xl font-bold text-text-primary ml-3">{title}</h3>
                </div>
                
                <div>
                    {renderContent()}
                </div>
            </div>

            <div className="bg-accent/50 p-4 mt-auto flex justify-between items-center transition-colors duration-300 group-hover:bg-brand">
                <span className="text-brand font-semibold group-hover:text-white">
                    {`Explore All ${category.charAt(0).toUpperCase() + category.slice(1)}`}
                </span>
                <ArrowRightIcon className="w-5 h-5 text-brand group-hover:text-white transition-transform duration-300 group-hover:translate-x-1" />
            </div>
        </div>
    );
};

export default HomeSectionCard;