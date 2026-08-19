import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import AppHeader from '../components/common/AppHeader';

const SPORTS = [
    { id: 'kabaddi', name: 'Kabaddi', icon: 'human-handsup' }
];

export default function PointsTableScreen() {
    const [selectedSport, setSelectedSport] = useState<'cricket' | 'football' | 'kabaddi'>('kabaddi');
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStandings = async (sport = selectedSport) => {
        try {
            setLoading(true);
            const res = await api.get('/teams', { params: { sport } });
            
            // Dynamic tie-breaker sorting based on sport rules
            const sorted = res.data.sort((a: any, b: any) => {
                if (b.points !== a.points) return b.points - a.points;
                if (sport === 'cricket') {
                    return (b.nrr || 0) - (a.nrr || 0);
                } else if (sport === 'football') {
                    const gdA = (a.goalDifference !== undefined) ? a.goalDifference : ((a.goalsFor || 0) - (a.goalsAgainst || 0));
                    const gdB = (b.goalDifference !== undefined) ? b.goalDifference : ((b.goalsFor || 0) - (b.goalsAgainst || 0));
                    if (gdB !== gdA) return gdB - gdA;
                    return (b.goalsFor || 0) - (a.goalsFor || 0);
                } else if (sport === 'kabaddi') {
                    return (b.scoreDiff || 0) - (a.scoreDiff || 0);
                }
                return 0;
            });
            setTeams(sorted);
        } catch (error) {
            console.error('Error fetching standings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStandings(selectedSport);
    }, [selectedSport]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchStandings(selectedSport);
        setRefreshing(false);
    };

    const renderHeader = () => {
        if (selectedSport === 'football') {
            return (
                <View style={styles.rowHeader}>
                    <Text style={[styles.cellHeader, styles.posCell]}>#</Text>
                    <Text style={[styles.cellHeader, styles.teamCell]}>Team</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>P</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>W</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>D</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>L</Text>
                    <Text style={[styles.cellHeader, styles.nrrCell]}>GD</Text>
                    <Text style={[styles.cellHeader, styles.ptsCell]}>Pts</Text>
                </View>
            );
        } else if (selectedSport === 'kabaddi') {
            return (
                <View style={styles.rowHeader}>
                    <Text style={[styles.cellHeader, styles.posCell]}>#</Text>
                    <Text style={[styles.cellHeader, styles.teamCell]}>Team</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>P</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>W</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>L</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>D</Text>
                    <Text style={[styles.cellHeader, styles.nrrCell]}>SD</Text>
                    <Text style={[styles.cellHeader, styles.ptsCell]}>Pts</Text>
                </View>
            );
        } else {
            return (
                <View style={styles.rowHeader}>
                    <Text style={[styles.cellHeader, styles.posCell]}>#</Text>
                    <Text style={[styles.cellHeader, styles.teamCell]}>Team</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>P</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>W</Text>
                    <Text style={[styles.cellHeader, styles.statCell]}>L</Text>
                    <Text style={[styles.cellHeader, styles.nrrCell]}>NRR</Text>
                    <Text style={[styles.cellHeader, styles.ptsCell]}>Pts</Text>
                </View>
            );
        }
    };

    const renderRow = (team: any, index: number) => {
        const isQualified = index < 4;
        
        if (selectedSport === 'football') {
            const gd = (team.goalDifference !== undefined) ? team.goalDifference : ((team.goalsFor || 0) - (team.goalsAgainst || 0));
            const gdStr = gd > 0 ? `+${gd}` : String(gd);
            
            return (
                <View key={team._id} style={[styles.row, isQualified && styles.qualifiedRow]}>
                    <Text style={[styles.cell, styles.posCell, index < 3 && styles.topThreePos]}>{index + 1}</Text>
                    <View style={[styles.teamCell, styles.teamFlex]}>
                        {team.logo && team.logo !== 'https://via.placeholder.com/150' ? (
                            <Image source={{ uri: team.logo }} style={styles.logo} />
                        ) : (
                            <View style={[styles.logoFallback, { backgroundColor: '#E31C25' }]}>
                                <Text style={styles.logoFallbackText}>{team.code[0]}</Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.teamCode} numberOfLines={1}>{team.code}</Text>
                            <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cell, styles.statCell]}>{team.matchesPlayed}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.won}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.draw || 0}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.lost}</Text>
                    <Text style={[styles.cell, styles.nrrCell, gd > 0 ? styles.positiveStat : gd < 0 ? styles.negativeStat : null]}>{gdStr}</Text>
                    <Text style={[styles.cell, styles.ptsCell]}>{team.points}</Text>

                    {isQualified && <View style={styles.qualifiedIndicator} />}
                </View>
            );
        } else if (selectedSport === 'kabaddi') {
            const sd = team.scoreDiff || 0;
            const sdStr = sd > 0 ? `+${sd}` : String(sd);

            return (
                <View key={team._id} style={[styles.row, isQualified && styles.qualifiedRow]}>
                    <Text style={[styles.cell, styles.posCell, index < 3 && styles.topThreePos]}>{index + 1}</Text>
                    <View style={[styles.teamCell, styles.teamFlex]}>
                        {team.logo && team.logo !== 'https://via.placeholder.com/150' ? (
                            <Image source={{ uri: team.logo }} style={styles.logo} />
                        ) : (
                            <View style={[styles.logoFallback, { backgroundColor: '#3b82f6' }]}>
                                <Text style={styles.logoFallbackText}>{team.code[0]}</Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.teamCode} numberOfLines={1}>{team.code}</Text>
                            <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cell, styles.statCell]}>{team.matchesPlayed}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.won}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.lost}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.draw || 0}</Text>
                    <Text style={[styles.cell, styles.nrrCell, sd > 0 ? styles.positiveStat : sd < 0 ? styles.negativeStat : null]}>{sdStr}</Text>
                    <Text style={[styles.cell, styles.ptsCell]}>{team.points}</Text>

                    {isQualified && <View style={styles.qualifiedIndicator} />}
                </View>
            );
        } else {
            const nrr = team.nrr || 0;
            const nrrStr = nrr > 0 ? `+${nrr.toFixed(3)}` : nrr.toFixed(3);

            return (
                <View key={team._id} style={[styles.row, isQualified && styles.qualifiedRow]}>
                    <Text style={[styles.cell, styles.posCell, index < 3 && styles.topThreePos]}>{index + 1}</Text>
                    <View style={[styles.teamCell, styles.teamFlex]}>
                        {team.logo && team.logo !== 'https://via.placeholder.com/150' ? (
                            <Image source={{ uri: team.logo }} style={styles.logo} />
                        ) : (
                            <View style={[styles.logoFallback, { backgroundColor: '#10b981' }]}>
                                <Text style={styles.logoFallbackText}>{team.code[0]}</Text>
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.teamCode} numberOfLines={1}>{team.code}</Text>
                            <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
                        </View>
                    </View>
                    <Text style={[styles.cell, styles.statCell]}>{team.matchesPlayed}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.won}</Text>
                    <Text style={[styles.cell, styles.statCell]}>{team.lost}</Text>
                    <Text style={[styles.cell, styles.nrrCell, nrr > 0 ? styles.positiveStat : nrr < 0 ? styles.negativeStat : null]}>{nrrStr}</Text>
                    <Text style={[styles.cell, styles.ptsCell]}>{team.points}</Text>

                    {isQualified && <View style={styles.qualifiedIndicator} />}
                </View>
            );
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
                contentContainerStyle={styles.content}
            >
                <View style={styles.pageTitleContainer}>
                    <Ionicons name="podium-outline" size={24} color="#1a1a1a" />
                    <Text style={styles.pageTitle}>Standings</Text>
                </View>

                {/* Sport selector */}
                <View style={styles.tabScroll}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
                        {SPORTS.map((sport) => (
                            <TouchableOpacity
                                key={sport.id}
                                onPress={() => setSelectedSport(sport.id as any)}
                                style={[styles.sportTab, selectedSport === sport.id && styles.activeSportTab]}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={sport.icon as any}
                                    size={18}
                                    color={selectedSport === sport.id ? '#fff' : '#666'}
                                />
                                <Text style={[styles.sportTabText, selectedSport === sport.id && styles.activeSportTabText]}>
                                    {sport.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#E31C25" /></View>
                ) : (
                    <>
                        {/* Top Leaders Podium */}
                        {teams.length > 0 ? (
                            <TopTeamsPodium topTeams={teams.slice(0, 3)} />
                        ) : null}

                        {/* Standings Table Card */}
                        <View style={styles.table}>
                            {renderHeader()}

                            {teams.length > 0 ? (
                                teams.map((team, index) => renderRow(team, index))
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Ionicons name="alert-circle-outline" size={32} color="#aaa" />
                                    <Text style={{ color: '#999', marginTop: 10, fontSize: 13, fontWeight: '500' }}>No teams found for this sport</Text>
                                </View>
                            )}
                        </View>

                        {/* Legend */}
                        {teams.length > 0 ? (
                            <View style={styles.legend}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.dot, { backgroundColor: '#F9FCF7', borderColor: '#4CAF50' }]} />
                                    <Text style={styles.legendText}>Qualifier Zone (Top 4)</Text>
                                </View>
                            </View>
                        ) : null}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const TopTeamsPodium = ({ topTeams }: { topTeams: any[] }) => {
    if (!topTeams || topTeams.length === 0) return null;
    
    const first = topTeams[0];
    const second = topTeams[1];
    const third = topTeams[2];

    return (
        <LinearGradient colors={['#1e1e1e', '#0f0f0f']} style={styles.podiumCard}>
            <Text style={styles.podiumTitle}>🏆 LEAGUE LEADERS</Text>
            
            <View style={styles.podiumWrapper}>
                {/* 2nd Place */}
                {second ? (
                    <View style={styles.podiumColumn}>
                        <View style={[styles.podiumLogoContainer, styles.podiumSecond]}>
                            {second.logo && second.logo !== 'https://via.placeholder.com/150' ? (
                                <Image source={{ uri: second.logo }} style={styles.podiumLogo} />
                            ) : (
                                <Text style={styles.podiumLogoText}>{second.code[0]}</Text>
                            )}
                            <View style={styles.podiumBadge}>
                                <Text style={styles.podiumBadgeText}>2</Text>
                            </View>
                        </View>
                        <Text style={styles.podiumTeamName} numberOfLines={1}>{second.code}</Text>
                        <Text style={styles.podiumTeamPts}>{second.points} Pts</Text>
                    </View>
                ) : (
                    <View style={styles.podiumColumn} />
                )}

                {/* 1st Place */}
                {first ? (
                    <View style={[styles.podiumColumn, styles.podiumCenterColumn]}>
                        <View style={styles.crownContainer}>
                            <Ionicons name="ribbon" size={18} color="#FFD700" />
                        </View>
                        <View style={[styles.podiumLogoContainer, styles.podiumFirst]}>
                            {first.logo && first.logo !== 'https://via.placeholder.com/150' ? (
                                <Image source={{ uri: first.logo }} style={styles.podiumLogoLarge} />
                            ) : (
                                <Text style={styles.podiumLogoTextLarge}>{first.code[0]}</Text>
                            )}
                            <View style={[styles.podiumBadge, styles.podiumBadgeFirst]}>
                                <Text style={styles.podiumBadgeText}>1</Text>
                            </View>
                        </View>
                        <Text style={[styles.podiumTeamName, styles.podiumTeamNameFirst]} numberOfLines={1}>{first.code}</Text>
                        <Text style={styles.podiumTeamPts}>{first.points} Pts</Text>
                    </View>
                ) : null}

                {/* 3rd Place */}
                {third ? (
                    <View style={styles.podiumColumn}>
                        <View style={[styles.podiumLogoContainer, styles.podiumThird]}>
                            {third.logo && third.logo !== 'https://via.placeholder.com/150' ? (
                                <Image source={{ uri: third.logo }} style={styles.podiumLogo} />
                            ) : (
                                <Text style={styles.podiumLogoText}>{third.code[0]}</Text>
                            )}
                            <View style={styles.podiumBadge}>
                                <Text style={styles.podiumBadgeText}>3</Text>
                            </View>
                        </View>
                        <Text style={styles.podiumTeamName} numberOfLines={1}>{third.code}</Text>
                        <Text style={styles.podiumTeamPts}>{third.points} Pts</Text>
                    </View>
                ) : (
                    <View style={styles.podiumColumn} />
                )}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    center: { paddingVertical: 80, justifyContent: 'center', alignItems: 'center' },
    
    // Tab styling
    tabScroll: { marginVertical: 10 },
    tabScrollContainer: { paddingHorizontal: 20 },
    sportTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#E1E4E8' },
    activeSportTab: { backgroundColor: '#E31C25', borderColor: '#E31C25' },
    sportTabText: { color: '#666', fontSize: 13, fontWeight: '600', marginLeft: 6 },
    activeSportTabText: { color: '#fff', fontWeight: '700' },

    // Leaders podium
    podiumCard: { marginHorizontal: 20, marginVertical: 12, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 },
    podiumTitle: { color: 'rgba(255, 215, 0, 0.95)', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center', marginBottom: 12 },
    podiumWrapper: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 10 },
    podiumColumn: { alignItems: 'center', flex: 1 },
    podiumCenterColumn: { transform: [{ translateY: -10 }] },
    crownContainer: { marginBottom: 4 },
    podiumLogoContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 4, position: 'relative', borderWidth: 2 },
    podiumFirst: { width: 54, height: 54, borderRadius: 27, borderColor: '#FFD700' },
    podiumSecond: { borderColor: '#C0C0C0' },
    podiumThird: { borderColor: '#CD7F32' },
    podiumLogo: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff' },
    podiumLogoLarge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff' },
    podiumLogoText: { fontSize: 18, fontWeight: '900', color: '#333' },
    podiumLogoTextLarge: { fontSize: 22, fontWeight: '900', color: '#333' },
    podiumBadge: { position: 'absolute', bottom: -6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#999', justifyContent: 'center', alignItems: 'center' },
    podiumBadgeFirst: { backgroundColor: '#FFD700', width: 18, height: 18, borderRadius: 9 },
    podiumBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
    podiumTeamName: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 12, opacity: 0.9 },
    podiumTeamNameFirst: { fontSize: 14, fontWeight: '800', opacity: 1 },
    podiumTeamPts: { color: '#FFD700', fontSize: 10, fontWeight: '600', marginTop: 2, opacity: 0.8 },

    table: {
        margin: 20,
        backgroundColor: '#fff',
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        overflow: 'hidden',
    },
    rowHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
        position: 'relative',
    },
    qualifiedRow: {
        backgroundColor: '#F9FCF7',
    },
    qualifiedIndicator: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#4CAF50',
    },
    cellHeader: {
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '800',
        color: '#888',
        letterSpacing: 0.2,
    },
    cell: {
        textAlign: 'center',
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    posCell: { width: 32, fontWeight: '700', color: '#888' },
    topThreePos: { color: '#E31C25', fontWeight: '800' },
    teamCell: { flex: 1, paddingLeft: 8, alignItems: 'flex-start' },
    statCell: { width: 30 },
    ptsCell: { width: 44, fontWeight: '800', fontSize: 13, color: '#1a1a1a' },
    nrrCell: { width: 62 },

    teamFlex: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', borderWidth: 1, borderColor: '#eee' },
    logoFallback: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
    logoFallbackText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    teamCode: { fontWeight: '700', fontSize: 13, color: '#1a1a1a' },
    teamName: { fontSize: 10, color: '#888', marginTop: 1 },

    positiveStat: { color: '#2E7D32', fontWeight: '600' },
    negativeStat: { color: '#C62828', fontWeight: '600' },

    legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 20, marginBottom: 40 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
    legendText: { fontSize: 11, color: '#666', fontWeight: '500' },

    content: { paddingBottom: 100 },
    pageTitleContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, gap: 12 },
    pageTitle: { fontSize: 24, fontWeight: '900', color: '#1a1a1a', letterSpacing: -0.5 },
});
