import { Redirect } from 'expo-router';
import { useSession } from './ctx';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
    const { session, isLoading } = useSession();

    console.log('🔍 Index.tsx - isLoading:', isLoading, 'session:', session);

    if (isLoading) {
        console.log('⏳ Index.tsx - Still loading...');
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E31C25" />
            </View>
        );
    }

    // Redirect to login if no session, otherwise to tabs
    const destination = session ? '/(tabs)' : '/(auth)/login';
    console.log('🚀 Index.tsx - Redirecting to:', destination);
    return <Redirect href={destination} />;
}
