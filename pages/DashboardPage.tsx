

import React, { useState, useEffect } from 'react';
// FIX: Removed unused v9 modular imports for Firebase database.
import { db } from '../services/firebase';
import { AppUser, Tool, View, UserProfile, AppInfo, HomeApp, HomeTool, Message } from '../types';
import Sidebar from '../components/Sidebar';
import ToolsHubPage from './ToolsHubPage';
import ToolViewPage from './ToolViewPage';
import Header from '../components/Header';
import ProfilePage from './ProfilePage';
import AppListPage from './AppListPage';
import AppDetailPage from './AppDetailPage';
import HomeSectionCard from '../components/HomeSectionCard';
import HomeControllerPage from './HomeControllerPage';
import InboxPage from './InboxPage';
import ReportPage from './ReportPage';
import AboutPage from './AboutPage';
import { EditIcon } from '../components/icons/Icons';
import ToastNotification from '../components/ToastNotification';

interface HomePageProps {
    user: AppUser;
    userProfile: UserProfile | null;
    currentView: View;
    selectedToolId: string | null;
    selectedAppId: string | null;
    onNavigate: (view: View) => void;
    onSelectTool: (tool: Tool) => void;
    onReturnToToolsHub: () => void;
    onSelectApp: (app: AppInfo) => void;
    onReturnToAppList: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
    user, 
    userProfile,
    currentView, 
    selectedToolId,
    selectedAppId,
    onNavigate, 
    onSelectTool, 
    onReturnToToolsHub,
    onSelectApp,
    onReturnToAppList
}) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // State for home page content
    const [homeApps, setHomeApps] = useState<HomeApp[]>([]);
    const [homeTools, setHomeTools] = useState<HomeTool[]>([]);
    const [homeLoading, setHomeLoading] = useState(true);
    const [homeError, setHomeError] = useState('');
    const [toasts, setToasts] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // State for app/tool detail views
    const [selectedApp, setSelectedApp] = useState<AppInfo | null>(null);
    const [loadingAppDetail, setLoadingAppDetail] = useState(false);
    const [appDetailError, setAppDetailError] = useState('');
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [loadingToolDetail, setLoadingToolDetail] = useState(false);
    const [toolDetailError, setToolDetailError] = useState('');

    useEffect(() => {
        if (!user?.uid) return;
    
        const messagesRef = db.ref('Apps-Hive-Inbox');
        const userNotificationsRef = db.ref(`Apps-Hive-InboxNotification/${user.uid}`);
    
        let allMessages: Message[] = [];
        let notifiedMessageIds: { [key: string]: boolean } = {};
        let messagesLoaded = false;
        let notificationsLoaded = false;
    
        const checkAndNotify = () => {
            if (!messagesLoaded || !notificationsLoaded) return;
    
            const notifiedCount = Object.keys(notifiedMessageIds).length;
            const totalMessages = allMessages.length;
            setUnreadCount(Math.max(0, totalMessages - notifiedCount));
    
            const notifiedIdsSet = new Set(Object.keys(notifiedMessageIds));
            const newMessagesForToast = allMessages.filter(msg => !notifiedIdsSet.has(msg.id));
    
            if (newMessagesForToast.length > 0) {
                setToasts(prevToasts => {
                    const existingToastIds = new Set(prevToasts.map(t => t.id));
                    const uniqueNewMessages = newMessagesForToast.filter(nm => !existingToastIds.has(nm.id));
                    return [...prevToasts, ...uniqueNewMessages];
                });
    
                newMessagesForToast.forEach(msg => {
                    db.ref(`Apps-Hive-InboxNotification/${user.uid}/${msg.id}`).set(true);
                });
            }
        };
    
        const messagesListener = messagesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            allMessages = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            messagesLoaded = true;
            checkAndNotify();
        });
    
        const notificationsListener = userNotificationsRef.on('value', (snapshot) => {
            notifiedMessageIds = snapshot.val() || {};
            notificationsLoaded = true;
            checkAndNotify();
        });
    
        return () => {
            messagesRef.off('value', messagesListener);
            userNotificationsRef.off('value', notificationsListener);
        };
    }, [user?.uid]);


    useEffect(() => {
        if (currentView !== 'HOME') return;

        setHomeLoading(true);
        setHomeError('');

        let appsLoaded = false;
        let toolsLoaded = false;
        const checkLoadingDone = () => {
            if (appsLoaded && toolsLoaded) {
                setHomeLoading(false);
            }
        };

        const appsRef = db.ref('Apps-Hive-Home/Apps');
        const appsCallback = (snapshot: any) => {
            const data = snapshot.val();
            const appsList: HomeApp[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setHomeApps(appsList);
            appsLoaded = true;
            checkLoadingDone();
        };
        appsRef.on('value', appsCallback, (err: Error) => {
            setHomeError(prev => prev + ' Failed to fetch home apps. ');
            appsLoaded = true;
            checkLoadingDone();
        });

        const toolsRef = db.ref('Apps-Hive-Home/Tool');
        const toolsCallback = (snapshot: any) => {
            const data = snapshot.val();
            const toolsList: HomeTool[] = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setHomeTools(toolsList);
            toolsLoaded = true;
            checkLoadingDone();
        };
        toolsRef.on('value', toolsCallback, (err: Error) => {
            setHomeError(prev => prev + ' Failed to fetch home tools. ');
            toolsLoaded = true;
            checkLoadingDone();
        });
        
        return () => {
            appsRef.off('value', appsCallback);
            toolsRef.off('value', toolsCallback);
        };
    }, [currentView]);

    useEffect(() => {
        if (currentView === 'APP_DETAIL_VIEW' && selectedAppId) {
            if (selectedApp?.id === selectedAppId) return;
            setLoadingAppDetail(true);
            setAppDetailError('');
            setSelectedApp(null);
            
            const appRef = db.ref(`Apps-Hive-apps/${selectedAppId}`);
            const listener = appRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    setSelectedApp({ id: snapshot.key, ...snapshot.val() } as AppInfo);
                } else {
                    setAppDetailError('App not found.');
                }
                setLoadingAppDetail(false);
            }, (error) => {
                setAppDetailError('Failed to fetch app details.');
                setLoadingAppDetail(false);
            });
    
            return () => appRef.off('value', listener);

        } else if (currentView !== 'APP_DETAIL_VIEW') {
            setSelectedApp(null);
        }
    }, [currentView, selectedAppId, selectedApp?.id]);

    useEffect(() => {
        if (currentView === 'TOOL_VIEW' && selectedToolId) {
            if (selectedTool?.id === selectedToolId) return;
            setLoadingToolDetail(true);
            setToolDetailError('');
            setSelectedTool(null);
            
            const toolRef = db.ref(`Apps-Hive-Tools/${selectedToolId}`);
            const listener = toolRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    setSelectedTool({ id: snapshot.key, ...snapshot.val() } as Tool);
                } else {
                    setToolDetailError('Tool not found.');
                }
                setLoadingToolDetail(false);
            }, (error) => {
                setToolDetailError('Failed to fetch tool details.');
                setLoadingToolDetail(false);
            });
    
            return () => toolRef.off('value', listener);

        } else if (currentView !== 'TOOL_VIEW') {
            setSelectedTool(null);
        }
    }, [currentView, selectedToolId, selectedTool?.id]);


    const handleDismissToast = (id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };
    
    const handleToastClick = (toast: Message) => {
        onNavigate('INBOX');
        handleDismissToast(toast.id);
    };

    const handleSelectAppFromList = (app: AppInfo) => {
        setSelectedApp(app);
        onSelectApp(app);
    };
    
    const handleSelectToolFromList = (tool: Tool) => {
        setSelectedTool(tool);
        onSelectTool(tool);
    };

    const renderContent = () => {
        switch (currentView) {
            case 'TOOLS_HUB':
                return <ToolsHubPage onSelectTool={handleSelectToolFromList} userProfile={userProfile} />;
            case 'TOOL_VIEW':
                if (loadingToolDetail) {
                    return (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div>
                        </div>
                    );
                }
                if (toolDetailError) {
                    return <div className="text-center p-8 text-red-400">Error: {toolDetailError}</div>;
                }
                if (selectedTool) {
                    return <ToolViewPage tool={selectedTool} user={user} onBack={onReturnToToolsHub} />;
                }
                if (!selectedToolId) {
                    onReturnToToolsHub();
                }
                return null;
            case 'APP_LIST':
                return <AppListPage onSelectApp={handleSelectAppFromList} userProfile={userProfile} />;
            case 'APP_DETAIL_VIEW':
                if (loadingAppDetail) {
                     return (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div>
                        </div>
                    );
                }
                if (appDetailError) {
                    return <div className="text-center p-8 text-red-400">Error: {appDetailError}</div>;
                }
                if (selectedApp) {
                    return <AppDetailPage app={selectedApp} onBack={onReturnToAppList} />;
                }
                if (!selectedAppId) {
                    onReturnToAppList();
                }
                return null;
            case 'PROFILE':
                return <ProfilePage user={user} />;
            case 'HOME_CONTROL':
                return <HomeControllerPage userProfile={userProfile} onNavigate={onNavigate} />;
            case 'INBOX':
                return <InboxPage userProfile={userProfile} />;
            case 'REPORT':
                return <ReportPage user={user} userProfile={userProfile} />;
            case 'ABOUT':
                return <AboutPage />;
            case 'HOME':
            default:
                return (
                    <div className="p-4 sm:p-6 lg:p-8 relative min-h-full">
                        <div className="text-center mb-12">
                            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{userProfile?.name?.split(' ')[0] || 'User'}</span>!
                            </h1>
                            <p className="text-lg text-text-secondary max-w-3xl mx-auto">
                                Explore our curated collections of powerful apps and essential tools, all streamlined in one central hub for your convenience.
                            </p>
                        </div>
                        
                        {homeLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div>
                            </div>
                        ) : homeError ? (
                            <div className="text-center p-8 text-red-400">Error: {homeError}</div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto items-start">
                                <HomeSectionCard 
                                    title="Latest Apps"
                                    items={homeApps}
                                    category="apps"
                                    onNavigate={() => onNavigate('APP_LIST')}
                                />
                                <HomeSectionCard 
                                    title="Featured Tools"
                                    items={homeTools}
                                    category="tools"
                                    onNavigate={() => onNavigate('TOOLS_HUB')}
                                />
                            </div>
                        )}
                        
                        <div className="max-w-6xl mx-auto mt-16">
                            <div className="bg-secondary rounded-2xl shadow-lg border border-accent overflow-hidden flex flex-col md:flex-row">
                                <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center p-8 bg-gradient-to-br from-brand to-purple-600">
                                    <img 
                                        src="https://firebasestorage.googleapis.com/v0/b/shakibul-islam-ltd-server.appspot.com/o/Google_AI_Studio_2025-11-29T15_01_20.725Z-removebg-preview.png?alt=media&token=0279bb93-2552-4c9a-b48e-8fcb3a027687" 
                                        alt="Apps Hive Logo" 
                                        className="w-24 h-24 object-contain drop-shadow-lg" 
                                    />
                                </div>
                                
                                <div className="w-full md:w-1/2 lg:w-7/12 p-8 lg:p-12">
                                    <h2 className="text-3xl font-bold text-text-primary mb-4">
                                        Your All-in-One Digital Hub
                                    </h2>
                                    <p className="text-text-secondary mb-6 leading-relaxed">
                                        Welcome to Apps Hive, the central hub designed to streamline your digital life. We bring together a curated collection of powerful tools and applications, all accessible from a single, secure platform.
                                    </p>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-brand">What We Offer:</h4>
                                            <ul className="list-disc list-inside text-text-secondary mt-2 space-y-1">
                                                <li><strong>Tools Hub:</strong> A suite of essential utilities to boost your productivity.</li>
                                                <li><strong>App List:</strong> Discover and download hand-picked applications for your needs.</li>
                                                <li><strong>Personalized Experience:</strong> Manage your profile and preferences with ease.</li>
                                            </ul>
                                        </div>
                                        <div>
                                             <h4 className="font-semibold text-brand">Your Benefits:</h4>
                                             <p className="text-text-secondary mt-2">
                                                Enjoy the convenience of having everything in one place, saving you time and effort. Our goal is to provide a seamless and efficient experience, helping you find the right tool for the right job, instantly.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {userProfile?.role === 'Admin' && (
                             <div className="absolute bottom-8 right-8">
                                <button
                                    onClick={() => onNavigate('HOME_CONTROL')}
                                    className="flex items-center justify-center px-5 py-3 bg-brand text-white font-semibold rounded-full shadow-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-brand transition-all duration-300 transform hover:scale-105"
                                >
                                    <EditIcon className="w-5 h-5 mr-2" />
                                    Manage Home Content
                                </button>
                            </div>
                        )}
                    </div>
                );
        }
    };
    
    const getPageTitle = () => {
        switch (currentView) {
            case 'TOOLS_HUB':
                return 'Tools Hub';
            case 'TOOL_VIEW':
                return selectedTool?.name || 'Tool';
            case 'APP_LIST':
                return 'App List';
            case 'APP_DETAIL_VIEW':
                return selectedApp?.name || 'App Details';
            case 'PROFILE':
                return 'Profile';
            case 'HOME_CONTROL':
                return 'Home Content Control';
            case 'INBOX':
                return 'Inbox';
            case 'REPORT':
                return 'Report & Feedback';
            case 'ABOUT':
                return 'About';
            case 'HOME':
            default:
                return 'Home';
        }
    }

    return (
        <div className="flex h-screen bg-primary">
            <Sidebar 
                isOpen={isSidebarOpen} 
                setIsOpen={setSidebarOpen} 
                onNavigate={onNavigate}
                user={user}
                userProfile={userProfile}
                currentView={currentView}
                unreadCount={unreadCount}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header 
                    pageTitle={getPageTitle()}
                    onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
                    user={user}
                    userProfile={userProfile}
                />
                <main className="flex-1 overflow-y-auto bg-primary">
                    {renderContent()}
                </main>
            </div>
            <div className="fixed top-6 right-6 z-50 space-y-3 w-full max-w-sm">
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        message={toast}
                        onDismiss={() => handleDismissToast(toast.id)}
                        onNavigate={() => handleToastClick(toast)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomePage;