import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import AppHeader from '../../components/common/AppHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Team {
    _id: string;
    name: string;
    code: string;
    logo: string;
    city?: string;
    captain?: string;
    players?: any[];
}

export default function TeamsScreen() {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            setTeams(response.data);
        } catch (error) {
            console.error('Failed to fetch teams', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTeams();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <AppHeader />

            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.headerTitle}>Franchise Teams</Text>
                    <Text style={styles.headerSubtitle}>Official League Squads</Text>
                </View>
                <View style={styles.iconBadge}>
                    <Ionicons name="shield-checkmark" size={20} color="#E31C25" />
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#E31C25" style={{ marginTop: 50 }} />
                ) : teams.length > 0 ? (
                    <View style={styles.grid}>
                        {teams.map((team, index) => (
                            <TouchableOpacity
                                key={team._id}
                                style={[styles.card, { marginTop: index % 2 === 1 ? 20 : 0 }]}
                                activeOpacity={0.9}
                            >
                                <View style={styles.cardHeader}>
                                    <LinearGradient
                                        colors={['#ffffff', '#f0f2f5']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.logoContainer}
                                    >
                                        <Image
                                            source={{ uri: team.logo || 'https://via.placeholder.com/150' }}
                                            style={styles.logo}
                                            resizeMode="contain"
                                        />
                                    </LinearGradient>
                                    <View style={styles.codeBadge}>
                                        <Text style={styles.codeText}>{team.code}</Text>
                                    </View>
                                </View>

                                <View style={styles.cardBody}>
                                    <Text style={styles.teamName} numberOfLines={2}>{team.name}</Text>

                                    <View style={styles.divider} />

                                    <View style={styles.infoContainer}>
                                        <View style={styles.infoItem}>
                                            <Ionicons name="location" size={12} color="#9CA3AF" />
                                            <Text style={styles.infoText} numberOfLines={1}>{team.city || 'TBA'}</Text>
                                        </View>
                                        <View style={styles.infoItem}>
                                            <Ionicons name="person" size={12} color="#9CA3AF" />
                                            <Text style={styles.infoText} numberOfLines={1}>{team.captain || 'TBA'}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="shield-outline" size={48} color="#D1D5DB" />
                        </View>
                        <Text style={styles.emptyText}>No teams found</Text>
                        <Text style={styles.emptySubText}>Teams will appear here once added.</Text>
                    </View>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        marginTop: 2,
    },
    iconBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#fff',
        borderRadius: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'visible',
    },
    cardHeader: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },
    logoContainer: {
        width: 110,
        height: 110,
        borderRadius: 55,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#fff',
    },
    logo: {
        width: 70,
        height: 70,
    },
    codeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#111827',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    codeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    cardBody: {
        padding: 16,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    teamName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
        height: 44, // Fixed height for 2 lines alignment
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 12,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        justifyContent: 'center',
    },
    infoText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubText: {
        color: '#9CA3AF',
        fontSize: 14,
        marginTop: 4,
    },
});
