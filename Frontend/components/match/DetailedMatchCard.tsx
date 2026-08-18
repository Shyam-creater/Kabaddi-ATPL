import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, withSequence } from 'react-native-reanimated';

interface Team {
    name: string;
    code: string;
    logo?: string;
}

interface Score {
    runs?: number;
    wickets?: number;
    overs?: number;
    extras?: number;
    wides?: number;
    noballs?: number;
    byes?: number;
    legbyes?: number;
}

interface Batter {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isStriker: boolean;
}

interface Bowler {
    name: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    wides: number;
    noballs: number;
}

interface CommentaryItem {
    over: number;
    ball: number;
    runs: number;
    event: string;
    description: string;
}

interface Match {
    _id: string;
    title: string;
    series: string;
    venue?: string;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
    sport?: string;
    teamA: Team;
    teamB: Team;
    scoreA: number | Score;
    scoreB: number | Score;
    target?: number;
    tossWinner?: string;
    tossDecision?: string;
    oversLimit?: number;
    currentBatters?: Batter[];
    currentBowler?: Bowler;
    commentary?: CommentaryItem[];
    statusText?: string;
    winner?: string;
}

interface DetailedMatchCardProps {
    match: Match;
    onPress: () => void;
}

const DetailedMatchCard: React.FC<DetailedMatchCardProps> = ({ match, onPress }) => {
    const isLive = match.status === 'LIVE';
    const isCricket = match.sport === 'cricket' || !match.sport;
    const opacity = useSharedValue(0.4);

    useEffect(() => {
        if (isLive) {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0.4, { duration: 800 })
                ),
                -1, true
            );
        } else {
            opacity.value = 1;
        }
    }, [isLive]);

    const liveDotStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const formatScore = (score: any) => {
        if (score === null || score === undefined) return '0/0';
        if (typeof score === 'object') {
            const runs = score.runs ?? 0;
            const wickets = score.wickets ?? 0;
            return `${runs}/${wickets}`;
        }
        return String(score);
    };

    const formatOvers = (score: any) => {
        if (typeof score === 'object' && score.overs !== undefined && score.overs !== null) {
            return `${score.overs} ov`;
        }
        return '';
    };

    const calculateSR = (runs: number, balls: number) => {
        if (balls === 0) return '0.0';
        return ((runs / balls) * 100).toFixed(1);
    };

    const calculateEconomy = (runs: number, overs: number) => {
        if (!overs || overs === 0) return '0.0';
        // Check if overs is represented as standard cricket decimal (e.g. 3.2 means 3 overs and 2 balls = 20 balls)
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

    // Extract recent 6 balls from commentary
    const getRecentBalls = () => {
        if (!match.commentary || match.commentary.length === 0) return [];
        const sorted = [...match.commentary].sort((a, b) => {
            if (a.over !== b.over) return b.over - a.over;
            return b.ball - a.ball;
        });
        return sorted.slice(0, 6).reverse();
    };

    const getBallStyle = (event: string, runs: number) => {
        const ev = event?.toLowerCase() || '';
        if (ev.includes('wicket')) return [styles.ballBadge, styles.ballWicket];
        if (ev.includes('wide') || ev.includes('no-ball') || ev.includes('noball')) return [styles.ballBadge, styles.ballExtra];
        if (runs === 4) return [styles.ballBadge, styles.ballFour];
        if (runs === 6) return [styles.ballBadge, styles.ballSix];
        if (runs === 0) return [styles.ballBadge, styles.ballDot];
        return [styles.ballBadge, styles.ballNormal];
    };

    const getBallText = (event: string, runs: number) => {
        const ev = event?.toLowerCase() || '';
        if (ev.includes('wicket')) return 'W';
        if (ev.includes('wide')) return 'wd';
        if (ev.includes('no-ball') || ev.includes('noball')) return 'nb';
        return String(runs);
    };

    const getBallTextColor = (event: string, runs: number) => {
        const ev = event?.toLowerCase() || '';
        if (ev.includes('wicket') || runs === 4 || runs === 6) return '#FFF';
        if (ev.includes('wide') || ev.includes('no-ball') || ev.includes('noball')) return '#E65100';
        if (runs === 0) return '#999';
        return '#333';
    };

    const recentBalls = getRecentBalls();

    return (
        <TouchableOpacity activeOpacity={0.95} onPress={onPress} style={styles.cardContainer}>
            <LinearGradient
                colors={['#1e1e2f', '#12121e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header Row */}
                <View style={styles.header}>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, !isLive && styles.upcomingBadge, match.status === 'COMPLETED' && styles.completedBadge]}>
                            {isLive && <Animated.View style={[styles.liveDot, liveDotStyle]} />}
                            <Text style={styles.statusText}>{match.status}</Text>
                        </View>
                        {isLive && isCricket && (
                            <View style={styles.liveTagBadge}>
                                <Text style={styles.liveTagText}>CRICKET</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.seriesName} numberOfLines={1}>{match.series}</Text>
                </View>

                {/* Scoreboard Info */}
                <View style={styles.scoreboard}>
                    <View style={styles.teamRow}>
                        <View style={styles.teamInfo}>
                            <View style={styles.teamIconBg}>
                                <Text style={styles.teamInitial}>{match.teamA.code[0]}</Text>
                            </View>
                            <Text style={styles.teamCode} numberOfLines={1}>{match.teamA.name}</Text>
                        </View>
                        <View style={styles.scoreInfo}>
                            <Text style={styles.scoreText}>{formatScore(match.scoreA)}</Text>
                            <Text style={styles.oversText}>{formatOvers(match.scoreA)}</Text>
                        </View>
                    </View>

                    <View style={styles.teamRow}>
                        <View style={styles.teamInfo}>
                            <View style={styles.teamIconBg}>
                                <Text style={styles.teamInitial}>{match.teamB.code[0]}</Text>
                            </View>
                            <Text style={styles.teamCode} numberOfLines={1}>{match.teamB.name}</Text>
                        </View>
                        <View style={styles.scoreInfo}>
                            <Text style={styles.scoreText}>{formatScore(match.scoreB)}</Text>
                            <Text style={styles.oversText}>{formatOvers(match.scoreB)}</Text>
                        </View>
                    </View>
                </View>

                {/* Toss & Target Banner */}
                {!!(match.tossWinner || match.target || match.statusText) && (
                    <View style={styles.metaBanner}>
                        <View style={styles.metaRow}>
                            {!!match.tossWinner && (
                                <Text style={styles.metaText} numberOfLines={1}>
                                    <Ionicons name="ribbon-outline" size={12} color="#FFD700" />{' '}
                                    Toss: {match.tossWinner} elected to {match.tossDecision}
                                </Text>
                            )}
                            {!!match.target && (
                                <Text style={styles.targetText}>
                                    Target: <Text style={styles.targetHighlight}>{match.target}</Text>
                                </Text>
                            )}
                        </View>
                        {match.statusText ? (
                            <Text style={styles.statusDetails} numberOfLines={1}>
                                {match.statusText}
                            </Text>
                        ) : null}
                    </View>
                )}

                {/* Live Match Details (Batsmen & Bowler) */}
                {isLive && isCricket && (
                    <View style={styles.liveDetailsContainer}>
                        {/* Batting Section */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Batting</Text>
                            <View style={styles.battingStatsHeaders}>
                                <Text style={[styles.statHeader, { width: 35 }]}>R</Text>
                                <Text style={[styles.statHeader, { width: 30 }]}>B</Text>
                                <Text style={[styles.statHeader, { width: 25 }]}>4s</Text>
                                <Text style={[styles.statHeader, { width: 25 }]}>6s</Text>
                                <Text style={[styles.statHeader, { width: 45, textAlign: 'right' }]}>SR</Text>
                            </View>
                        </View>

                        {match.currentBatters && match.currentBatters.length > 0 ? (
                            match.currentBatters.map((batter, idx) => (
                                <View key={idx} style={[styles.playerRow, batter.isStriker && styles.strikerRow]}>
                                    <View style={styles.playerNameContainer}>
                                        {batter.isStriker && (
                                            <MaterialCommunityIcons name="cricket" size={14} color="#E31C25" style={{ marginRight: 4 }} />
                                        )}
                                        <Text style={[styles.playerName, batter.isStriker && styles.strikerNameText]} numberOfLines={1}>
                                            {batter.name}{batter.isStriker ? '*' : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.playerStats}>
                                        <Text style={[styles.playerStatVal, { width: 35, fontWeight: '700' }]}>{batter.runs}</Text>
                                        <Text style={[styles.playerStatVal, { width: 30, color: '#aaa' }]}>{batter.balls}</Text>
                                        <Text style={[styles.playerStatVal, { width: 25, color: '#888' }]}>{batter.fours}</Text>
                                        <Text style={[styles.playerStatVal, { width: 25, color: '#888' }]}>{batter.sixes}</Text>
                                        <Text style={[styles.playerStatVal, { width: 45, textAlign: 'right', fontWeight: '600' }]}>
                                            {calculateSR(batter.runs, batter.balls)}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noPlayersText}>Active batsmen details not set</Text>
                        )}

                        {/* Bowling Section */}
                        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                            <Text style={styles.sectionTitle}>Bowling</Text>
                            <View style={styles.bowlingStatsHeaders}>
                                <Text style={[styles.statHeader, { width: 35 }]}>O</Text>
                                <Text style={[styles.statHeader, { width: 30 }]}>M</Text>
                                <Text style={[styles.statHeader, { width: 30 }]}>R</Text>
                                <Text style={[styles.statHeader, { width: 30 }]}>W</Text>
                                <Text style={[styles.statHeader, { width: 45, textAlign: 'right' }]}>ECON</Text>
                            </View>
                        </View>

                        {match.currentBowler && match.currentBowler.name ? (
                            <View style={styles.playerRow}>
                                <Text style={styles.playerName} numberOfLines={1}>
                                    {match.currentBowler.name}
                                </Text>
                                <View style={styles.playerStats}>
                                    <Text style={[styles.playerStatVal, { width: 35 }]}>{match.currentBowler.overs}</Text>
                                    <Text style={[styles.playerStatVal, { width: 30, color: '#aaa' }]}>{match.currentBowler.maidens}</Text>
                                    <Text style={[styles.playerStatVal, { width: 30, color: '#aaa' }]}>{match.currentBowler.runs}</Text>
                                    <Text style={[styles.playerStatVal, { width: 30, fontWeight: '700', color: '#E31C25' }]}>{match.currentBowler.wickets}</Text>
                                    <Text style={[styles.playerStatVal, { width: 45, textAlign: 'right', fontWeight: '600' }]}>
                                        {calculateEconomy(match.currentBowler.runs, match.currentBowler.overs)}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <Text style={styles.noPlayersText}>Active bowler details not set</Text>
                        )}

                        {/* Recent Balls Tracker */}
                        <View style={styles.recentBallsRow}>
                            <Text style={styles.recentBallsTitle}>Recent Over</Text>
                            <View style={styles.recentBallsList}>
                                {recentBalls.length > 0 ? (
                                    recentBalls.map((ball, idx) => (
                                        <View key={idx} style={getBallStyle(ball.event, ball.runs)}>
                                            <Text style={[styles.ballText, { color: getBallTextColor(ball.event, ball.runs) }]}>
                                                {getBallText(ball.event, ball.runs)}
                                            </Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.noRecentBallsText}>Waiting for first ball...</Text>
                                )}
                            </View>
                        </View>
                    </View>
                )}

                {/* Click to View details */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Click to view full details</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFF" style={styles.footerIcon} />
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        borderRadius: 18,
        overflow: 'hidden',
        marginVertical: 10,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    gradient: {
        padding: 18,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 10,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E31C25',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    upcomingBadge: {
        backgroundColor: '#FF9800',
    },
    completedBadge: {
        backgroundColor: '#6366F1',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFF',
        marginRight: 4,
    },
    statusText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    liveTagBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
    },
    liveTagText: {
        color: '#ccc',
        fontSize: 8,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    seriesName: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: 11,
        fontWeight: '600',
        maxWidth: '60%',
    },
    scoreboard: {
        marginVertical: 12,
        gap: 10,
    },
    teamRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    teamInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    teamIconBg: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    teamInitial: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 13,
    },
    teamCode: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    scoreInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
    },
    scoreText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    oversText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
    },
    metaBanner: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    metaText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        fontWeight: '500',
        flex: 1,
    },
    targetText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '600',
    },
    targetHighlight: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    statusDetails: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
        fontStyle: 'italic',
    },
    liveDetailsContainer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        paddingTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    battingStatsHeaders: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bowlingStatsHeaders: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statHeader: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    playerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        paddingHorizontal: 4,
        borderRadius: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    },
    strikerRow: {
        backgroundColor: 'rgba(227, 28, 37, 0.08)',
    },
    playerNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    playerName: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    strikerNameText: {
        color: '#FFF',
        fontWeight: '700',
    },
    playerStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerStatVal: {
        color: '#FFF',
        fontSize: 11,
        textAlign: 'center',
    },
    noPlayersText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
        fontStyle: 'italic',
        marginVertical: 4,
    },
    recentBallsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.06)',
    },
    recentBallsTitle: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 11,
        fontWeight: '600',
    },
    recentBallsList: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    ballBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ballWicket: {
        backgroundColor: '#D32F2F',
    },
    ballExtra: {
        backgroundColor: '#FFE0B2',
    },
    ballFour: {
        backgroundColor: '#2E7D32',
    },
    ballSix: {
        backgroundColor: '#6A1B9A',
    },
    ballDot: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    ballNormal: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    ballText: {
        fontSize: 9,
        fontWeight: '800',
    },
    noRecentBallsText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
        gap: 4,
    },
    footerText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    footerIcon: {
        marginLeft: 2,
    },
});

export default DetailedMatchCard;
