import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Image,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchProfile } from '../../features/auth/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import api from '../../services/api';

const { width } = Dimensions.get('window');

export default function ProfileDetailsPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    const [advancedStats, setAdvancedStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchProfile());
            
            const fetchStats = async () => {
                if (!user?._id) return;
                try {
                    setLoadingStats(true);
                    const response = await api.get(`/user/${user._id}/stats`);
                    if (response.data.success) {
                        setAdvancedStats(response.data.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch player stats:', error);
                } finally {
                    setLoadingStats(false);
                }
            };
            fetchStats();
        }, [dispatch, user?._id])
    );

    const hasCricketProfile = !!((user?.playerProfile?.cricket || (advancedStats?.stats?.totalMatches > 0)) && user?.sports?.includes('Cricket'));
    const hasKabaddiProfile = !!((user?.playerProfile?.kabaddi || (advancedStats?.stats?.totalMatches > 0)) && user?.sports?.includes('Kabaddi'));
    const hasProfile = hasCricketProfile || hasKabaddiProfile || !!(advancedStats?.stats?.totalMatches > 0);

    const getMergedCricketStats = () => {
        const cricketProfile = user?.playerProfile?.cricket || {};
        const careerSummary = cricketProfile.careerSummary || {};
        
        return {
            ...cricketProfile,
            role: cricketProfile.role || 'Player',
            jerseyNumber: cricketProfile.jerseyNumber || '-',
            battingStyle: cricketProfile.battingStyle || 'N/A',
            bowlingStyle: cricketProfile.bowlingStyle || 'N/A',
            careerSummary: {
                totalRuns: advancedStats?.stats?.totalRunsScored !== undefined ? advancedStats.stats.totalRunsScored : (careerSummary.totalRuns || 0),
                totalWickets: advancedStats?.stats?.totalWickets !== undefined ? advancedStats.stats.totalWickets : (careerSummary.totalWickets || 0),
                battingAverage: advancedStats?.stats?.battingAverage !== undefined ? advancedStats.stats.battingAverage : (careerSummary.battingAverage || 0),
                strikeRate: advancedStats?.stats?.strikeRate !== undefined ? advancedStats.stats.strikeRate : (careerSummary.strikeRate || 0),
                economyRate: advancedStats?.stats?.economyRate !== undefined ? advancedStats.stats.economyRate : (careerSummary.economyRate || 0),
                highestScore: careerSummary.highestScore || 0,
                matchesPlayed: advancedStats?.stats?.totalMatches !== undefined ? advancedStats.stats.totalMatches : (careerSummary.matchesPlayed || 0),
            },
            formatStats: cricketProfile.formatStats || [],
            leagueHistory: cricketProfile.leagueHistory || []
        };
    };

    const getMergedKabaddiStats = () => {
        const kabaddiProfile = user?.playerProfile?.kabaddi || {};
        const careerSummary = kabaddiProfile.careerSummary || {};
        const raidingStats = kabaddiProfile.raidingStats || {};
        const defenseStats = kabaddiProfile.defenseStats || {};
        
        return {
            ...kabaddiProfile,
            role: kabaddiProfile.role || 'Player',
            jerseyNumber: kabaddiProfile.jerseyNumber || '-',
            playingPosition: kabaddiProfile.playingPosition || 'N/A',
            careerSummary: {
                totalPoints: careerSummary.totalPoints || 0,
                matchesPlayed: advancedStats?.stats?.totalMatches !== undefined ? advancedStats.stats.totalMatches : (careerSummary.matchesPlayed || 0),
            },
            raidingStats: {
                totalRaidPoints: raidingStats.totalRaidPoints || 0,
                raidSuccessRate: raidingStats.raidSuccessRate || 0,
                super10s: raidingStats.super10s || 0,
                superRaids: raidingStats.superRaids || 0,
                doOrDieRaidPoints: raidingStats.doOrDieRaidPoints || 0,
                emptyRaids: raidingStats.emptyRaids || 0,
                bonusPoints: raidingStats.bonusPoints || 0,
            },
            defenseStats: {
                totalTacklePoints: defenseStats.totalTacklePoints || 0,
                tackleSuccessRate: defenseStats.tackleSuccessRate || 0,
                high5s: defenseStats.high5s || 0,
                superTackles: defenseStats.superTackles || 0,
                blocks: defenseStats.blocks || 0,
                dashes: defenseStats.dashes || 0,
                ankleHolds: defenseStats.ankleHolds || 0,
            },
            records: kabaddiProfile.records || {},
            discipline: kabaddiProfile.discipline || {}
        };
    };

    const StatCard = ({ label, value, icon, color = '#E31C25' }: { label: string, value: any, icon?: any, color?: string }) => (
        <View style={styles.statCard}>
            <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
                {icon && <Ionicons name={icon} size={18} color={color} />}
            </View>
            <Text style={styles.statCardValue}>{value || 0}</Text>
            <Text style={styles.statCardLabel}>{label}</Text>
        </View>
    );

    const SectionHeader = ({ title, icon }: { title: string, icon?: any }) => (
        <View style={styles.sectionHeaderWrapper}>
            <LinearGradient colors={['#E31C25', '#A00F15']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionIconBox}>
                <Ionicons name={icon || 'stats-chart'} size={14} color="#fff" />
            </LinearGradient>
            <Text style={styles.sectionHeaderTitle}>{title}</Text>
            <View style={styles.sectionHeaderLine} />
        </View>
    );

    const renderKabaddiStats = (data: any) => (
        <View>
            <View style={styles.roleCard}>
                <LinearGradient colors={['#FFF5F5', '#fff']} style={styles.roleGradient}>
                    <Text style={styles.roleTitle}>KABADDI PROFILE</Text>
                    <View style={styles.roleRow}>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>{data.role || 'Player'}</Text></View>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>Jersey #{data.jerseyNumber}</Text></View>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>{data.playingPosition}</Text></View>
                    </View>
                </LinearGradient>
            </View>

            {/* Overview Highlights */}
            <View style={styles.highlightGrid}>
                <LinearGradient colors={['#E31C25', '#ff4d4d']} style={styles.mainStatBox}>
                    <Text style={styles.mainStatLabel}>TOTAL POINTS</Text>
                    <Text style={styles.mainStatValue}>{data.careerSummary?.totalPoints || 0}</Text>
                    <Text style={styles.mainStatSub}>{data.careerSummary?.matchesPlayed || 0} Matches</Text>
                </LinearGradient>
                <View style={{ flex: 1, gap: 10 }}>
                    <View style={styles.subStatBox}>
                        <Text style={styles.subStatValue}>{data.raidingStats?.totalRaidPoints || 0}</Text>
                        <Text style={styles.subStatLabel}>Raid Points</Text>
                    </View>
                    <View style={styles.subStatBox}>
                        <Text style={styles.subStatValue}>{data.defenseStats?.totalTacklePoints || 0}</Text>
                        <Text style={styles.subStatLabel}>Tackle Points</Text>
                    </View>
                </View>
            </View>

            {/* Raiding Stats */}
            <SectionHeader title="Raiding Statistics" icon="flash" />
            <View style={styles.gridContainer}>
                <StatCard label="Success %" value={`${data.raidingStats?.raidSuccessRate || 0}%`} icon="checkmark-circle" color="#4CAF50" />
                <StatCard label="Super 10s" value={data.raidingStats?.super10s} icon="star" color="#FFD700" />
                <StatCard label="Super Raids" value={data.raidingStats?.superRaids} icon="flame" color="#FF9800" />
                <StatCard label="Do-Or-Die" value={data.raidingStats?.doOrDieRaidPoints} icon="skull" color="#333" />
                <StatCard label="Empty Raids" value={data.raidingStats?.emptyRaids} icon="radio-button-off" color="#999" />
                <StatCard label="Bonus Pts" value={data.raidingStats?.bonusPoints} icon="add-circle" color="#2196F3" />
            </View>

            {/* Defense Stats */}
            <SectionHeader title="Defense Statistics" icon="shield" />
            <View style={styles.gridContainer}>
                <StatCard label="Success %" value={`${data.defenseStats?.tackleSuccessRate || 0}%`} icon="checkmark-circle" color="#4CAF50" />
                <StatCard label="High 5s" value={data.defenseStats?.high5s} icon="hand-left" color="#FFD700" />
                <StatCard label="Super Tackles" value={data.defenseStats?.superTackles} icon="expand" color="#FF9800" />
                <StatCard label="Blocks" value={data.defenseStats?.blocks} icon="stop-circle" color="#E91E63" />
                <StatCard label="Dashes" value={data.defenseStats?.dashes} icon="flash-off" color="#9C27B0" />
                <StatCard label="Ankle Holds" value={data.defenseStats?.ankleHolds} icon="accessibility" color="#795548" />
            </View>

            {/* Records */}
            <SectionHeader title="Records & Discipline" icon="trophy" />
            <View style={styles.listContainer}>
                <View style={styles.listItem}>
                    <Text style={styles.listLabel}>Most Raid Points (Match)</Text>
                    <Text style={styles.listValue}>{data.records?.mostRaidPointsInMatch || 0}</Text>
                </View>
                <View style={styles.listItem}>
                    <Text style={styles.listLabel}>Most Tackle Points (Match)</Text>
                    <Text style={styles.listValue}>{data.records?.mostTacklePointsInMatch || 0}</Text>
                </View>
                <View style={styles.listItem}>
                    <Text style={styles.listLabel}>Cards (G/Y/R)</Text>
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                        <View style={[styles.cardBadge, { backgroundColor: '#4CAF50' }]}><Text style={styles.cardText}>{data.discipline?.greenCards || 0}</Text></View>
                        <View style={[styles.cardBadge, { backgroundColor: '#FFD700' }]}><Text style={styles.cardText}>{data.discipline?.yellowCards || 0}</Text></View>
                        <View style={[styles.cardBadge, { backgroundColor: '#F44336' }]}><Text style={styles.cardText}>{data.discipline?.redCards || 0}</Text></View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderCricketStats = (data: any) => (
        <View>
            <View style={styles.roleCard}>
                <LinearGradient colors={['#FFF5F5', '#fff']} style={styles.roleGradient}>
                    <Text style={styles.roleTitle}>CRICKET PROFILE</Text>
                    <View style={styles.roleRow}>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>{data.role || 'Player'}</Text></View>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>Jersey #{data.jerseyNumber}</Text></View>
                    </View>
                    <Text style={styles.styleText}>{data.battingStyle} • {data.bowlingStyle}</Text>
                </LinearGradient>
            </View>

            {/* Overview Highlights */}
            <View style={styles.highlightGrid}>
                <LinearGradient colors={['#E31C25', '#ff4d4d']} style={styles.mainStatBox}>
                    <Text style={styles.mainStatLabel}>TOTAL RUNS</Text>
                    <Text style={styles.mainStatValue}>{data.careerSummary?.totalRuns || 0}</Text>
                    <Text style={styles.mainStatSub}>Avg: {data.careerSummary?.battingAverage || 0}</Text>
                </LinearGradient>
                <View style={{ flex: 1, gap: 10 }}>
                    <View style={[styles.subStatBox, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={[styles.subStatValue, { color: '#1565C0' }]}>{data.careerSummary?.totalWickets || 0}</Text>
                        <Text style={styles.subStatLabel}>Wickets</Text>
                    </View>
                    <View style={styles.subStatBox}>
                        <Text style={styles.subStatValue}>{data.careerSummary?.highestScore || 0}</Text>
                        <Text style={styles.subStatLabel}>Highest Score</Text>
                    </View>
                </View>
            </View>

            {data.formatStats && data.formatStats.length > 0 && (
                <View>
                    <SectionHeader title="Format Statistics" icon="bar-chart" />
                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 1.5, textAlign: 'left' }]}>Format</Text>
                            <Text style={styles.th}>Mat</Text>
                            <Text style={styles.th}>Runs</Text>
                            <Text style={styles.th}>Wkts</Text>
                            <Text style={styles.th}>Avg</Text>
                        </View>
                        {data.formatStats.map((item: any, idx: number) => (
                            <View key={idx} style={[styles.tr, idx % 2 === 0 && styles.trAlt]}>
                                <Text style={[styles.td, { flex: 1.5, textAlign: 'left', fontWeight: 'bold' }]}>{item.format}</Text>
                                <Text style={styles.td}>{item.matches}</Text>
                                <Text style={styles.td}>{item.runs}</Text>
                                <Text style={styles.td}>{item.wickets}</Text>
                                <Text style={styles.td}>{item.average}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {data.leagueHistory && data.leagueHistory.length > 0 && (
                <View>
                    <SectionHeader title="League History" icon="time" />
                    {data.leagueHistory.map((item: any, idx: number) => (
                        <TouchableOpacity key={idx} style={styles.leagueCard}>
                            <View style={styles.leagueHeader}>
                                <Text style={styles.leagueName}>{item.leagueName}</Text>
                                <View style={styles.seasonBadge}><Text style={styles.seasonText}>{item.season}</Text></View>
                            </View>
                            <Text style={styles.teamName}>{item.teamName}</Text>
                            <View style={styles.leagueStatsRow}>
                                <Text style={styles.leagueStat}>Matches: <Text style={{ fontWeight: 'bold' }}>{item.matches}</Text></Text>
                                <Text style={styles.leagueStat}>Runs: <Text style={{ fontWeight: 'bold' }}>{item.runs}</Text></Text>
                                <Text style={styles.leagueStat}>Wickets: <Text style={{ fontWeight: 'bold' }}>{item.wickets}</Text></Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    const showCricket = hasCricketProfile || (hasProfile && !hasKabaddiProfile);
    const showKabaddi = hasKabaddiProfile;

    const renderRecentMatches = () => {
        if (!advancedStats?.matches?.details || advancedStats.matches.details.length === 0) {
            return null;
        }

        return (
            <View style={{ marginTop: 10, marginBottom: 20 }}>
                <SectionHeader title="Recent Matches" icon="logo-playstation" />
                {advancedStats.matches.details.map((match: any, idx: number) => {
                    const isWon = match.result === 'Won';
                    const dateStr = match.date ? new Date(match.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }) : 'N/A';

                    return (
                        <View key={idx} style={styles.matchCard}>
                            <View style={styles.matchCardHeader}>
                                <View style={styles.matchTypeBadge}>
                                    <Text style={styles.matchTypeText}>{match.matchType || 'Match'}</Text>
                                </View>
                                <Text style={styles.matchDate}>{dateStr}</Text>
                            </View>

                            <View style={styles.matchTeamsRow}>
                                <View style={styles.teamInfo}>
                                    <Text style={styles.teamNameText} numberOfLines={1}>
                                        {match.playerTeam?.name || 'My Team'}
                                    </Text>
                                    <Text style={styles.scoreText}>
                                        {match.playerTeamScore ? `${match.playerTeamScore.runs || 0}/${match.playerTeamScore.wickets || 0} (${match.playerTeamScore.overs || 0} ov)` : '-'}
                                    </Text>
                                </View>

                                <Text style={styles.vsText}>VS</Text>

                                <View style={[styles.teamInfo, { alignItems: 'flex-end' }]}>
                                    <Text style={styles.teamNameText} numberOfLines={1}>
                                        {match.opponent?.name || 'Opponent'}
                                    </Text>
                                    <Text style={styles.scoreText}>
                                        {match.opponentScore ? `${match.opponentScore.runs || 0}/${match.opponentScore.wickets || 0} (${match.opponentScore.overs || 0} ov)` : '-'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.matchFooter}>
                                <Text style={styles.venueText} numberOfLines={1}>
                                    <Ionicons name="location" size={12} color="#999" /> {match.venue || 'TBD'}
                                </Text>
                                <View style={[styles.resultBadge, { backgroundColor: isWon ? '#E8F5E9' : '#FFEBEE' }]}>
                                    <Text style={[styles.resultText, { color: isWon ? '#2E7D32' : '#C62828' }]}>
                                        {isWon ? 'Won' : 'Lost'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        );
    };

    if (loadingStats && !advancedStats) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E31C25" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <StatusBar barStyle="light-content" />
            <View style={styles.headerContainer}>
                <LinearGradient colors={['#2c3e50', '#000000']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.headerGradient}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                        <Text style={styles.headerTitle}>Player Statistics</Text>
                        <TouchableOpacity style={styles.shareButton}><Ionicons name="share-outline" size={22} color="#fff" /></TouchableOpacity>
                    </View>

                    <View style={styles.profileSection}>
                        <View style={styles.avatarBorder}>
                            {user?.profilePicture ?
                                <Image source={{ uri: user.profilePicture }} style={styles.avatar} /> :
                                <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color="#fff" /></View>
                            }
                        </View>
                        <Text style={styles.userName}>{user?.name || 'Guest Player'}</Text>
                        <View style={styles.locRow}>
                            <Ionicons name="location-outline" size={14} color="#ccc" />
                            <Text style={styles.locationText}>{user?.address || user?.city || 'Location Unknown'}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <View style={styles.contentWrapper}>
                <Animated.View entering={FadeInUp.delay(300).duration(600)}>
                    {!hasProfile ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="stats-chart" size={60} color="#ccc" />
                            <Text style={styles.emptyTitle}>No Stats Available</Text>
                            <Text style={styles.emptyText}>Create your profile to start tracking your career.</Text>
                            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/profile/edit' as any)}>
                                <Text style={styles.createBtnText}>Create Profile</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={{ paddingBottom: 40 }}>
                            {showKabaddi && renderKabaddiStats(getMergedKabaddiStats())}
                            {showCricket && renderCricketStats(getMergedCricketStats())}

                            {advancedStats && (
                                <View style={{ marginTop: 20 }}>
                                    <SectionHeader title="Platform Activity" icon="analytics" />
                                    <View style={styles.highlightGrid}>
                                        <LinearGradient colors={['#333', '#111']} style={styles.mainStatBox}>
                                            <Text style={styles.mainStatLabel}>MATCHES</Text>
                                            <Text style={styles.mainStatValue}>{advancedStats.stats?.totalMatches || 0}</Text>
                                            <Text style={styles.mainStatSub}>Won: {advancedStats.stats?.matchesWon || 0} | Lost: {advancedStats.stats?.matchesLost || 0}</Text>
                                        </LinearGradient>
                                        <View style={{ flex: 1, gap: 10 }}>
                                            <View style={styles.subStatBox}>
                                                <Text style={styles.subStatValue}>{advancedStats.leagues?.total || 0}</Text>
                                                <Text style={styles.subStatLabel}>Leagues</Text>
                                            </View>
                                            <View style={styles.subStatBox}>
                                                <Text style={styles.subStatValue}>{advancedStats.teams?.total || 0}</Text>
                                                <Text style={styles.subStatLabel}>Teams</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}

                            {renderRecentMatches()}
                        </View>
                    )}
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    headerContainer: { width: '100%' },
    headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 60, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 0.5 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    shareButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    profileSection: { alignItems: 'center' },
    avatarBorder: { padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 55, marginBottom: 10 },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
    avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#555', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
    userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    locRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
    locationText: { color: '#ccc', fontSize: 14 },
    contentWrapper: { paddingHorizontal: 16, marginTop: -40 },

    // Role Card
    roleCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, backgroundColor: '#fff' },
    roleGradient: { padding: 20 },
    roleTitle: { fontSize: 12, color: '#E31C25', fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    roleRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    roleBadge: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
    roleText: { fontSize: 13, fontWeight: '600', color: '#333' },
    styleText: { marginTop: 10, color: '#666', fontSize: 13, fontStyle: 'italic' },

    // Highlights
    highlightGrid: { flexDirection: 'row', gap: 10, height: 140, marginBottom: 25 },
    mainStatBox: { flex: 1.2, borderRadius: 16, padding: 20, justifyContent: 'center' },
    mainStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
    mainStatValue: { color: '#fff', fontSize: 32, fontWeight: '900' },
    mainStatSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 5 },
    subStatBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', paddingHorizontal: 15, elevation: 2 },
    subStatValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    subStatLabel: { fontSize: 11, color: '#999', fontWeight: '600' },

    // Sections
    sectionHeaderWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    sectionIconBox: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionHeaderTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    sectionHeaderLine: { flex: 1, height: 1, backgroundColor: '#eee', marginLeft: 15 },

    // Grid Stats
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    statCard: { width: '31%', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#f0f0f0', alignItems: 'center' },
    iconCircle: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statCardValue: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    statCardLabel: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2 },

    // Lists
    listContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 5, marginBottom: 20 },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    listLabel: { color: '#666', fontSize: 14 },
    listValue: { fontWeight: 'bold', color: '#333', fontSize: 14 },
    cardBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    cardText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

    // Tables
    tableCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', marginBottom: 20 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#f9f9f9', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
    th: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 'bold', color: '#999' },
    tr: { flexDirection: 'row', padding: 12, backgroundColor: '#fff' },
    trAlt: { backgroundColor: '#fcfcfc' },
    td: { flex: 1, textAlign: 'center', fontSize: 13, color: '#333' },

    // League History
    leagueCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee', borderLeftWidth: 4, borderLeftColor: '#E31C25' },
    leagueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    leagueName: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    seasonBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    seasonText: { fontSize: 10, color: '#666', fontWeight: '600' },
    teamName: { color: '#E31C25', fontSize: 13, fontWeight: '600', marginTop: 2, marginBottom: 8 },
    leagueStatsRow: { flexDirection: 'row', gap: 15 },
    leagueStat: { fontSize: 12, color: '#666' },

    // Empty State
    emptyState: { alignItems: 'center', padding: 40, backgroundColor: '#fff', borderRadius: 20, marginTop: 20 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 15 },
    emptyText: { textAlign: 'center', color: '#999', marginVertical: 10, fontSize: 13 },
    createBtn: { backgroundColor: '#E31C25', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25, marginTop: 10 },
    createBtnText: { color: '#fff', fontWeight: 'bold' },
    
    // Match styles
    matchCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
    matchCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    matchTypeBadge: { backgroundColor: '#F0F2F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    matchTypeText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
    matchDate: { fontSize: 11, color: '#999' },
    matchTeamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 5 },
    teamInfo: { flex: 1, flexDirection: 'column' },
    teamNameText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
    scoreText: { fontSize: 12, color: '#E31C25', fontWeight: '600', marginTop: 4 },
    vsText: { fontSize: 12, fontWeight: 'bold', color: '#ccc', marginHorizontal: 15 },
    matchFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10, marginTop: 4 },
    venueText: { fontSize: 11, color: '#999', flex: 1 },
    resultBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    resultText: { fontSize: 10, fontWeight: 'bold' }
});
