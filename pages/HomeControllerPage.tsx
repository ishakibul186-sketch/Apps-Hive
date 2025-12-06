
import React, { useState, useEffect, FormEvent } from 'react';
import { db } from '../services/firebase';
import { UserProfile, View, HomeApp, HomeTool } from '../types';
import { AppsIcon, ToolsIcon, TrashIcon, BackIcon, PlusIcon } from '../components/icons/Icons';

interface HomeControllerPageProps {
    userProfile: UserProfile | null;
    onNavigate: (view: View) => void;
}

const HomeControllerPage: React.FC<HomeControllerPageProps> = ({ userProfile, onNavigate }) => {
    const [apps, setApps] = useState<HomeApp[]>([]);
    const [tools, setTools] = useState<HomeTool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newAppIconUrl, setNewAppIconUrl] = useState('');
    const [newToolName, setNewToolName] = useState('');
    const [isSavingApp, setIsSavingApp] = useState(false);
    const [isSavingTool, setIsSavingTool] = useState(false);

    useEffect(() => {
        setLoading(true);
        setError('');
        
        let appsLoaded = false;
        let toolsLoaded = false;
        const checkLoadingDone = () => {
            if (appsLoaded && toolsLoaded) {
                setLoading(false);
            }
        };

        const appsRef = db.ref('Apps-Hive-Home/Apps');
        const toolsRef = db.ref('Apps-Hive-Home/Tool');

        const appsCallback = (snapshot: any) => {
            const data = snapshot.val();
            const list: HomeApp[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setApps(list);
            appsLoaded = true;
            checkLoadingDone();
        };

        const toolsCallback = (snapshot: any) => {
            const data = snapshot.val();
            const list: HomeTool[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setTools(list);
            toolsLoaded = true;
            checkLoadingDone();
        };

        appsRef.on('value', appsCallback, (err: Error) => {
            setError(prev => prev + `Failed to fetch home apps: ${err.message}. `);
            appsLoaded = true;
            checkLoadingDone();
        });

        toolsRef.on('value', toolsCallback, (err: Error) => {
            setError(prev => prev + `Failed to fetch home tools: ${err.message}. `);
            toolsLoaded = true;
            checkLoadingDone();
        });

        return () => {
            appsRef.off('value', appsCallback);
            toolsRef.off('value', toolsCallback);
        };
    }, []);

    const handleAddApp = async (e: FormEvent) => {
        e.preventDefault();
        if (!newAppIconUrl.trim()) return;
        setIsSavingApp(true);
        try {
            await db.ref('Apps-Hive-Home/Apps').push({ iconurl: newAppIconUrl, name: 'App Icon' });
            setNewAppIconUrl('');
        } catch (err: any) {
            setError('Failed to add app icon: ' + err.message);
        } finally {
            setIsSavingApp(false);
        }
    };

    const handleDeleteApp = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this app icon?')) {
            try {
                await db.ref(`Apps-Hive-Home/Apps/${id}`).remove();
            } catch (err: any) {
                setError('Failed to delete app icon: ' + err.message);
            }
        }
    };

    const handleAddTool = async (e: FormEvent) => {
        e.preventDefault();
        if (!newToolName.trim()) return;
        setIsSavingTool(true);
        try {
            await db.ref('Apps-Hive-Home/Tool').push({ name: newToolName });
            setNewToolName('');
        } catch (err: any) {
            setError('Failed to add tool: ' + err.message);
        } finally {
            setIsSavingTool(false);
        }
    };

    const handleDeleteTool = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this tool?')) {
            try {
                await db.ref(`Apps-Hive-Home/Tool/${id}`).remove();
            } catch (err: any) {
                setError('Failed to delete tool: ' + err.message);
            }
        }
    };

    if (userProfile?.role !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2>
                <p className="text-text-secondary">You do not have permission to view this page.</p>
                <button onClick={() => onNavigate('HOME')} className="mt-8 flex items-center text-brand hover:text-brand-hover transition-colors p-2 rounded-lg">
                    <BackIcon />
                    <span className="ml-2 font-medium">Return to Home</span>
                </button>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <button onClick={() => onNavigate('HOME')} className="mb-8 flex items-center text-text-primary hover:text-brand transition-colors p-2 rounded-lg -ml-2">
                <BackIcon />
                <span className="ml-2 font-medium">Back to Home</span>
            </button>

            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">{error}</div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Manage App Icons */}
                <div className="bg-secondary rounded-2xl shadow-lg border border-accent p-6">
                    <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center"><AppsIcon className="w-5 h-5 mr-3 text-brand" /> Manage App Icons</h3>
                    <form onSubmit={handleAddApp} className="flex gap-2 mb-4">
                        <input
                            type="url"
                            value={newAppIconUrl}
                            onChange={(e) => setNewAppIconUrl(e.target.value)}
                            placeholder="Enter new icon URL"
                            className="flex-grow py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                            required
                        />
                        <button type="submit" disabled={isSavingApp} className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:opacity-50 flex-shrink-0">
                            <PlusIcon className="w-5 h-5"/>
                        </button>
                    </form>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                        {apps.map(app => (
                            <div key={app.id} className="flex items-center justify-between bg-accent p-2 rounded-lg">
                                <img src={app.iconurl} alt="icon" className="w-6 h-6 rounded-md object-cover bg-primary" />
                                <p className="text-sm text-text-secondary truncate mx-4 flex-grow" title={app.iconurl}>{app.iconurl}</p>
                                <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/10 flex-shrink-0">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Manage Tool Names */}
                <div className="bg-secondary rounded-2xl shadow-lg border border-accent p-6">
                    <h3 className="text-2xl font-bold text-text-primary mb-4 flex items-center"><ToolsIcon className="w-5 h-5 mr-3 text-brand" /> Manage Tool Names</h3>
                    <form onSubmit={handleAddTool} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newToolName}
                            onChange={(e) => setNewToolName(e.target.value)}
                            placeholder="Enter new tool name"
                            className="flex-grow py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                            required
                        />
                        <button type="submit" disabled={isSavingTool} className="px-4 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:opacity-50 flex-shrink-0">
                            <PlusIcon className="w-5 h-5"/>
                        </button>
                    </form>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                        {tools.map(tool => (
                            <div key={tool.id} className="flex items-center justify-between bg-accent p-2 rounded-lg">
                                <p className="text-text-primary truncate mx-2 flex-grow" title={tool.name}>{tool.name}</p>
                                <button onClick={() => handleDeleteTool(tool.id)} className="p-2 text-red-500 hover:text-red-400 rounded-full hover:bg-red-500/10 flex-shrink-0">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeControllerPage;