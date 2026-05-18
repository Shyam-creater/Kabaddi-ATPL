import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../services/api';
import AppHeader from '../../components/common/AppHeader';

import socketService from '../../services/socketService';

const { width } = Dimensions.get('window');

const SPORTS = [
    { id: 'cricket', name: 'Cricket', icon: 'cricket' },
    { id: 'football', name: 'Football', icon: 'soccer' },
    { id: 'kabaddi', name: 'Kabaddi', icon: 'human-handsup' } // Approximation for Kabaddi
];

interface Tournament {
    _id: string;
    name: string;
    description?: string;
    registrationFee?: number;
    sport: 'cricket' | 'football' | 'kabaddi';
    startDate: string;
    endDate: string;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ONGOING';
    venue: string;
    teams: any[];
    logo?: string;
    banner?: string;
    registrationCount?: number;
}

export default function TournamentScreen() {
    const router = useRouter();
    const [selectedSport, setSelectedSport] = useState('cricket');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchTournaments();

        // Socket Listeners
        socketService.onTournamentCreate((newTournament) => {
            if (newTournament.sport === selectedSport) {
                setTournaments(prev => [...prev, newTournament]);
            }
        });

        socketService.onTournamentUpdate((updatedTournament) => {
            setTournaments(prev => prev.map(t => t._id === updatedTournament._id ? updatedTournament : t));
        });

        socketService.onTournamentDelete(({ id }) => {
            setTournaments(prev => prev.filter(t => t._id !== id));
        });

        return () => {
            socketService.removeListener('tournament:create');
            socketService.removeListener('tournament:update');
            socketService.removeListener('tournament:delete');
        };
    }, [selectedSport]);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/tournaments/${selectedSport}/all`);
            setTournaments(response.data);
        } catch (error) {
            console.error('Failed to fetch tournaments', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTournaments();
    };

    return (
        <View style={styles.container}>
            <AppHeader />
            <View style={styles.header}>
                <View>
                    <View style={styles.titleRowHead}>
                        <Ionicons name="shield-checkmark" size={28} color="#E31C25" style={{ marginRight: 10 }} />
                        <Text style={styles.headerTitle}>Player <Text style={{ color: '#E31C25' }}>Registration</Text></Text>
                    </View>
                    <Text style={styles.headerSubtitle}>Enroll your franchise into upcoming epic leagues</Text>
                </View>
            </View>

            {/* Sport Selector */}
            <View style={styles.tabContainer}>
                {SPORTS.map((sport) => (
                    <TouchableOpacity
                        key={sport.id}
                        onPress={() => setSelectedSport(sport.id)}
                        style={[styles.tabBtn, selectedSport === sport.id && styles.activeTabBtn]}
                    >
                        <MaterialCommunityIcons
                            name={sport.icon as any}
                            size={20}
                            color={selectedSport === sport.id ? '#fff' : '#666'}
                            style={{ marginRight: 6 }}
                        />
                        <Text style={[styles.tabText, selectedSport === sport.id && styles.activeTabText]}>
                            {sport.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
            >
                {loading ? (
                    <Text style={styles.loadingText}>Loading Leagues...</Text>
                ) : tournaments.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="trophy-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No upcoming leagues</Text>
                    </View>
                ) : (
                    tournaments.map((tournament) => (
                        <TouchableOpacity
                            key={tournament._id}
                            style={styles.card}
                            activeOpacity={0.9}
                            onPress={() => router.push({ pathname: '/tournament/register', params: { id: tournament._id, sport: selectedSport } } as any)}
                        >
                            {/* High Fidelity Banner Section */}
                            <View style={styles.bannerContainer}>
                                {tournament.banner ? (
                                    <Image 
                                        source={{ uri: tournament.banner }} 
                                        style={styles.leagueBanner}
                                        resizeMode="cover"
                                        fadeDuration={300}
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={['#1A1A1A', '#4A4A4A']}
                                        style={styles.leagueBanner}
                                    />
                                )}
                                <View style={styles.bannerOverlay}>
                                    <View style={[styles.statusBadge, { backgroundColor: (tournament.status === 'LIVE' || tournament.status === 'ONGOING') ? '#E31C25' : '#4CAF50' }]}>
                                        <Text style={styles.statusText}>{tournament.status}</Text>
                                    </View>
                                    <View style={styles.feeBadge}>
                                        <Text style={styles.feeBadgeText}>₹{tournament.registrationFee || 500}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.cardInfo}>
                                <View style={styles.titleRow}>
                                    <View style={styles.logoCircle}>
                                        {tournament.logo ? (
                                            <Image source={{ uri: tournament.logo }} style={styles.miniLogo} />
                                        ) : (
                                            <Ionicons name="trophy" size={20} color="#E31C25" />
                                        )}
                                    </View>
                                    <View style={styles.nameCol}>
                                        <Text style={styles.tournamentName} numberOfLines={1}>{tournament.name}</Text>
                                        {tournament.description ? (
                                            <Text style={styles.descriptionText} numberOfLines={2}>{tournament.description}</Text>
                                        ) : (
                                            <View style={styles.venueRow}>
                                                <MaterialCommunityIcons name="map-marker-outline" size={14} color="#E31C25" />
                                                <Text style={styles.venueText}>{tournament.venue || 'TBA'}</Text>
                                            </View>
                                        )}
                                        {tournament.description && (
                                            <View style={styles.venueRow}>
                                                <MaterialCommunityIcons name="map-marker-outline" size={14} color="#E31C25" />
                                                <Text style={styles.venueText}>{tournament.venue || 'TBA'}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.footer}>
                                <View style={styles.footerLeft}>
                                    <View style={styles.dateInfo}>
                                        <Ionicons name="calendar-outline" size={14} color="#E31C25" />
                                        <Text style={styles.dateText}>
                                            {new Date(tournament.startDate).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <View style={styles.separator} />
                                    <View style={styles.teamInfo}>
                                        <MaterialCommunityIcons name="account-group-outline" size={16} color="#666" />
                                        <Text style={styles.teamCountText}>{tournament.registrationCount || 0} Teams</Text>
                                    </View>
                                </View>
                                <TouchableOpacity 
                                    style={styles.viewBtn} 
                                    onPress={() => router.push({ pathname: '/tournament/register', params: { id: tournament._id, sport: selectedSport } } as any)}
                                >
                                    <Text style={styles.viewBtnText}>Register</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 5,
        backgroundColor: '#F4F6F9',
    },
    titleRowHead: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#777',
        marginTop: 5,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 50,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        marginTop: 20, // Added spacing from Header
    },
    tabBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 30,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    activeTabBtn: {
        backgroundColor: '#E31C25',
        borderColor: '#E31C25',
        elevation: 4,
        shadowColor: '#E31C25',
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    tabText: {
        fontWeight: '600',
        color: '#666',
        fontSize: 13,
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        marginTop: 10,
        color: '#999',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    bannerContainer: {
        width: '100%',
        height: (width - 40) * (740/1200),
        backgroundColor: '#eee',
        position: 'relative',
    },
    leagueBanner: {
        width: '100%',
        height: '100%',
    },
    bannerOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    feeBadge: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    feeBadgeText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#1A1A1A',
    },
    cardInfo: {
        padding: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    logoCircle: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        marginTop: -5,
    },
    miniLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    nameCol: {
        marginLeft: 12,
        flex: 1,
    },
    tournamentName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A1A1A',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    descriptionText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
        lineHeight: 17,
        marginTop: 4,
        marginBottom: 2,
    },
    venueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    venueText: {
        fontSize: 13,
        color: '#888',
        marginLeft: 4,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f1f1',
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#fafafa',
    },
    footerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dateText: {
        fontSize: 12,
        color: '#1A1A1A',
        fontWeight: '800',
    },
    separator: {
        width: 1,
        height: 16,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 12,
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    teamCountText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '700',
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statChipText: {
        fontSize: 11,
        color: '#4B5563',
        marginLeft: 5,
        fontWeight: '700',
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E31C25',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
        elevation: 4,
        shadowColor: '#E31C25',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    viewBtnText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '800',
    },
});
