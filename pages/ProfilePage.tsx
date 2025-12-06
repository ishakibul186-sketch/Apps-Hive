
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { db } from '../services/firebase';
import { AppUser, UserProfile } from '../types';
import { UserIcon, CameraIcon, EditIcon, SaveIcon } from '../components/icons/Icons';

interface ProfilePageProps {
    user: AppUser;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // FIX: Switched to Firebase v8 compat syntax for database references and listeners.
        const userRef = db.ref(`Apps-Hive-users/${user.uid}`);
        const listener = userRef.on('value', (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfile(data);
                setDisplayName(data.name);
            } else {
                setError('User profile not found.');
            }
            setLoading(false);
        }, (err: Error) => {
            setError('Failed to fetch profile: ' + err.message);
            setLoading(false);
        });

        // FIX: Use ref.off() to detach the listener with the v8 compat API.
        return () => userRef.off('value', listener);
    }, [user.uid]);

    const obfuscateEmail = (email: string | undefined | null): string => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (localPart.length <= 3) return email;
        const obfuscatedLocal = `${localPart.substring(0, 3)}...`;
        return `${obfuscatedLocal}@${domain}`;
    };

    const handleNameSave = async () => {
        if (!displayName.trim()) {
            setError('Name cannot be empty.');
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            // FIX: Switched to Firebase v8 compat syntax for updating data.
            const userRef = db.ref(`Apps-Hive-users/${user.uid}`);
            await userRef.update({ name: displayName });
            setIsEditingName(false);
            setSuccessMessage('Name updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            setError('Failed to update name: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input to allow re-uploading the same file
    };

    const handlePhotoSave = () => {
        if (!imagePreview) return;
        
        setIsSaving(true);
        setError('');
        const img = new Image();
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const size = 256;
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Could not process image.');
                setIsSaving(false);
                return;
            }
            
            const sourceSize = Math.min(img.width, img.height);
            const sourceX = (img.width - sourceSize) / 2;
            const sourceY = (img.height - sourceSize) / 2;
            ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
            const base64 = canvas.toDataURL('image/webp', 0.8);

            try {
                // FIX: Switched to Firebase v8 compat syntax for updating data.
                const userRef = db.ref(`Apps-Hive-users/${user.uid}`);
                await userRef.update({ photoBase64: base64 });
                setSuccessMessage('Photo updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err: any) {
                setError('Failed to save photo: ' + err.message);
            } finally {
                setIsSaving(false);
                setImagePreview(null);
            }
        };
        img.onerror = () => {
            setError('Failed to load image for processing.');
            setIsSaving(false);
        };
        img.src = imagePreview;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center p-8 text-text-secondary">Could not load profile.</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center w-full min-h-full">
            {successMessage && (
                <div className="fixed top-24 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {successMessage}
                </div>
            )}
            <div className="w-full max-w-md bg-secondary rounded-2xl shadow-2xl p-8 border border-accent">
                {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}
                <div className="flex flex-col items-center">
                    <div className="relative mb-6">
                         <div className="w-32 h-32 rounded-full bg-accent flex items-center justify-center overflow-hidden ring-4 ring-brand/50">
                            {profile.photoBase64 ? (
                                <img src={profile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-16 h-16 text-text-secondary" />
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-brand text-white p-2 rounded-full hover:bg-brand-hover transition-all transform hover:scale-110 shadow-lg"
                            aria-label="Change profile picture"
                        >
                            <CameraIcon className="w-5 h-5" />
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    </div>

                    <div className="w-full text-center space-y-4">
                        <div className="flex items-center justify-center space-x-2">
                             {isEditingName ? (
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="text-2xl font-bold text-center bg-accent text-text-primary border-b-2 border-brand focus:outline-none w-48"
                                    onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                                />
                            ) : (
                                <h2 className="text-3xl font-bold text-text-primary">{profile.name}</h2>
                            )}

                            {isEditingName ? (
                                <button onClick={handleNameSave} className="text-green-400 hover:text-green-300 p-1" disabled={isSaving}>
                                    <SaveIcon />
                                </button>
                            ) : (
                                <button onClick={() => setIsEditingName(true)} className="text-text-secondary hover:text-brand p-1">
                                    <EditIcon />
                                </button>
                            )}
                        </div>

                        <p className="text-text-secondary" title={profile.email}>{obfuscateEmail(profile.email)}</p>
                    </div>
                </div>
            </div>

            {imagePreview && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-accent">
                        <h3 className="text-xl font-bold text-text-primary mb-4">Update Profile Photo</h3>
                        <div className="aspect-square w-full rounded-lg overflow-hidden mb-6 bg-accent">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setImagePreview(null)}
                                className="px-4 py-2 bg-accent text-text-primary font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePhotoSave}
                                className="px-6 py-2 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                                disabled={isSaving}
                            >
                                {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
