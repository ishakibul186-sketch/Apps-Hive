
import React from 'react';
import { auth } from '../services/firebase';
import { AppUser, View, UserProfile } from '../types';
import { DashboardIcon, ToolsIcon, LogoutIcon, CloseIcon, ProfileIcon, AppsIcon, InboxIcon, ReportIcon, AboutIcon } from './icons/Icons';

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    onNavigate: (view: View) => void;
    user: AppUser;
    userProfile: UserProfile | null;
    currentView: View;
    unreadCount: number;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    view: View;
    currentView: View;
    onClick: (view: View) => void;
    unreadCount?: number;
}> = ({ icon, label, view, currentView, onClick, unreadCount }) => {
    const isActive = currentView === view || (currentView === 'TOOL_VIEW' && view === 'TOOLS_HUB') || (currentView === 'APP_DETAIL_VIEW' && view === 'APP_LIST');

    const baseClasses = "group flex items-center w-full px-4 py-3 text-left transition-all duration-300 ease-in-out rounded-lg mb-1";
    const activeClasses = "text-white bg-brand shadow-lg shadow-brand/20";
    const inactiveClasses = "text-text-secondary hover:text-white hover:bg-accent/40";

    return (
        <button
            onClick={() => onClick(view)}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            <div className="relative">
                {icon}
                 {view === 'INBOX' && unreadCount && unreadCount > 0 ? (
                     <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-secondary"></span>
                 ) : null}
            </div>
            <span className="ml-3 font-medium tracking-wide">{label}</span>
        </button>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, onNavigate, user, userProfile, currentView, unreadCount }) => {
    const handleNavigation = (view: View) => {
        onNavigate(view);
        setIsOpen(false);
    };

    const handleLogout = () => {
        auth.signOut();
        setIsOpen(false);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity md:hidden ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsOpen(false)}
            />
            <aside
                className={`fixed top-0 left-0 w-64 h-full bg-secondary shadow-2xl z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-64 md:flex-shrink-0 flex flex-col border-r border-accent ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Header Section */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-accent bg-secondary/50 backdrop-blur-sm">
                    <div className="flex items-center">
                        <img 
                            src="https://firebasestorage.googleapis.com/v0/b/shakibul-islam-ltd-server.appspot.com/o/Google_AI_Studio_2025-11-29T15_01_20.725Z-removebg-preview.png?alt=media&token=0279bb93-2552-4c9a-b48e-8fcb3a027687" 
                            alt="Logo" 
                            className="w-8 h-8 object-contain" 
                        />
                        <span className="ml-3 text-xl font-bold text-text-primary tracking-wide">Apps Hive</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="md:hidden text-text-secondary hover:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <nav>
                        <NavItem icon={<DashboardIcon className="w-5 h-5"/>} label="Home" view="HOME" currentView={currentView} onClick={handleNavigation} />
                        <NavItem icon={<AppsIcon className="w-5 h-5"/>} label="Apps List" view="APP_LIST" currentView={currentView} onClick={handleNavigation} />
                        <NavItem icon={<ToolsIcon className="w-5 h-5"/>} label="Tools Hub" view="TOOLS_HUB" currentView={currentView} onClick={handleNavigation} />
                        <NavItem icon={<InboxIcon className="w-5 h-5"/>} label="Inbox" view="INBOX" currentView={currentView} onClick={handleNavigation} unreadCount={unreadCount} />
                        <NavItem icon={<ReportIcon className="w-5 h-5"/>} label="Report & Feedback" view="REPORT" currentView={currentView} onClick={handleNavigation} />
                        <NavItem icon={<ProfileIcon className="w-5 h-5"/>} label="Profile" view="PROFILE" currentView={currentView} onClick={handleNavigation} />
                        <NavItem icon={<AboutIcon className="w-5 h-5"/>} label="About" view="ABOUT" currentView={currentView} onClick={handleNavigation} />
                    </nav>
                </div>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-accent bg-secondary/50">
                    <div className="flex items-center w-full p-2 rounded-lg hover:bg-accent/20 transition-colors">
                         <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white font-bold overflow-hidden ring-2 ring-brand/50">
                                {userProfile?.photoBase64 ? (
                                    <img src={userProfile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                                )}
                            </div>
                        </div>
                        <div className="ml-3 flex-grow overflow-hidden">
                            <p className="text-sm font-medium text-text-primary truncate">{userProfile?.name || 'User'}</p>
                            <p className="text-xs text-text-secondary truncate">{user.email}</p>
                        </div>
                        <button 
                            onClick={handleLogout} 
                            className="ml-2 p-2 text-text-secondary hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all"
                            title="Sign Out"
                        >
                            <LogoutIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;