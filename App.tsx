

import React, { useState, useEffect } from 'react';
import { auth, db } from './services/firebase';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/DashboardPage';
import { AppUser, Tool, View, AppInfo, UserProfile } from './types';

const viewToPath: { [key in View]?: string } = {
    HOME: '/',
    TOOLS_HUB: '/tools-hub',
    APP_LIST: '/apps-list',
    PROFILE: '/profile',
    INBOX: '/inbox',
    REPORT: '/report',
    ABOUT: '/about',
    HOME_CONTROL: '/admin/home-control',
};

const pathToView = (path: string): { view: View; id?: string } => {
    // Handle /login as a special case
    if (path === '/login') return { view: 'HOME' };
    
    // Handle dynamic app detail URLs like /apps-list/some-id
    const appDetailMatch = path.match(/^\/apps-list\/([a-zA-Z0-9_-]+)$/);
    if (appDetailMatch) {
        return { view: 'APP_DETAIL_VIEW', id: appDetailMatch[1] };
    }

    // Handle dynamic tool detail URLs like /tools-hub/some-id
    const toolDetailMatch = path.match(/^\/tools-hub\/([a-zA-Z0-9_-]+)$/);
    if (toolDetailMatch) {
        return { view: 'TOOL_VIEW', id: toolDetailMatch[1] };
    }

    const viewKey = Object.keys(viewToPath).find(key => viewToPath[key as View] === path);
    return { view: viewKey ? (viewKey as View) : 'HOME' };
};


const App: React.FC = () => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    
    const initialRoute = pathToView(window.location.pathname);
    const [currentView, setCurrentView] = useState<View>(initialRoute.view);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(initialRoute.view === 'APP_DETAIL_VIEW' ? initialRoute.id || null : null);
    const [selectedToolId, setSelectedToolId] = useState<string | null>(initialRoute.view === 'TOOL_VIEW' ? initialRoute.id || null : null);


    useEffect(() => {
        const handlePopState = () => {
            const { view, id } = pathToView(window.location.pathname);
            setCurrentView(view);
            setSelectedAppId(view === 'APP_DETAIL_VIEW' ? id || null : null);
            setSelectedToolId(view === 'TOOL_VIEW' ? id || null : null);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        let userProfileUnsubscribe: (() => void) | null = null;

        const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
            if (userProfileUnsubscribe) {
                userProfileUnsubscribe();
                userProfileUnsubscribe = null;
            }

            if (firebaseUser) {
                setUser(firebaseUser as AppUser);
                const userRef = db.ref(`Apps-Hive-users/${firebaseUser.uid}`);
                
                const profileCallback = (snapshot: any) => {
                    if (snapshot.exists()) {
                        const userProfileData = snapshot.val() as UserProfile;
                        setUserProfile({ ...userProfileData, role: userProfileData.role || 'User' });
                    } else {
                        setUserProfile(null);
                    }
                    setLoading(false);
                };
                userRef.on('value', profileCallback);

                userProfileUnsubscribe = () => userRef.off('value', profileCallback);

            } else {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (userProfileUnsubscribe) {
                userProfileUnsubscribe();
            }
        };
    }, []);

    const handleNavigate = (view: View) => {
        const path = viewToPath[view];
        if (path !== undefined && path !== window.location.pathname) {
            window.history.pushState({ view }, '', path);
        }
        setCurrentView(view);
        setSelectedAppId(null);
        setSelectedToolId(null);
    };

    const handleSelectTool = (tool: Tool) => {
        const path = `/tools-hub/${tool.id}`;
        window.history.pushState({ view: 'TOOL_VIEW', id: tool.id }, '', path);
        setCurrentView('TOOL_VIEW');
        setSelectedToolId(tool.id);
    };
    
    const handleReturnToToolsHub = () => {
        window.history.pushState({ view: 'TOOLS_HUB' }, '', '/tools-hub');
        setCurrentView('TOOLS_HUB');
        setSelectedToolId(null);
    }

    const handleSelectApp = (app: AppInfo) => {
        const path = `/apps-list/${app.id}`;
        window.history.pushState({ view: 'APP_DETAIL_VIEW', id: app.id }, '', path);
        setCurrentView('APP_DETAIL_VIEW');
        setSelectedAppId(app.id);
    };

    const handleReturnToAppList = () => {
        window.history.pushState({ view: 'APP_LIST' }, '', '/apps-list');
        setCurrentView('APP_LIST');
        setSelectedAppId(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-primary">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-brand"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary font-sans">
            {!user ? (
                <AuthPage />
            ) : (
                <HomePage
                    user={user}
                    userProfile={userProfile}
                    currentView={currentView}
                    selectedToolId={selectedToolId}
                    selectedAppId={selectedAppId}
                    onNavigate={handleNavigate}
                    onSelectTool={handleSelectTool}
                    onReturnToToolsHub={handleReturnToToolsHub}
                    onSelectApp={handleSelectApp}
                    onReturnToAppList={handleReturnToAppList}
                />
            )}
        </div>
    );
};

export default App;