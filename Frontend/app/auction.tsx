import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, RefreshControl, Dimensions, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AppHeader from '../components/common/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function AuctionScreen() {
    const [players, setPlayers] = useState<any[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeSport, setActiveSport] = useState('Cricket');
    const [activeCategory, setActiveCategory] = useState('All');

    const fetchPlayers = async () => {
        try {
            const res = await api.get(`/players?sport=${activeSport}`);
            setPlayers(res.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlayers();
        // Socket listener would go here
    }, [activeSport]);

    useEffect(() => {
        let result = players;
        if (activeCategory !== 'All') {
            result = result.filter(p => p.category === activeCategory);
        }
        setFilteredPlayers(result);
    }, [players, activeCategory]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPlayers();
        setRefreshing(false);
    };

    const livePlayer = players.find(p => p.auctionStatus === 'LIVE');
    const soldPlayers = filteredPlayers.filter(p => p.auctionStatus === 'SOLD').sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const upcomingPlayers = filteredPlayers.filter(p => p.auctionStatus === 'UPCOMING' || p.auctionStatus === 'UNSOLD');

    const renderSportTab = (sport: string, icon: any) => (
        <TouchableOpacity
            style={[styles.sportTab, activeSport === sport && styles.activeSportTab]}
            onPress={() => { setActiveSport(sport); setLoading(true); }}
        >
            <Ionicons name={icon} size={16} color={activeSport === sport ? '#fff' : '#666'} />
            <Text style={[styles.sportTabText, activeSport === sport && styles.activeSportTabText]}>{sport}</Text>
        </TouchableOpacity>
    );

    const renderCategoryChip = (cat: string) => (
        <TouchableOpacity
            style={[styles.catChip, activeCategory === cat && styles.activeCatChip]}
            onPress={() => setActiveCategory(cat)}
        >
            <Text style={[styles.catText, activeCategory === cat && styles.activeCatText]}>{cat === 'All' ? 'All' : `Cat ${cat}`}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <View style={styles.filterHeader}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportTabsContainer}>
                    {renderSportTab('Cricket', 'baseball-outline')}
                    {renderSportTab('Kabaddi', 'body-outline')}
                    {renderSportTab('Football', 'football-outline')}
                </ScrollView>
                <View style={styles.catContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
                        {renderCategoryChip('All')}
                        {renderCategoryChip('A')}
                        {renderCategoryChip('B')}
                        {renderCategoryChip('Icon')}
                    </ScrollView>
                </View>
            </View>

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
                contentContainerStyle={styles.content}
            >
                {/* LIVE AUCTION BANNER */}
                {livePlayer ? (
                    <View style={styles.liveContainer}>
                        <LinearGradient colors={['#E31C25', '#990000']} style={styles.liveCard}>
                            <View style={styles.liveHeader}>
                                <View style={styles.liveBadge}><Text style={styles.liveText}>LIVE AUCTION</Text></View>
                                <Ionicons name="radio-outline" size={24} color="#fff" style={{ opacity: 0.8 }} />
                            </View>
                            <View style={styles.liveBody}>
                                <View style={styles.liveImageContainer}>
                                    <Image source={{ uri: livePlayer.image || 'https://via.placeholder.com/150' }} style={styles.liveImage} />
                                </View>
                                <View style={styles.liveInfo}>
                                    <Text style={styles.liveName}>{livePlayer.name}</Text>
                                    <Text style={styles.liveRole}>{livePlayer.role} • {livePlayer.category}</Text>
                                    <View style={styles.livePriceBox}>
                                        <Text style={styles.livePriceLabel}>Current Bid</Text>
                                        <Text style={styles.livePrice}>₹{livePlayer.basePrice}</Text>
                                        {/* Ideally socket updates specifically currentBid, falling back to basePrice */}
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>
                ) : (
                    <View style={styles.noLiveContainer}>
                        <LinearGradient colors={['#eee', '#e0e0e0']} style={styles.noLiveCard}>
                            <Text style={styles.noLiveText}>No Live Auction in {activeSport}</Text>
                            <Text style={styles.noLiveSubText}>Check Upcoming Players below</Text>
                        </LinearGradient>
                    </View>
                )}

                {/* SOLD PLAYERS */}
                {soldPlayers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Just Sold</Text>
                        {soldPlayers.map((player) => (
                            <View key={player._id} style={styles.soldCard}>
                                <Image source={{ uri: player.image || 'https://via.placeholder.com/150' }} style={styles.soldAvatar} />
                                <View style={styles.soldInfo}>
                                    <Text style={styles.soldName}>{player.name}</Text>
                                    <Text style={styles.soldRole}>{player.role} • {player.category}</Text>
                                </View>
                                <View style={styles.soldPriceContainer}>
                                    <Text style={styles.soldPrice}>₹{player.soldPrice}</Text>
                                    <View style={styles.teamBadge}>
                                        <Text style={styles.teamText}>{player.team?.code || player.team || 'SOLD'}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* UPCOMING PLAYERS */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming / Unsold</Text>
                    <View style={styles.grid}>
                        {upcomingPlayers.map((player) => (
                            <View key={player._id} style={styles.gridCard}>
                                <View style={styles.gridImageContainer}>
                                    <Image source={{ uri: player.image || 'https://via.placeholder.com/150' }} style={styles.gridImage} />
                                    <View style={styles.catBadge}><Text style={styles.catBadgeText}>{player.category}</Text></View>
                                </View>
                                <Text style={styles.gridName} numberOfLines={1}>{player.name}</Text>
                                <Text style={styles.gridRole}>{player.role}</Text>
                                <Text style={styles.gridPrice}>Base: ₹{player.basePrice}</Text>
                            </View>
                        ))}
                        {upcomingPlayers.length === 0 && (
                            <Text style={styles.emptyText}>No upcoming players found.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    filterHeader: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sportTabsContainer: {
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 10,
    },
    sportTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        gap: 6,
    },
    activeSportTab: {
        backgroundColor: '#1a1a1a',
    },
    sportTabText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    activeSportTabText: {
        color: '#fff',
    },
    catContainer: {
        height: 30, // Fixed height for chips
    },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        justifyContent: 'center',
    },
    activeCatChip: {
        backgroundColor: '#E31C25',
        borderColor: '#E31C25',
    },
    catText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#666',
    },
    activeCatText: {
        color: '#fff',
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    liveContainer: { marginBottom: 24, paddingHorizontal: 4 },
    liveCard: { padding: 24, borderRadius: 24, elevation: 10, shadowColor: '#E31C25', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
    liveHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    liveBadge: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    liveText: { color: '#E31C25', fontWeight: '900', fontSize: 10, letterSpacing: 1 },
    liveBody: { flexDirection: 'row', alignItems: 'center' },
    liveImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
    liveImageContainer: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    liveInfo: { marginLeft: 20, flex: 1 },
    liveName: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
    liveRole: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: 12 },
    livePriceBox: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12, alignSelf: 'flex-start' },
    livePriceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, textTransform: 'uppercase', fontWeight: 'bold' },
    livePrice: { color: '#fff', fontSize: 20, fontWeight: '900' },

    noLiveContainer: { marginBottom: 24, paddingVertical: 10 },
    noLiveCard: { padding: 20, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    noLiveText: { fontSize: 14, fontWeight: 'bold', color: '#888' },
    noLiveSubText: { fontSize: 12, color: '#aaa', marginTop: 4 },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1a1a1a', marginBottom: 16, marginLeft: 4 },

    soldCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    soldAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f0f0' },
    soldInfo: { flex: 1, marginLeft: 12 },
    soldName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    soldRole: { fontSize: 11, color: '#888', marginTop: 2 },
    soldPriceContainer: { alignItems: 'flex-end' },
    soldPrice: { fontSize: 15, fontWeight: '900', color: '#2E7D32' },
    teamBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
    teamText: { fontSize: 10, fontWeight: 'bold', color: '#1565C0' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridCard: { width: (width - 44) / 2, backgroundColor: '#fff', padding: 12, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
    gridImageContainer: { position: 'relative', marginBottom: 10 },
    gridImage: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f8f8f8' },
    catBadge: { position: 'absolute', bottom: 0, right: -4, backgroundColor: '#1a1a1a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    catBadgeText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
    gridName: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 2, textAlign: 'center' },
    gridRole: { fontSize: 11, color: '#888', marginBottom: 6 },
    gridPrice: { fontSize: 11, fontWeight: 'bold', color: '#555', backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    emptyText: { width: '100%', textAlign: 'center', color: '#aaa', marginVertical: 20 },
});
