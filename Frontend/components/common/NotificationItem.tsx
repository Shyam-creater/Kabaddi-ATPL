import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { userService } from '../../services/api';
import socketService from '../../services/socketService';
import { useAppSelector } from '../../store/hooks';

const { width } = Dimensions.get('window');

interface NotificationProps {
  visible: boolean;
  onClose: () => void;
}

interface FollowRequest {
  _id: string;
  name: string;
  image: string;
  role?: string;
  status: string;
}

export default function NotificationsModal({ visible, onClose }: NotificationProps) {
  const slideAnim = useRef(new Animated.Value(1000)).current;
  const [activeTab, setActiveTab] = useState<'General' | 'Matches' | 'FollowRequests'>('FollowRequests');
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [generalNotifications, setGeneralNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(1000);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();

      // Fetch both when modal opens
      fetchFollowRequests();
      fetchGeneralNotifications();
    }
  }, [visible]);

  // Socket.IO listener for new follow requests
  useEffect(() => {
    if (visible) {
      const onNewRequest = () => fetchFollowRequests();
      const onNewGeneral = () => fetchGeneralNotifications();

      socketService.onFollowRequest(onNewRequest);
      // We can also have a socket listener for general notifications if payload exists
      
      return () => {
        socketService.removeListener('followRequest', onNewRequest);
      };
    }
  }, [visible]);

  const fetchFollowRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/user/${user?._id}/followers?includePending=true`);
      if (response.data.success) {
        const pending = response.data.data.filter((f: any) => f.status === 'pending');
        setFollowRequests(pending);
      }
    } catch (error) {
      console.error('Failed to fetch follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setGeneralNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch general notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchGeneralNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      fetchGeneralNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleAccept = async (userId: string) => {
    try {
      await userService.acceptFollowRequest(userId);
      Alert.alert('Success', 'Follow request accepted');
      fetchFollowRequests();
    } catch (error) {
      console.error('Failed to accept follow request:', error);
      Alert.alert('Error', 'Failed to accept follow request');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await api.post(`/user/unfollow/${userId}`);
      Alert.alert('Success', 'Follow request rejected');
      fetchFollowRequests();
    } catch (error) {
      console.error('Failed to reject follow request:', error);
      Alert.alert('Error', 'Failed to reject follow request');
    }
  };

  const goBack = () => {
    Animated.timing(slideAnim, {
      toValue: 1000,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const renderFollowRequest = ({ item }: { item: FollowRequest }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => { onClose(); }}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: '#E31C25', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
              {item.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <Text style={styles.message}>{item.name} wants to follow you</Text>
        <Text style={styles.time}>{item.role || 'Player'}</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item._id)}>
            <Ionicons name="close-circle" size={18} color="#666" />
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderGeneralNotification = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, !item.read && { backgroundColor: '#fff5f5' }]}
      onPress={() => handleMarkAsRead(item._id)}
    >
      <View style={styles.textContainer}>
        <View style={styles.headerRow}>
          <View style={styles.iconAndTitle}>
            <View style={[styles.avatar, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }]}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.miniIcon} />
              ) : (
                <Ionicons name={item.type === 'broadcast' ? "megaphone" : "notifications"} size={20} color="#E31C25" />
              )}
            </View>
            <Text style={[styles.message, !item.read && { fontWeight: '800' }]} numberOfLines={1}>{item.title}</Text>
          </View>
          <View style={styles.headerRight}>
            {!item.read && <View style={styles.unreadDot} />}
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color="#ccc" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={styles.bodyColumn}>
            <Text style={styles.bodyText} numberOfLines={3}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
          {item.contentImage && (
            <Image source={{ uri: item.contentImage }} style={styles.contentIcon} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No notifications here</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.statusBar} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={goBack}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications Centre</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'FollowRequests' && { borderBottomColor: '#E31C25' }]}
              onPress={() => setActiveTab('FollowRequests')}
            >
              <Text style={[styles.tabText, activeTab === 'FollowRequests' && styles.activeTab]}>
                Follows
              </Text>
              {followRequests.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{followRequests.length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'General' && { borderBottomColor: '#E31C25' }]}
              onPress={() => setActiveTab('General')}
            >
              <Text style={[styles.tabText, activeTab === 'General' && styles.activeTab]}>
                General
              </Text>
              {generalNotifications.some(n => !n.read) && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{generalNotifications.filter(n => !n.read).length}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'Matches' && { borderBottomColor: '#E31C25' }]}
              onPress={() => setActiveTab('Matches')}
            >
              <Text style={[styles.tabText, activeTab === 'Matches' && styles.activeTab]}>
                League
              </Text>
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E31C25" />
            </View>
          ) : (
            <FlatList
              data={
                activeTab === 'FollowRequests' ? followRequests : 
                activeTab === 'General' ? generalNotifications : []
              }
              keyExtractor={(item) => item._id}
              renderItem={activeTab === 'FollowRequests' ? renderFollowRequest : renderGeneralNotification}
              ListEmptyComponent={renderEmptyState}
              contentContainerStyle={(activeTab === 'FollowRequests' ? followRequests.length : generalNotifications.length) === 0 ? { flex: 1 } : {}}
            />
          )}
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBar: {
    height: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#E31C25',
  },
  header: {
    backgroundColor: '#E31C25',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  activeTab: {
    color: '#E31C25',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#E31C25',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#eee',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  acceptText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  rejectText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
  bodyText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginVertical: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E31C25',
    position: 'absolute',
    top: 20,
    right: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bodyColumn: {
    flex: 1,
  },
  contentIcon: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  deleteBtn: {
    padding: 4,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  miniIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  notificationImageContainer: {
    display: 'none' // Removed in favor of miniIcon
  },
});
