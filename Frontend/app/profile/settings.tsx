import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Switch,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Image,
    FlatList,
    KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

import { useTheme } from '../../context/ThemeContext';
import { useSession } from '@/app/ctx';
import authService from '../../features/auth/authService';

export default function Settings() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { theme, setTheme, actualTheme } = useTheme();
    const { signOut } = useSession();

    // Settings State
    const [notifications, setNotifications] = useState(true);
    const [sound, setSound] = useState(true);
    const [biometrics, setBiometrics] = useState(false);

    // Modals State
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [blockedUsersVisible, setBlockedUsersVisible] = useState(false);
    const [legalModalVisible, setLegalModalVisible] = useState(false);
    const [legalContent, setLegalContent] = useState({ title: '', body: '' });

    // Data State
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
    const [loadingBlocked, setLoadingBlocked] = useState(false);

    // Forms State
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Initial Load
    useEffect(() => {
        loadSettings();
        if (params.action === 'blocked') {
            setBlockedUsersVisible(true);
            fetchBlockedUsers();
        }
    }, [params.action]);

    const loadSettings = async () => {
        try {
            const [storedNotif, storedSound, storedBio] = await Promise.all([
                AsyncStorage.getItem('settings_notifications'),
                AsyncStorage.getItem('settings_sound'),
                AsyncStorage.getItem('settings_biometrics'),
            ]);
            if (storedNotif !== null) setNotifications(JSON.parse(storedNotif));
            if (storedSound !== null) setSound(JSON.parse(storedSound));
            if (storedBio !== null) setBiometrics(JSON.parse(storedBio));
        } catch (e) {
            console.error(e);
        }
    };

    // Toggles
    const toggleNotifications = async (val: boolean) => {
        setNotifications(val);
        await AsyncStorage.setItem('settings_notifications', JSON.stringify(val));
    };

    const toggleSound = async (val: boolean) => {
        setSound(val);
        await AsyncStorage.setItem('settings_sound', JSON.stringify(val));
    };

    const toggleBiometrics = async (val: boolean) => {
        if (val) {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                Alert.alert('Unavailable', 'Your device does not support biometrics.');
                return;
            }
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) {
                Alert.alert('Unavailable', 'No biometrics (fingerprint/face) enrolled on this device.');
                return;
            }
        }
        setBiometrics(val);
        await AsyncStorage.setItem('settings_biometrics', JSON.stringify(val));
    };

    const toggleTheme = (val: boolean) => {
        setTheme(val ? 'dark' : 'light');
    };

    // Blocked Users Logic
    const fetchBlockedUsers = async () => {
        setLoadingBlocked(true);
        try {
            const res = await authService.getBlockedUsers();
            if (res.success) {
                setBlockedUsers(res.data);
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to fetch blocked users');
        } finally {
            setLoadingBlocked(false);
        }
    };

    const handleUnblock = async (userId: string) => {
        try {
            await authService.unblockUser(userId);
            setBlockedUsers(prev => prev.filter(u => u._id !== userId));
            Alert.alert('Success', 'User unblocked');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to unblock user');
        }
    };

    // Change Password Logic
    const handleChangePassword = async () => {
        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (passwordForm.new.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoadingPassword(true);
        try {
            const res = await authService.changePassword({
                currentPassword: passwordForm.current,
                newPassword: passwordForm.new
            });
            if (res.success) {
                Alert.alert('Success', 'Password changed successfully');
                setChangePasswordVisible(false);
                setPasswordForm({ current: '', new: '', confirm: '' });
                signOut();
                router.replace('/(auth)/login');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoadingPassword(false);
        }
    };

    // Delete Account Logic
    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await authService.deleteAccount();
                            if (res.success) {
                                Alert.alert('Success', 'Account deleted successfully');
                                signOut();
                                router.replace('/(auth)/login');
                            }
                        } catch (error: any) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
                        }
                    }
                }
            ]
        );
    };

    // // Legal Content
    // const openLegal = (type: 'terms' | 'privacy') => {
    //     if (type === 'terms') {
    //         setLegalContent({
    //             title: 'Terms of Service',
    //             body: 'Welcome to Aattum TPL App.\n\n1. Acceptance of Terms\nBy accessing and using this app, you accept and agree to be bound by the terms and provision of this agreement.\n\n2. Use License\nPermission is granted to temporarily download one copy of the materials on Aattum TPL App\'s website for personal, non-commercial transitory viewing only.\n\n3. Disclaimer\nThe materials on Aattum TPL App\'s website are provided "as is". Aattum TPL App makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.'
    //         });
    //     } else {
    //         setLegalContent({
    //             title: 'Privacy Policy',
    //             body: 'Your privacy is important to us.\n\n1. Information Collection\nWe collect information to provide better services to all our users. We collect information in the following ways: information you give us, and information we get from your use of our services.\n\n2. Information Use\nWe use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect Aattum TPL App and our users.\n\n3. Information Sharing\nWe do not share personal information with companies, organizations and individuals outside of Aattum TPL App unless one of the following circumstances applies: with your consent, for legal reasons.'
    //         });
    //     }
    //     setLegalModalVisible(true);
    // };

    const SettingItem = ({ icon, title, value, onValueChange, type = 'toggle', onPress, color = '#E31C25' }: any) => (
        <TouchableOpacity
            style={[styles.settingItem, actualTheme === 'dark' && styles.settingItemDark]}
            onPress={type !== 'toggle' ? onPress : undefined}
            disabled={type === 'toggle'}
        >
            <View style={styles.settingLeft}>
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: actualTheme === 'dark' ? '#333' : (value ? `${color}15` : '#F5F5F5') }
                ]}>
                    <Ionicons name={icon} size={22} color={actualTheme === 'dark' ? '#fff' : (value ? color : '#888')} />
                </View>
                <Text style={[styles.settingTitle, actualTheme === 'dark' && styles.textDark]}>{title}</Text>
            </View>
            {type === 'toggle' ? (
                <Switch
                    trackColor={{ false: '#767577', true: `${color}80` }}
                    thumbColor={value ? color : '#f4f3f4'}
                    onValueChange={onValueChange}
                    value={value}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color={actualTheme === 'dark' ? '#666' : "#CCC"} />
            )}
        </TouchableOpacity>
    );

    const themeStyles = actualTheme === 'dark' ? styles.darkContainer : styles.lightContainer;
    const textColor = actualTheme === 'dark' ? '#fff' : '#333';
    const sectionBg = actualTheme === 'dark' ? '#1E1E1E' : '#fff';

    return (
        <View style={[styles.container, themeStyles]}>
            <View style={[styles.header, actualTheme === 'dark' && styles.headerDark]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={textColor} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionHeader, actualTheme === 'dark' && styles.textMuted]}>Preferences</Text>

                <View style={[styles.section, { backgroundColor: sectionBg }]}>
                    <SettingItem
                        icon="moon-outline"
                        title="Dark Mode"
                        value={actualTheme === 'dark'}
                        onValueChange={toggleTheme}
                        color="#6C63FF"
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        value={notifications}
                        onValueChange={toggleNotifications}
                        color="#E31C25"
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="volume-high-outline"
                        title="Sound Effects"
                        value={sound}
                        onValueChange={toggleSound}
                        color="#4CAF50"
                    />
                </View>

                <Text style={[styles.sectionHeader, actualTheme === 'dark' && styles.textMuted]}>Security</Text>

                <View style={[styles.section, { backgroundColor: sectionBg }]}>
                    <SettingItem
                        icon="finger-print-outline"
                        title="Biometric Login"
                        value={biometrics}
                        onValueChange={toggleBiometrics}
                        color="#2196F3"
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="key-outline"
                        title="Change Password"
                        type="link"
                        onPress={() => setChangePasswordVisible(true)}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="person-remove-outline"
                        title="Blocked Users"
                        type="link"
                        onPress={() => {
                            setBlockedUsersVisible(true);
                            fetchBlockedUsers();
                        }}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="trash-outline"
                        title="Delete Account"
                        type="link"
                        color="#FF3B30"
                        onPress={handleDeleteAccount}
                    />
                </View>

                {/* <Text style={[styles.sectionHeader, actualTheme === 'dark' && styles.textMuted]}>About</Text> */}

                {/* <View style={[styles.section, { backgroundColor: sectionBg }]}>
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        type="link"
                        onPress={() => openLegal('terms')}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon="shield-checkmark-outline"
                        title="Privacy Policy"
                        type="link"
                        onPress={() => openLegal('privacy')}
                    />
                </View> */}

                {/* <Text style={styles.versionText}>App Version 1.0.0</Text> */}
            </ScrollView>

            {/* Change Password Modal */}
            <Modal visible={changePasswordVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, actualTheme === 'dark' && { backgroundColor: '#1E1E1E' }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: textColor }]}>Change Password</Text>
                                <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                                    <Ionicons name="close" size={24} color={textColor} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.label, { color: textColor }]}>Current Password</Text>
                                    <TextInput
                                        style={[styles.input, actualTheme === 'dark' && styles.inputDark]}
                                        secureTextEntry
                                        value={passwordForm.current}
                                        onChangeText={t => setPasswordForm({ ...passwordForm, current: t })}
                                        placeholderTextColor="#888"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.label, { color: textColor }]}>New Password</Text>
                                    <TextInput
                                        style={[styles.input, actualTheme === 'dark' && styles.inputDark]}
                                        secureTextEntry
                                        value={passwordForm.new}
                                        onChangeText={t => setPasswordForm({ ...passwordForm, new: t })}
                                        placeholderTextColor="#888"
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Text style={[styles.label, { color: textColor }]}>Confirm New Password</Text>
                                    <TextInput
                                        style={[styles.input, actualTheme === 'dark' && styles.inputDark]}
                                        secureTextEntry
                                        value={passwordForm.confirm}
                                        onChangeText={t => setPasswordForm({ ...passwordForm, confirm: t })}
                                        placeholderTextColor="#888"
                                    />
                                </View>

                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={handleChangePassword}
                                    disabled={loadingPassword}
                                >
                                    {loadingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Update Password</Text>}
                                </TouchableOpacity>
                                <View style={{ height: 20 }} />
                            </ScrollView>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Blocked Users Modal */}
            <Modal visible={blockedUsersVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.fullScreenModal, actualTheme === 'dark' && styles.darkContainer]}>
                    <View style={[styles.header, actualTheme === 'dark' && styles.headerDark]}>
                        <TouchableOpacity onPress={() => setBlockedUsersVisible(false)} style={styles.backButton}>
                            <Ionicons name="close" size={24} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: textColor }]}>Blocked Users</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {loadingBlocked ? (
                        <ActivityIndicator size="large" color="#E31C25" style={{ marginTop: 50 }} />
                    ) : (
                        <FlatList
                            data={blockedUsers}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={{ padding: 20 }}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="people-outline" size={50} color="#ccc" />
                                    <Text style={styles.emptyText}>No blocked users</Text>
                                </View>
                            }
                            renderItem={({ item }) => (
                                <View style={[styles.userItem, actualTheme === 'dark' && { backgroundColor: '#1E1E1E' }]}>
                                    <Image
                                        source={{ uri: item.profilePicture || 'https://via.placeholder.com/50' }}
                                        style={styles.userAvatar}
                                    />
                                    <Text style={[styles.userName, { color: textColor }]}>{item.name}</Text>
                                    <TouchableOpacity
                                        style={styles.unblockButton}
                                        onPress={() => handleUnblock(item._id)}
                                    >
                                        <Text style={styles.unblockText}>Unblock</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </View>
            </Modal>

            {/* Legal Modal */}
            <Modal visible={legalModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.fullScreenModal, actualTheme === 'dark' && styles.darkContainer]}>
                    <View style={[styles.header, actualTheme === 'dark' && styles.headerDark]}>
                        <TouchableOpacity onPress={() => setLegalModalVisible(false)} style={styles.backButton}>
                            <Ionicons name="close" size={24} color={textColor} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: textColor }]}>{legalContent.title}</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <Text style={[styles.legalText, { color: textColor }]}>{legalContent.body}</Text>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    lightContainer: { backgroundColor: '#F8F9FA' },
    darkContainer: { backgroundColor: '#121212' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerDark: {
        backgroundColor: '#121212',
        borderBottomColor: '#333',
    },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginBottom: 10,
        marginTop: 10,
        marginLeft: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textMuted: { color: '#888' },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 20,
        elevation: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
    },
    settingItemDark: { borderBottomColor: '#333' },
    settingLeft: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingTitle: { fontSize: 16, fontWeight: '500' },
    textDark: { color: '#fff' },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 48 },
    versionText: { textAlign: 'center', color: '#999', marginTop: 10, marginBottom: 30 },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputContainer: { marginBottom: 15 },
    label: { marginBottom: 5, fontWeight: '500' },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    },
    inputDark: {
        backgroundColor: '#333',
        color: '#fff',
    },
    actionButton: {
        backgroundColor: '#E31C25',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // Blocked Users
    fullScreenModal: { flex: 1, backgroundColor: '#F8F9FA' },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
    },
    userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    userName: { flex: 1, fontSize: 16, fontWeight: '600' },
    unblockButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    unblockText: { fontSize: 12, color: '#333' },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#888', marginTop: 10 },

    legalText: { fontSize: 16, lineHeight: 24 }
});

