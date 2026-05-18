import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../services/api';

const { width } = Dimensions.get('window');

interface UserProfileModalProps {
    visible: boolean;
    userId: string | null;
    onClose: () => void;
}

export default function UserProfileModal({ visible, userId, onClose }: UserProfileModalProps) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (visible && userId) {
            fetchUserProfile();
        } else {
            setUser(null);
        }
    }, [visible, userId]);

    const fetchUserProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/user/${userId}`);
            setUser(res.data.data);
        } catch (error) {
            console.log('Error fetching user profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />

                <View style={styles.modalContent}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#E31C25" />
                        </View>
                    ) : user ? (
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            {/* Header / Cover */}
                            <LinearGradient
                                colors={['#E31C25', '#900C12']}
                                style={styles.headerBackground}
                            />

                            {/* Avatar */}
                            <View style={styles.avatarContainer}>
                                {user.profileImage ? (
                                    <Image source={{ uri: user.profileImage }} style={styles.avatar} />
                                ) : (
                                    <View style={[styles.avatar, styles.placeholderAvatar]}>
                                        <Ionicons name="person" size={50} color="#fff" />
                                    </View>
                                )}
                            </View>

                            {/* User Info */}
                            <View style={styles.infoContainer}>
                                <Text style={styles.name}>{user.name}</Text>
                                <Text style={styles.role}>{user.role || 'Player'}</Text>

                                <View style={styles.locationRow}>
                                    <Ionicons name="location-outline" size={16} color="#666" />
                                    <Text style={styles.locationText}>{user.city || 'Location not set'}</Text>
                                </View>

                                {/* Sports Tags */}
                                {user.sports && user.sports.length > 0 && (
                                    <View style={styles.sportsContainer}>
                                        {user.sports.map((sport: string, index: number) => (
                                            <View key={index} style={styles.sportTag}>
                                                <Text style={styles.sportText}>{sport}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Divider */}
                                <View style={styles.divider} />

                                {/* Stats Grid */}
                                <View style={styles.statsGrid}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>0</Text>
                                        <Text style={styles.statLabel}>Matches</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>0%</Text>
                                        <Text style={styles.statLabel}>Win Rate</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>0</Text>
                                        <Text style={styles.statLabel}>Awards</Text>
                                    </View>
                                </View>

                                {/* Additional Info */}
                                <View style={styles.detailsSection}>
                                    <View style={styles.detailRow}>
                                        <MaterialCommunityIcons name="gender-male-female" size={20} color="#555" />
                                        <Text style={styles.detailText}>{user.gender || 'Not specified'}</Text>
                                    </View>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="call-outline" size={20} color="#555" />
                                        <Text style={styles.detailText}>{user.phone || 'Hidden'}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Close Button */}
                            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                <Text style={styles.closeButtonText}>Close Profile</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    ) : (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Failed to load profile</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
        backgroundColor: '#F8F9FA',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '85%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    headerBackground: {
        height: 140,
        width: '100%',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: -70,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 5,
        borderColor: '#fff',
    },
    placeholderAvatar: {
        backgroundColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        padding: 24,
        alignItems: 'center',
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 6,
        letterSpacing: 0.5,
    },
    role: {
        fontSize: 14,
        color: '#E31C25',
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        backgroundColor: 'rgba(227, 28, 37, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        overflow: 'hidden',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    locationText: {
        color: '#666',
        marginLeft: 6,
        fontSize: 15,
        fontWeight: '500',
    },
    sportsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 10,
    },
    sportTag: {
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sportText: {
        color: '#333',
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 28,
        gap: 10,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    statLabel: {
        fontSize: 11,
        color: '#999',
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    detailsSection: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: 12,
        color: '#444',
        fontSize: 16,
        fontWeight: '500',
    },
    closeButton: {
        marginTop: 30,
        marginHorizontal: 24,
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E31C25',
    },
    closeButtonText: {
        color: '#E31C25',
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: '#888',
        fontSize: 16,
        marginBottom: 20,
    },
});
