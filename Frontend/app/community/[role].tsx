import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';
import AppHeader from '../../components/common/AppHeader';

export default function CommunityRoleScreen() {
    const { role } = useLocalSearchParams();
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const formattedRole = typeof role === 'string' ? role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ') : 'Members';

    const fetchCommunityMembers = async () => {
        try {
            // For now fetching all and filtering locally, or we can use the endpoint if backed by role filter.
            const response = await api.get('/user/list');
            if (response.data.success) {
                // Approximate filtering logic based on the role param
                const allUsers = response.data.data || [];
                const filtered = allUsers.filter((u: any) => 
                    u.role && u.role.toLowerCase() === (role as string).replace('-', ' ').toLowerCase()
                );
                
                // If we also want to fall back to no filter if none found (optional):
                // setUsers(filtered.length > 0 ? filtered : allUsers);
                setUsers(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch community members:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchCommunityMembers();
    }, [role]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCommunityMembers();
    };

    const displayUsers = users.filter((u: any) => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderUserCard = ({ item }: { item: any }) => (
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
                                {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
                            </Text>
                        </LinearGradient>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.role} numberOfLines={1}>{item.role || formattedRole}</Text>

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

    return (
        <View style={styles.container}>
            <AppHeader />
            
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.pageTitle}>{formattedRole}</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={`Search ${formattedRole}...`}
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

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#E31C25" />
                </View>
            ) : (
                <FlatList
                    data={displayUsers}
                    renderItem={renderUserCard}
                    keyExtractor={(item: any) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No {formattedRole.toLowerCase()} found in the community.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5 },
    backButton: { marginRight: 15, padding: 5 },
    pageTitle: { fontSize: 22, fontWeight: '900', color: '#1A1A1A' },
    searchContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6FA', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333', fontWeight: '500' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 20, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#f0f0f0' },
    cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    imageContainer: { marginRight: 15 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee' },
    placeholderAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    placeholderText: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
    infoContainer: { flex: 1, marginRight: 10 },
    name: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
    role: { fontSize: 12, color: '#666', marginBottom: 4, textTransform: 'capitalize' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    location: { fontSize: 11, color: '#888' },
    viewButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5F5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    viewBtnText: { color: '#E31C25', fontSize: 11, fontWeight: '700', marginRight: 2 },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', marginTop: 10 }
});
