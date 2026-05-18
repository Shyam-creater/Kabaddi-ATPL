import React from 'react';
import { useStorageState } from './useStorageState';

const AuthContext = React.createContext<{
    signIn: (token: string) => void;
    signOut: () => void;
    session?: string | null;
    isLoading: boolean;
}>({
    signIn: () => null,
    signOut: () => null,
    session: null,
    isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
    const value = React.useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }

    return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
    const [[isLoading, session], setSession] = useStorageState('token');

    console.log('🔐 SessionProvider - isLoading:', isLoading, 'session:', session ? 'EXISTS' : 'NULL');

    return (
        <AuthContext.Provider
            value={{
                signIn: (token) => {
                    console.log('✅ signIn called with token:', token ? 'EXISTS' : 'NULL');
                    setSession(token);
                },
                signOut: () => {
                    console.log('🚪 signOut called');
                    setSession(null);
                },
                session,
                isLoading,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
}
