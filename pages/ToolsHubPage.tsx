
import React, { useState, useEffect, useMemo, FormEvent } from 'react';
// FIX: Removed unused v9 modular imports for Firebase database.
import { db } from '../services/firebase';
import { Tool, UserProfile } from '../types';
import ToolCard from '../components/ToolCard';
import { SearchIcon, PlusIcon, CloseIcon } from '../components/icons/Icons';

interface ToolsHubPageProps {
    onSelectTool: (tool: Tool) => void;
    userProfile: UserProfile | null;
}

const ToolsHubPage: React.FC<ToolsHubPageProps> = ({ onSelectTool, userProfile }) => {
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | null>(null);
    const [newToolName, setNewToolName] = useState('');
    const [newToolDescription, setNewToolDescription] = useState('');
    const [newToolLink, setNewToolLink] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        // FIX: Switched to Firebase v8 compat syntax for database references and listeners.
        const toolsRef = db.ref('Apps-Hive-Tools');
        const listener = toolsRef.on('value', (snapshot) => {
            setLoading(true);
            setError(null);
            try {
                const data = snapshot.val();
                if (data) {
                    const toolsList: Tool[] = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    }));
                    setTools(toolsList);
                } else {
                    setTools([]);
                }
            } catch (e: any) {
                setError("Failed to parse tools data.");
            } finally {
                setLoading(false);
            }
        }, (err: Error) => {
            setError(err.message);
            setLoading(false);
        });

        // FIX: Use the returned listener function with ref.off() for cleanup.
        return () => toolsRef.off('value', listener);
    }, []);

    const filteredTools = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (!query) {
            return tools;
        }
        return tools.filter(tool =>
            tool.name.toLowerCase().includes(query) ||
            (tool.description && tool.description.toLowerCase().includes(query))
        );
    }, [tools, searchQuery]);

    const resetForm = () => {
        setNewToolName('');
        setNewToolDescription('');
        setNewToolLink('');
        setModalError('');
        setIsSaving(false);
        setEditingTool(null);
    };

    const handleOpenAddModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (tool: Tool) => {
        resetForm();
        setEditingTool(tool);
        setNewToolName(tool.name);
        setNewToolDescription(tool.description);
        setNewToolLink(tool.link);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const handleSaveTool = async (e: FormEvent) => {
        e.preventDefault();
        if (!newToolName.trim() || !newToolDescription.trim() || !newToolLink.trim()) {
            setModalError('All fields are required.');
            return;
        }
        setIsSaving(true);
        setModalError('');
        try {
            if (editingTool) {
                // Update existing tool
                // FIX: Switched to Firebase v8 compat syntax for updating data.
                const toolRef = db.ref(`Apps-Hive-Tools/${editingTool.id}`);
                await toolRef.update({
                    name: newToolName,
                    description: newToolDescription,
                    link: newToolLink,
                });
            } else {
                // Add new tool
                // FIX: Switched to Firebase v8 compat syntax for pushing data.
                const toolsRef = db.ref('Apps-Hive-Tools');
                await toolsRef.push({
                    name: newToolName,
                    description: newToolDescription,
                    link: newToolLink,
                });
            }
            handleCloseModal();
        } catch (error: any) {
            setModalError('Failed to save tool: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteTool = async (tool: Tool) => {
        if (window.confirm(`Are you sure you want to delete "${tool.name}"? This action cannot be undone.`)) {
            try {
                // FIX: Switched to Firebase v8 compat syntax for removing data.
                const toolRef = db.ref(`Apps-Hive-Tools/${tool.id}`);
                await toolRef.remove();
            } catch (error: any) {
                setError('Failed to delete tool: ' + error.message);
            }
        }
    };

    const handleShareTool = async (tool: Tool) => {
        const shareUrl = `${window.location.origin}/tools-hub/${tool.id}`;
        const shareData = {
            title: tool.name,
            text: `Check out the "${tool.name}" tool on Apps Hive!`,
            url: shareUrl,
        };
    
        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing tool:', error);
            }
        } else {
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
                        placeholder="Search tools by name or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full py-3 pl-10 pr-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                        aria-label="Search for tools"
                    />
                </div>
                {/* Admin Controls: Show "Add Tool" button only for Admin users */}
                {userProfile?.role === 'Admin' && (
                     <button
                        onClick={handleOpenAddModal}
                        className="flex-shrink-0 w-full md:w-auto flex items-center justify-center px-5 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-brand transition duration-300"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Tool
                    </button>
                )}
            </div>

            {tools.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">No tools available at the moment.</div>
            ) : filteredTools.length === 0 ? (
                <div className="text-center p-8 text-text-secondary">No tools found matching your search.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTools.map(tool => (
                        <ToolCard 
                            key={tool.id} 
                            tool={tool} 
                            userProfile={userProfile}
                            onSelect={() => onSelectTool(tool)}
                            onEdit={() => handleOpenEditModal(tool)}
                            onDelete={() => handleDeleteTool(tool)}
                            onShare={() => handleShareTool(tool)}
                        />
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
                    <div className="bg-secondary rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-accent transform transition-all duration-300 scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-text-primary">{editingTool ? 'Edit Tool' : 'Add New Tool'}</h3>
                            <button onClick={handleCloseModal} className="text-text-secondary hover:text-white p-1 rounded-full">
                                <CloseIcon />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTool} className="space-y-5">
                            <div>
                                <label htmlFor="tool-name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                                <input
                                    id="tool-name"
                                    type="text"
                                    value={newToolName}
                                    onChange={(e) => setNewToolName(e.target.value)}
                                    placeholder="e.g., Image Generator"
                                    className="w-full py-3 px-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                                    required
                                />
                            </div>
                             <div>
                                <label htmlFor="tool-desc" className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                                <textarea
                                    id="tool-desc"
                                    value={newToolDescription}
                                    onChange={(e) => setNewToolDescription(e.target.value)}
                                    placeholder="Describe what this tool does..."
                                    className="w-full py-3 px-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition-all h-24 resize-none"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="tool-link" className="block text-sm font-medium text-text-secondary mb-1">Link</label>
                                <input
                                    id="tool-link"
                                    type="url"
                                    value={newToolLink}
                                    onChange={(e) => setNewToolLink(e.target.value)}
                                    placeholder="https://example.com/tool"
                                    className="w-full py-3 px-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition-all"
                                    required
                                />
                            </div>
                            
                            {modalError && <p className="text-red-400 text-sm text-center">{modalError}</p>}
                            
                            <div className="flex justify-end space-x-4 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-5 py-2 bg-accent text-text-primary font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : (editingTool ? 'Save Changes' : 'Save Tool')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToolsHubPage;