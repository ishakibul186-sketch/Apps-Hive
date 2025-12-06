import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { db } from '../services/firebase';
import { AppUser, UserProfile, Report } from '../types';
import { CameraIcon, CloseIcon, ReportIcon, SaveIcon } from '../components/icons/Icons';

interface ReportPageProps {
    user: AppUser;
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

const StatusBadge: React.FC<{ status: Report['status'] }> = ({ status }) => {
    const statusStyles: { [key in Report['status']]: string } = {
        Pending: 'bg-yellow-500/20 text-yellow-400',
        'In Progress': 'bg-blue-500/20 text-blue-400',
        Resolved: 'bg-green-500/20 text-green-400',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};

const ReportPage: React.FC<ReportPageProps> = ({ user, userProfile }) => {
    const isAdmin = userProfile?.role === 'Admin';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // User state
    const [userReports, setUserReports] = useState<Report[]>([]);
    const [activeTab, setActiveTab] = useState('submit');
    
    // Admin state
    const [allReports, setAllReports] = useState<Report[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [adminReply, setAdminReply] = useState('');
    const [adminStatus, setAdminStatus] = useState<Report['status']>('Pending');
    
    // Form state
    const [message, setMessage] = useState('');
    const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');

        if (isAdmin) {
            const reportsRef = db.ref('Apps-Hive-Report');
            const listener = reportsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                const allReportsList: Report[] = [];
                if (data) {
                    for (const userId in data) {
                        const userReportsData = data[userId];
                        for (const reportId in userReportsData) {
                            allReportsList.push({
                                id: reportId,
                                userId: userId,
                                ...userReportsData[reportId]
                            });
                        }
                    }
                }
                allReportsList.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
                setAllReports(allReportsList);
                setLoading(false);
            }, (err: Error) => {
                setError(err.message);
                setLoading(false);
            });
            return () => reportsRef.off('value', listener);
        } else {
            const userReportsRef = db.ref(`Apps-Hive-Report/${user.uid}`);
            const listener = userReportsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                const userReportsList: Report[] = data ? Object.keys(data).map(key => ({
                    id: key,
                    userId: user.uid,
                    ...data[key]
                })).reverse() : [];
                setUserReports(userReportsList);
                setLoading(false);
            }, (err: Error) => {
                setError(err.message);
                setLoading(false);
            });
            return () => userReportsRef.off('value', listener);
        }
    }, [isAdmin, user.uid]);

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await fileToBase64(file);
            setPhotos(prev => {
                const newPhotos = [...prev];
                newPhotos[index] = base64;
                return newPhotos;
            });
        } catch (err) {
            setFormError('Failed to process image.');
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            setFormError('Message cannot be empty.');
            return;
        }
        setIsSubmitting(true);
        setFormError('');
        try {
            const [photo1, photo2, photo3] = photos;
            const reportData = {
                message,
                time: new Date().toISOString(),
                status: 'Pending' as Report['status'],
                userName: userProfile?.name || 'N/A',
                userEmail: user.email || 'N/A',
                ...(photo1 && { photo1 }),
                ...(photo2 && { photo2 }),
                ...(photo3 && { photo3 }),
            };
            await db.ref(`Apps-Hive-Report/${user.uid}`).push(reportData);
            setSuccessMessage('Your report has been submitted successfully!');
            setMessage('');
            setPhotos([null, null, null]);
            setActiveTab('history');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            setFormError('Submission failed: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdminUpdate = async () => {
        if (!selectedReport) return;
        setIsSubmitting(true);
        try {
            await db.ref(`Apps-Hive-Report/${selectedReport.userId}/${selectedReport.id}`).update({
                reply: adminReply,
                status: adminStatus,
            });
            setSelectedReport(null);
        } catch (err: any) {
            setError('Failed to update report: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const ImageSlot: React.FC<{ index: number, value: string | null, onChange: (e: ChangeEvent<HTMLInputElement>, index: number) => void, onClear: () => void }> = ({ index, value, onChange, onClear }) => (
        <div className="relative w-full aspect-video bg-accent rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
            {value ? (
                <>
                    <img src={value} alt={`Preview ${index+1}`} className="w-full h-full object-contain rounded-lg" />
                    <button type="button" onClick={onClear} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 leading-none"><CloseIcon className="w-4 h-4" /></button>
                </>
            ) : (
                <label className="cursor-pointer text-center text-text-secondary p-2">
                    <CameraIcon className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm">Attach Image {index+1}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onChange(e, index)} />
                </label>
            )}
        </div>
    );
    
    const openAdminModal = (report: Report) => {
        setSelectedReport(report);
        setAdminReply(report.reply || '');
        setAdminStatus(report.status);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-brand"></div></div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-400">Error: {error}</div>;
    }

    // ADMIN VIEW
    if (isAdmin) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold text-text-primary mb-6">All User Reports</h1>
                {allReports.length === 0 ? (
                    <div className="text-center p-12 bg-secondary rounded-lg"><ReportIcon className="w-16 h-16 mx-auto text-text-secondary mb-4" /><h2 className="text-xl font-semibold">No reports found.</h2></div>
                ) : (
                    <div className="space-y-4">
                        {allReports.map(report => (
                            <div key={report.id} onClick={() => openAdminModal(report)} className="bg-secondary rounded-lg shadow-md border border-accent hover:border-brand p-4 cursor-pointer transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-text-primary">{report.userName} <span className="text-sm text-text-secondary font-normal">({report.userEmail})</span></p>
                                        <p className="text-sm text-text-secondary mt-1">{new Date(report.time).toLocaleString()}</p>
                                    </div>
                                    <StatusBadge status={report.status} />
                                </div>
                                <p className="text-text-secondary mt-2 line-clamp-2">{report.message}</p>
                            </div>
                        ))}
                    </div>
                )}
                {selectedReport && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-secondary rounded-2xl shadow-2xl p-6 max-w-2xl w-full border border-accent max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-2xl font-bold">Report Details</h3>
                                <button onClick={() => setSelectedReport(null)} className="p-1"><CloseIcon /></button>
                            </div>
                            <div className="overflow-y-auto space-y-4 pr-2">
                                <p><strong>From:</strong> {selectedReport.userName} ({selectedReport.userEmail})</p>
                                <p><strong>Date:</strong> {new Date(selectedReport.time).toLocaleString()}</p>
                                <p className="bg-accent p-3 rounded-lg whitespace-pre-wrap">{selectedReport.message}</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {selectedReport.photo1 && <img src={selectedReport.photo1} className="w-full h-auto object-cover rounded-lg"/>}
                                    {selectedReport.photo2 && <img src={selectedReport.photo2} className="w-full h-auto object-cover rounded-lg"/>}
                                    {selectedReport.photo3 && <img src={selectedReport.photo3} className="w-full h-auto object-cover rounded-lg"/>}
                                </div>
                                <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} placeholder="Type your reply here..." className="w-full p-2 bg-accent rounded-lg h-24"/>
                                <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value as Report['status'])} className="w-full p-2 bg-accent rounded-lg">
                                    <option>Pending</option>
                                    <option>In Progress</option>
                                    <option>Resolved</option>
                                </select>
                            </div>
                             <div className="flex justify-end space-x-3 mt-4">
                                <button onClick={() => setSelectedReport(null)} className="px-4 py-2 bg-accent rounded-lg">Cancel</button>
                                <button onClick={handleAdminUpdate} disabled={isSubmitting} className="px-6 py-2 bg-brand text-white rounded-lg min-w-[100px]">{isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div> : 'Update'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    
    // USER VIEW
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Report & Feedback</h1>
            <p className="text-text-secondary mb-6">Submit a bug report or share your feedback to help us improve.</p>

            <div className="border-b border-accent mb-6 flex">
                <button onClick={() => setActiveTab('submit')} className={`px-4 py-2 font-semibold ${activeTab === 'submit' ? 'text-brand border-b-2 border-brand' : 'text-text-secondary'}`}>Submit New</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-semibold ${activeTab === 'history' ? 'text-brand border-b-2 border-brand' : 'text-text-secondary'}`}>My Reports</button>
            </div>
            
            {successMessage && <div className="bg-green-500/20 text-green-300 p-3 rounded-lg mb-4">{successMessage}</div>}

            {activeTab === 'submit' && (
                <div className="max-w-3xl mx-auto bg-secondary p-6 rounded-xl border border-accent">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue or feedback in detail..." className="w-full p-3 bg-accent rounded-lg h-40 resize-none focus:ring-2 focus:ring-brand focus:outline-none" required />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[0,1,2].map(i => <ImageSlot key={i} index={i} value={photos[i]} onChange={handleImageChange} onClear={() => setPhotos(p => {const n=[...p]; n[i]=null; return n;})} />)}
                        </div>
                        {formError && <p className="text-red-400 text-sm text-center">{formError}</p>}
                        <div className="flex justify-end">
                            <button type="submit" disabled={isSubmitting} className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover disabled:opacity-50 min-w-[150px] flex items-center justify-center">
                                {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            {activeTab === 'history' && (
                 <div className="max-w-3xl mx-auto space-y-4">
                    {userReports.length === 0 ? (
                        <div className="text-center p-12 bg-secondary rounded-lg">
                            <p className="text-text-secondary">You haven't submitted any reports yet.</p>
                        </div>
                    ) : (
                        userReports.map(report => (
                            <details key={report.id} className="bg-secondary rounded-lg shadow-md border border-accent p-4 group">
                                <summary className="flex justify-between items-center cursor-pointer list-none">
                                    <div className="font-semibold text-text-primary line-clamp-1 flex-grow pr-4">{report.message}</div>
                                    <div className="flex-shrink-0 flex items-center space-x-4">
                                        <StatusBadge status={report.status} />
                                        <span className="text-sm text-text-secondary">{new Date(report.time).toLocaleDateString()}</span>
                                    </div>
                                </summary>
                                <div className="mt-4 pt-4 border-t border-accent space-y-4">
                                    <p className="text-text-secondary whitespace-pre-wrap">{report.message}</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      {report.photo1 && <img src={report.photo1} className="rounded-md"/>}
                                      {report.photo2 && <img src={report.photo2} className="rounded-md"/>}
                                      {report.photo3 && <img src={report.photo3} className="rounded-md"/>}
                                    </div>
                                    {report.reply && (
                                        <div className="bg-brand/10 p-3 rounded-lg">
                                            <p className="font-semibold text-brand mb-1">Admin Reply:</p>
                                            <p className="text-text-primary whitespace-pre-wrap">{report.reply}</p>
                                        </div>
                                    )}
                                </div>
                            </details>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportPage;
