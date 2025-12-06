import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// FIX: The User type from "firebase/auth" is from Firebase v9+.
// Switched to Firebase v8 compatibility syntax (firebase.User).
type FirebaseUser = firebase.User;

// Fix: Changed AppUser from an interface to a type alias using an intersection.
// This resolves an issue where properties from FirebaseUser were not being inherited.
export type AppUser = FirebaseUser & {
    // You can extend the FirebaseUser type with custom properties if needed
};

export interface UserProfile {
    name: string;
    email: string;
    role: string;
    time: string;
    photoBase64?: string;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    link: string;
}

export interface AppInfo {
    id: string;
    name: string;
    description: string;
    features: string;
    apkurl: string;
    icon: string;
}

export interface HomeApp {
    id: string;
    iconurl: string;
    name: string; // Add name for alt text, even if not displayed
}

export interface HomeTool {
    id: string;
    name: string;
}

export interface Message {
    id: string;
    title: string;
    message: string;
    ph1?: string;
    ph2?: string;
    ph3?: string;
}

export interface Report {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    time: string;
    message: string;
    photo1?: string;
    photo2?: string;
    photo3?: string;
    reply?: string;
    status: 'Pending' | 'In Progress' | 'Resolved';
}


export type View = 'HOME' | 'TOOLS_HUB' | 'TOOL_VIEW' | 'PROFILE' | 'APP_LIST' | 'APP_DETAIL_VIEW' | 'HOME_CONTROL' | 'INBOX' | 'REPORT' | 'ABOUT';