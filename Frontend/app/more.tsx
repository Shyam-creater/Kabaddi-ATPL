import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import AppHeader from '../components/common/AppHeader';

export default function MoreScreen() {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <View style={styles.pageTitleContainer}>
                <Ionicons name="grid-outline" size={24} color="#333" />
                <Text style={styles.pageTitle}>More Options</Text>
            </View>

            <View style={styles.content}>
                <Ionicons name="construct-outline" size={64} color="#ccc" style={{ marginBottom: 20 }} />
                <Text style={styles.text}>Coming Soon</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#999',
    },
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
});