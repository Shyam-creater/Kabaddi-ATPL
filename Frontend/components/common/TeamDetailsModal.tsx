import React from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

const { width } = Dimensions.get('window');

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

interface TeamDetailsModalProps {
    visible: boolean;
    team: Team | null;
    onClose: () => void;
}

export default function TeamDetailsModal({ visible, team, onClose }: TeamDetailsModalProps) {
    if (!visible || !team) return null;

    const sportColorMap = {
        cricket: '#10b981', // Green
        football: '#E31C25', // Red
        kabaddi: '#3b82f6',  // Blue
    };

    const sportColor = sportColorMap[team.sport] || '#E31C25';

    // Helper for rendering sport name and icon badge
    const renderSportBadge = () => {
        let iconName: any = 'trophy-outline';
        if (team.sport === 'cricket') iconName = 'cricket';
        else if (team.sport === 'football') iconName = 'soccer';
        else if (team.sport === 'kabaddi') iconName = 'human-handsup';

        return (
            <View style={[styles.sportBadge, { backgroundColor: `${sportColor}15`, borderColor: sportColor }]}>
                <MaterialCommunityIcons name={iconName} size={14} color={sportColor} />
                <Text style={[styles.sportBadgeText, { color: sportColor }]}>
                    {team.sport.toUpperCase()}
                </Text>
            </View>
        );
    };

    // Helper for rendering sport-specific metrics
    const renderSportSpecificStat = () => {
        if (team.sport === 'cricket') {
            const nrrVal = team.nrr || 0;
            const nrrStr = nrrVal > 0 ? `+${nrrVal.toFixed(3)}` : nrrVal.toFixed(3);
            return (
                <View style={styles.specificStatBox}>
                    <Text style={styles.specificStatLabel}>Net Run Rate (NRR)</Text>
                    <Text style={[styles.specificStatValue, nrrVal > 0 ? styles.positiveText : nrrVal < 0 ? styles.negativeText : null]}>
                        {nrrStr}
                    </Text>
                </View>
            );
        } else if (team.sport === 'football') {
            const gd = team.goalDifference !== undefined ? team.goalDifference : ((team.goalsFor || 0) - (team.goalsAgainst || 0));
            const gdStr = gd > 0 ? `+${gd}` : String(gd);
            return (
                <View style={styles.specificStatsContainer}>
                    <View style={styles.specificStatBox}>
                        <Text style={styles.specificStatLabel}>Goals For / Against</Text>
                        <Text style={styles.specificStatValue}>
                            {team.goalsFor || 0} : {team.goalsAgainst || 0}
                        </Text>
                    </View>
                    <View style={styles.specificStatBox}>
                        <Text style={styles.specificStatLabel}>Goal Difference (GD)</Text>
                        <Text style={[styles.specificStatValue, gd > 0 ? styles.positiveText : gd < 0 ? styles.negativeText : null]}>
                            {gdStr}
                        </Text>
                    </View>
                </View>
            );
        } else if (team.sport === 'kabaddi') {
            const sd = team.scoreDiff || 0;
            const sdStr = sd > 0 ? `+${sd}` : String(sd);
            return (
                <View style={styles.specificStatBox}>
                    <Text style={styles.specificStatLabel}>Score Difference (SD)</Text>
                    <Text style={[styles.specificStatValue, sd > 0 ? styles.positiveText : sd < 0 ? styles.negativeText : null]}>
                        {sdStr}
                    </Text>
                </View>
            );
        }
        return null;
    };

    const playersList = team.players || [];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.modalContent}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Header Banner */}
                        <LinearGradient
                            colors={['#E31C25', '#900C12']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.headerBackground}
                        >
                            <TouchableOpacity style={styles.backButton} onPress={onClose}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </LinearGradient>

                        {/* Logo overlay */}
                        <View style={styles.logoContainer}>
                            {team.logo && team.logo !== 'https://via.placeholder.com/150' ? (
                                <Image source={{ uri: team.logo }} style={styles.logo} resizeMode="contain" />
                            ) : (
                                <View style={[styles.logo, styles.placeholderLogo, { backgroundColor: sportColor }]}>
                                    <Text style={styles.placeholderLogoText}>{team.code ? team.code[0] : 'T'}</Text>
                                </View>
                            )}
                            <View style={styles.codeBadge}>
                                <Text style={styles.codeText}>{team.code}</Text>
                            </View>
                        </View>

                        {/* Team Basic Details */}
                        <View style={styles.teamDetailsContainer}>
                            <Text style={styles.teamName}>{team.name}</Text>
                            
                            <View style={styles.metaRow}>
                                {renderSportBadge()}
                                {team.city ? (
                                    <View style={styles.metaItem}>
                                        <Ionicons name="location-outline" size={14} color="#666" />
                                        <Text style={styles.metaText}>{team.city}</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.staffContainer}>
                                <View style={styles.staffBox}>
                                    <Text style={styles.staffLabel}>CAPTAIN</Text>
                                    <Text style={styles.staffValue} numberOfLines={1}>{team.captain || 'TBA'}</Text>
                                </View>
                                <View style={styles.staffBox}>
                                    <Text style={styles.staffLabel}>HEAD COACH</Text>
                                    <Text style={styles.staffValue} numberOfLines={1}>{team.coach || 'TBA'}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Statistics Grid */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.9, translateY: 15 }}
                            animate={{ opacity: 1, scale: 1, translateY: 0 }}
                            transition={{ type: 'spring', delay: 100 }}
                        >
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Season Standings</Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{team.matchesPlayed || 0}</Text>
                                    <Text style={styles.statLabel}>Played</Text>
                                </View>
                                <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#f0f0f0' }]}>
                                    <Text style={[styles.statValue, { color: '#10b981' }]}>{team.won || 0}</Text>
                                    <Text style={styles.statLabel}>Won</Text>
                                </View>
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, { color: '#ef4444' }]}>{team.lost || 0}</Text>
                                    <Text style={styles.statLabel}>Lost</Text>
                                </View>
                                <View style={[styles.statBox, { borderLeftWidth: 1, borderColor: '#f0f0f0' }]}>
                                    <Text style={styles.statValue}>{team.draw || 0}</Text>
                                    <Text style={styles.statLabel}>Draws</Text>
                                </View>
                                <LinearGradient
                                    colors={['#FEF2F2', '#FFF5F5']}
                                    style={[styles.statBox, styles.pointsBox]}
                                >
                                    <Text style={[styles.statValue, { color: '#E31C25', fontWeight: '900' }]}>{team.points || 0}</Text>
                                    <Text style={[styles.statLabel, { color: '#E31C25', fontWeight: '700' }]}>Points</Text>
                                </LinearGradient>
                            </View>
                        </MotiView>

                        {/* Sport Specific Metrics */}
                        {renderSportSpecificStat()}

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Squad Roster */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Squad Roster</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{playersList.length} Players</Text>
                            </View>
                        </View>

                        {playersList.length > 0 ? (
                            <View style={styles.rosterContainer}>
                                {playersList.map((player, idx) => {
                                    const isPlayerCaptain = player.isCaptain || false;
                                    const jNum = player.jerseyNumber !== undefined ? player.jerseyNumber : player.number;
                                    const playerRole = player.role || player.position || 'Squad Member';

                                    return (
                                        <MotiView
                                            key={idx}
                                            from={{ opacity: 0, scale: 0.8, translateX: -20 }}
                                            animate={{ opacity: 1, scale: 1, translateX: 0 }}
                                            transition={{
                                                type: 'spring',
                                                damping: 15,
                                                stiffness: 120,
                                                delay: idx * 45,
                                            }}
                                        >
                                            <View style={styles.playerCard}>
                                                {player.image ? (
                                                    <Image source={{ uri: player.image }} style={styles.playerAvatar} />
                                                ) : (
                                                    <View style={styles.playerAvatarPlaceholder}>
                                                        <Ionicons name="person" size={20} color="#9CA3AF" />
                                                    </View>
                                                )}

                                                <View style={styles.playerInfo}>
                                                    <View style={styles.playerNameRow}>
                                                        <Text style={styles.playerName}>{player.name}</Text>
                                                        {isPlayerCaptain && (
                                                            <View style={styles.captainBadge}>
                                                                <Ionicons name="ribbon" size={10} color="#fff" style={{ marginRight: 2 }} />
                                                                <Text style={styles.captainBadgeText}>C</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                    <Text style={styles.playerRole}>{playerRole}</Text>
                                                </View>

                                                {jNum !== undefined && jNum !== null ? (
                                                    <View style={styles.jerseyBadge}>
                                                        <Text style={styles.jerseyText}>#{jNum}</Text>
                                                    </View>
                                                ) : null}
                                            </View>
                                        </MotiView>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptySquadContainer}>
                                <Ionicons name="people-outline" size={36} color="#aaa" />
                                <Text style={styles.emptySquadText}>No squad members registered</Text>
                            </View>
                        )}

                        {/* Close button at bottom */}
                        <TouchableOpacity style={styles.bottomCloseButton} onPress={onClose}>
                            <Text style={styles.bottomCloseButtonText}>Close Squad View</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: '88%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerBackground: {
        height: 120,
        width: '100%',
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: -60,
        position: 'relative',
        zIndex: 2,
    },
    logo: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
    },
    placeholderLogo: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderLogoText: {
        fontSize: 44,
        fontWeight: '900',
        color: '#fff',
    },
    codeBadge: {
        position: 'absolute',
        bottom: -5,
        backgroundColor: '#111827',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    codeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    teamDetailsContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    teamName: {
        fontSize: 22,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 10,
    },
    sportBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    sportBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    staffContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    staffBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
    },
    staffLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
        marginBottom: 4,
    },
    staffValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
    },
    divider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 24,
        marginVertical: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1e293b',
    },
    countBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    countText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748b',
    },
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
    },
    pointsBox: {
        flex: 1.2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#334155',
    },
    statLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    specificStatsContainer: {
        flexDirection: 'row',
        marginHorizontal: 24,
        gap: 12,
        marginTop: 12,
    },
    specificStatBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        alignItems: 'center',
        marginHorizontal: 24,
        marginTop: 12,
    },
    specificStatLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 4,
    },
    specificStatValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e293b',
    },
    positiveText: {
        color: '#10b981',
    },
    negativeText: {
        color: '#ef4444',
    },
    rosterContainer: {
        paddingHorizontal: 24,
        gap: 10,
    },
    playerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    playerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
    },
    playerAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    playerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    playerName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    captainBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fbbf24',
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 6,
    },
    captainBadgeText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#fff',
    },
    playerRole: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
        marginTop: 2,
    },
    jerseyBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    jerseyText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },
    emptySquadContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptySquadText: {
        fontSize: 13,
        color: '#94a3b8',
        fontWeight: '500',
    },
    bottomCloseButton: {
        marginHorizontal: 24,
        marginTop: 24,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E31C25',
    },
    bottomCloseButtonText: {
        color: '#E31C25',
        fontWeight: '700',
        fontSize: 14,
    },
});
