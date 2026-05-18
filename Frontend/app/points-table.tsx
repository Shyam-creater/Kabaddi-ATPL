import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AppHeader from '../components/common/AppHeader';

export default function PointsTableScreen() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStandings = async () => {
        try {
            const res = await api.get('/teams');
            // Backend already sorts by Points, but let's ensure NRR tie-break if needed
            const sorted = res.data.sort((a: any, b: any) => {
                if (b.points !== a.points) return b.points - a.points;
                return b.nrr - a.nrr;
            });
            setTeams(sorted);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStandings();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStandings();
        setRefreshing(false);
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />}
                contentContainerStyle={styles.content}
            >
                <View style={styles.pageTitleContainer}>
                    <Ionicons name="podium-outline" size={24} color="#333" />
                    <Text style={styles.pageTitle}>Points Table</Text>
                </View>

                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={styles.rowHeader}>
                        <Text style={[styles.cell, styles.posCell]}>#</Text>
                        <Text style={[styles.cell, styles.teamCell]}>Team</Text>
                        <Text style={[styles.cell, styles.statCell]}>P</Text>
                        <Text style={[styles.cell, styles.statCell]}>W</Text>
                        <Text style={[styles.cell, styles.statCell]}>L</Text>
                        <Text style={[styles.cell, styles.ptsCell]}>Pts</Text>
                        <Text style={[styles.cell, styles.nrrCell]}>NRR</Text>
                    </View>

                    {/* Data Rows */}
                    {teams.map((team, index) => (
                        <View key={team._id} style={[styles.row, index < 4 && styles.qualifiedRow]}>
                            <Text style={[styles.cell, styles.posCell]}>{index + 1}</Text>
                            <View style={[styles.teamCell, styles.teamFlex]}>
                                <Image source={{ uri: team.logo }} style={styles.logo} />
                                <View>
                                    <Text style={styles.teamCode}>{team.code}</Text>
                                    <Text style={styles.teamName}>{team.name}</Text>
                                </View>
                            </View>
                            <Text style={[styles.cell, styles.statCell]}>{team.matchesPlayed}</Text>
                            <Text style={[styles.cell, styles.statCell]}>{team.won}</Text>
                            <Text style={[styles.cell, styles.statCell]}>{team.lost}</Text>
                            <Text style={[styles.cell, styles.ptsCell]}>{team.points}</Text>
                            <Text style={[styles.cell, styles.nrrCell]}>{(team.nrr || 0).toFixed(3)}</Text>

                            {index < 4 && <View style={styles.qualifiedIndicator} />}
                        </View>
                    ))}
                </View>

                <View style={styles.legend}>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#E8F5E9' }]} /><Text style={styles.legendText}>Qualifier Zone</Text></View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingBottom: 40 },
    header: {
        padding: 20,
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    table: {
        margin: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        overflow: 'hidden',
    },
    rowHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
        position: 'relative',
    },
    qualifiedRow: {
        backgroundColor: '#F1F8E9',
    },
    qualifiedIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#4CAF50',
    },
    cell: {
        textAlign: 'center',
        fontSize: 12,
        color: '#333',
    },
    posCell: { width: 30, fontWeight: 'bold', color: '#666' },
    teamCell: { flex: 3, paddingLeft: 10, alignItems: 'flex-start' }, // Left align team
    statCell: { width: 35 },
    ptsCell: { width: 40, fontWeight: '900', fontSize: 13 },
    nrrCell: { width: 50, fontSize: 11, color: '#666' },

    teamFlex: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#eee' },
    teamCode: { fontWeight: '900', fontSize: 14 },
    teamName: { fontSize: 10, color: '#888' },

    legend: { flexDirection: 'row', gap: 16, padding: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 12, height: 12, borderRadius: 3, borderWidth: 1, borderColor: '#ccc' },
    legendText: { fontSize: 12, color: '#666' },

    content: { paddingBottom: 100 },
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
});
