import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
    StatusBar,
    TouchableOpacity,
    ScrollView,
    Image,
    Linking,
} from 'react-native';
import { Easing } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { useDrawer } from '../../context/DrawerContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '../../store/hooks';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85;

interface DrawerMenuProps {
    visible: boolean;
    onClose: () => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ visible, onClose }) => {
    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const [showMore, setShowMore] = useState(false);
    const router = useRouter();
    // Use any cast to avoid context null error without changing context file
    const { setDrawerOpen } = useDrawer() as any;
    const { user } = useAppSelector(state => state.auth);

    // Unified Menu Items - Organized by category
    const menuItems = [
        // 🏆 Core Cricket Features
        { icon: 'emoji-events', label: 'Team Player Registration', screen: '/tournament', color: '#4CAF50', type: 'material' },
        { icon: 'search', label: 'Looking', screen: '/looking', color: '#2196F3', type: 'material' },
        { icon: 'live-tv', label: 'Go Live', screen: '/live', color: '#F44336', type: 'material' },

        // 👤 User Features
        { icon: 'bar-chart', label: 'Profile Statistics', screen: '/profile/stats', color: '#9C27B0', type: 'material' },
        { icon: 'storefront', label: 'Store', badge: '👕', screen: '/store', color: '#E91E63', type: 'material' },

        // 🏏 Cricket Features
        { icon: 'gavel', label: 'Auction', screen: '/auction', color: '#FF9800', type: 'material' },
        { icon: 'groups', label: 'Franchise Teams', screen: '/teams', color: '#3F51B5', type: 'material' },
        { icon: 'military-tech', label: 'Awards', screen: '/awards', color: '#FFD700', type: 'material' },

        // 📊 Info Features
        { icon: 'leaderboard', label: 'Points Table', screen: '/points-table', color: '#00BCD4', type: 'material' },
        { icon: 'photo-library', label: 'Gallery', screen: '/gallery', color: '#8BC34A', type: 'material' },

        // 🔗 App Utilities
        { icon: 'people', label: 'Community', screen: '/community', color: '#673AB7', type: 'material' },
        { icon: 'article', label: 'Blog', screen: '/blog', color: '#1a1a2e', type: 'material' },
        { icon: 'support-agent', label: 'Contact', screen: '/contact', color: '#607D8B', type: 'material' },
        { icon: 'share', label: 'Share the App', screen: '/share', color: '#009688', type: 'material' },
        { icon: 'star-rate', label: 'Rate Us', screen: '/rate', color: '#FFC107', type: 'material' },
        { icon: 'qr-code', label: 'App Code', screen: '/app-code', color: '#795548', type: 'material' },
    ];

    const moreItemsList = [
        { icon: 'info-outline', label: "What's New", screen: '/whats-new', type: 'material' },
        { icon: 'language', label: 'Change Language', screen: '/language', type: 'material' },
        { icon: 'photo-camera', label: 'Instagram', screen: '/instagram' },
        { icon: 'smart-display', label: 'YouTube', screen: '/youtube', type: 'material' },
        { icon: 'facebook', label: 'Facebook', screen: '/facebook', type: 'material' },
        { icon: 'close', label: 'X', screen: '/x', type: 'material' },
        { icon: 'person-outline', label: 'About Us', screen: '/about', type: 'material' },
        { icon: 'article', label: 'Blog', screen: '/blog', type: 'material' },
        { icon: 'help-outline', label: 'Help / FAQs', screen: '/help', type: 'material' },
        { icon: 'policy', label: 'Privacy Policy', screen: '/settings/privacypolicyscreen', type: 'material' },
        { icon: 'gavel', label: 'Terms of Service', screen: '/settings/termsscreen', type: 'material' },
        { icon: 'shield', label: 'Child Safety Policy', screen: '/settings/childsafety', type: 'material' },
    ];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: visible ? 0 : -DRAWER_WIDTH,
                duration: 350,
                easing: Easing.out(Easing.back(1)), // Slight bounce effect
                useNativeDriver: true,
            }),
            Animated.timing(overlayOpacity, {
                toValue: visible ? 1 : 0,
                duration: 350,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start();
    }, [visible]);

    const handleProfileNavigation = () => {
        console.log('Navigating to profile');
        setDrawerOpen(false);
        router.push('/profile');
    };

    const handleNavigation = (screen: string) => {
        if (screen === '/rate') {
            setDrawerOpen(false);
            Linking.openURL('https://play.google.com/store/apps/details?id=com.aattum.tplscore').catch(err => console.error('An error occurred', err));
            return;
        }
        if (screen === '/share') {
            setDrawerOpen(false);
            // Optionally, handle sharing right away or navigate
            router.push(screen as any);
            return;
        }
        if (screen) {
            setDrawerOpen(false);
            router.push(screen as any);
        }
    };

    const renderMenuItem = (item: any, index: number) => (
        <TouchableOpacity
            key={index}
            style={styles.menuItem}
            activeOpacity={0.7}
            delayPressIn={0}
            onPress={() => handleNavigation(item.screen)}
        >
            <View style={styles.menuItemContent}>
                <View style={styles.menuLeft}>
                    <MaterialIcons
                        name={item.icon}
                        size={20}
                        color={item.color || "#555"}
                        style={styles.menuIcon}
                    />
                    <Text style={styles.menuText}>{item.label}</Text>
                </View>

                {item.badge && (
                    <LinearGradient
                        colors={item.badge === 'PRO' ? ['#FFD700', '#FDB931'] : ['#4facfe', '#00f2fe']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.menuBadge}
                    >
                        <Text style={[
                            styles.menuBadgeText,
                            item.badge === 'PRO' ? { color: '#000' } : { color: '#fff' }
                        ]}>{item.badge}</Text>
                    </LinearGradient>
                )}
            </View>
        </TouchableOpacity>
    );
    
    const sport =
        user?.sports?.[0]?.toLowerCase() ||
        (user?.playerProfile?.cricket ? 'cricket' : null) ||
        (user?.playerProfile?.kabaddi ? 'kabaddi' : null);

    const totalMatches =
        sport === 'cricket'
            ? user?.playerProfile?.cricket?.careerSummary?.totalMatches ?? 0
            : sport === 'kabaddi'
                ? user?.playerProfile?.kabaddi?.careerSummary?.matchesPlayed ?? 0
                : 0;


    // @ts-ignore: Accessing private property _value for optimization
    if (!visible && (translateX as any)._value === -DRAWER_WIDTH) return null;

    return (
        <View style={styles.container} pointerEvents={visible ? 'auto' : 'none'}>
            {/* Darker Overlay */}
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
            </TouchableWithoutFeedback>

            <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* 🔹 Floating Profile Card */}
                        <View style={styles.headerContainer}>
                            <LinearGradient
                                colors={['#141E30', '#243B55']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.profileCard}
                            >
                                <Pressable
                                    style={styles.profileRow}
                                    onPress={handleProfileNavigation}
                                >
                                    <View style={styles.avatarContainer}>
                                        {user?.profilePicture ? (
                                            <Image
                                                source={{ uri: user.profilePicture }}
                                                style={styles.avatar}
                                            />
                                        ) : (
                                            <View style={[styles.avatar, { backgroundColor: '#E31C25', justifyContent: 'center', alignItems: 'center' }]}>
                                                <Ionicons name="person" size={24} color="#fff" />
                                            </View>
                                        )}
                                        <View style={styles.onlineIndicator} />
                                    </View>

                                    <View style={styles.profileInfo}>
                                        <Text style={styles.profileName}>{user?.name || 'Guest User'}</Text>
                                        <Text style={styles.profilePhone}>{user?.phone || 'No Phone Number'}</Text>
                                        <View style={styles.planBadge}>
                                            <Text style={styles.planText}>
                                                {user?.sports && user.sports.length > 0
                                                    ? `${user.sports[0].toUpperCase()} PLAYER`
                                                    : (user?.role?.toUpperCase() || 'PLAYER')}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.viewProfileBtn}
                                        onPress={handleProfileNavigation}
                                    >
                                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </Pressable>

                                {/* Stats/Progress - Removed Explicit Button */}
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{user?.profileProgress ?? 0}%</Text>
                                        <Text style={styles.statLabel}>Completed</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.statItem}>
                                        <Text style={styles.statValue}>{totalMatches}</Text>
                                        <Text style={styles.statLabel}>Matches</Text>
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Menu Groups */}
                        <View style={styles.menuGroup}>
                            {menuItems.map(renderMenuItem)}
                        </View>

                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => setShowMore(!showMore)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.moreButtonText}>{showMore ? 'Show Less' : 'More Options'}</Text>
                            <Ionicons name={showMore ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                        </TouchableOpacity>

                        {showMore && (
                            <View style={styles.moreGroup}>
                                {moreItemsList.map(renderMenuItem)}
                            </View>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.versionText}>v1.0.0 • Made with ❤️</Text>
                        </View>
                    </ScrollView>

                </SafeAreaView>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)', // Darker dim
    },
    drawer: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        backgroundColor: '#F3F4F6', // Light gray background for contrast
        borderTopRightRadius: 30,
        borderBottomRightRadius: 30,
        overflow: 'hidden',
        zIndex: 2100,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 10, height: 0 }, shadowOpacity: 0.3, shadowRadius: 15 },
            android: { elevation: 25 },
        }),
    },
    headerContainer: {
        marginBottom: 24,
        marginTop: 10,
    },
    profileCard: {
        borderRadius: 24,
        padding: 20,
        shadowColor: '#E31C25',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 12,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: '#fff',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        backgroundColor: '#4CAF50',
        borderRadius: 7,
        borderWidth: 2,
        borderColor: '#141E30',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    profilePhone: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginBottom: 8,
        fontWeight: '500',
    },
    planBadge: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    planText: {
        color: '#FFD700',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    viewProfileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    fullProfileBtn: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    fullProfileBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.15)',
        paddingTop: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
    },
    statLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '600',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
        paddingTop: 10,
    },
    menuGroup: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    moreGroup: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionHeader: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '700',
        marginBottom: 8,
        marginLeft: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    menuItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    menuIcon: {
        marginRight: 16,
        opacity: 0.8,
    },
    menuText: {
        fontSize: 16,
        color: '#1A1A1A',
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    menuBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    menuBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    moreButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    moreButtonText: {
        color: '#4B5563',
        fontWeight: '700',
        marginRight: 8,
        fontSize: 14,
    },
    footer: {
        alignItems: 'center',
        marginTop: 10,
    },
    versionText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default DrawerMenu;
