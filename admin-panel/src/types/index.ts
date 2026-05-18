export interface User {
    _id: string;
    name: string;
    email: string;
    role: 'player' | 'admin' | 'scorer';
    phone?: string;
    city?: string;
    gender?: 'Male' | 'Female' | 'Other';
    dob?: string;
    profileImage?: string;
    sports?: string[];
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface DashboardStats {
    users: {
        total: number;
        breakdown: { _id: string; count: number }[];
    };
    matches: number;
    tournaments: number;
}
