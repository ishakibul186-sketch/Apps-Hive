
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
// FIX: Removed unused v9 modular imports for Firebase database.
import { db } from '../services/firebase';
import { AppInfo, UserProfile } from '../types';
import AppCard from '../components/AppCard';
import { SearchIcon, PlusIcon, CloseIcon } from '../components/icons/Icons';

interface AppListPageProps {
    onSelectApp: (app: AppInfo) => void;
    userProfile: UserProfile | null;
}

const AppListPage: React.FC<AppListPageProps> = ({ onSelectApp, userProfile }) => {
    const [apps, setApps] = useState<AppInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingApp, setEditingApp] = useState<AppInfo | null>(null);
    const [formState, setFormState] = useState({
        name: '',
        description: '',
        features: '',
        apkurl: '',
        icon: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        // FIX: Switched to Firebase v8 compat syntax for database references and listeners.
        const appsRef = db.ref('Apps-Hive-apps');
        const listener = appsRef.on('value', (snapshot) => {
            setLoading(true);
            setError(null);
            try {
                const data = snapshot.val();
                if (data) {
                    const appsList: AppInfo[] = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    setApps(appsList);
                } else {
                    setApps([]);
                }
            } catch (e: any) {
                setError("Failed to parse apps data.");
            } finally {
                setLoading(false);
            }
        }, (err: Error) => {
            setError(err.message);
            setLoading(false);
        });

        // FIX: Use ref.off() to detach the listener with the v8 compat API.
        return () => appsRef.off('value', listener);
    }, []);

    const filteredApps = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) return apps;
        return apps.filter(app =>
            app.name.toLowerCase().includes(query) ||
            app.description.toLowerCase().includes(query) ||
            app.features.toLowerCase().includes(query)
        );
    }, [apps, searchQuery]);

    const resetForm = () => {
        setFormState({ name: '', description: '', features: '', apkurl: '', icon: '' });
        setModalError('');
        setIsSaving(false);
        setEditingApp(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (app: AppInfo) => {
        resetForm();
        setEditingApp(app);
        setFormState({ 
            name: app.name || '',
            description: app.description || '',
            features: app.features || '',
            apkurl: app.apkurl || '',
            icon: app.icon || '',
         });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveApp = async (e: FormEvent) => {
        e.preventDefault();
        // FIX: The original check was `Object.values(formState).some(value => !value.trim())`.
        // This was causing a type error because `value` was inferred as `unknown`.
        // We now check each value in `formState` to ensure it's a non-empty string.
        if (Object.values(formState).some(value => typeof value !== 'string' || !value.trim())) {
            setModalError('All fields are required.');
            return;
        }
        setIsSaving(true);
        setModalError('');
        
        const appData = { ...formState };
        
        try {
            if (editingApp) {
                // FIX: Switched to Firebase v8 compat syntax for updating data.
                const appRef = db.ref(`Apps-Hive-apps/${editingApp.id}`);
                await appRef.update(appData);
            } else {
                // FIX: Switched to Firebase v8 compat syntax for pushing data.
                const appsRef = db.ref('Apps-Hive-apps');
                await appsRef.push(appData);
            }
            handleCloseModal();
        } catch (error: any) {
            setModalError('Failed to save app: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteApp = async (app: AppInfo) => {
        if (window.confirm(`Are you sure you want to delete "${app.name}"?`)) {
            try {
                // FIX: Switched to Firebase v8 compat syntax for removing data.
                await db.ref(`Apps-Hive-apps/${app.id}`).remove();
            } catch (error: any) {
                setError('Failed to delete app: ' + error.message);
            }
        }
    };

    const handleShareApp = async (app: AppInfo) => {
        const shareUrl = `${window.location.origin}/apps-list/${app.id}`;
        const shareData = {
            title: app.name,
            text: `Check out ${app.name} on Apps Hive!`,
            url: shareUrl,
        };
    
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing app:', error);
            }
        } else {
            // Fallback for browsers that don't support the Web Share API
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
            } catch (error) {
                alert('Could not copy link to clipboard.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div>
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center p-8 text-red-400">Error: {error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col md:flex-row gap-4 justify-center items-center">
                <div className="relative w-full max-w-lg">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary pointer-events-none">
                        <SearchIcon className="w-5 h-5" />
                    </span>
                    <input
                        type="text"
                        placeholder="Search apps by name, description, features..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-3 pl-10 pr-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                        aria-label="Search for apps"
                    />
                </div>
                 {/* Admin Controls: Show "Add App" button only for Admin users */}
                {userProfile?.role === 'Admin' && (
                     <button
                        onClick={handleOpenAddModal}
                        className="flex-shrink-0 w-full md:w-auto flex items-center justify-center px-5 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-brand transition duration-300"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add App
                    </button>
                )}
            </div>

            {apps.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">No apps available.</div>
            ) : filteredApps.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">No apps found matching your search.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredApps.map(app => (
                        <AppCard 
                            key={app.id} 
                            app={app} 
                            userProfile={userProfile}
                            onSelect={() => onSelectApp(app)}
                            onEdit={() => handleOpenEditModal(app)}
                            onDelete={() => handleDeleteApp(app)}
                            onShare={() => handleShareApp(app)}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-accent">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-text-primary">{editingApp ? 'Edit App' : 'Add New App'}</h3>
                            <button onClick={handleCloseModal} className="text-text-secondary hover:text-white p-1 rounded-full"><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSaveApp} className="space-y-4">
                            <input name="name" value={formState.name} onChange={handleFormChange} placeholder="App Name" required className="w-full py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                            <textarea name="description" value={formState.description} onChange={handleFormChange} placeholder="Description" required className="w-full py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand h-24 resize-none" />
                            <textarea name="features" value={formState.features} onChange={handleFormChange} placeholder="Features (comma-separated)" required className="w-full py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand h-24 resize-none" />
                            <input name="icon" type="url" value={formState.icon} onChange={handleFormChange} placeholder="Icon URL" required className="w-full py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                            <input name="apkurl" type="url" value={formState.apkurl} onChange={handleFormChange} placeholder="APK URL" required className="w-full py-2 px-3 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
                            
                            {modalError && <p className="text-red-400 text-sm text-center">{modalError}</p>}
                            
                            <div className="flex justify-end space-x-4 pt-2">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2 bg-accent text-text-primary font-semibold rounded-lg hover:bg-gray-600" disabled={isSaving}>Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:opacity-50 min-w-[120px]" disabled={isSaving}>
                                    {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : (editingApp ? 'Save Changes' : 'Save App')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppListPage;