import React from 'react';
import { MenuIcon } from './icons/Icons';
import { AppUser, UserProfile } from '../types';

interface HeaderProps {
    pageTitle: string;
    onMenuClick: () => void;
    user: AppUser;
    userProfile: UserProfile | null;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, onMenuClick, user, userProfile }) => {
    return (
        <header className="flex items-center justify-between h-20 bg-secondary px-6 shadow-md flex-shrink-0 z-10 border-b border-accent">
            <div className="flex items-center">
                 <button onClick={onMenuClick} className="md:hidden text-text-secondary hover:text-white mr-4 p-2 -ml-2">
                    <MenuIcon />
                </button>
                <h2 className="text-xl font-semibold text-text-primary">{pageTitle}</h2>
            </div>
            <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center font-bold text-white ring-2 ring-offset-2 ring-offset-secondary ring-brand overflow-hidden">
                    {userProfile?.photoBase64 ? (
                        <img src={userProfile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        userProfile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()
                    )}
                 </div>
            </div>
        </header>
    );
};

export default Header;