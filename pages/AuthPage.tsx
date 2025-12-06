
import React, { useState, FormEvent, useEffect } from 'react';
// FIX: Removed unused v9 modular imports for Firebase database.
import { auth, db, googleProvider } from '../services/firebase';
import { UserIcon, EmailIcon, LockIcon } from '../components/icons/Icons';
import { initEmailJS, sendWelcomeEmail } from '../services/email';

// Define InputField outside of the AuthPage component to prevent re-rendering on state change
const InputField: React.FC<{
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ReactNode;
    required?: boolean;
}> = ({ type, placeholder, value, onChange, icon, required }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
            {icon}
        </span>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full py-3 pl-10 pr-4 bg-accent text-text-primary border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition-all"
            required={required}
        />
    </div>
);

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        initEmailJS();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                // FIX: Switched from v9 `signInWithEmailAndPassword(auth, ...)` to v8 compat `auth.signInWithEmailAndPassword(...)`.
                await auth.signInWithEmailAndPassword(email, password);
            } else {
                if (name.trim() === '') {
                    setError('Name is required for signing up.');
                    setLoading(false);
                    return;
                }
                // FIX: Switched from v9 `createUserWithEmailAndPassword(auth, ...)` to v8 compat `auth.createUserWithEmailAndPassword(...)`.
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                // Add the role: 'User' field as requested
                // FIX: Switched to Firebase v8 compat syntax for setting data.
                await db.ref(`Apps-Hive-users/${user.uid}`).set({
                    name: name,
                    email: user.email,
                    role: 'User',
                    time: new Date().toISOString(),
                });
                // Send welcome email
                await sendWelcomeEmail(name, user.email!);
            }
        } catch (err: any) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;

            // If it's a new user, create their profile in the Realtime Database.
            if (result.additionalUserInfo?.isNewUser && user) {
                const userRef = db.ref(`Apps-Hive-users/${user.uid}`);
                await userRef.set({
                    name: user.displayName || 'New User', // Fallback name
                    email: user.email,
                    role: 'User',
                    time: new Date().toISOString(),
                });
                 // Send a welcome email to the new user.
                if (user.displayName && user.email) {
                    await sendWelcomeEmail(user.displayName, user.email);
                }
            }
            // If the user already exists, the onAuthStateChanged listener in App.tsx will handle the login.
        } catch (err: any) {
            // Avoid showing an error if the user closes the Google sign-in popup.
            if (err.code !== 'auth/popup-closed-by-user') {
               setError(err.message.replace('Firebase: ', ''));
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-primary p-4 lg:p-0">
            <div className="flex w-full max-w-sm lg:max-w-4xl bg-secondary rounded-2xl shadow-2xl overflow-hidden border border-accent">
                {/* Left side - Branding */}
                <div className="hidden lg:flex flex-col items-center justify-center w-1/2 bg-gradient-to-br from-brand to-purple-600 p-12 text-white text-center">
                    <img 
                        src="https://firebasestorage.googleapis.com/v0/b/shakibul-islam-ltd-server.appspot.com/o/Google_AI_Studio_2025-11-29T15_01_20.725Z-removebg-preview.png?alt=media&token=0279bb93-2552-4c9a-b48e-8fcb3a027687" 
                        alt="Apps Hive Logo" 
                        className="w-24 h-24 mb-4 object-contain" 
                    />
                    <h1 className="text-4xl font-bold mb-2">Welcome to Apps Hive</h1>
                    <p className="text-lg opacity-80">Your one-stop hub for powerful applications.</p>
                </div>

                {/* Right side - Form */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
                    <div className="mb-8 text-center lg:hidden flex flex-col items-center">
                        <img 
                            src="https://firebasestorage.googleapis.com/v0/b/shakibul-islam-ltd-server.appspot.com/o/Google_AI_Studio_2025-11-29T15_01_20.725Z-removebg-preview.png?alt=media&token=0279bb93-2552-4c9a-b48e-8fcb3a027687" 
                            alt="Apps Hive Logo" 
                            className="w-16 h-16 mb-2 object-contain" 
                        />
                        <h1 className="text-3xl font-bold text-text-primary">Apps Hive</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex mb-8 border-b border-accent">
                        <button
                            onClick={() => { setIsLogin(true); setError('') }}
                            className={`w-1/2 py-3 font-semibold transition-colors duration-300 ${isLogin ? 'text-brand border-b-2 border-brand' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError('') }}
                            className={`w-1/2 py-3 font-semibold transition-colors duration-300 ${!isLogin ? 'text-brand border-b-2 border-brand' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Sign Up
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-text-primary mb-2">{isLogin ? 'Welcome Back!' : 'Create an Account'}</h2>
                    <p className="text-text-secondary mb-6">{isLogin ? 'Login to continue.' : 'Get started in seconds.'}</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <InputField
                                type="text"
                                placeholder="Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                icon={<UserIcon />}
                                required={!isLogin}
                            />
                        )}
                        <InputField
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<EmailIcon />}
                            required
                        />
                        <InputField
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<LockIcon />}
                            required
                        />
                        
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-brand text-white font-semibold rounded-lg hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-brand transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mx-auto"></div>
                            ) : (isLogin ? 'Login' : 'Create Account')}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-accent"></div>
                        <span className="mx-4 text-sm text-text-secondary">OR</span>
                        <div className="flex-grow border-t border-accent"></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full flex items-center justify-center py-3 px-4 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary focus:ring-brand transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.617-3.26-11.283-7.94l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
