import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    ActivityIndicator,
    Alert,
    Modal
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import api, { userService } from '../../../services/api';
import { useAppSelector } from '../../../store/hooks';

const { width, height } = Dimensions.get('window');

export default function PublicProfileDetails() {
    const router = useRouter();
    const { userId } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showFullImage, setShowFullImage] = useState(false);

    const { user: currentUser } = useAppSelector(state => state.auth);
    const [isBlocked, setIsBlocked] = useState(false);
    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');

    useEffect(() => {
        if (currentUser && currentUser.blockedUsers && userId) {
            setIsBlocked(currentUser.blockedUsers.includes(userId));
        }
        if (currentUser && currentUser.following && userId) {
            const followEntry = currentUser.following.find((f: any) => f.user === userId || f.user?._id === userId);
            if (followEntry) {
                setFollowStatus(followEntry.status);
            } else {
                setFollowStatus('none');
            }
        }
    }, [currentUser, userId]);

    const handleFollowAction = async () => {
        if (!userId) return;
        try {
            if (followStatus === 'none') {
                await userService.followUser(userId as string);
                setFollowStatus('pending');
                Alert.alert('Success', 'Follow request sent');
            } else {
                // Unfollow
                Alert.alert('Unfollow', 'Are you sure you want to unfollow?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Unfollow',
                        style: 'destructive',
                        onPress: async () => {
                            await userService.unfollowUser(userId as string);
                            setFollowStatus('none');
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('Follow action failed', error);
            Alert.alert('Error', 'Failed to update follow status');
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                if (!userId) return;
                const response = await api.get(`/user/${userId}`);
                if (response.data.success) {
                    const userData = response.data.data;
                    setUser(userData);
                    // Use server-provided status if available
                    if (userData.followStatus) {
                        setFollowStatus(userData.followStatus);
                    } else if (userData.isFollowing) {
                        setFollowStatus('accepted');
                    } else if (userData.isRequested) {
                        setFollowStatus('pending');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    const handleUnblockUser = () => {
        Alert.alert('Unblock User', 'Do you want to unblock this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Unblock',
                style: 'default',
                onPress: async () => {
                    try {
                        const response = await api.post(`/user/unblock/${userId}`);
                        if (response.data.success) {
                            Alert.alert('Success', 'User unblocked');
                            setIsBlocked(false);
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Failed to unblock user.');
                    }
                }
            },
        ]);
    };

    const handleBlockUser = () => {
        Alert.alert('Block User', 'Are you sure you want to block this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Block',
                style: 'destructive',
                onPress: async () => {
                    try {
                        if (!userId) return;
                        const response = await api.post(`/user/block/${userId}`);
                        if (response.data.success) {
                            Alert.alert('Blocked', 'User has been blocked.');
                            router.back();
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Failed to block user.');
                    }
                }
            },
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E31C25" />
            </View>
        );
    }

    if (isBlocked) {
        return (
            <View style={styles.blockedContainer}>
                <Ionicons name="eye-off-outline" size={60} color="#999" />
                <Text style={styles.blockedTitle}>You have blocked this user</Text>
                <Text style={styles.blockedSubtitle}>You cannot see their profile or activity.</Text>
                <TouchableOpacity style={styles.unblockBtn} onPress={handleUnblockUser}>
                    <Text style={styles.unblockBtnText}>Unblock User</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#E31C25' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.loadingContainer}>
                <Ionicons name="person-outline" size={60} color="#ccc" />
                <Text style={{ color: '#666', marginTop: 15 }}>User not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: '#E31C25' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

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

            <SectionHeader title="Raiding Statistics" icon="flash" />
            <View style={styles.gridContainer}>
                <StatCard label="Success %" value={`${data.raidingStats?.raidSuccessRate || 0}%`} icon="checkmark-circle" color="#4CAF50" />
                <StatCard label="Super 10s" value={data.raidingStats?.super10s} icon="star" color="#FFD700" />
                <StatCard label="Super Raids" value={data.raidingStats?.superRaids} icon="flame" color="#FF9800" />
                <StatCard label="Do-Or-Die" value={data.raidingStats?.doOrDieRaidPoints} icon="skull" color="#333" />
                <StatCard label="Empty Raids" value={data.raidingStats?.emptyRaids} icon="radio-button-off" color="#999" />
                <StatCard label="Bonus Pts" value={data.raidingStats?.bonusPoints} icon="add-circle" color="#2196F3" />
            </View>

            <SectionHeader title="Defense Statistics" icon="shield" />
            <View style={styles.gridContainer}>
                <StatCard label="Success %" value={`${data.defenseStats?.tackleSuccessRate || 0}%`} icon="checkmark-circle" color="#4CAF50" />
                <StatCard label="High 5s" value={data.defenseStats?.high5s} icon="hand-left" color="#FFD700" />
                <StatCard label="Super Tackles" value={data.defenseStats?.superTackles} icon="expand" color="#FF9800" />
                <StatCard label="Blocks" value={data.defenseStats?.blocks} icon="stop-circle" color="#E91E63" />
                <StatCard label="Dashes" value={data.defenseStats?.dashes} icon="flash-off" color="#9C27B0" />
                <StatCard label="Ankle Holds" value={data.defenseStats?.ankleHolds} icon="accessibility" color="#795548" />
            </View>

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Header with Large Image */}
                <View style={styles.heroContainer}>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => user?.profilePicture && setShowFullImage(true)}
                    >
                        {user?.profilePicture ? (
                            <Image source={{ uri: user.profilePicture }} style={styles.heroImage} />
                        ) : (
                            <LinearGradient colors={['#2c3e50', '#1a1a2e']} style={styles.heroPlaceholder}>
                                <Ionicons name="person" size={80} color="rgba(255,255,255,0.3)" />
                            </LinearGradient>
                        )}
                    </TouchableOpacity>

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroOverlay}
                    />

                    {/* Header Buttons */}
                    <View style={styles.headerButtons}>
                        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {/* Removed Chat and Block buttons from here */}
                            <TouchableOpacity style={[styles.headerBtn, { backgroundColor: followStatus === 'accepted' ? '#fff' : '#E31C25' }]} onPress={handleFollowAction}>
                                <Ionicons
                                    name={followStatus === 'none' ? "person-add" : (followStatus === 'pending' ? "time" : "checkmark")}
                                    size={20}
                                    color={followStatus === 'accepted' ? '#E31C25' : '#fff'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Player Info on Image */}
                    <View style={styles.heroInfo}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <View>
                                <Text style={styles.heroName}>{user?.name || 'Guest Player'}</Text>
                                <View style={styles.heroLocationRow}>
                                    <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.heroLocation}>{user?.address || user?.city || 'Location Unknown'}</Text>
                                </View>
                            </View>

                            {/* Chat Button Moved Here */}
                            <TouchableOpacity
                                style={styles.chatBtn}
                                onPress={() => router.push(`/messages?userId=${userId}&userName=${user?.name}` as any)}
                            >
                                <Ionicons name="chatbubbles" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {user?.sports && user.sports.length > 0 && (
                            <View style={styles.sportTagsRow}>
                                {user.sports.map((sport: string, idx: number) => (
                                    <View key={idx} style={styles.sportTag}>
                                        <Text style={styles.sportTagText}>{sport}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Tap to View Hint */}
                    {user?.profilePicture && (
                        <View style={styles.tapHint}>
                            <Ionicons name="expand-outline" size={14} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.tapHintText}>Tap to view full image</Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.contentWrapper}>
                    <Animated.View entering={FadeInUp.delay(300).duration(600)}>
                        {!hasProfile ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="stats-chart" size={60} color="#ccc" />
                                <Text style={styles.emptyTitle}>No Stats Available</Text>
                                <Text style={styles.emptyText}>This player hasn't set up their profile stats yet.</Text>
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

            {/* Full Image Modal */}
            <Modal
                visible={showFullImage}
                transparent
                animationType="fade"
                onRequestClose={() => setShowFullImage(false)}
            >
                <View style={styles.fullImageModal}>
                    <TouchableOpacity
                        style={styles.closeFullImage}
                        onPress={() => setShowFullImage(false)}
                    >
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    {user?.profilePicture && (
                        <Image
                            source={{ uri: user.profilePicture }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                    <Text style={styles.fullImageName}>{user?.name}</Text>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    blockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA', paddingHorizontal: 30 },
    blockedTitle: { fontSize: 18, fontWeight: 'bold', color: '#555', marginTop: 15 },
    blockedSubtitle: { color: '#888', marginTop: 5, marginBottom: 25, textAlign: 'center' },
    unblockBtn: { backgroundColor: '#444', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 25 },
    unblockBtnText: { color: '#fff', fontWeight: 'bold' },

    // Hero Image Section
    heroContainer: {
        width: '100%',
        height: height * 0.45,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
    },
    heroPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    headerButtons: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    headerBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroInfo: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
    },
    heroName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    heroLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginTop: 6,
    },
    heroLocation: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    sportTagsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    sportTag: {
        backgroundColor: '#E31C25',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sportTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    tapHint: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 55 : 45,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    tapHintText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
    },

    contentWrapper: { paddingHorizontal: 16, marginTop: 20 },

    // Full Image Modal
    fullImageModal: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeFullImage: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 40,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    fullImage: {
        width: width,
        height: height * 0.7,
    },
    fullImageName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 20,
    },

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
    chatBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E31C25',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }
});
