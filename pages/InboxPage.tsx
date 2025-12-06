import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { db } from '../services/firebase';
import { UserProfile, Message } from '../types';
import { BackIcon, PlusIcon, InboxIcon, CloseIcon, CameraIcon, TrashIcon } from '../components/icons/Icons';

interface InboxPageProps {
    userProfile: UserProfile | null;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const truncateMessage = (text: string, wordLimit: number): string => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
        return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
};

const InboxPage: React.FC<InboxPageProps> = ({ userProfile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'detail' | 'compose'>('list');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    
    // Compose form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [ph1, setPh1] = useState<string | null>(null);
    const [ph2, setPh2] = useState<string | null>(null);
    const [ph3, setPh3] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        const messagesRef = db.ref('Apps-Hive-Inbox');
        const listener = messagesRef.on('value', (snapshot) => {
            setLoading(true);
            setError(null);
            try {
                const data = snapshot.val();
                if (data) {
                    const messagesList: Message[] = Object.keys(data).map(key => ({
                        id: key,
                        ...data[key]
                    })).reverse(); // Show newest first
                    setMessages(messagesList);
                } else {
                    setMessages([]);
                }
            } catch (e: any) {
                setError("Failed to parse messages.");
            } finally {
                setLoading(false);
            }
        }, (err: Error) => {
            setError(err.message);
            setLoading(false);
        });

        return () => messagesRef.off('value', listener);
    }, []);

    const handleSelectMessage = (msg: Message) => {
        setSelectedMessage(msg);
        setView('detail');
    };

    const handleBackToList = () => {
        setSelectedMessage(null);
        setView('list');
        // Reset form
        setTitle('');
        setMessage('');
        setPh1(null);
        setPh2(null);
        setPh3(null);
        setFormError('');
        setIsSaving(false);
    };

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64 = await fileToBase64(file);
            if (slot === 1) setPh1(base64);
            if (slot === 2) setPh2(base64);
            if (slot === 3) setPh3(base64);
        } catch (err) {
            setFormError('Failed to process image.');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            setFormError('Title and message are required.');
            return;
        }
        setIsSaving(true);
        setFormError('');

        try {
            const newMessage: Omit<Message, 'id'> = { title, message };
            if (ph1) newMessage.ph1 = ph1;
            if (ph2) newMessage.ph2 = ph2;
            if (ph3) newMessage.ph3 = ph3;

            await db.ref('Apps-Hive-Inbox').push(newMessage);
            handleBackToList();
        } catch (err: any) {
            setFormError('Failed to send message: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteMessage = async (messageId: string, messageTitle: string) => {
        if (window.confirm(`Are you sure you want to delete the message "${messageTitle}"? This action cannot be undone.`)) {
            try {
                await db.ref(`Apps-Hive-Inbox/${messageId}`).remove();
                if (view === 'detail') {
                    handleBackToList();
                }
            } catch (err: any) {
                setError('Failed to delete message: ' + err.message);
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

    const ImageSlot: React.FC<{ slot: 1 | 2 | 3, value: string | null, onChange: (e: ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => void, onClear: () => void }> = ({ slot, value, onChange, onClear }) => (
        <div className="relative w-full aspect-video bg-accent rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
            {value ? (
                <>
                    <img src={value} alt={`Preview ${slot}`} className="w-full h-full object-contain rounded-lg" />
                    <button type="button" onClick={onClear} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none"><CloseIcon className="w-4 h-4" /></button>
                </>
            ) : (
                <label className="cursor-pointer text-center text-text-secondary">
                    <CameraIcon className="w-8 h-8 mx-auto mb-2" />
                    <span>Add Image {slot}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e, slot)} />
                </label>
            )}
        </div>
    );


    if (view === 'detail' && selectedMessage) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handleBackToList} className="flex items-center text-text-primary hover:text-brand transition-colors p-2 rounded-lg -ml-2">
                        <BackIcon />
                        <span className="ml-2 font-medium">Back to Inbox</span>
                    </button>
                    {userProfile?.role === 'Admin' && (
                        <button
                            onClick={() => {
                                if (selectedMessage) {
                                    handleDeleteMessage(selectedMessage.id, selectedMessage.title);
                                }
                            }}
                            className="flex items-center justify-center px-4 py-2 bg-red-500/10 text-red-400 font-semibold rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            <TrashIcon className="w-5 h-5 mr-2" />
                            Delete Message
                        </button>
                    )}
                </div>
                <div className="max-w-4xl mx-auto bg-secondary rounded-xl shadow-lg border border-accent p-6">
                    <h1 className="text-3xl font-bold text-text-primary mb-4 border-b border-accent pb-3">{selectedMessage.title}</h1>
                    <p className="text-text-secondary leading-relaxed whitespace-pre-wrap mb-6">{selectedMessage.message}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedMessage.ph1 && <img src={selectedMessage.ph1} alt="Image 1" className="w-full h-auto object-cover rounded-lg bg-accent" />}
                        {selectedMessage.ph2 && <img src={selectedMessage.ph2} alt="Image 2" className="w-full h-auto object-cover rounded-lg bg-accent" />}
                        {selectedMessage.ph3 && <img src={selectedMessage.ph3} alt="Image 3" className="w-full h-auto object-cover rounded-lg bg-accent" />}
                    </div>
                </div>
            </div>
        );
    }
    
    if (view === 'compose') {
        return (
             <div className="p-4 sm:p-6 lg:p-8">
                <button onClick={handleBackToList} className="mb-6 flex items-center text-text-primary hover:text-brand transition-colors p-2 rounded-lg -ml-2">
                    <BackIcon />
                    <span className="ml-2 font-medium">Back to Inbox</span>
                </button>
                <div className="max-w-4xl mx-auto bg-secondary rounded-xl shadow-lg border border-accent p-6">
                    <h2 className="text-3xl font-bold text-text-primary mb-6">Send New Message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Message Title"
                            className="w-full py-3 px-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                            required
                        />
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Your message here..."
                            className="w-full py-3 px-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand h-48 resize-none"
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <ImageSlot slot={1} value={ph1} onChange={handleImageChange} onClear={() => setPh1(null)} />
                            <ImageSlot slot={2} value={ph2} onChange={handleImageChange} onClear={() => setPh2(null)} />
                            <ImageSlot slot={3} value={ph3} onChange={handleImageChange} onClear={() => setPh3(null)} />
                        </div>
                        
                        {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:opacity-50 min-w-[150px] flex items-center justify-center"
                            >
                                {isSaving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Send Message'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-text-primary">Inbox</h1>
                {userProfile?.role === 'Admin' && (
                    <button
                        onClick={() => setView('compose')}
                        className="flex items-center justify-center px-5 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-brand transition"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Send New Message
                    </button>
                )}
            </div>

            {messages.length === 0 ? (
                <div className="text-center p-12 bg-secondary rounded-lg border border-accent">
                    <InboxIcon className="w-16 h-16 mx-auto text-text-secondary mb-4" />
                    <h2 className="text-xl font-semibold text-text-primary">Your Inbox is Empty</h2>
                    <p className="text-text-secondary mt-2">There are no messages to show right now.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className="bg-secondary rounded-lg shadow-md border border-accent hover:border-brand hover:shadow-brand/20 transition-all duration-300 flex items-center justify-between"
                        >
                            <div
                                onClick={() => handleSelectMessage(msg)}
                                className="flex-grow p-5 flex items-start space-x-4 cursor-pointer"
                            >
                                <div className="flex-shrink-0 bg-brand/10 p-3 rounded-full">
                                    <InboxIcon className="w-6 h-6 text-brand" />
                                </div>
                                <div className="flex-grow overflow-hidden">
                                    <h3 className="text-lg font-bold text-text-primary truncate">{msg.title}</h3>
                                    <p className="text-text-secondary text-sm mt-1">
                                        {truncateMessage(msg.message, 7)}
                                    </p>
                                </div>
                            </div>
                            {userProfile?.role === 'Admin' && (
                                <div className="pr-5 flex-shrink-0">
                                     <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteMessage(msg.id, msg.title);
                                        }}
                                        className="p-2 text-text-secondary hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
                                        aria-label={`Delete message: ${msg.title}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InboxPage;