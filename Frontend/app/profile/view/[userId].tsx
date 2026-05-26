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
    const [advancedStats, setAdvancedStats] = useState<any>(null);

    const { user: currentUser } = useAppSelector(state => state.auth);
    const [isBlocked, setIsBlocked] = useState(false);
    const [followStatus, setFollowStatus] = useState<'none' | 'pending' | 'accepted'>('none');
    const [auctionData, setAuctionData] = useState<any>(null);
    const [selectedSport, setSelectedSport] = useState<string>('');


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

                    // Set default selected sport from profile if available
                    if (userData.sports && userData.sports.length > 0) {
                        setSelectedSport(userData.sports[0]);
                    }

                    // Fetch auction info from general player list by matching name
                    try {
                        const playersResponse = await api.get('/players');
                        const matchedPlayer = playersResponse.data.find(
                            (p: any) => p.name?.trim().toLowerCase() === userData.name?.trim().toLowerCase()
                        );
                        setAuctionData(matchedPlayer || null);
                    } catch (e) {
                        console.log('Auction details fetch error', e);
                    }
                }
                
                try {
                    const statsResponse = await api.get(`/user/${userId}/stats`);
                    if (statsResponse.data.success) {
                        setAdvancedStats(statsResponse.data.data);
                    }
                } catch (e) {
                    console.log('Advanced stats error', e);
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

    const hasCricketProfile = !!((user?.playerProfile?.cricket || (advancedStats?.stats?.totalMatches > 0)) && user?.sports?.includes('Cricket'));
    const hasKabaddiProfile = !!((user?.playerProfile?.kabaddi || (advancedStats?.stats?.totalMatches > 0)) && user?.sports?.includes('Kabaddi'));
    const hasFootballProfile = !!(user?.playerProfile?.football && user?.sports?.includes('Football'));
    const hasProfile = hasCricketProfile || hasKabaddiProfile || hasFootballProfile || !!(advancedStats?.stats?.totalMatches > 0);


    const getMergedFootballStats = () => {
        const footballProfile = user?.playerProfile?.football || {};
        const careerSummary = footballProfile.careerSummary || {};
        
        return {
            ...footballProfile,
            role: footballProfile.position || 'Player',
            jerseyNumber: footballProfile.jerseyNumber || '-',
            preferredFoot: footballProfile.preferredFoot || 'N/A',
            careerSummary: {
                totalGoals: careerSummary.totalGoals || 0,
                totalAssists: careerSummary.totalAssists || 0,
                matchesPlayed: careerSummary.matchesPlayed || 0,
                cleanSheets: careerSummary.cleanSheets || 0,
                passingAccuracy: careerSummary.passingAccuracy || 0,
            },
            seasonStats: footballProfile.seasonStats || []
        };
    };


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
                highestScore: advancedStats?.stats?.highestScore !== undefined ? advancedStats.stats.highestScore : (careerSummary.highestScore || 0),
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
                    <Text style={styles.listLabel}>Cards (Green / Yellow / Red)</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={[styles.refereeCard, { backgroundColor: '#4CAF50' }]}><Text style={styles.cardText}>{data.discipline?.greenCards || 0}</Text></View>
                        <View style={[styles.refereeCard, { backgroundColor: '#FFD700' }]}><Text style={styles.cardText}>{data.discipline?.yellowCards || 0}</Text></View>
                        <View style={[styles.refereeCard, { backgroundColor: '#F44336' }]}><Text style={styles.cardText}>{data.discipline?.redCards || 0}</Text></View>
                    </View>
                </View>
            </View>

            {/* Fitness & Medical Clearance Status */}
            {data.fitness && (
                <View style={styles.fitnessCard}>
                    <LinearGradient
                        colors={
                            data.fitness.fitnessStatus === 'Fit'
                                ? ['#E8F5E9', '#C8E6C9']
                                : data.fitness.fitnessStatus === 'Recovering'
                                ? ['#FFF9C4', '#FFF59D']
                                : ['#FFEBEE', '#FFCDD2']
                        }
                        style={styles.fitnessGradient}
                    >
                        <View style={styles.fitnessHeader}>
                            <Ionicons
                                name={
                                    data.fitness.fitnessStatus === 'Fit'
                                        ? 'shield-checkmark'
                                        : data.fitness.fitnessStatus === 'Recovering'
                                        ? 'shield'
                                        : 'alert-circle'
                                }
                                size={20}
                                color={
                                    data.fitness.fitnessStatus === 'Fit'
                                        ? '#2E7D32'
                                        : data.fitness.fitnessStatus === 'Recovering'
                                        ? '#F57F17'
                                        : '#C62828'
                                }
                            />
                            <Text style={[
                                styles.fitnessStatusText,
                                {
                                    color:
                                        data.fitness.fitnessStatus === 'Fit'
                                            ? '#2E7D32'
                                            : data.fitness.fitnessStatus === 'Recovering'
                                            ? '#F57F17'
                                            : '#C62828'
                                }
                            ]}>
                                Medical Clearance: {data.fitness.fitnessStatus || 'Fit'}
                            </Text>
                        </View>
                        {data.fitness.injuries ? (
                            <Text style={styles.fitnessInjuriesText}>Injury Logs: {data.fitness.injuries}</Text>
                        ) : null}
                        {data.fitness.lastMatchPlayedDate ? (
                            <Text style={styles.fitnessLastPlayedText}>
                                Last Scored Game: {new Date(data.fitness.lastMatchPlayedDate).toLocaleDateString()}
                            </Text>
                        ) : null}
                    </LinearGradient>
                </View>
            )}

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

    const renderFootballStats = (data: any) => (
        <View>
            <View style={styles.roleCard}>
                <LinearGradient colors={['#E8F5E9', '#fff']} style={styles.roleGradient}>
                    <Text style={[styles.roleTitle, { color: '#2E7D32' }]}>FOOTBALL PROFILE</Text>
                    <View style={styles.roleRow}>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>{data.role || 'Player'}</Text></View>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>Jersey #{data.jerseyNumber}</Text></View>
                        <View style={styles.roleBadge}><Text style={styles.roleText}>Preferred Foot: {data.preferredFoot}</Text></View>
                    </View>
                </LinearGradient>
            </View>

            {/* Pitch positioning mini field */}
            <SectionHeader title="Pitch Positioning" icon="football" />
            {renderSoccerField(data.role)}

            <View style={styles.highlightGrid}>
                <LinearGradient colors={['#2E7D32', '#4CAF50']} style={styles.mainStatBox}>
                    <Text style={styles.mainStatLabel}>TOTAL GOALS</Text>
                    <Text style={styles.mainStatValue}>{data.careerSummary?.totalGoals || 0}</Text>
                    <Text style={styles.mainStatSub}>{data.careerSummary?.matchesPlayed || 0} Matches Played</Text>
                </LinearGradient>
                <View style={{ flex: 1, gap: 10 }}>
                    <View style={styles.subStatBox}>
                        <Text style={styles.subStatValue}>{data.careerSummary?.totalAssists || 0}</Text>
                        <Text style={styles.subStatLabel}>Assists</Text>
                    </View>
                    <View style={styles.subStatBox}>
                        <Text style={styles.subStatValue}>{data.careerSummary?.cleanSheets || 0}</Text>
                        <Text style={styles.subStatLabel}>Clean Sheets</Text>
                    </View>
                </View>
            </View>

            <SectionHeader title="Technical Ratios" icon="analytics" />
            <View style={styles.gridContainer}>
                <StatCard label="Passing Acc." value={`${data.careerSummary?.passingAccuracy || 0}%`} icon="locate" color="#2E7D32" />
                <StatCard label="Shots on Target" value={`${data.careerSummary?.shotsOnTarget || 0}%`} icon="eye" color="#E31C25" />
                <StatCard label="Experience" value={`${data.experienceYears || 0} Yrs`} icon="hourglass" color="#FFA726" />
            </View>

            {data.seasonStats && data.seasonStats.length > 0 && (
                <View>
                    <SectionHeader title="Season Performance" icon="calendar" />
                    <View style={styles.tableCard}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.th, { flex: 1.2, textAlign: 'left' }]}>Season</Text>
                            <Text style={styles.th}>Mat</Text>
                            <Text style={styles.th}>Goals</Text>
                            <Text style={styles.th}>Ast</Text>
                            <Text style={styles.th}>Min</Text>
                        </View>
                        {data.seasonStats.map((item: any, idx: number) => (
                            <View key={idx} style={[styles.tr, idx % 2 === 0 && styles.trAlt]}>
                                <Text style={[styles.td, { flex: 1.2, textAlign: 'left', fontWeight: 'bold' }]}>{item.season}</Text>
                                <Text style={styles.td}>{item.matches}</Text>
                                <Text style={styles.td}>{item.goals}</Text>
                                <Text style={styles.td}>{item.assists}</Text>
                                <Text style={styles.td}>{item.minutesPlayed}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    const renderSoccerField = (position: string) => {
        const normalizedPos = (position || '').trim().toLowerCase();
        let markerStyle: any = { top: '45%', left: '46%' }; // Midfield
        
        if (normalizedPos.includes('forward') || normalizedPos.includes('striker') || normalizedPos.includes('wing') || normalizedPos.includes('attac')) {
            markerStyle = { top: '15%', left: '46%' };
        } else if (normalizedPos.includes('midfield')) {
            markerStyle = { top: '45%', left: '46%' };
        } else if (normalizedPos.includes('defen') || normalizedPos.includes('back')) {
            markerStyle = { top: '72%', left: '46%' };
        } else if (normalizedPos.includes('goalkeeper') || normalizedPos.includes('keeper') || normalizedPos.includes('gk')) {
            markerStyle = { top: '88%', left: '46%' };
        }

        return (
            <View style={styles.soccerFieldContainer}>
                <LinearGradient colors={['#2E7D32', '#1b5e20']} style={styles.soccerField}>
                    {/* Penalty Area Top */}
                    <View style={styles.fieldPenaltyAreaTop} />
                    {/* Penalty Area Bottom */}
                    <View style={styles.fieldPenaltyAreaBottom} />
                    {/* Center Circle */}
                    <View style={styles.fieldCenterCircle} />
                    {/* Center Line */}
                    <View style={styles.fieldCenterLine} />
                    {/* Player Position Marker */}
                    <View style={[styles.fieldPlayerMarker, markerStyle]}>
                        <View style={styles.fieldPlayerMarkerPulse} />
                        <Text style={styles.fieldPlayerMarkerText}>{position || 'Player'}</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    const activeSportToShow = selectedSport || (user?.sports && user.sports[0]) || 'Cricket';
    const showCricket = activeSportToShow === 'Cricket' && hasCricketProfile;
    const showKabaddi = activeSportToShow === 'Kabaddi' && hasKabaddiProfile;
    const showFootball = activeSportToShow === 'Football' && hasFootballProfile;


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

                    {/* Auction Banner overlay */}
                    {auctionData && (
                        <View style={styles.auctionBadgeOverlay}>
                            <LinearGradient
                                colors={
                                    auctionData.auctionStatus === 'SOLD'
                                        ? ['#FFD700', '#FFA000']
                                        : auctionData.auctionStatus === 'LIVE'
                                        ? ['#E31C25', '#FF4081']
                                        : ['#475569', '#334155']
                                }
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.auctionBadgeGradient}
                            >
                                <View style={styles.auctionBadgeContent}>
                                    <MaterialCommunityIcons
                                        name={
                                            auctionData.auctionStatus === 'SOLD'
                                                ? 'crown'
                                                : auctionData.auctionStatus === 'LIVE'
                                                ? 'gavel'
                                                : 'calendar-clock'
                                        }
                                        size={14}
                                        color={auctionData.auctionStatus === 'SOLD' ? '#1A1A1A' : '#fff'}
                                        style={{ marginRight: 6 }}
                                    />
                                    <Text style={[
                                        styles.auctionBadgeText,
                                        { color: auctionData.auctionStatus === 'SOLD' ? '#1A1A1A' : '#fff' }
                                    ]}>
                                        {auctionData.auctionStatus === 'SOLD'
                                            ? `SOLD to ${auctionData.team?.name || auctionData.team?.code || 'Franchise'} for ₹${auctionData.soldPrice?.toLocaleString()}`
                                            : auctionData.auctionStatus === 'LIVE'
                                            ? `LIVE BID • Base Price: ₹${auctionData.basePrice?.toLocaleString()}`
                                            : auctionData.auctionStatus === 'UNSOLD'
                                            ? `UNSOLD • Base Price: ₹${auctionData.basePrice?.toLocaleString()}`
                                            : `Category ${auctionData.category || 'A'} • Base Price: ₹${auctionData.basePrice?.toLocaleString()}`}
                                    </Text>
                                </View>
                            </LinearGradient>
                        </View>
                    )}


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
                                {/* Horizontal Sport Tabs Switcher */}
                                {user?.sports && user.sports.length > 1 && (
                                    <View style={styles.sportSwitcherContainer}>
                                        {user.sports.map((sport: string) => {
                                            const isSelected = activeSportToShow === sport;
                                            return (
                                                <TouchableOpacity
                                                    key={sport}
                                                    style={[styles.sportProfileTabBtn, isSelected && styles.activeSportProfileTabBtn]}
                                                    onPress={() => setSelectedSport(sport)}
                                                    activeOpacity={0.8}
                                                >
                                                    <MaterialCommunityIcons
                                                        name={
                                                            sport === 'Cricket'
                                                                ? 'cricket'
                                                                : sport === 'Kabaddi'
                                                                ? 'run'
                                                                : 'football'
                                                        }
                                                        size={16}
                                                        color={isSelected ? '#fff' : '#666'}
                                                    />
                                                    <Text style={[styles.sportProfileTabBtnText, isSelected && styles.activeSportProfileTabBtnText]}>
                                                        {sport}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}

                                {showKabaddi && renderKabaddiStats(getMergedKabaddiStats())}
                                {showCricket && renderCricketStats(getMergedCricketStats())}
                                {showFootball && renderFootballStats(getMergedFootballStats())}

                                
                                {advancedStats && (
                                    <View>
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
    },
    
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
    resultText: { fontSize: 10, fontWeight: 'bold' },
    
    // New Profile View Styles
    refereeCard: {
        width: 20,
        height: 28,
        borderRadius: 3,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
    },
    fitnessCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    fitnessGradient: {
        padding: 16,
    },
    fitnessHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fitnessStatusText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    fitnessInjuriesText: {
        fontSize: 12,
        color: '#555',
        marginTop: 6,
        fontWeight: '600',
    },
    fitnessLastPlayedText: {
        fontSize: 11,
        color: '#666',
        marginTop: 4,
    },
    auctionBadgeOverlay: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 105 : 95,
        left: 20,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    auctionBadgeGradient: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    auctionBadgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    auctionBadgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    sportSwitcherContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 3,
        borderWidth: 1,
        borderColor: '#eee',
        gap: 6,
    },
    sportProfileTabBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    activeSportProfileTabBtn: {
        backgroundColor: '#E31C25',
    },
    sportProfileTabBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
    },
    activeSportProfileTabBtnText: {
        color: '#fff',
    },
    soccerFieldContainer: {
        height: 160,
        borderRadius: 16,
        overflow: 'hidden',
        marginVertical: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    soccerField: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#2e7d32',
    },
    fieldCenterLine: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    fieldCenterCircle: {
        position: 'absolute',
        top: '35%',
        left: '35%',
        width: '30%',
        height: '30%',
        borderRadius: 100,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'transparent',
    },
    fieldPenaltyAreaTop: {
        position: 'absolute',
        top: 0,
        left: '20%',
        width: '60%',
        height: '25%',
        borderBottomWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    fieldPenaltyAreaBottom: {
        position: 'absolute',
        bottom: 0,
        left: '20%',
        width: '60%',
        height: '25%',
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    fieldPlayerMarker: {
        position: 'absolute',
        transform: [{ translateX: -40 }, { translateY: -15 }],
        width: 80,
        alignItems: 'center',
    },
    fieldPlayerMarkerPulse: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#FFD700',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    fieldPlayerMarkerText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
        marginTop: 4,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowRadius: 3,
        textShadowOffset: { width: 0, height: 1 },
        textAlign: 'center',
    },

});
