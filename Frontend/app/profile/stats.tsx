import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import AppHeader from '../../components/common/AppHeader';

export default function LeaderboardScreen() {
    const [batsmen, setBatsmen] = useState<any[]>([]);
    const [bowlers, setBowlers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'batsman' | 'bowler'>('batsman');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [batRes, bowlRes] = await Promise.all([
                api.get('/players?top=batsman'),
                api.get('/players?top=bowler')
            ]);
            setBatsmen(batRes.data);
            setBowlers(bowlRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const displayList = activeTab === 'batsman' ? batsmen : bowlers;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <View style={styles.pageTitleContainer}>
                <Ionicons name="stats-chart-outline" size={24} color="#333" />
                <Text style={styles.pageTitle}>Tourney Stats</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity onPress={() => setActiveTab('batsman')} style={[styles.tab, activeTab === 'batsman' && styles.activeTab]}>
                    <Ionicons name="baseball-outline" size={20} color={activeTab === 'batsman' ? '#fff' : '#555'} />
                    <Text style={[styles.tabText, activeTab === 'batsman' && styles.activeTabText]}>Top Run Scorers</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('bowler')} style={[styles.tab, activeTab === 'bowler' && styles.activeTab]}>
                    <Ionicons name="tennisball-outline" size={20} color={activeTab === 'bowler' ? '#fff' : '#555'} />
                    <Text style={[styles.tabText, activeTab === 'bowler' && styles.activeTabText]}>Top Wicket Takers</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {loading ? <ActivityIndicator size="large" color="#7ED321" style={{ marginTop: 50 }} /> :
                    displayList.map((player, index) => (
                        <View key={player._id} style={styles.card}>
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>{index + 1}</Text>
                            </View>
                            <Image source={{ uri: player.image || 'https://via.placeholder.com/50' }} style={styles.avatar} />
                            <View style={styles.info}>
                                <Text style={styles.name}>{player.name}</Text>
                                <Text style={styles.team}>{player.team?.code || 'Free Agent'}</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={styles.statValue}>{activeTab === 'batsman' ? player.runs : player.wickets}</Text>
                                <Text style={styles.statLabel}>{activeTab === 'batsman' ? 'RUNS' : 'WKTS'}</Text>
                            </View>
                        </View>
                    ))}
                {!loading && displayList.length === 0 && <Text style={styles.empty}>No stats available.</Text>}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    tabContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#eee' },
    activeTab: { backgroundColor: '#7ED321', borderColor: '#7ED321' },
    tabText: { fontWeight: 'bold', color: '#555' },
    activeTabText: { color: '#fff' },

    list: { padding: 16, paddingTop: 0 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
    rankBadge: { width: 30, height: 30, backgroundColor: '#f0f0f0', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    rankText: { fontWeight: '900', color: '#888' },
    avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#eee' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    team: { fontSize: 12, color: '#888' },
    statBox: { alignItems: 'flex-end' },
    statValue: { fontSize: 20, fontWeight: '900', color: '#7ED321' },
    statLabel: { fontSize: 10, fontWeight: 'bold', color: '#aaa' },
    empty: { textAlign: 'center', marginTop: 40, color: '#aaa' },

    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
});
