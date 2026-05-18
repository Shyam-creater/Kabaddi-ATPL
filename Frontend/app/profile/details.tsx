import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Image,
    Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchProfile } from '../../features/auth/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ProfileDetailsPage() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchProfile());
        }, [dispatch])
    );

    const hasCricketProfile = user?.playerProfile && user.playerProfile.cricket && user.sports?.includes('Cricket');
    const hasKabaddiProfile = user?.playerProfile && user.playerProfile.kabaddi && user.sports?.includes('Kabaddi');
    const hasProfile = hasCricketProfile || hasKabaddiProfile;

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
                            {hasKabaddiProfile && renderKabaddiStats(user.playerProfile.kabaddi)}
                            {hasCricketProfile && renderCricketStats(user.playerProfile.cricket)}
                        </View>
                    )}
                </Animated.View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
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
    createBtnText: { color: '#fff', fontWeight: 'bold' }
});
