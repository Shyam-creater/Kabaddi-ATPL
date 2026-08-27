import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Dimensions,
    Platform,
    Image,
    RefreshControl,
    StatusBar,
    Linking,
    Modal,
    ToastAndroid
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@/app/ctx';
import { useRouter } from 'expo-router';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchProfile } from '../../features/auth/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function ProfilePage() {
    const { signOut } = useSession();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, loading } = useAppSelector(state => state.auth);
    const [refreshing, setRefreshing] = React.useState(false);
    const [showFullImage, setShowFullImage] = useState(false);

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const DELETE_REASONS = ["Privacy concerns", "Not using enough", "Too many bugs", "Other"];

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchProfile());
        }, [dispatch])
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await dispatch(fetchProfile());
        setRefreshing(false);
    }, [dispatch]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/login'); } },
        ]);
    };

    const handleDeleteAccount = () => {
        setDeleteModalVisible(true);
    };

    const confirmDeleteAccount = async () => {
        if (!deleteReason) {
            Alert.alert('Required', 'Please select a reason for deletion.');
            return;
        }

        try {
            const response = await api.delete('/user/delete');
            if (response.data.success) {
                setDeleteModalVisible(false);
                signOut();
                router.replace('/(auth)/login');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete account. Please try again.');
        }
    };

    const navigateTo = (screen: string) => {
        router.push(`/profile/${screen}` as any);
    };

    const copyToClipboard = async (text: string) => {
        await Clipboard.setStringAsync(text);
        if (Platform.OS === 'android') {
            ToastAndroid.show('ID copied to clipboard!', ToastAndroid.SHORT);
        } else {
            Alert.alert('Copied', 'ID copied to clipboard!');
        }
    };

    // ... existing helper functions like hasCricketProfile, calculateAge ...

    const hasCricketProfile = user?.playerProfile && user.playerProfile.cricket && user.sports?.includes('Cricket');
    const hasKabaddiProfile = user?.playerProfile && user.playerProfile.kabaddi && user.sports?.includes('Kabaddi');
    const hasProfile = hasCricketProfile || hasKabaddiProfile;

    const calculateAge = (dobString: string) => {
        if (!dobString) return '';
        const birthDate = new Date(dobString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatDOB = (dateStr: string | null | undefined) => {
        if (!dateStr) return 'Not set';
        try {
            const date = new Date(dateStr);
            const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            const age = calculateAge(dateStr);
            return `${formattedDate} (${age} Yrs)`;
        } catch (e) {
            return dateStr;
        }
    };

    // ... menuItems ...

    const menuItems = [
        // Primary Action: View Detailed Stats
        {
            icon: 'stats-chart',
            title: 'View Profile Details',
            subtitle: 'Check your detailed career statistics',
            action: () => router.push(`/profile/view/${user?._id}` as any),
            color: '#E31C25',
            hide: !hasProfile
        },
        // Edit Action
        {
            icon: 'create-outline',
            title: hasProfile ? 'Edit Profile' : 'Create Profile',
            subtitle: hasProfile ? 'Update your information' : 'Set up your player profile',
            action: () => navigateTo('edit'),
            color: '#4A90E2',
            hide: false
        },
        {
            icon: 'trophy-outline',
            title: 'My Matches',
            subtitle: 'History of your games',
            action: () => router.push({ pathname: '/matches', params: { filter: 'my' } } as any),
            color: '#FFA726',
            hide: false
        },
        {
            icon: 'person-remove-outline',
            title: 'Blocked Users',
            subtitle: 'Manage blocked accounts',
            action: () => router.push({ pathname: '/profile/settings', params: { action: 'blocked' } } as any),
            color: '#D32F2F',
            hide: false
        },
        {
            icon: 'settings-outline',
            title: 'Settings',
            subtitle: 'App preferences',
            action: () => navigateTo('settings'),
            color: '#78909C'
        }
    ];

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E31C25" />}>
            {/* ... Header and Content ... */}
            <StatusBar barStyle="light-content" />
            <View style={styles.headerContainer}>
                {/* existing header JSX */}
                <LinearGradient colors={['#E31C25', '#A00F15']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
                        <Text style={styles.headerTitle}>My Profile</Text>
                        {hasProfile ? (
                            <TouchableOpacity style={styles.editBadgeTop} onPress={() => navigateTo('edit')}><Ionicons name="create-outline" size={20} color="#fff" /></TouchableOpacity>
                        ) : <View style={{ width: 40 }} />}
                    </View>
                    <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.profileInfo}>
                        <View style={styles.avatarContainer}>
                            <TouchableOpacity onPress={() => user?.profilePicture && setShowFullImage(true)}>
                                {user?.profilePicture ?
                                    (<Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />) :
                                    (<View style={styles.avatarPlaceholder}><Ionicons name="person" size={50} color="#E31C25" /></View>)
                                }
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.userName}>{user?.name || 'Guest user'}</Text>
                        {user?.atplId && (
                            <TouchableOpacity 
                                style={styles.atplIdContainer}
                                onPress={() => copyToClipboard(user.atplId)}
                            >
                                <Text style={styles.atplIdText}>{user.atplId}</Text>
                                <Ionicons name="copy-outline" size={14} color="#fff" />
                            </TouchableOpacity>
                        )}

                        {/* Social Stats */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 20 }}>
                            <TouchableOpacity
                                style={{ alignItems: 'center' }}
                                onPress={() => router.push({ pathname: '/profile/network', params: { type: 'followers', userId: user?._id, userName: user?.name } })}
                            >
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{user?.followers?.length || 0}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Followers</Text>
                            </TouchableOpacity>
                            <View style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                            <TouchableOpacity
                                style={{ alignItems: 'center' }}
                                onPress={() => router.push({ pathname: '/profile/network', params: { type: 'following', userId: user?._id, userName: user?.name } })}
                            >
                                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{user?.following?.length || 0}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Following</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.headerGrid}>
                            <View style={styles.gridRow}>
                                <View style={styles.gridItem}><View style={styles.gridIconBox}><Ionicons name="call" size={14} color="#fff" /></View><View><Text style={styles.gridLabel}>MOBILE</Text><Text style={styles.gridValue}>{user?.phone || 'Not set'}</Text></View></View>
                                <View style={styles.gridItem}><View style={styles.gridIconBox}><Ionicons name="location" size={14} color="#fff" /></View><View><Text style={styles.gridLabel}>LOCATION</Text><Text style={styles.gridValue} numberOfLines={1}>{user?.address || user?.city || 'Not set'}</Text></View></View>
                            </View>
                            <View style={styles.gridRow}>
                                <View style={styles.gridItem}><View style={styles.gridIconBox}><Ionicons name="calendar" size={14} color="#fff" /></View><View><Text style={styles.gridLabel}>BIRTHDAY</Text><Text style={styles.gridValue}>{formatDOB(user?.dob)}</Text></View></View>
                                <View style={styles.gridItem}><View style={styles.gridIconBox}><Ionicons name="trophy" size={14} color="#fff" /></View><View><Text style={styles.gridLabel}>SPORTS</Text><Text style={styles.gridValue} numberOfLines={1}>{(user?.sports && user.sports.length > 0) ? user.sports.join(', ') : 'Kabaddi'}</Text></View></View>
                            </View>
                        </View>
                    </Animated.View>
                </LinearGradient>
            </View>

            <View style={styles.contentWrapper}>
                <Animated.View entering={FadeInUp.delay(300).duration(600)}>
                    {!hasProfile && (
                        <View style={styles.emptyState}>
                            <Ionicons name="person-add-outline" size={50} color="#666" />
                            <Text style={styles.emptyStateTitle}>Complete Your Profile</Text>
                            <Text style={styles.emptyStateText}>Create your profile to start tracking stats.</Text>
                            <TouchableOpacity style={styles.createButton} onPress={() => navigateTo('edit')}>
                                <Text style={styles.createButtonText}>Create Profile</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.menuList}>
                        {menuItems.filter(i => i.hide !== true).map((item, index) => (
                            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
                                <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}><Ionicons name={item.icon as any} size={22} color={item.color} /></View>
                                <View style={styles.menuTextContainer}><Text style={styles.menuItemTitle}>{item.title}</Text><Text style={styles.menuItemSubtitle}>{item.subtitle}</Text></View>
                                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LinearGradient colors={['#FF5252', '#D32F2F']} style={styles.logoutGradient}><Ionicons name="log-out-outline" size={20} color="#fff" /><Text style={styles.logoutText}>Logout</Text></LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                    <Text style={styles.deleteButtonText}>Delete Account</Text>
                </TouchableOpacity>
            </View>

            {/* Full Screen Image Modal */}
            <Modal visible={showFullImage} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => setShowFullImage(false)}>
                        <Ionicons name="close-circle" size={40} color="#fff" />
                    </TouchableOpacity>
                    <Image source={{ uri: user?.profilePicture }} style={styles.fullImage} resizeMode="contain" />
                </View>
            </Modal>

            {/* Delete Reason Modal */}
            <Modal visible={deleteModalVisible} transparent={true} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.deleteModalContent}>
                        <Text style={styles.deleteModalTitle}>Delete Account?</Text>
                        <Text style={styles.deleteModalSubtitle}>We are sorry to see you go. Please tell us why:</Text>

                        {DELETE_REASONS.map((reason) => (
                            <TouchableOpacity
                                key={reason}
                                style={[styles.reasonRow, deleteReason === reason && styles.reasonRowSelected]}
                                onPress={() => setDeleteReason(reason)}
                            >
                                <View style={styles.radioCircle}>
                                    {deleteReason === reason && <View style={styles.radioFill} />}
                                </View>
                                <Text style={styles.reasonText}>{reason}</Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.confirmDeleteBtn, !deleteReason && { opacity: 0.5 }]} onPress={confirmDeleteAccount} disabled={!deleteReason}>
                                <Text style={styles.confirmDeleteText}>Confirm Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F8FA' },
    headerContainer: { width: '100%' },
    headerGradient: { paddingTop: Platform.OS === 'ios' ? 60 : 50, paddingBottom: 50, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
    headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    editBadgeTop: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    profileInfo: { alignItems: 'center', paddingHorizontal: 20 },
    avatarContainer: { marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },
    avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)' }, // Slightly larger
    avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', backgroundColor: '#fff' },
    userName: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: 0.5, marginBottom: 15 },
    atplIdContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 15, gap: 8 },
    atplIdText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
    headerGrid: { width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 15, gap: 15 },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    gridItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    gridIconBox: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    gridLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
    gridValue: { fontSize: 12, fontWeight: '700', color: '#fff' },
    contentWrapper: { paddingHorizontal: 20, marginTop: -30 },
    menuList: { marginBottom: 20 },
    menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 12, borderRadius: 18, elevation: 2 },
    menuIconContainer: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    menuTextContainer: { flex: 1 },
    menuItemTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    menuItemSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    logoutButton: { marginBottom: 30 },
    logoutGradient: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 18 },
    logoutText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 10 },
    deleteButton: { alignItems: 'center', paddingVertical: 15, marginBottom: 40 },
    deleteButtonText: { color: '#FF5252', fontSize: 14, fontWeight: '600' },
    emptyState: { backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 20, elevation: 2 },
    emptyStateTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 10 },
    emptyStateText: { textAlign: 'center', color: '#888', fontSize: 12, marginVertical: 5 },
    createButton: { backgroundColor: '#E31C25', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10 },
    createButtonText: { color: '#fff', fontWeight: 'bold' },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
    fullImage: { width: width, height: height * 0.8 },
    deleteModalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '90%' },
    deleteModalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#333' },
    deleteModalSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
    reasonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
    reasonRowSelected: { backgroundColor: '#fff5f5' },
    radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#ccc', marginRight: 15, justifyContent: 'center', alignItems: 'center' },
    radioFill: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E31C25' },
    reasonText: { fontSize: 16, color: '#444' },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 15 },
    cancelBtn: { paddingHorizontal: 15, paddingVertical: 10 },
    cancelBtnText: { color: '#666', fontWeight: '600' },
    confirmDeleteBtn: { backgroundColor: '#E31C25', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    confirmDeleteText: { color: '#fff', fontWeight: 'bold' }
});
