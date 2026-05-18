import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SearchModal from '../common/SearchModal';
import NotificationsModal from '../common/NotificationItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useDrawer } from '../../context/DrawerContext';
import DirectMessagesModal from '../common/DirectMessagesModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import socketService from '../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_SEEN_REQ = 'ASC_LAST_SEEN_REQUESTS';
const LAST_SEEN_GEN = 'ASC_LAST_SEEN_GENERAL';
const CLEARED_KEY = 'ASC_CLEARED_NOTIFICATIONS';

export default function AppHeader() {
  const { setDrawerOpen } = useDrawer() as any;
  const { user } = useSelector((state: any) => state.auth);
  const router = useRouter();

  const [searchVisible, setSearchVisible] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDM, setShowDM] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [pendingFollowCount, setPendingFollowCount] = useState(0);

  // Animation for notification badge
  const scale = useSharedValue(1);

  // Memoized fetcher to avoid re-creation
  const fetchNotificationCounts = useCallback(async () => {
    if (!user?._id) return;
    try {
      const [seenReq, seenGen, clearedRaw] = await Promise.all([
        AsyncStorage.getItem(LAST_SEEN_REQ),
        AsyncStorage.getItem(LAST_SEEN_GEN),
        AsyncStorage.getItem(CLEARED_KEY),
      ]);
      
      const lastReq = seenReq ? parseInt(seenReq) : 0;
      const lastGen = seenGen ? parseInt(seenGen) : 0;
      const cleared = clearedRaw ? JSON.parse(clearedRaw) : [];

      // 1. Follow Requests
      const followRes = await api.get(`/user/${user._id}/followers?includePending=true`);
      if (followRes?.data?.success && Array.isArray(followRes?.data?.data)) {
        const newRequests = followRes.data.data.filter((f: any) => {
          const isPending = f.status === 'pending';
          const isNew = new Date(f.createdAt).getTime() > lastReq;
          return isPending && !cleared.includes(f._id) && isNew;
        });
        setPendingFollowCount(newRequests.length);
      }

      // 2. Notifications
      const notifRes = await api.get('/notifications');
      if (Array.isArray(notifRes.data)) {
        const newGeneral = notifRes.data.filter((n: any) => {
          const isAdminType = n.type === 'broadcast' || n.type === 'targeted';
          const isNew = new Date(n.createdAt).getTime() > lastGen;
          return isAdminType && !n.read && !cleared.includes(n._id) && isNew;
        });
        setTotalNotifications(newGeneral.length);
      }
    } catch (error) {
      console.log('Sync error:', error);
    }
  }, [user?._id]);

  // Fetch unread messages count
  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/messages/users');
      if (Array.isArray(res.data)) {
        const total = res.data.reduce((acc: number, u: any) => acc + (u.unreadCount || 0), 0);
        setUnreadCount(total);
      } else if (res.data?.success && Array.isArray(res.data?.data)) {
        const total = res.data.data.reduce((acc: number, u: any) => acc + (u.unreadCount || 0), 0);
        setUnreadCount(total);
      }
    } catch (error) {
      console.log('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1, 
      true 
    );

    if (user?._id) {
      fetchUnreadCount();
      fetchNotificationCounts();

      socketService.connect(user._id);

      const onUpdate = () => fetchNotificationCounts();
      const onMsg = () => fetchUnreadCount();

      socketService.onMessage(onMsg);
      socketService.onFollowRequest(onUpdate);

      return () => {
        socketService.removeListener('receiveMessage', onMsg);
        socketService.removeListener('followRequest', onUpdate);
      };
    }
  }, [user?._id, fetchNotificationCounts]);

  // Refetch counts when the header is re-rendered (navigation return)
  useEffect(() => {
    fetchNotificationCounts();
  }, [fetchNotificationCounts]);

  // Refetch when DM modal closes (to clear counts)
  useEffect(() => {
    if (!showDM) {
      fetchUnreadCount();
    }
  }, [showDM]);

  const animatedBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={styles.headerAbsolute}>
        <LinearGradient
          colors={['#FF1F29', '#E31C25', '#7A090E']}
          locations={[0, 0.4, 1]}
          style={styles.gradientHeader}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              
              {/* Left Group: Menu & Branding Integrated */}
              <View style={styles.centerGroup}>
                <TouchableOpacity
                  onPress={() => setDrawerOpen(true)}
                  activeOpacity={0.7}
                  style={styles.actionIcon}
                >
                  <MaterialIcons name="menu" size={26} color="#fff" />
                </TouchableOpacity>

                <View style={styles.brandGroup}>
                  <View style={styles.logoRing}>
                    <Image
                      source={require('../../assets/images/ATPL LOGO.jpeg')}
                      style={styles.logoImg}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.textStack}>
                    <Text style={styles.mainTitle}>ATPL</Text>
                    <Text style={styles.subTitle}>SCORE</Text>
                  </View>
                </View>
              </View>

              {/* Right Group: Action Bar & Notifications */}
              <View style={styles.actionRegistry}>
                <View style={styles.actionCapsule}>
                  <TouchableOpacity
                    onPress={() => setSearchVisible(true)}
                    activeOpacity={0.7}
                    style={styles.capsuleBtn}
                  >
                    <Ionicons name="search" size={22} color="#fff" />
                  </TouchableOpacity>
                  
                  <View style={styles.divider} />

                  <TouchableOpacity
                    onPress={() => setShowDM(true)}
                    activeOpacity={0.7}
                    style={styles.capsuleBtn}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={22} color="#fff" />
                    {unreadCount > 0 && <View style={styles.badgeIndicator} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/notifications')}
                  activeOpacity={0.7}
                  style={styles.notifBadge}
                >
                  <Ionicons name="notifications" size={24} color="#E31C25" />
                  {(totalNotifications + pendingFollowCount) > 0 && (
                    <Animated.View style={[styles.pulseCounter, animatedBadgeStyle]}>
                      <Text style={styles.counterText}>
                        {totalNotifications + pendingFollowCount}
                      </Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              </View>

            </View>
          </SafeAreaView>
          
          <View style={styles.glassHighlight} />
        </LinearGradient>
      </View>

      <SearchModal visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <NotificationsModal visible={showNotifications} onClose={() => setShowNotifications(false)} />
      <DirectMessagesModal visible={showDM} onClose={() => setShowDM(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 100,
    backgroundColor: 'transparent',
  },
  headerAbsolute: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    elevation: 25,
    shadowColor: '#7A090E',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    backgroundColor: 'transparent', // Critical: Eliminate white corners
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 4 : 0,
    paddingBottom: 20,
  },
  headerContent: {
    height: 38, // Increased height for center satisfaction
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  logoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  textStack: {
    justifyContent: 'center',
  },
  mainTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 22,
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
    lineHeight: 10,
    marginTop: 1,
  },
  actionRegistry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    paddingHorizontal: 6,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  capsuleBtn: {
    width: 42,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  notifBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  badgeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFEB3B',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 1)',
  },
  pulseCounter: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFEB3B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E31C25',
    paddingHorizontal: 4,
    zIndex: 10,
  },
  counterText: {
    color: '#E31C25',
    fontSize: 10,
    fontWeight: '900',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
