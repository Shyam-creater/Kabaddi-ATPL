import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppSelector } from '../../store/hooks';
import api from '../../services/api';
import AppHeader from '../../components/common/AppHeader';

const SPORTS_TABS = [
    { id: 'All', name: 'All Players', icon: 'trophy-outline' },
    { id: 'Cricket', name: 'Cricket', icon: 'cricket' },
    { id: 'Kabaddi', name: 'Kabaddi', icon: 'human-handsup' },
    { id: 'Football', name: 'Football', icon: 'soccer' },
];

export default function PlayersScreen() {
    const router = useRouter();
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('All');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchPlayers = async () => {
        try {
            const endpoint = activeTab === 'All'
                ? '/user/list'
                : `/user/list?sport=${activeTab}`;

            const response = await api.get(endpoint);
            if (response.data.success) {
                setPlayers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch players:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchPlayers();
    }, [activeTab]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPlayers();
    };

    const renderPlayerCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/profile/view/${item._id}` as any)}
        >
            <View style={styles.cardContent}>
                <View style={styles.imageContainer}>
                    {item.profilePicture ? (
                        <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
                    ) : (
                        <LinearGradient colors={['#E31C25', '#A00F15']} style={styles.placeholderAvatar}>
                            <Text style={styles.placeholderText}>
                                {item.name ? item.name.charAt(0).toUpperCase() : 'P'}
                            </Text>
                        </LinearGradient>
                    )}
                    {item.sports && item.sports.length > 0 && (
                        <View style={styles.sportBadge}>
                            <Ionicons
                                name={item.sports.includes('Cricket') ? 'baseball' : 'people'}
                                size={10}
                                color="#fff"
                            />
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.role} numberOfLines={1}>{item.role || 'Player'}</Text>

                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color="#666" />
                        <Text style={styles.location} numberOfLines={1}>
                            {item.address || item.city || 'Unknown Location'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.viewButton} onPress={() => router.push(`/profile/view/${item._id}` as any)}>
                    <Text style={styles.viewBtnText}>View</Text>
                    <Ionicons name="chevron-forward" size={14} color="#E31C25" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const filteredPlayers = players.filter((player: any) => 
        player.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <AppHeader />

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search players by name..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#ccc" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.tabWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    {SPORTS_TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
                        >
                            <MaterialCommunityIcons
                                name={tab.icon as any}
                                size={20}
                                color={activeTab === tab.id ? '#000' : '#999'}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                                {tab.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            
            {/* --- PROFILE COMPLETION ALERT --- */}
            {currentUser && (
                (!currentUser.profilePicture || !currentUser.city || !currentUser.role || !currentUser.sports || currentUser.sports.length === 0) && (
                    <Animated.View 
                        entering={FadeInDown.delay(200).duration(800)}
                        style={styles.profileAlertBanner}
                    >
                        <LinearGradient
                            colors={['#E31C25', '#900C12']}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.profileAlertGradient}
                        >
                            <View style={styles.profileAlertContent}>
                                <View style={styles.profileAlertIconBg}>
                                    <MaterialCommunityIcons name="account-check" size={20} color="#d5c106ff" />
                                </View>
                                <View style={styles.profileAlertTextContainer}>
                                    <Text style={styles.profileAlertTitle}>Complete Your Profile</Text>
                                    <Text style={styles.profileAlertDesc}>Boost visibility remaing</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.profileAlertBtn}
                                    onPress={() => router.push('/profile/edit')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.profileAlertBtnText}>Set Up</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#E31C25" />
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </Animated.View>
                )
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E31C25" />
                </View>
            ) : (
                <FlatList
                    data={filteredPlayers}
                    renderItem={renderPlayerCard}
                    keyExtractor={(item: any) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No players found in this category</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    searchContainer: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333', fontWeight: '500' },
    tabWrapper: { marginTop: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 0 },
    tabItem: { flexDirection: 'row', alignItems: 'center', marginRight: 20, paddingBottom: 12 },
    activeTabItem: { borderBottomWidth: 3, borderBottomColor: '#E31C25' },
    tabText: { color: '#999', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
    activeTabText: { color: '#000', fontWeight: '800' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
    cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    imageContainer: { marginRight: 15, position: 'relative' },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee' },
    placeholderAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
    sportBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#E31C25', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
    infoContainer: { flex: 1, marginRight: 10 },
    name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
    role: { fontSize: 12, color: '#666', marginBottom: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    location: { fontSize: 11, color: '#888' },
    viewButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    viewBtnText: { color: '#E31C25', fontSize: 11, fontWeight: '700', marginRight: 2 },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', marginTop: 10 },

    // Profile Alert Banner
    profileAlertBanner: {
        marginHorizontal: 20,
        marginTop: 5,
        marginBottom: 10,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    profileAlertGradient: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    profileAlertContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    profileAlertIconBg: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileAlertTextContainer: {
        flex: 1,
        marginHorizontal: 12,
    },
    profileAlertTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    profileAlertDesc: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 1,
    },
    profileAlertBtn: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 2,
    },
    profileAlertBtnText: {
        color: '#E31C25',
        fontSize: 11,
        fontWeight: '800',
    },
});
