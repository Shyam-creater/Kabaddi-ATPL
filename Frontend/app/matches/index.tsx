import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MatchService, { Match } from '../../services/matchService';
import socketService from '../../services/socketService';
import AppHeader from '../../components/common/AppHeader';
import VideoPlayerModal from '../../components/common/VideoPlayerModal';
import api from '../../services/api';
import { useAppSelector } from '../../store/hooks';

const SPORTS = [
    { id: 'kabaddi', label: 'Kabaddi' },
];

const TABS = [
    { status: 'LIVE', label: '🔴 Live' },
    { status: 'UPCOMING', label: '⏳ Upcoming' },
    { status: 'COMPLETED', label: '🎬 Highlights' },
];

export default function MatchesScreen() {
    const router = useRouter();
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('LIVE');
    const [activeSport, setActiveSport] = useState('kabaddi');
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [myTeamIds, setMyTeamIds] = useState<string[]>([]);
    const [myTeamNames, setMyTeamNames] = useState<Set<string>>(new Set());
    const [myTeamCodes, setMyTeamCodes] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchUserTeams = async () => {
            if (!currentUser?._id) return;
            try {
                const response = await api.get('/teams');
                const allTeams = Array.isArray(response.data) ? response.data : [];
                
                const filtered = allTeams.filter((t: any) => 
                    t.players?.some((p: any) => p.user === currentUser._id || p.user?._id === currentUser._id) ||
                    t.createdBy === currentUser._id || t.createdBy?._id === currentUser._id ||
                    t.captainId === currentUser._id
                );

                const ids = filtered.map((t: any) => t._id);
                const names = new Set(filtered.map((t: any) => t.name?.toLowerCase()));
                const codes = new Set(filtered.map((t: any) => t.code?.toLowerCase()));

                setMyTeamIds(ids);
                setMyTeamNames(names);
                setMyTeamCodes(codes);
            } catch (error) {
                console.error('Failed to fetch user teams:', error);
            }
        };
        fetchUserTeams();
    }, [currentUser?._id]);

    const fetchMatches = async () => {
        try {
            const data = await MatchService.getMatches(activeTab !== 'ALL' ? activeTab : undefined, 'MatchesScreen');
            setMatches(data);
        } catch (error) {
            console.error('Failed to fetch matches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchMatches();

        const handleMatchUpdate = (updatedMatch: Match) => {
            setMatches(prev => {
                const index = prev.findIndex(m => m._id === updatedMatch._id);
                if (index !== -1) {
                    const newMatches = [...prev];
                    newMatches[index] = updatedMatch;
                    return newMatches;
                } else if (updatedMatch.status === activeTab) {
                    return [updatedMatch, ...prev];
                }
                return prev;
            });
        };

        socketService.onMatchUpdate(handleMatchUpdate);

        return () => {
            socketService.removeListener('match:update', handleMatchUpdate);
        };
    }, [activeTab]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMatches();
        setRefreshing(false);
    };

    const filteredMatches = matches.filter(m => {
        // 1. Sport filter
        const matchesSport = activeSport === 'all' || m.sport === activeSport;
        if (!matchesSport) return false;

        // 2. User specific filter based on login users
        if (!currentUser?._id) return true; // If not logged in, show all (or default)
        
        const matchObj = m as any;
        const createdById = typeof matchObj.createdBy === 'object' ? matchObj.createdBy?._id : matchObj.createdBy;
        const isCreatedByUser = createdById === currentUser._id;
        
        const isPlaying = 
            matchObj.teamAPlayers?.some((p: any) => p.user === currentUser._id || p.user?._id === currentUser._id) ||
            matchObj.teamBPlayers?.some((p: any) => p.user === currentUser._id || p.user?._id === currentUser._id);
            
        const isMyTeamMatch = 
            myTeamIds.includes(matchObj.teamAId) || 
            myTeamIds.includes(matchObj.teamBId) ||
            myTeamIds.includes(matchObj.teamA?._id) || 
            myTeamIds.includes(matchObj.teamB?._id) ||
            (matchObj.teamA?.name && myTeamNames.has(matchObj.teamA.name.toLowerCase())) ||
            (matchObj.teamB?.name && myTeamNames.has(matchObj.teamB.name.toLowerCase())) ||
            (matchObj.teamA?.code && myTeamCodes.has(matchObj.teamA.code.toLowerCase())) ||
            (matchObj.teamB?.code && myTeamCodes.has(matchObj.teamB.code.toLowerCase()));

        return isCreatedByUser || isPlaying || isMyTeamMatch;
    });

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <View style={styles.pageTitleContainer}>
                <Ionicons name="calendar-outline" size={24} color="#333" />
                <Text style={styles.pageTitle}>Schedule</Text>
            </View>

            {/* Sport Filter */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {SPORTS.map(sport => (
                        <TouchableOpacity
                            key={sport.id}
                            style={[styles.filterChip, activeSport === sport.id && styles.activeFilterChip]}
                            onPress={() => setActiveSport(sport.id)}
                        >
                            <Text style={[styles.filterText, activeSport === sport.id && styles.activeFilterText]}>{sport.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {TABS.map(tab => (
                    <TouchableOpacity
                        key={tab.status}
                        style={[styles.tab, activeTab === tab.status && styles.activeTab]}
                        onPress={() => setActiveTab(tab.status)}
                    >
                        <Text style={[styles.tabText, activeTab === tab.status && styles.activeTabText]}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Match List */}
            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#E31C25" style={{ marginTop: 50 }} />
                ) : filteredMatches.length > 0 ? (
                    filteredMatches.map(match => (
                        <MatchCard key={match._id} match={match} />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>No matches found</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}


const MatchCard = ({ match }: { match: Match }) => {
    const router = useRouter();
    const isLive = match.status === 'LIVE';
    const [videoVisible, setVideoVisible] = useState(false);

    const formatScore = (score: any) => {
        if (!score) return '-';
        if (typeof score === 'number') return score;
        if (typeof score === 'object') return `${score.runs}/${score.wickets}`;
        return score;
    };

    const getVideoMeta = () => {
        if (match.status === 'LIVE') {
            const common = { label: '🔴 Watch Live', color: '#E31C25', bg: 'rgba(227,28,37,0.1)', type: 'live' as const };
            if (match.youtubeId) return { ...common, url: `https://www.youtube.com/watch?v=${match.youtubeId}` };
            if (match.hlsUrl) return { ...common, url: match.hlsUrl };
            if (match.liveStreamUrl) return { ...common, url: match.liveStreamUrl };
        }
        if (match.status === 'UPCOMING' && match.previewVideoUrl)
            return { url: match.previewVideoUrl, label: '📅 Preview', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', type: 'preview' as const };
        if (match.status === 'COMPLETED' && match.recordedVideoUrl)
            return { url: match.recordedVideoUrl, label: '🎬 Highlights', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', type: 'recorded' as const };
        return null;
    };
    const videoMeta = getVideoMeta();

    return (
        <>
            {/* ── Inline Video Player Modal (WebView for YouTube, expo-av for files) ── */}
            {videoMeta && (
                <VideoPlayerModal
                    visible={videoVisible}
                    url={videoMeta.url}
                    title={`${match.teamA.code} vs ${match.teamB.code}`}
                    subtitle={`${match.series} · ${match.venue || ''}`}
                    type={videoMeta.type}
                    onClose={() => setVideoVisible(false)}
                />
            )}

            <TouchableOpacity 
                style={styles.matchCard} 
                activeOpacity={0.9}
                onPress={() => router.push(`/matches/details/${match._id}` as any)}
            >
                <View style={[styles.matchHeader, match.sport === 'kabaddi' ? { backgroundColor: '#FF9800' } : match.sport === 'football' ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#2196F3' }]}>
                    <Text style={styles.seriesName}>{match.series}</Text>
                    <View style={styles.sportBadge}>
                        <Text style={styles.sportText}>{match.sport || 'Cricket'}</Text>
                    </View>
                </View>

                <View style={styles.matchBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={styles.teamContainer}>
                            <View style={styles.teamLogo}>
                                <Text style={styles.teamLetter}>{match.teamA.code[0]}</Text>
                            </View>
                            <Text style={styles.teamCode}>{match.teamA.code}</Text>
                            <Text style={styles.score}>{formatScore(match.scoreA)}</Text>
                            {typeof match.scoreA === 'object' && <Text style={styles.overs}>({match.scoreA.overs})</Text>}
                        </View>

                        <View style={styles.vsContainer}>
                            <Text style={styles.vsText}>VS</Text>
                            {isLive && <View style={styles.liveTag}><Text style={styles.liveTagText}>LIVE</Text></View>}
                        </View>

                        <View style={styles.teamContainer}>
                            <View style={styles.teamLogo}>
                                <Text style={styles.teamLetter}>{match.teamB.code[0]}</Text>
                            </View>
                            <Text style={styles.teamCode}>{match.teamB.code}</Text>
                            <Text style={styles.score}>{formatScore(match.scoreB)}</Text>
                            {typeof match.scoreB === 'object' && <Text style={styles.overs}>({match.scoreB.overs})</Text>}
                        </View>
                    </View>

                    <Text style={styles.statusText}>{match.statusText || match.venue}</Text>

                    {/* ── Video Play Button ── */}
                    {videoMeta && (
                        <TouchableOpacity
                            style={[styles.videoCta, { backgroundColor: videoMeta.bg, borderColor: videoMeta.color }]}
                            onPress={() => setVideoVisible(true)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name="play-circle"
                                size={16}
                                color={videoMeta.color}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.videoCtaText, { color: videoMeta.color }]}>{videoMeta.label}</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F9',
    },
    filterContainer: {
        paddingVertical: 12,
        backgroundColor: '#fff',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        marginRight: 8,
    },
    activeFilterChip: {
        backgroundColor: '#E31C25',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    activeFilterText: {
        color: '#fff',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#E31C25',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#999',
    },
    activeTabText: {
        color: '#E31C25',
    },
    listContent: {
        padding: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#999',
        marginTop: 10,
        fontSize: 16,
    },
    // Match Card
    matchCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 6,
        alignItems: 'center',
    },
    seriesName: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    sportBadge: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sportText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    matchBody: {
        padding: 16,
    },
    teamContainer: {
        alignItems: 'center',
        flex: 1,
    },
    teamLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    teamLetter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#555',
    },
    teamCode: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    score: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    overs: {
        fontSize: 11,
        color: '#888',
    },
    vsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
    },
    vsText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#ddd',
        marginBottom: 6,
    },
    liveTag: {
        backgroundColor: '#E31C25',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 3,
    },
    liveTagText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    statusText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#E31C25',
        fontWeight: '600',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f5f5f5',
    },

    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12, backgroundColor: '#fff' },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },

    // Video CTA
    videoCta: {
        marginTop: 10,
        paddingVertical: 9,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    videoCtaText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
