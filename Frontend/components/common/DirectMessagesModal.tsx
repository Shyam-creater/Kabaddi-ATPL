import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Animated,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  AlertButton,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import socketService from '../../services/socketService';
import api from '../../services/api';

import UserProfileModal from './UserProfileModal';

const { height, width } = Dimensions.get('window');

// 🟢 Helper to format "Last Seen"
const formatLastSeen = (dateString: string) => {
  if (!dateString) return 'Offline';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
};

interface DirectMessagesModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DirectMessagesModal({ visible, onClose }: DirectMessagesModalProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const { user: currentUser } = useSelector((state: any) => state.auth);

  const [activeChat, setActiveChat] = useState<any>(null); // The user we are chatting with
  const [conversations, setConversations] = useState<any[]>([]); // List of users to chat
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null); // { uri, type }
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Profile View State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [viewUserId, setViewUserId] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Animation handling
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(height);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Socket & Initial Data
  useEffect(() => {
    if (visible && currentUser) {
      // Connect Socket
      socketService.connect(currentUser._id);

      // Listen for online users
      const onOnlineUpdate = (users: any) => setOnlineUsers(users);
      socketService.onOnlineUsers(onOnlineUpdate);

      // Listen for incoming messages
      const onMsgReceived = (msg: any) => {
        if (activeChat && (msg.senderId === activeChat._id || msg.senderId === currentUser._id)) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

          if (msg.senderId === activeChat._id) {
            socketService.markMessagesRead(activeChat._id, currentUser._id);
          }
        } else {
          setConversations((prev) =>
            prev.map(u =>
              u._id === msg.senderId
                ? { ...u, unreadCount: (u.unreadCount || 0) + 1 }
                : u
            )
          );
        }
      };
      socketService.onMessage(onMsgReceived);

      // Listen for deleted messages
      const onMsgDeleted = (data: any) => {
        setMessages((prev) => prev.map(m => {
          if (m._id === data.messageId) {
            return { ...m, message: 'This message was deleted', isDeletedForEveryone: true, attachment: null };
          }
          return m;
        }));
      };
      socketService.onMessageDeleted(onMsgDeleted);

      // Fetch potential users to chat with (Sidebar)
      fetchUsers();

      return () => {
        socketService.removeListener('receiveMessage', onMsgReceived);
        socketService.removeListener('getOnlineUsers', onOnlineUpdate);
        socketService.removeListener('messageDeleted', onMsgDeleted);
      };
    }
  }, [visible, currentUser, activeChat]);

  // Total Unread Calculation
  useEffect(() => {
    const total = conversations.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
    setTotalUnread(total);
  }, [conversations]);

  // Fetch messages when opening a chat
  useEffect(() => {
    let isCancelled = false;

    if (activeChat) {
      // Clear messages immediately to prevent previous chat from showing
      setMessages([]);
      setSelectedMedia(null);
      setInputText('');
      setLoadingMessages(true);

      // Fetch messages
      const loadMessages = async () => {
        try {
          const res = await api.get(`/messages/${activeChat._id}`);
          if (!isCancelled) {
            setMessages(res.data);
            setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
          }
        } catch (err) {
          console.log('Error fetching messages:', err);
        } finally {
          if (!isCancelled) {
            setLoadingMessages(false);
          }
        }
      };

      loadMessages();

      // Update unread count and mark as read
      setConversations(prev =>
        prev.map(u => u._id === activeChat._id ? { ...u, unreadCount: 0 } : u)
      );
      socketService.markMessagesRead(activeChat._id, currentUser._id);
    }

    // Cleanup function to prevent race conditions
    return () => {
      isCancelled = true;
    };
  }, [activeChat]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/messages/users');
      setConversations(res.data);
    } catch (err) {
      console.log('Error fetching users:', err);
    }
  };

  const handleSendMessage = async () => {
    // Check if we have media to upload first
    let attachmentUrl = null;
    let attachmentType = 'none';

    if (!inputText.trim() && !selectedMedia) return;
    if (!activeChat) return;

    setUploading(true);

    if (selectedMedia) {
      try {
        const formData = new FormData();
        const filename = selectedMedia.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `${selectedMedia.type}/${match[1]}` : selectedMedia.type;

        // @ts-ignore
        formData.append('file', { uri: selectedMedia.uri, name: filename, type });

        const res = await socketService.uploadFile(formData);
        if (res && res.url) {
          attachmentUrl = res.url;
          attachmentType = res.type;
        }
      } catch (err) {
        Alert.alert('Upload Failed', 'Could not upload image.');
        setUploading(false);
        return;
      }
    }

    const tempMsg = {
      senderId: currentUser._id,
      receiverId: activeChat._id,
      message: inputText,
      attachment: attachmentUrl,
      attachmentType: attachmentType,
      createdAt: new Date().toISOString(),
    };

    // Emit socket
    socketService.sendMessage(tempMsg);

    // Optimistic UI update
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    setSelectedMedia(null);
    setUploading(false);

    try {
      await api.post(`/messages/send/${activeChat._id}`, {
        message: tempMsg.message,
        attachment: attachmentUrl,
        attachmentType: attachmentType
      });
    } catch (e) {
      console.log("Error saving msg", e);
    }
  };

  // Image Helper
  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
        });
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All, // Images and Videos
          allowsEditing: true,
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Instead of uploading immediately, set selections
        const asset = result.assets[0];
        setSelectedMedia({ uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' });
      }
    } catch (err) {
      console.log('Image picker error', err);
    }
  };

  // Message Actions (Delete)
  const handleLongPress = (msg: any) => {
    if (msg.isDeletedForEveryone) return;

    const isMyMsg = msg.senderId === currentUser._id;
    const options: AlertButton[] = [
      {
        text: 'Delete for Me',
        onPress: () => deleteMsgAPI(msg._id, false),
        style: 'destructive'
      },
      { text: 'Cancel', style: 'cancel' }
    ];

    if (isMyMsg) {
      options.unshift({
        text: 'Delete for Everyone',
        onPress: () => deleteMsgAPI(msg._id, true),
        style: 'destructive',
      });
    }

    // ActionSheet (iOS) / Alert (Android)
    Alert.alert('Delete Message', 'Choose an action', options);
  };

  const deleteMsgAPI = async (messageId: string, deleteForEveryone: boolean) => {
    try {
      // Optimistic update
      setMessages(prev => {
        if (deleteForEveryone) {
          return prev.map(m => m._id === messageId ? { ...m, message: 'This message was deleted', isDeletedForEveryone: true, attachment: null } : m);
        } else {
          return prev.filter(m => m._id !== messageId);
        }
      });

      await api.post(`/messages/delete/${messageId}`, { deleteForEveryone });

      if (deleteForEveryone && activeChat) {
        socketService.deleteMessage({ messageId, receiverId: activeChat._id, deleteForEveryone: true });
      }

    } catch (err) {
      console.log('Delete error', err);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  const handleViewProfile = () => {
    if (activeChat) {
      setViewUserId(activeChat._id);
      setShowProfileModal(true);
    }
  };

  // ---------------- UI RENDERERS ----------------

  const goBack = () => {
    if (activeChat) {
      setActiveChat(null); // Go back to list
      fetchUsers(); // Refresh updated last seen/unread
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(onClose);
    }
  };

  const renderConversationItem = ({ item }) => {
    const isOnline = onlineUsers.includes(item._id);
    const unread = item.unreadCount || 0;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => setActiveChat(item)}
      >
        <View>
          <View style={styles.avatarContainer}>
            {item.profileImage ? (
              <Image source={{ uri: item.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={24} color="#555" />
              </View>
            )}
            {isOnline && <View style={styles.onlineDot} />}
          </View>
        </View>
        <View style={styles.conversationInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.userName}>{item.name}</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {item.attachmentType === 'image' && !item.message ? (
              <Text style={styles.lastMessage}>📷 Photo</Text>
            ) : (
              <Text style={[styles.lastMessage, unread > 0 && styles.unreadMessage]} numberOfLines={1}>
                {unread > 0 ? `${unread} new messages` : 'Tap to chat'}
              </Text>
            )}

            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMessageItem = ({ item }) => {
    const isMe = item.senderId === currentUser?._id;
    const isDeleted = item.isDeletedForEveryone;

    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
        style={[styles.msgBubbleWrapper, isMe ? styles.msgRight : styles.msgLeft]}
      >
        <View style={[styles.msgBubble, isMe ? styles.bubbleRight : styles.bubbleLeft, isDeleted && { backgroundColor: '#ccc' }]}>

          {item.attachmentType === 'image' && item.attachment && !isDeleted && (
            <Image source={{ uri: item.attachment }} style={{ width: 220, height: 220, borderRadius: 12, marginBottom: item.message ? 8 : 0 }} resizeMode="cover" />
          )}

          {item.message ? (
            <Text style={[styles.msgText, isMe ? styles.textRight : styles.textLeft, isDeleted && { fontStyle: 'italic', color: '#555' }]}>
              {item.message}
            </Text>
          ) : null}

          <Text style={[styles.msgTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : null]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {isMe && (
              <Text style={{ fontSize: 10, marginLeft: 4 }}>
                {item.read ? ' • Read' : ' • Sent'}
              </Text>
            )}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View
        style={[
          styles.container,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>

            {/* 🔴 Header */}
            <LinearGradient
              colors={['#E31C25', '#900C12']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.headerGradient}
            >
              <SafeAreaView>
                <View style={styles.headerContent}>
                  <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                  </TouchableOpacity>

                  {activeChat ? (
                    <TouchableOpacity
                      style={styles.chatHeaderInfo}
                      onPress={handleViewProfile}
                      activeOpacity={0.7}
                    >
                      {activeChat.profileImage ? (
                        <Image source={{ uri: activeChat.profileImage }} style={styles.headerAvatar} />
                      ) : (
                        <View style={[styles.headerAvatar, { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="person" size={20} color="#E31C25" />
                        </View>
                      )}
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.headerTitle}>{activeChat.name}</Text>
                        <Text style={styles.headerSubtitle}>
                          {onlineUsers.includes(activeChat._id)
                            ? 'Online'
                            : `Last seen ${formatLastSeen(activeChat.lastSeen)}`
                          }
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.headerTitle}>Direct Messages</Text>
                      {totalUnread > 0 && (
                        <View style={styles.headerBadge}>
                          <Text style={styles.headerBadgeText}>{totalUnread}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View style={{ width: 40 }} />
                </View>
              </SafeAreaView>
            </LinearGradient>

            {/* Content */}
            <View style={styles.contentContainer}>
              {!activeChat ? (
                // Conversation List
                <>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search users..."
                      placeholderTextColor="#999"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <FlatList
                    data={conversations.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
                    keyExtractor={(item) => item._id}
                    renderItem={renderConversationItem}
                    contentContainerStyle={{ padding: 15 }}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
                        <Text style={{ color: '#888', marginTop: 10 }}>No users found.</Text>
                      </View>
                    }
                  />
                </>
              ) : (
                // Chat View
                <>
                  {loadingMessages ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#E31C25" />
                      <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                  ) : (
                    <FlatList
                      ref={flatListRef}
                      data={messages}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={renderMessageItem}
                      contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                    />
                  )}

                  {/* 🟢 Media Preview Area */}
                  {selectedMedia && (
                    <View style={styles.mediaPreviewContainer}>
                      <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreview} />
                      <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeMediaBtn}>
                        <Ionicons name="close-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Input Area */}
                  <View style={styles.inputArea}>
                    <TouchableOpacity onPress={() => pickImage(false)} style={styles.attachBtn} disabled={uploading}>
                      <Ionicons name="images-outline" size={24} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => pickImage(true)} style={styles.attachBtn} disabled={uploading}>
                      <Ionicons name="camera-outline" size={24} color="#555" />
                    </TouchableOpacity>

                    <TextInput
                      style={styles.input}
                      placeholder={uploading ? "Uploading..." : (selectedMedia ? "Add a caption..." : "Type a message...")}
                      value={inputText}
                      onChangeText={setInputText}
                      placeholderTextColor="#999"
                      multiline
                      editable={!uploading}
                    />

                    {uploading ? (
                      <ActivityIndicator color="#E31C25" style={{ marginLeft: 10 }} />
                    ) : (
                      <TouchableOpacity onPress={() => handleSendMessage()} style={styles.sendBtn}>
                        <Ionicons name="send" size={20} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>

          </View>
        </KeyboardAvoidingView>
      </Animated.View>

      <UserProfileModal
        visible={showProfileModal}
        userId={viewUserId}
        onClose={() => setShowProfileModal(false)}
      />
    </Modal >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingBottom: 15,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 15,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerBadge: {
    backgroundColor: '#FFD700', // Gold color for high visibility
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerBadgeText: {
    color: '#900C12',
    fontSize: 16, // Larger font
    fontWeight: '900', // Extra bold
  },

  contentContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },

  // List Item Styles
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#888',
  },
  unreadMessage: {
    color: '#333',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#E31C25',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },


  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 25,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#333',
  },

  // Chat Styles
  msgBubbleWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  msgLeft: {
    alignItems: 'flex-start',
  },
  msgRight: {
    alignItems: 'flex-end',
  },
  msgBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bubbleLeft: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#E31C25', // Theme Color
    borderBottomRightRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textLeft: {
    color: '#333',
  },
  textRight: {
    color: '#fff',
  },
  msgTime: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
    color: 'rgba(0,0,0,0.4)',
    fontWeight: '500',
  },

  // Media Preview
  mediaPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mediaPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: 5,
    left: 60,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },

  // Input Styles
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
  },
  attachBtn: {
    marginRight: 10,
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E31C25',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
});