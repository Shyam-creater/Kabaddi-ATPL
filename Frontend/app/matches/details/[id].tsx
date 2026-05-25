import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MatchService from '../../../services/matchService';
import socketService from '../../../services/socketService';
import VideoPlayerModal from '../../../components/common/VideoPlayerModal';

const { width } = Dimensions.get('window');

type TabType = 'scorecard' | 'commentary' | 'squads' | 'stats';

export default function MatchDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [match, setMatch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('scorecard');
    const [activeInningsTab, setActiveInningsTab] = useState<'innings1' | 'innings2'>('innings1');
    const [videoVisible, setVideoVisible] = useState(false);

    useEffect(() => {
        if (!id) return;

        let isMounted = true;

        const fetchMatchDetails = async () => {
            try {
                const data = await MatchService.getMatchById(id as string);
                if (isMounted) {
                    setMatch(data);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Failed to load match detail:', error);
                if (isMounted) setLoading(false);
            }
        };

        fetchMatchDetails();

        const handleMatchUpdate = (updatedMatch: any) => {
            if (updatedMatch._id === id && isMounted) {
                setMatch(updatedMatch);
            }
        };

        socketService.onMatchUpdate(handleMatchUpdate);

        return () => {
            isMounted = false;
            socketService.removeListener('match:update', handleMatchUpdate);
        };
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#E31C25" />
                <Text style={styles.loadingText}>Fetching scorecard details...</Text>
            </SafeAreaView>
        );
    }

    if (!match) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#999" />
                <Text style={styles.errorText}>Match not found or failed to load</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isLive = match.status === 'LIVE';
    const isCricket = match.sport === 'cricket' || !match.sport;

    // Split Batsmen and Bowlers by Team
    const teamABatsmen = match.battingLineup?.filter((b: any) =>
        match.teamAPlayers?.some((p: any) => p.name?.toLowerCase() === b.name?.toLowerCase())
    ) || [];

    const teamBBatsmen = match.battingLineup?.filter((b: any) =>
        match.teamBPlayers?.some((p: any) => p.name?.toLowerCase() === b.name?.toLowerCase())
    ) || [];

    const teamABowlers = match.bowlingLineup?.filter((b: any) =>
        match.teamAPlayers?.some((p: any) => p.name?.toLowerCase() === b.name?.toLowerCase())
    ) || [];

    const teamBBowlers = match.bowlingLineup?.filter((b: any) =>
        match.teamBPlayers?.some((p: any) => p.name?.toLowerCase() === b.name?.toLowerCase())
    ) || [];

    // Calculate Extras breakdown helper
    const getExtrasString = (score: any) => {
        if (!score || typeof score !== 'object') return '0';
        const ext = score.extras ?? 0;
        const wd = score.wides ?? 0;
        const nb = score.noballs ?? 0;
        const b = score.byes ?? 0;
        const lb = score.legbyes ?? 0;
        return `${ext} (wd ${wd}, nb ${nb}, b ${b}, lb ${lb})`;
    };

    // Determine who batted first
    // Default to Innings 1 = Team A batting, Innings 2 = Team B batting
    let innings1BattingTeam = match.teamA;
    let innings1Score = match.scoreA;
    let innings1Batsmen = teamABatsmen;
    let innings1Bowlers = teamBBowlers; // Team B bowled to Team A

    let innings2BattingTeam = match.teamB;
    let innings2Score = match.scoreB;
    let innings2Batsmen = teamBBatsmen;
    let innings2Bowlers = teamABowlers; // Team A bowled to Team B

    const tossDecisionStr = match.tossDecision?.toLowerCase() || '';
    const tossWinnerStr = match.tossWinner || '';

    // If Team B won toss and chose to bat, or Team A won toss and chose to bowl, Team B bats first!
    const isTeamBFirstInnings = 
        (tossWinnerStr === match.teamB.name && tossDecisionStr === 'bat') ||
        (tossWinnerStr === match.teamA.name && tossDecisionStr === 'bowl') ||
        (tossWinnerStr === match.teamB.code && tossDecisionStr === 'bat') ||
        (tossWinnerStr === match.teamA.code && tossDecisionStr === 'bowl');

    if (isTeamBFirstInnings) {
        innings1BattingTeam = match.teamB;
        innings1Score = match.scoreB;
        innings1Batsmen = teamBBatsmen;
        innings1Bowlers = teamABowlers;

        innings2BattingTeam = match.teamA;
        innings2Score = match.scoreA;
        innings2Batsmen = teamABatsmen;
        innings2Bowlers = teamBBowlers;
    }

    const calculateSR = (runs: number, balls: number) => {
        if (balls === 0) return '0.0';
        return ((runs / balls) * 100).toFixed(1);
    };

    const calculateEconomy = (runs: number, overs: number) => {
        if (!overs || overs === 0) return '0.0';
        const oversStr = String(overs);
        let totalBalls = 0;
        if (oversStr.includes('.')) {
            const [ov, bl] = oversStr.split('.');
            totalBalls = parseInt(ov, 10) * 6 + parseInt(bl || '0', 10);
        } else {
            totalBalls = overs * 6;
        }
        if (totalBalls === 0) return '0.0';
        return ((runs / totalBalls) * 6).toFixed(2);
    };

    const getVideoInfo = () => {
        if (match.status === 'LIVE') {
            if (match.youtubeId) return { url: `https://www.youtube.com/watch?v=${match.youtubeId}`, type: 'live' as const, label: '🔴 Watch Live' };
            if (match.hlsUrl) return { url: match.hlsUrl, type: 'live' as const, label: '🔴 Watch Live' };
            if (match.liveStreamUrl) return { url: match.liveStreamUrl, type: 'live' as const, label: '🔴 Watch Live' };
        }
        if (match.status === 'UPCOMING' && match.previewVideoUrl)
            return { url: match.previewVideoUrl, type: 'preview' as const, label: '📅 Preview' };
        if (match.status === 'COMPLETED' && match.recordedVideoUrl)
            return { url: match.recordedVideoUrl, type: 'recorded' as const, label: '🎬 Highlights' };
        return null;
    };
    const videoInfo = getVideoInfo();

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {match.teamA.code} vs {match.teamB.code} Scorecard
                </Text>
                {videoInfo ? (
                    <TouchableOpacity onPress={() => setVideoVisible(true)} style={styles.headerLiveBtn}>
                        <Ionicons name="play-circle" size={24} color="#FFD700" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* Video Player Modal */}
            {videoInfo && (
                <VideoPlayerModal
                    visible={videoVisible}
                    url={videoInfo.url}
                    title={`${match.teamA.code} vs ${match.teamB.code}`}
                    subtitle={`${match.series} · ${match.venue || ''}`}
                    type={videoInfo.type}
                    onClose={() => setVideoVisible(false)}
                />
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
                {/* Immersive Match Summary Card */}
                <LinearGradient colors={['#E31C25', '#900C12']} style={styles.matchBanner}>
                    <View style={styles.bannerRow}>
                        <Text style={styles.bannerSeries}>{match.series}</Text>
                        <View style={[styles.statusBadge, match.status === 'LIVE' && styles.liveBadge, match.status === 'COMPLETED' && styles.completedBadge]}>
                            <Text style={styles.statusText}>{match.status}</Text>
                        </View>
                    </View>

                    <View style={styles.teamsScoreRow}>
                        <View style={styles.teamScoreCol}>
                            <Text style={styles.bannerTeamCode}>{match.teamA.code}</Text>
                            <Text style={styles.bannerScore}>
                                {typeof match.scoreA === 'object' ? `${match.scoreA.runs}/${match.scoreA.wickets}` : match.scoreA}
                            </Text>
                            <Text style={styles.bannerOvers}>
                                {typeof match.scoreA === 'object' ? `(${match.scoreA.overs} ov)` : ''}
                            </Text>
                        </View>

                        <Text style={styles.bannerVs}>VS</Text>

                        <View style={[styles.teamScoreCol, { alignItems: 'flex-end' }]}>
                            <Text style={styles.bannerTeamCode}>{match.teamB.code}</Text>
                            <Text style={styles.bannerScore}>
                                {typeof match.scoreB === 'object' ? `${match.scoreB.runs}/${match.scoreB.wickets}` : match.scoreB}
                            </Text>
                            <Text style={styles.bannerOvers}>
                                {typeof match.scoreB === 'object' ? `(${match.scoreB.overs} ov)` : ''}
                            </Text>
                        </View>
                    </View>

                    {(match.tossWinner || match.target || match.statusText) && (
                        <View style={styles.bannerFooter}>
                            {match.tossWinner && (
                                <Text style={styles.bannerToss}>
                                    Toss: {match.tossWinner} won and chose to {match.tossDecision}
                                </Text>
                            )}
                            {match.target && (
                                <Text style={styles.bannerTarget}>Target: {match.target} runs</Text>
                            )}
                            {match.statusText && (
                                <Text style={styles.bannerStatusText}>{match.statusText}</Text>
                            )}
                        </View>
                    )}
                </LinearGradient>

                {/* Tabs Bar */}
                <View style={styles.tabBar}>
                    {(['scorecard', 'commentary', 'squads', 'stats'] as TabType[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
                                {tab.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Tab Contents */}
                {activeTab === 'scorecard' && (
                    <View style={styles.tabContent}>
                        {/* Innings selector tab */}
                        <View style={styles.inningsSelectorRow}>
                            <TouchableOpacity
                                style={[styles.inningsTab, activeInningsTab === 'innings1' && styles.activeInningsTab]}
                                onPress={() => setActiveInningsTab('innings1')}
                            >
                                <Text style={[styles.inningsTabText, activeInningsTab === 'innings1' && styles.activeInningsTabText]}>
                                    {innings1BattingTeam.code} Innings
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.inningsTab, activeInningsTab === 'innings2' && styles.activeInningsTab]}
                                onPress={() => setActiveInningsTab('innings2')}
                            >
                                <Text style={[styles.inningsTabText, activeInningsTab === 'innings2' && styles.activeInningsTabText]}>
                                    {innings2BattingTeam.code} Innings
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Innings Content */}
                        {activeInningsTab === 'innings1' ? (
                            <InningsScorecard
                                battingTeam={innings1BattingTeam}
                                score={innings1Score}
                                batsmen={innings1Batsmen}
                                bowlers={innings1Bowlers}
                                calculateSR={calculateSR}
                                calculateEconomy={calculateEconomy}
                                getExtrasString={getExtrasString}
                                currentBatters={match.currentBatters}
                            />
                        ) : (
                            <InningsScorecard
                                battingTeam={innings2BattingTeam}
                                score={innings2Score}
                                batsmen={innings2Batsmen}
                                bowlers={innings2Bowlers}
                                calculateSR={calculateSR}
                                calculateEconomy={calculateEconomy}
                                getExtrasString={getExtrasString}
                                currentBatters={match.currentBatters}
                            />
                        )}
                    </View>
                )}

                {activeTab === 'commentary' && (
                    <View style={styles.tabContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTitle}>Live Commentary</Text>
                        </View>
                        {match.commentary && match.commentary.length > 0 ? (
                            [...match.commentary]
                                .sort((a, b) => {
                                    if (a.over !== b.over) return b.over - a.over;
                                    return b.ball - a.ball;
                                })
                                .map((comm, idx) => {
                                    const isBoundary = comm.runs === 4 || comm.runs === 6;
                                    const isWicket = comm.event?.toLowerCase().includes('wicket');
                                    return (
                                        <View key={idx} style={[styles.commRow, isBoundary && styles.commBoundaryRow, isWicket && styles.commWicketRow]}>
                                            <View style={styles.commMeta}>
                                                <Text style={styles.commOver}>
                                                    {comm.over}.{comm.ball}
                                                </Text>
                                                <View style={[
                                                    styles.commBadge,
                                                    isWicket && styles.commWicketBadge,
                                                    comm.runs === 4 && styles.commFourBadge,
                                                    comm.runs === 6 && styles.commSixBadge,
                                                    comm.runs === 0 && styles.commDotBadge
                                                ]}>
                                                    <Text style={[
                                                        styles.commBadgeText,
                                                        (isWicket || isBoundary) ? { color: '#FFF' } : comm.runs === 0 ? { color: '#888' } : { color: '#333' }
                                                    ]}>
                                                        {isWicket ? 'W' : comm.runs}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.commContent}>
                                                <Text style={styles.commEvent} numberOfLines={1}>{comm.event || 'Delivery'}</Text>
                                                <Text style={styles.commDesc}>{comm.description || 'No description provided.'}</Text>
                                            </View>
                                        </View>
                                    );
                                })
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbox-ellipses-outline" size={48} color="#ccc" />
                                <Text style={styles.emptyText}>No commentary events recorded yet</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'squads' && (
                    <View style={styles.tabContent}>
                        <View style={styles.squadsRow}>
                            <View style={styles.squadCol}>
                                <Text style={styles.squadTeamTitle}>{match.teamA.code} Squad</Text>
                                {match.teamAPlayers && match.teamAPlayers.length > 0 ? (
                                    match.teamAPlayers.map((p: any, idx: number) => (
                                        <View key={idx} style={styles.squadPlayerRow}>
                                            <View style={styles.squadPlayerNumBg}>
                                                <Text style={styles.squadPlayerNum}>{p.jerseyNumber || (idx + 1)}</Text>
                                            </View>
                                            <View style={styles.squadPlayerInfo}>
                                                <Text style={styles.squadPlayerName} numberOfLines={1}>{p.name}</Text>
                                                <Text style={styles.squadPlayerRole}>{p.role || 'Player'}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptySquadText}>No players registered</Text>
                                )}
                            </View>
                            
                            <View style={styles.squadCol}>
                                <Text style={styles.squadTeamTitle}>{match.teamB.code} Squad</Text>
                                {match.teamBPlayers && match.teamBPlayers.length > 0 ? (
                                    match.teamBPlayers.map((p: any, idx: number) => (
                                        <View key={idx} style={styles.squadPlayerRow}>
                                            <View style={styles.squadPlayerNumBg}>
                                                <Text style={styles.squadPlayerNum}>{p.jerseyNumber || (idx + 1)}</Text>
                                            </View>
                                            <View style={styles.squadPlayerInfo}>
                                                <Text style={styles.squadPlayerName} numberOfLines={1}>{p.name}</Text>
                                                <Text style={styles.squadPlayerRole}>{p.role || 'Player'}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptySquadText}>No players registered</Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {activeTab === 'stats' && (
                    <View style={styles.tabContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderTitle}>Key Stats Comparison</Text>
                        </View>
                        
                        {/* Run Rate comparison */}
                        <StatBar
                            title="Current Run Rate"
                            valA={typeof match.scoreA === 'object' && match.scoreA.overs > 0 ? ((match.scoreA.runs / match.scoreA.overs).toFixed(2)) : '0.00'}
                            valB={typeof match.scoreB === 'object' && match.scoreB.overs > 0 ? ((match.scoreB.runs / match.scoreB.overs).toFixed(2)) : '0.00'}
                            teamA={match.teamA.code}
                            teamB={match.teamB.code}
                        />

                        {/* Wickets Lost */}
                        <StatBar
                            title="Wickets Lost"
                            valA={typeof match.scoreA === 'object' ? String(match.scoreA.wickets || 0) : '0'}
                            valB={typeof match.scoreB === 'object' ? String(match.scoreB.wickets || 0) : '0'}
                            teamA={match.teamA.code}
                            teamB={match.teamB.code}
                        />

                        {/* Boundaries Fours */}
                        <StatBar
                            title="Total Fours (4s)"
                            valA={String(match.battingLineup?.filter((b: any) => match.teamAPlayers?.some((p: any) => p.name === b.name)).reduce((sum: number, b: any) => sum + (b.fours || 0), 0) || 0)}
                            valB={String(match.battingLineup?.filter((b: any) => match.teamBPlayers?.some((p: any) => p.name === b.name)).reduce((sum: number, b: any) => sum + (b.fours || 0), 0) || 0)}
                            teamA={match.teamA.code}
                            teamB={match.teamB.code}
                        />

                        {/* Boundaries Sixes */}
                        <StatBar
                            title="Total Sixes (6s)"
                            valA={String(match.battingLineup?.filter((b: any) => match.teamAPlayers?.some((p: any) => p.name === b.name)).reduce((sum: number, b: any) => sum + (b.sixes || 0), 0) || 0)}
                            valB={String(match.battingLineup?.filter((b: any) => match.teamBPlayers?.some((p: any) => p.name === b.name)).reduce((sum: number, b: any) => sum + (b.sixes || 0), 0) || 0)}
                            teamA={match.teamA.code}
                            teamB={match.teamB.code}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// InningsScorecard Component
const InningsScorecard = ({
    battingTeam,
    score,
    batsmen,
    bowlers,
    calculateSR,
    calculateEconomy,
    getExtrasString,
    currentBatters,
}: any) => {
    return (
        <View style={styles.scorecardContainer}>
            {/* Batting Section */}
            <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHeader, { flex: 4 }]}>Batter</Text>
                <Text style={[styles.tableColHeader, { flex: 2 }]}>Dismissal</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>R</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>B</Text>
                <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'center' }]}>4s</Text>
                <Text style={[styles.tableColHeader, { flex: 0.8, textAlign: 'center' }]}>6s</Text>
                <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>SR</Text>
            </View>

            {batsmen && batsmen.length > 0 ? (
                batsmen.map((b: any, idx: number) => {
                    const isCurrentBatter = currentBatters?.some((cb: any) => cb.name === b.name && cb.isStriker);
                    const isBatting = b.status === 'Batting';
                    return (
                        <View key={idx} style={[styles.tableDataRow, isCurrentBatter && styles.highlightedRow]}>
                            <View style={[{ flex: 4, flexDirection: 'row', alignItems: 'center' }]}>
                                {isCurrentBatter && (
                                    <MaterialCommunityIcons name="cricket" size={12} color="#E31C25" style={{ marginRight: 2 }} />
                                )}
                                <Text style={[styles.tableDataText, { fontWeight: (isCurrentBatter || isBatting) ? 'bold' : '500' }]} numberOfLines={1}>
                                    {b.name}{isCurrentBatter ? '*' : ''}
                                </Text>
                            </View>
                            <Text style={[styles.tableDataText, { flex: 2, color: '#777', fontSize: 10 }]} numberOfLines={1}>
                                {isBatting ? 'not out' : (b.dismissal || b.status || 'DNB')}
                            </Text>
                            <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>{b.runs}</Text>
                            <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', color: '#555' }]}>{b.balls}</Text>
                            <Text style={[styles.tableDataText, { flex: 0.8, textAlign: 'center', color: '#666' }]}>{b.fours}</Text>
                            <Text style={[styles.tableDataText, { flex: 0.8, textAlign: 'center', color: '#666' }]}>{b.sixes}</Text>
                            <Text style={[styles.tableDataText, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>
                                {calculateSR(b.runs, b.balls)}
                            </Text>
                        </View>
                    );
                })
            ) : (
                <Text style={styles.emptyTableText}>No batsman stats recorded yet</Text>
            )}

            {/* Extras and Totals */}
            <View style={styles.extrasRow}>
                <Text style={styles.extrasLabel}>Extras</Text>
                <Text style={styles.extrasValue}>{getExtrasString(score)}</Text>
            </View>

            <View style={styles.totalsRow}>
                <View>
                    <Text style={styles.totalsLabel}>Total</Text>
                    <Text style={styles.totalsOvers}>{score?.overs || 0} Overs (CRR: {score?.overs > 0 ? (score.runs / score.overs).toFixed(2) : '0.00'})</Text>
                </View>
                <Text style={styles.totalsScore}>{score?.runs || 0}/{score?.wickets || 0}</Text>
            </View>

            {/* Bowling Section */}
            <View style={[styles.tableHeaderRow, { marginTop: 24 }]}>
                <Text style={[styles.tableColHeader, { flex: 4 }]}>Bowler</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>O</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>M</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>R</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>W</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>WD</Text>
                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'center' }]}>NB</Text>
                <Text style={[styles.tableColHeader, { flex: 1.5, textAlign: 'right' }]}>ECON</Text>
            </View>

            {bowlers && bowlers.length > 0 ? (
                bowlers.map((b: any, idx: number) => (
                    <View key={idx} style={styles.tableDataRow}>
                        <Text style={[styles.tableDataText, { flex: 4, fontWeight: '500' }]} numberOfLines={1}>{b.name}</Text>
                        <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center' }]}>{b.overs}</Text>
                        <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', color: '#555' }]}>{b.maidens}</Text>
                        <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', color: '#555' }]}>{b.runs}</Text>
                        <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#E31C25' }]}>{b.wickets}</Text>
                        <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', color: '#777' }]}>{b.wides || 0}</Text>
                        <Text style={[styles.tableDataText, { flex: 1, textAlign: 'center', color: '#777' }]}>{b.noballs || 0}</Text>
                        <Text style={[styles.tableDataText, { flex: 1.5, textAlign: 'right', fontWeight: '600' }]}>
                            {calculateEconomy(b.runs, b.overs)}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={styles.emptyTableText}>No bowler stats recorded yet</Text>
            )}
        </View>
    );
};

// StatBar Component
const StatBar = ({ title, valA, valB, teamA, teamB }: any) => {
    const numA = parseFloat(valA) || 0;
    const numB = parseFloat(valB) || 0;
    const total = numA + numB;
    const pctA = total > 0 ? (numA / total) * 100 : 50;
    const pctB = total > 0 ? (numB / total) * 100 : 50;

    return (
        <View style={styles.statBarContainer}>
            <Text style={styles.statBarTitle}>{title}</Text>
            <View style={styles.statBarValues}>
                <Text style={styles.statBarValText}>{teamA}: {valA}</Text>
                <Text style={styles.statBarValText}>{teamB}: {valB}</Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFillA, { width: `${pctA}%` }]} />
                <View style={[styles.progressBarFillB, { width: `${pctB}%` }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    loadingText: {
        marginTop: 10,
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    backBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#E31C25',
        borderRadius: 8,
    },
    backBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#E31C25',
        paddingVertical: 15,
        paddingHorizontal: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    headerBackBtn: {
        padding: 4,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 8,
    },
    headerLiveBtn: {
        padding: 4,
    },
    scroll: {
        flex: 1,
    },
    matchBanner: {
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    bannerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bannerSeries: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveBadge: {
        backgroundColor: '#FFF',
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
    },
    statusText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    teamsScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 16,
    },
    teamScoreCol: {
        flex: 1,
    },
    bannerTeamCode: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4,
    },
    bannerScore: {
        color: '#FFF',
        fontSize: 26,
        fontWeight: '900',
    },
    bannerOvers: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginTop: 2,
    },
    bannerVs: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 16,
        fontWeight: '900',
        fontStyle: 'italic',
        marginHorizontal: 16,
    },
    bannerFooter: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.15)',
        paddingTop: 12,
        gap: 4,
    },
    bannerToss: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '600',
    },
    bannerTarget: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    bannerStatusText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        fontStyle: 'italic',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EBEBEB',
        marginTop: 10,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#E31C25',
    },
    tabButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#888',
        letterSpacing: 0.5,
    },
    activeTabButtonText: {
        color: '#E31C25',
    },
    tabContent: {
        padding: 16,
    },
    inningsSelectorRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 4,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    inningsTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeInningsTab: {
        backgroundColor: 'rgba(227, 28, 37, 0.1)',
    },
    inningsTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
    },
    activeInningsTabText: {
        color: '#E31C25',
    },
    scorecardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        borderBottomWidth: 1.5,
        borderBottomColor: '#EEE',
        paddingBottom: 8,
        marginBottom: 6,
        paddingHorizontal: 8,
    },
    tableColHeader: {
        color: '#888',
        fontSize: 11,
        fontWeight: '700',
    },
    tableDataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
        paddingHorizontal: 8,
        borderRadius: 6,
    },
    highlightedRow: {
        backgroundColor: 'rgba(227, 28, 37, 0.04)',
    },
    tableDataText: {
        fontSize: 12,
        color: '#333',
    },
    emptyTableText: {
        color: '#999',
        fontSize: 12,
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 16,
    },
    extrasRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1.5,
        borderBottomColor: '#EEE',
    },
    extrasLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
    },
    extrasValue: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },
    totalsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        backgroundColor: '#FAF9F9',
        paddingHorizontal: 8,
        borderRadius: 8,
        marginTop: 10,
    },
    totalsLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: '#1A1A1A',
    },
    totalsOvers: {
        fontSize: 11,
        color: '#666',
        marginTop: 2,
    },
    totalsScore: {
        fontSize: 20,
        fontWeight: '900',
        color: '#E31C25',
    },
    cardHeader: {
        marginBottom: 16,
    },
    cardHeaderTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#222',
    },
    commRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 10,
        paddingHorizontal: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
    },
    commBoundaryRow: {
        backgroundColor: 'rgba(46, 125, 50, 0.04)',
        borderLeftWidth: 4,
        borderLeftColor: '#2E7D32',
    },
    commWicketRow: {
        backgroundColor: 'rgba(211, 47, 47, 0.04)',
        borderLeftWidth: 4,
        borderLeftColor: '#D32F2F',
    },
    commMeta: {
        alignItems: 'center',
        marginRight: 14,
        width: 38,
    },
    commOver: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        marginBottom: 4,
    },
    commBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#EEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    commWicketBadge: {
        backgroundColor: '#D32F2F',
    },
    commFourBadge: {
        backgroundColor: '#2E7D32',
    },
    commSixBadge: {
        backgroundColor: '#6A1B9A',
    },
    commDotBadge: {
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    commBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    commContent: {
        flex: 1,
    },
    commEvent: {
        fontSize: 13,
        fontWeight: '700',
        color: '#222',
        marginBottom: 2,
        textTransform: 'capitalize',
    },
    commDesc: {
        fontSize: 12,
        color: '#555',
        lineHeight: 16,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        color: '#999',
    },
    squadsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    squadCol: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    squadTeamTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#222',
        marginBottom: 12,
        borderBottomWidth: 1.5,
        borderBottomColor: '#EEE',
        paddingBottom: 6,
    },
    squadPlayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    squadPlayerNumBg: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    squadPlayerNum: {
        fontSize: 11,
        fontWeight: '700',
        color: '#666',
    },
    squadPlayerInfo: {
        flex: 1,
    },
    squadPlayerName: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    squadPlayerRole: {
        fontSize: 10,
        color: '#888',
        marginTop: 1,
    },
    emptySquadText: {
        fontSize: 11,
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 20,
    },
    statBarContainer: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
    },
    statBarTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666',
        marginBottom: 6,
    },
    statBarValues: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statBarValText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#222',
    },
    progressBarBg: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EEE',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    progressBarFillA: {
        height: '100%',
        backgroundColor: '#E31C25',
    },
    progressBarFillB: {
        height: '100%',
        backgroundColor: '#4A90E2',
    },
});
