import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { userService } from '../services/userService';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CLEARED_KEY = 'ASC_CLEARED_NOTIFICATIONS';
const LAST_SEEN_REQ = 'ASC_LAST_SEEN_REQUESTS';
const LAST_SEEN_GEN = 'ASC_LAST_SEEN_GENERAL';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useSelector((state: any) => state.auth);
  
  const [activeTab, setActiveTab] = useState<'general' | 'requests'>('requests');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [followRequests, setFollowRequests] = useState<any[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [lastSeenRequests, setLastSeenRequests] = useState<number>(0);
  const [lastSeenGeneral, setLastSeenGeneral] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Unified count for the header - only show items created AFTER last seen
  const totalUnreadGeneral = notifications.filter(n => {
    const isNew = new Date(n.createdAt).getTime() > lastSeenGeneral;
    return !n.read && !clearedIds.includes(n._id) && isNew;
  }).length;

  const totalPendingRequests = followRequests.filter(req => {
    const isNew = new Date(req.createdAt).getTime() > lastSeenRequests;
    return req.status === 'pending' && !clearedIds.includes(req._id) && isNew;
  }).length;

  const unifiedTotalCount = totalUnreadGeneral + totalPendingRequests;

  const loadInitialState = async () => {
    try {
      const [savedCleared, seenReq, seenGen] = await Promise.all([
        AsyncStorage.getItem(CLEARED_KEY),
        AsyncStorage.getItem(LAST_SEEN_REQ),
        AsyncStorage.getItem(LAST_SEEN_GEN),
      ]);
      
      if (savedCleared) setClearedIds(JSON.parse(savedCleared));
      if (seenReq) setLastSeenRequests(parseInt(seenReq));
      if (seenGen) setLastSeenGeneral(parseInt(seenGen));
    } catch (e) {
      console.log('Error loading state:', e);
    }
  };

  const saveClearedIds = async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(CLEARED_KEY, JSON.stringify(ids));
    } catch (e) {
      console.log('Failed to save cleared IDs:', e);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchNotifications(), fetchFollowRequests(), loadInitialState()]);
    setLoading(false);
    setRefreshing(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const adminNotifications = (res.data || []).filter((n: any) => {
        const hasContent = n.title && n.title.trim().length > 0 && n.body && n.body.trim().length > 0;
        const isAdminType = n.type === 'broadcast' || n.type === 'targeted';
        return hasContent && isAdminType;
      });
      setNotifications(adminNotifications);
    } catch (error) {
      console.log('Error fetching notifications:', error);
    }
  };

  const fetchFollowRequests = async () => {
    if (!user?._id) return;
    try {
      const res = await api.get(`/user/${user._id}/followers?includePending=true`);
      if (res.data.success) {
        setFollowRequests(res.data.data);
      }
    } catch (error) {
      console.log('Error fetching follow requests:', error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user?._id]);

  useEffect(() => {
    const updateLastSeen = async () => {
      const now = Date.now();
      if (activeTab === 'requests') {
        setLastSeenRequests(now);
        await AsyncStorage.setItem(LAST_SEEN_REQ, now.toString());
      } else {
        setLastSeenGeneral(now);
        await AsyncStorage.setItem(LAST_SEEN_GEN, now.toString());
        markAllGeneralAsRead();
      }
    };
    updateLastSeen();
  }, [activeTab]);

  const markAllGeneralAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map(id => api.put(`/notifications/${id}/read`)));
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.log('Error marking all as read:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const target = notifications.find(n => n._id === id);
      if (target && target.type === 'broadcast') return;

      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.log('Failed to mark as read:', error);
    }
  };

  const handleSoftClearAll = async () => {
    const currentTabIds = activeTab === 'requests' 
      ? followRequests.map(r => r._id) 
      : notifications.map(n => n._id);
    
    const newCleared = [...new Set([...clearedIds, ...currentTabIds])];
    setClearedIds(newCleared);
    await saveClearedIds(newCleared);
  };

  const handleDelete = async (id: string) => {
    const newCleared = [...new Set([...clearedIds, id])];
    setClearedIds(newCleared);
    await saveClearedIds(newCleared);
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      const res = await userService.acceptFollowRequest(userId);
      if (res.data.success) {
        setFollowRequests(prev => 
          prev.map(req => req._id === userId ? { ...req, status: 'accepted' } : req)
        );
      }
    } catch (error) {
      console.log('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      const res = await userService.removeFollower(userId);
      if (res.data.success) {
        setFollowRequests(prev => 
          prev.map(req => req._id === userId ? { ...req, status: 'rejected' } : req)
        );
      }
    } catch (error) {
      console.log('Failed to reject request:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => !clearedIds.includes(n._id));
  const filteredRequests = followRequests.filter(req => !clearedIds.includes(req._id));

  const renderNotificationItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => item.type !== 'broadcast' && handleMarkAsRead(item._id)}
      activeOpacity={0.8}
    >
      <View style={styles.textContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.titleArea}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.iconAvatar} />
            ) : (
              <LinearGradient
                colors={item.type === 'broadcast' ? ['#E31C25', '#900C12'] : ['#4f46e5', '#3730a3']}
                style={styles.iconGradient}
              >
                <Ionicons 
                  name={item.type === 'broadcast' ? "megaphone" : "notifications"} 
                  size={20} 
                  color="#fff" 
                />
              </LinearGradient>
            )}
            <View style={styles.titleInfo}>
              <Text style={[styles.title, !item.read && styles.boldText]} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.timeTag}>
                {(() => {
                  try {
                    const d = new Date(item.createdAt);
                    return isNaN(d.getTime()) ? 'Recently' : 
                      `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                  } catch (e) { return 'Recently'; }
                })()}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {!item.read && item.type !== 'broadcast' && <View style={styles.unreadPulse} />}
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Ionicons name="close-circle-outline" size={18} color="#bbb" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.bodyColumn}>
            <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
          </View>
          {item.contentImage && (
            <Image source={{ uri: item.contentImage }} style={styles.contentAsset} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFollowRequestItem = ({ item }: { item: any }) => (
    <View style={styles.requestCardCompact}>
      <View style={styles.requestRow}>
        <Image 
          source={item.image ? { uri: item.image } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
          style={styles.avatarMini} 
        />
        
        <View style={styles.compactContent}>
          <View style={styles.textBlock}>
            <Text style={styles.requestMainText} numberOfLines={1}>
              <Text style={styles.boldName}>{item.name}</Text>
              <Text style={styles.timeInline}> • {(() => {
                try {
                  const d = new Date(item.createdAt);
                  return isNaN(d.getTime()) ? 'now' : d.toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                } catch (e) { return 'now'; }
              })()}</Text>
            </Text>
          </View>

          <View style={styles.miniActions}>
            {item.status === 'pending' ? (
              <View style={styles.miniBtnGroup}>
                <TouchableOpacity onPress={() => handleAcceptRequest(item._id)} style={styles.btnIconAccept}>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRejectRequest(item._id)} style={styles.btnIconReject}>
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[
                styles.statusPillSmall, 
                item.status === 'accepted' ? styles.pillGreen : styles.pillRed
              ]}>
                <Text style={[
                  styles.pillTextSmall, 
                  item.status === 'accepted' ? styles.pillTextGreen : styles.pillTextRed
                ]}>
                  {item.status === 'accepted' ? 'Accepted' : 'Rejected'}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.tinyDelete}>
              <Ionicons name="close" size={14} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Header with official ATPL-Red Theme & Perfect Alignment */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={['#E31C25', '#900C12']} style={styles.headerGradient}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              {/* Left Action */}
              <TouchableOpacity onPress={() => router.back()} style={styles.sideBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              
              {/* Centered Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitleText}>Notifications</Text>
                {unifiedTotalCount > 0 && (
                  <View style={styles.headerCountBadge}>
                    <Text style={styles.headerCountText}>{unifiedTotalCount}</Text>
                  </View>
                )}
              </View>

              {/* Right Action */}
              <TouchableOpacity onPress={handleSoftClearAll} style={styles.clearAllBox}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {/* Tab Selector - Premium Design */}
            <View style={styles.tabBar}>
              <TouchableOpacity 
                onPress={() => setActiveTab('requests')}
                style={[styles.tabItem, activeTab === 'requests' && styles.activeTabItem]}
              >
                <View style={styles.tabContentRow}>
                  <Ionicons name="person-add" size={16} color={activeTab === 'requests' ? '#E31C25' : '#fff'} />
                  <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests</Text>
                  {totalPendingRequests > 0 && activeTab !== 'requests' && (
                    <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{totalPendingRequests}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setActiveTab('general')}
                style={[styles.tabItem, activeTab === 'general' && styles.activeTabItem]}
              >
                <View style={styles.tabContentRow}>
                  <Ionicons name="megaphone" size={16} color={activeTab === 'general' ? '#E31C25' : '#fff'} />
                  <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General</Text>
                  {totalUnreadGeneral > 0 && activeTab !== 'general' && (
                    <View style={styles.miniBadge}><Text style={styles.miniBadgeText}>{totalUnreadGeneral}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#E31C25" />
          <Text style={styles.loadingMsg}>Syncing Communication Matrix...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'requests' ? filteredRequests : filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'requests' ? renderFollowRequestItem : renderNotificationItem}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.nothingWrap}>
              <Ionicons 
                name={activeTab === 'requests' ? "person-remove-outline" : "notifications-off-outline"} 
                size={80} 
                color="#eee" 
              />
              <Text style={styles.nothingHeadline}>
                {activeTab === 'requests' ? 'No New Requests' : 'Quiet Feed'}
              </Text>
              <Text style={styles.nothingPara}>
                {activeTab === 'requests' 
                  ? 'All requests have been successfully routed.' 
                  : 'Your communication timeline is clear.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerWrapper: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 5 : 0,
    paddingBottom: 25,
  },
  headerContent: {
    height: 54, // Unified high-fidelity height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sideBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerCountBadge: {
    backgroundColor: '#fff',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerCountText: {
    color: '#E31C25',
    fontSize: 10,
    fontWeight: '900',
  },
  clearAllBox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  clearAllText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  activeTabItem: {
    backgroundColor: '#fff',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  activeTabText: {
    color: '#E31C25',
  },
  miniBadge: {
    backgroundColor: '#E31C25',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  miniBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  unreadCard: {
    borderColor: '#ffe8e8',
    backgroundColor: '#fffafa',
  },
  textContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '900',
  },
  timeTag: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  unreadPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E31C25',
  },
  deleteBtn: {
    padding: 4,
  },
  contentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bodyColumn: {
    flex: 1,
  },
  body: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  contentAsset: {
    width: 70,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  requestCardCompact: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eee',
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    marginRight: 10,
  },
  requestMainText: {
    fontSize: 12,
    color: '#666',
  },
  boldName: {
    fontWeight: '800',
    color: '#1a1a1a',
  },
  roleText: {
    color: '#999',
    fontSize: 11,
  },
  actionPrompt: {
    color: '#E31C25',
    fontWeight: '700',
    fontSize: 11,
  },
  timeInline: {
    color: '#bbb',
    fontSize: 10,
    fontWeight: '500',
  },
  miniActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnIconAccept: {
    padding: 2,
  },
  btnIconReject: {
    padding: 2,
  },
  statusPillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillGreen: {
    backgroundColor: '#ECFDF5',
  },
  pillRed: {
    backgroundColor: '#FEF2F2',
  },
  pillTextSmall: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillTextGreen: {
    color: '#059669',
  },
  pillTextRed: {
    color: '#EF4444',
  },
  tinyDelete: {
    marginLeft: 4,
    padding: 2,
  },
  loadingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMsg: {
    marginTop: 15,
    fontSize: 12,
    color: '#999',
    fontWeight: '800',
    letterSpacing: 1,
  },
  nothingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  nothingHeadline: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    marginTop: 20,
  },
  nothingPara: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
