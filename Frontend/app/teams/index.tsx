import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import api from '../../services/api';
import AppHeader from '../../components/common/AppHeader';
import TeamDetailsModal from '../../components/common/TeamDetailsModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Player {
    user?: string;
    name: string;
    role?: string;
    position?: string;
    jerseyNumber?: number;
    number?: number;
    isCaptain?: boolean;
    image?: string;
}

interface Team {
    _id: string;
    name: string;
    code: string;
    logo: string;
    sport: 'cricket' | 'football' | 'kabaddi';
    city?: string;
    captain?: string;
    coach?: string;
    matchesPlayed?: number;
    won?: number;
    lost?: number;
    draw?: number;
    points?: number;
    nrr?: number;
    goalsFor?: number;
    goalsAgainst?: number;
    goalDifference?: number;
    scoreDiff?: number;
    players?: Player[];
}

const SPORTS_TABS = [
    { id: 'kabaddi', name: 'Kabaddi', icon: 'human-handsup', lib: 'MaterialCommunityIcons' }
];

export default function TeamsScreen() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSport, setSelectedSport] = useState<'all' | 'cricket' | 'football' | 'kabaddi'>('kabaddi');
    
    // Modal states
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Failed to fetch teams', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTeams();
        setRefreshing(false);
    };

    const getSportColor = (sport: string) => {
        switch (sport?.toLowerCase()) {
            case 'cricket': return '#10b981'; // Green
            case 'football': return '#E31C25'; // Red
            case 'kabaddi': return '#3b82f6';  // Blue
            default: return '#6B7280';
        }
    };

    const getSportIcon = (sport: string, color: string) => {
        const name = sport?.toLowerCase();
        if (name === 'cricket') return <MaterialCommunityIcons name="cricket" size={12} color={color} />;
        if (name === 'football') return <MaterialCommunityIcons name="soccer" size={12} color={color} />;
        if (name === 'kabaddi') return <MaterialCommunityIcons name="human-handsup" size={12} color={color} />;
        return <Ionicons name="trophy-outline" size={12} color={color} />;
    };

    const filteredTeams = selectedSport === 'all'
        ? teams
        : teams.filter(t => t.sport?.toLowerCase() === selectedSport);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.headerTitle}>Franchise Teams</Text>
                    <Text style={styles.headerSubtitle}>Official League Squads</Text>
                </View>
                <View style={styles.iconBadge}>
                    <Ionicons name="shield-checkmark" size={20} color="#E31C25" />
                </View>
            </View>

            {/* Sport Tab Selector */}
            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
                    {SPORTS_TABS.map((tab, idx) => {
                        const isSelected = selectedSport === tab.id;
                        return (
                            <MotiView
                                key={tab.id}
                                from={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    damping: 12,
                                    stiffness: 100,
                                    delay: idx * 40,
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => setSelectedSport(tab.id as any)}
                                    style={[styles.sportTab, isSelected && styles.activeSportTab]}
                                    activeOpacity={0.7}
                                >
                                    {tab.lib === 'Ionicons' ? (
                                        <Ionicons
                                            name={tab.icon as any}
                                            size={16}
                                            color={isSelected ? '#fff' : '#666'}
                                        />
                                    ) : (
                                        <MaterialCommunityIcons
                                            name={tab.icon as any}
                                            size={16}
                                            color={isSelected ? '#fff' : '#666'}
                                        />
                                    )}
                                    <Text style={[styles.sportTabText, isSelected && styles.activeSportTabText]}>
                                        {tab.name}
                                    </Text>
                                </TouchableOpacity>
                            </MotiView>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#E31C25" style={{ marginTop: 50 }} />
                ) : filteredTeams.length > 0 ? (
                    <View style={styles.grid}>
                        {filteredTeams.map((team, index) => {
                            const teamSportColor = getSportColor(team.sport);
                            return (
                                <MotiView
                                    key={`${selectedSport}_${team._id}`}
                                    from={{ opacity: 0, scale: 0.65, translateY: 35 }}
                                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                                    transition={{
                                        type: 'spring',
                                        damping: 14,
                                        stiffness: 110,
                                        delay: index * 60,
                                    }}
                                    style={{ width: CARD_WIDTH, marginTop: index % 2 === 1 ? 20 : 0, marginBottom: 16 }}
                                >
                                    <TouchableOpacity
                                        style={styles.card}
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            setSelectedTeam(team);
                                            setModalVisible(true);
                                        }}
                                    >
                                        <View style={styles.cardHeader}>
                                            {/* Sport Badge (Top-Left) */}
                                            <View style={[styles.cardSportBadge, { backgroundColor: `${teamSportColor}15`, borderColor: teamSportColor }]}>
                                                {getSportIcon(team.sport, teamSportColor)}
                                                <Text style={[styles.cardSportText, { color: teamSportColor }]}>
                                                    {team.sport}
                                                </Text>
                                            </View>

                                            <LinearGradient
                                                colors={['#ffffff', '#f0f2f5']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.logoContainer}
                                            >
                                                <Image
                                                    source={{ uri: team.logo || 'https://via.placeholder.com/150' }}
                                                    style={styles.logo}
                                                    resizeMode="contain"
                                                />
                                            </LinearGradient>
                                            <View style={styles.codeBadge}>
                                                <Text style={styles.codeText}>{team.code}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.cardBody}>
                                            <Text style={styles.teamName} numberOfLines={2}>{team.name}</Text>

                                            <View style={styles.divider} />

                                            <View style={styles.infoContainer}>
                                                <View style={styles.infoItem}>
                                                    <Ionicons name="location" size={12} color="#9CA3AF" />
                                                    <Text style={styles.infoText} numberOfLines={1}>{team.city || 'TBA'}</Text>
                                                </View>
                                                <View style={styles.infoItem}>
                                                    <Ionicons name="person" size={12} color="#9CA3AF" />
                                                    <Text style={styles.infoText} numberOfLines={1}>{team.captain || 'TBA'}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </MotiView>
                            );
                        })}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="shield-outline" size={48} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyText}>No teams found</Text>
                        <Text style={styles.emptySubText}>Try selecting another sport category.</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Team Details Squad & Stats Modal */}
            <TeamDetailsModal
                visible={modalVisible}
                team={selectedTeam}
                onClose={() => {
                    setModalVisible(false);
                    setSelectedTeam(null);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 2,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Tab styles
    tabContainer: {
        marginVertical: 10,
        paddingBottom: 5,
    },
    tabScrollContainer: {
        paddingHorizontal: 20,
        gap: 10,
    },
    sportTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 6,
    },
    activeSportTab: {
        backgroundColor: '#E31C25',
        borderColor: '#E31C25',
    },
    sportTabText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
    },
    activeSportTabText: {
        color: '#fff',
        fontWeight: '700',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'visible',
    },
    cardHeader: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#fff',
    },
    logo: {
        width: 70,
        height: 70,
    },
    codeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#111827',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    codeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    cardSportBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        gap: 3,
    },
    cardSportText: {
        fontSize: 8,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    cardBody: {
        padding: 16,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
        height: 44, // Fixed height for 2 lines alignment
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        justifyContent: 'center',
    },
    infoText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
});
