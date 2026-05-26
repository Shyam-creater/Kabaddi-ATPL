import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import VideoPlayerModal from '../common/VideoPlayerModal';

interface LiveMatchCardProps {
    match: any;
    onPress: () => void;
}

const LiveMatchCard: React.FC<LiveMatchCardProps> = ({ match, onPress }) => {
    const opacity = useSharedValue(0.4);
    const [videoVisible, setVideoVisible] = useState(false);

    useEffect(() => {
        if (match.status === 'LIVE') {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(0.4, { duration: 800 })
                ),
                -1, true
            );
        }
    }, [match.status]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    const formatScoreDisplay = (score: any) => {
        if (score === null || score === undefined) return '-';
        if (typeof score === 'object') {
            const runs = score.runs ?? score.score ?? null;
            const wickets = score.wickets ?? null;
            if (runs !== null || wickets !== null) {
                return `${runs ?? 0}/${wickets ?? 0}`;
            }
            return String(score);
        }
        return String(score);
    };

    const formatOversDisplay = (score: any) => {
        if (typeof score === 'object' && score.overs !== undefined && score.overs !== null) {
            return `(${score.overs})`;
        }
        return '';
    };

    // Determine which video URL to show based on status
    const getVideoInfo = () => {
        if (match.status === 'LIVE') {
            // Prioritize Specific Stream Fields
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
        <>
            {/* ── Video Player ── */}
            {videoInfo && (
                <VideoPlayerModal
                    visible={videoVisible}
                    url={videoInfo.url}
                    title={`${match.teamA?.code} vs ${match.teamB?.code}`}
                    subtitle={`${match.series} · ${match.venue || ''}`}
                    type={videoInfo.type}
                    onClose={() => setVideoVisible(false)}
                />
            )}

            <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.cardContainer}>
                <ImageBackground
                    source={{ uri: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80' }}
                    style={styles.backgroundImage}
                    imageStyle={{ borderRadius: 16 }}
                >
                    <LinearGradient
                        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
                        style={styles.gradientOverlay}
                    >
                        {/* Header */}
                        <View style={styles.headerRow}>
                            <View style={styles.badgeRow}>
                                <View style={[styles.statusBadge, match.status === 'UPCOMING' && styles.upcomingBadge, match.status === 'COMPLETED' && styles.completedBadge]}>
                                    {match.status === 'LIVE' ? (
                                        <Animated.View style={[styles.pulsingDot, animatedStyle]} />
                                    ) : (
                                        <Ionicons
                                            name={match.status === 'UPCOMING' ? 'calendar-outline' : 'checkmark-circle-outline'}
                                            size={10} color="#fff"
                                            style={{ marginRight: 4 }}
                                        />
                                    )}
                                    <Text style={styles.statusText}>{match.status}</Text>
                                </View>
                                {match.sport && (
                                    <View style={styles.sportBadge}>
                                        <MaterialCommunityIcons 
                                            name={match.sport === 'cricket' ? 'cricket' : match.sport === 'football' ? 'soccer' : 'shield-half-full'} 
                                            size={10} 
                                            color="#FFD700" 
                                            style={{ marginRight: 2 }} 
                                        />
                                        <Text style={styles.sportText}>{match.sport.toUpperCase()}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.seriesText}>{match.series}</Text>
                        </View>

                        {/* Title & Details Info */}
                        <View style={styles.detailsRow}>
                            <Text style={styles.matchTitleText} numberOfLines={1}>{match.title || 'League Match'}</Text>
                            <View style={styles.subDetailInfo}>
                                {match.date && (match.status === 'COMPLETED' || match.status === 'UPCOMING') && (
                                    <Text style={styles.dateText}>
                                        <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" /> {new Date(match.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </Text>
                                )}
                                {match.venue && (
                                    <Text style={styles.venueText} numberOfLines={1}>
                                        <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.7)" /> {match.venue}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Scoreboard */}
                        <View style={styles.scoreBoard}>
                            <View style={styles.teamContainer}>
                                <Text style={styles.teamCode}>{match.teamA?.code}</Text>
                                <Text style={styles.scoreMain}>{formatScoreDisplay(match.scoreA)}</Text>
                                <Text style={styles.scoreSub}>{formatOversDisplay(match.scoreA)}</Text>
                            </View>

                            <Text style={styles.vsText}>VS</Text>

                            <View style={[styles.teamContainer, { alignItems: 'flex-end' }]}> 
                                <Text style={styles.teamCode}>{match.teamB?.code}</Text>
                                <Text style={styles.scoreMain}>{formatScoreDisplay(match.scoreB)}</Text>
                                <Text style={styles.scoreSub}>{formatOversDisplay(match.scoreB)}</Text>
                            </View>
                        </View>
                        {/* Footer: Status + Video Button Row */}
                        <View style={styles.footerRow}>
                            <Text style={styles.matchStatusText} numberOfLines={1}>
                                {match.statusText || (match.status === 'UPCOMING' ? 'Match starts soon' : match.status === 'COMPLETED' ? 'Match finished' : 'Match in progress')}
                            </Text>
                            {videoInfo && (
                                <TouchableOpacity
                                    style={styles.watchBtn}
                                    onPress={() => setVideoVisible(true)}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons name="play-circle" size={13} color="#fff" style={{ marginRight: 4 }} />
                                    <Text style={styles.watchBtnText}>{videoInfo.label}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                    </LinearGradient>
                </ImageBackground>
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
        backgroundColor: '#000',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E31C25',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    upcomingBadge: {
        backgroundColor: '#FF9800',
    },
    completedBadge: {
        backgroundColor: '#6366F1',
    },
    pulsingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#fff',
        marginRight: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    seriesText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 11,
        fontWeight: '600',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
    scoreBoard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    teamContainer: {
        flex: 1,
    },
    teamCode: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    scoreMain: {
        color: '#fff',
        fontSize: 22,
        fontWeight: '800',
    },
    scoreSub: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 11,
        marginTop: 2,
    },
    vsText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
        fontWeight: '900',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    matchStatusText: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '600',
        flex: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    watchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.35)',
    },
    watchBtnText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sportBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    sportText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingBottom: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    matchTitleText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    subDetailInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '500',
    },
    venueText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        fontWeight: '500',
        maxWidth: 120,
    },
});

export default LiveMatchCard;
