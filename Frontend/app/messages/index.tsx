import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
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
import { useLocalSearchParams, useRouter } from 'expo-router';

// Helper to format "Last Seen"
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

const { width } = Dimensions.get('window');

export default function MessagesScreen() {
    const router = useRouter();
    const { userId, userName } = useLocalSearchParams();
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
    const [searchQuery, setSearchQuery] = useState('');

    // Ref to access activeChat safely inside socket listeners
    const activeChatRef = useRef(activeChat);

    // Update ref whenever activeChat changes
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // Socket & Initial Data
    useEffect(() => {
        if (currentUser) {
            socketService.connect(currentUser._id);
            const onOnlineUpdate = (users: any) => setOnlineUsers(users);
            socketService.onOnlineUsers(onOnlineUpdate);

            // Single message handler for both active chat and background updates
            const handleMessage = (msg: any) => {
                const currentActive = activeChatRef.current;

                // 1. If message belongs to the ACTIVE chat (either from them or from me)
                if (currentActive && (msg.senderId === currentActive._id || msg.senderId === currentUser._id)) {
                    setMessages((prev) => [...prev, msg]);
                    setTimeout(() => flatListRef.current?.scrollToEnd(), 100);

                    // If received from active user, mark as read immediately
                    if (msg.senderId === currentActive._id) {
                        socketService.markMessagesRead(currentActive._id, currentUser._id);
                        // Also clear unread count for this user in the list
                        setConversations(prev =>
                            prev.map(u => u._id === currentActive._id ? { ...u, unreadCount: 0 } : u)
                        );
                    }
                }

                // 2. ALWAYS update the conversations list with new unread counts or re-order
                setConversations((prev) => {
                    const existingUser = prev.find(u => u._id === msg.senderId);

                    if (existingUser) {
                        // If user is active chat, we already cleared unread above, 
                        // but if we are Sender, no change to unread. 
                        // If we are Receiver and it is NOT active chat, increment.
                        const isChattingWithThem = currentActive && currentActive._id === msg.senderId;

                        if (!isChattingWithThem && msg.senderId !== currentUser._id) {
                            return prev.map(u => u._id === msg.senderId ? { ...u, unreadCount: (u.unreadCount || 0) + 1 } : u);
                        }
                        return prev;
                    } else {
                        // New user messing us? We should probably fetch fresh list or add them.
                        // For safety to avoid loops, let's just trigger a fetch if not found.
                        if (msg.senderId !== currentUser._id) {
                            fetchUsers();
                        }
                        return prev;
                    }
                });
            };

            socketService.onMessage(handleMessage);

            const onMsgDeleted = (data: any) => {
                setMessages((prev) => prev.map(m => {
                    if (m._id === data.messageId) {
                        return { ...m, message: 'This message was deleted', isDeletedForEveryone: true, attachment: null };
                    }
                    return m;
                }));
            };
            socketService.onMessageDeleted(onMsgDeleted);

            fetchUsers();

            return () => {
                socketService.removeListener('receiveMessage', handleMessage);
                socketService.removeListener('getOnlineUsers', onOnlineUpdate);
                socketService.removeListener('messageDeleted', onMsgDeleted);
            };
        }
    }, [currentUser]);

    // Handle Deep Link Params
    useEffect(() => {
        if (userId && currentUser) {
            // Check if we are already chatting with this user
            if (activeChat && activeChat._id === userId) return;

            const existing = conversations.find(c => c._id === userId);
            if (existing) {
                setActiveChat(existing);
            } else if (conversations.length > 0 || userName) {
                // If specific user not in curren list, fetch their details one-off
                const initChat = async () => {
                    try {
                        const res = await api.get(`/user/${userId}`);
                        if (res.data.success) {
                            const user = res.data.data;
                            const chatUser = {
                                _id: user._id,
                                name: user.name,
                                profileImage: user.profilePicture,
                                lastSeen: user.lastSeen
                            };
                            setActiveChat(chatUser);
                        }
                    } catch (e) {
                        console.error("Failed to init chat", e);
                    }
                }
                initChat();
            }
        }
    }, [userId, currentUser, conversations, activeChat]); // Logic handles "already set" check to avoid loop

    // Total Unread Calculation
    useEffect(() => {
        const total = conversations.reduce((sum, u) => sum + (u.unreadCount || 0), 0);
        setTotalUnread(total);
    }, [conversations]);

    // Fetch messages when opening a chat
    // DEPENDENCY: ONLY activeChat._id to prevent loop when object reference changes but ID is same
    useEffect(() => {
        let isCancelled = false;

        if (activeChat?._id) {
            setMessages([]);
            setSelectedMedia(null);
            setInputText('');
            setLoadingMessages(true);

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
                    if (!isCancelled) setLoadingMessages(false);
                }
            };

            loadMessages();

            // Mark local conversation as read immediately
            setConversations(prev =>
                prev.map(u => u._id === activeChat._id ? { ...u, unreadCount: 0 } : u)
            );
            socketService.markMessagesRead(activeChat._id, currentUser._id);
        }

        return () => { isCancelled = true; };
    }, [activeChat?._id]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/messages/users');
            setConversations(res.data);
        } catch (err) {
            console.log('Error fetching users:', err);
        }
    };

    const handleSendMessage = async () => {
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

        socketService.sendMessage(tempMsg);
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
        } catch (e) { console.log("Error saving msg", e); }
    };

    const pickImage = async (useCamera: boolean) => {
        try {
            let result;
            if (useCamera) {
                await ImagePicker.requestCameraPermissionsAsync();
                result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
            } else {
                await ImagePicker.requestMediaLibraryPermissionsAsync();
                result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsEditing: true, quality: 0.7 });
            }
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedMedia({ uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' });
            }
        } catch (err) { console.log('Image picker error', err); }
    };

    const handleLongPress = (msg: any) => {
        if (msg.isDeletedForEveryone) return;
        const isMyMsg = msg.senderId === currentUser._id;
        const options: AlertButton[] = [
            { text: 'Delete for Me', onPress: () => deleteMsgAPI(msg._id, false), style: 'destructive' },
            { text: 'Cancel', style: 'cancel' }
        ];
        if (isMyMsg) {
            options.unshift({ text: 'Delete for Everyone', onPress: () => deleteMsgAPI(msg._id, true), style: 'destructive' });
        }
        Alert.alert('Delete Message', 'Choose an action', options);
    };

    const deleteMsgAPI = async (messageId: string, deleteForEveryone: boolean) => {
        try {
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
        } catch (err) { Alert.alert('Error', 'Failed to delete message'); }
    };

    const goBack = () => {
        if (activeChat) {
            // IF we came from deep link (userId param is present),
            // and we press back, we probably want to go back to the previous screen (Profile),
            // NOT the message list.
            if (userId) {
                router.back();
            } else {
                // If we were just browsing the list and opened a chat, go back to list
                setActiveChat(null);
                fetchUsers();
            }
        } else {
            router.back();
        }
    };

    const renderConversationItem = ({ item }: { item: any }) => {
        const isOnline = onlineUsers.includes(item._id);
        const unread = item.unreadCount || 0;
        return (
            <TouchableOpacity style={styles.conversationItem} onPress={() => setActiveChat(item)}>
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
                            <View style={styles.unreadBadge}><Text style={styles.unreadText}>{unread}</Text></View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderMessageItem = ({ item }: { item: any }) => {
        const isMe = item.senderId === currentUser?._id;
        const isDeleted = item.isDeletedForEveryone;
        return (
            <TouchableOpacity onLongPress={() => handleLongPress(item)} activeOpacity={0.8} style={[styles.msgBubbleWrapper, isMe ? styles.msgRight : styles.msgLeft]}>
                <View style={[styles.msgBubble, isMe ? styles.bubbleRight : styles.bubbleLeft, isDeleted && { backgroundColor: '#ccc' }]}>
                    {item.attachmentType === 'image' && item.attachment && !isDeleted && (
                        <Image source={{ uri: item.attachment }} style={{ width: 220, height: 220, borderRadius: 12, marginBottom: item.message ? 8 : 0 }} resizeMode="cover" />
                    )}
                    {item.message ? (
                        <Text style={[styles.msgText, isMe ? styles.textRight : styles.textLeft, isDeleted && { fontStyle: 'italic', color: '#555' }]}>{item.message}</Text>
                    ) : null}
                    <Text style={[styles.msgTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : null]}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && <Text style={{ fontSize: 10, marginLeft: 4 }}>{item.read ? ' • Read' : ' • Sent'}</Text>}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <LinearGradient colors={['#E31C25', '#900C12']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.headerGradient}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={goBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        {activeChat ? (
                            <View style={styles.chatHeaderInfo}>
                                {activeChat.profileImage ? (
                                    <Image source={{ uri: activeChat.profileImage }} style={styles.headerAvatar} />
                                ) : (
                                    <View style={[styles.headerAvatar, { backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="person" size={20} color="#E31C25" />
                                    </View>
                                )}
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.headerTitle}>{activeChat.name}</Text>
                                    <Text style={styles.headerSubtitle}>{onlineUsers.includes(activeChat._id) ? 'Online' : `Last seen ${formatLastSeen(activeChat.lastSeen)}`}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.headerTitle}>Messages</Text>
                                {totalUnread > 0 && <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{totalUnread}</Text></View>}
                            </View>
                        )}
                        <View style={{ width: 40 }} />
                    </View>
                </LinearGradient>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {!activeChat ? (
                        <>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color="#999" />
                                <TextInput style={styles.searchInput} placeholder="Search users..." placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} />
                                {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#999" /></TouchableOpacity>}
                            </View>
                            <FlatList
                                data={conversations.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
                                keyExtractor={(item) => item._id}
                                renderItem={renderConversationItem}
                                contentContainerStyle={{ padding: 15 }}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
                                        <Text style={{ color: '#888', marginTop: 10 }}>No conversations found.</Text>
                                    </View>
                                }
                            />
                        </>
                    ) : (
                        <>
                            {loadingMessages ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#E31C25" />
                                    <Text style={styles.loadingText}>Loading messages...</Text>
                                </View>
                            ) : (
                                <FlatList ref={flatListRef} data={messages} keyExtractor={(item, index) => index.toString()} renderItem={renderMessageItem} contentContainerStyle={{ padding: 15, paddingBottom: 20 }} />
                            )}
                            {selectedMedia && (
                                <View style={styles.mediaPreviewContainer}>
                                    <Image source={{ uri: selectedMedia.uri }} style={styles.mediaPreview} />
                                    <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.removeMediaBtn}><Ionicons name="close-circle" size={24} color="#fff" /></TouchableOpacity>
                                </View>
                            )}
                            <View style={styles.inputArea}>
                                <TouchableOpacity onPress={() => pickImage(false)} style={styles.attachBtn} disabled={uploading}><Ionicons name="images-outline" size={24} color="#555" /></TouchableOpacity>
                                <TouchableOpacity onPress={() => pickImage(true)} style={styles.attachBtn} disabled={uploading}><Ionicons name="camera-outline" size={24} color="#555" /></TouchableOpacity>
                                <TextInput style={styles.input} placeholder={uploading ? "Uploading..." : (selectedMedia ? "Add a caption..." : "Type a message...")} value={inputText} onChangeText={setInputText} placeholderTextColor="#999" multiline editable={!uploading} />
                                {uploading ? (
                                    <ActivityIndicator color="#E31C25" style={{ marginLeft: 10 }} />
                                ) : (
                                    <TouchableOpacity onPress={() => handleSendMessage()} style={styles.sendBtn}><Ionicons name="send" size={20} color="#fff" /></TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    headerGradient: { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, paddingBottom: 15, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8, zIndex: 10 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
    backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
    chatHeaderInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 15 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
    headerBadge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginLeft: 10, borderWidth: 2, borderColor: '#fff' },
    headerBadgeText: { color: '#900C12', fontSize: 16, fontWeight: '900' },
    contentContainer: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 14, color: '#888' },
    conversationItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    avatarContainer: { position: 'relative', marginRight: 15 },
    avatar: { width: 54, height: 54, borderRadius: 27 },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#fff' },
    conversationInfo: { flex: 1, justifyContent: 'center' },
    userName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
    lastMessage: { fontSize: 14, color: '#888' },
    unreadMessage: { color: '#333', fontWeight: '600' },
    unreadBadge: { backgroundColor: '#E31C25', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
    unreadText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 15, marginBottom: 10, paddingHorizontal: 15, height: 50, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },
    msgBubbleWrapper: { marginBottom: 16, width: '100%' },
    msgLeft: { alignItems: 'flex-start' },
    msgRight: { alignItems: 'flex-end' },
    msgBubble: { borderRadius: 16, padding: 12, maxWidth: '75%', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    bubbleLeft: { backgroundColor: '#fff', borderTopLeftRadius: 4 },
    bubbleRight: { backgroundColor: '#E31C25', borderTopRightRadius: 4 },
    msgText: { fontSize: 15, lineHeight: 22 },
    textLeft: { color: '#333' },
    textRight: { color: '#fff' },
    msgTime: { fontSize: 10, color: '#999', marginTop: 4, alignSelf: 'flex-end' },
    mediaPreviewContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    mediaPreview: { width: 80, height: 80, borderRadius: 8 },
    removeMediaBtn: { position: 'absolute', top: 5, right: 5 },
    inputArea: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    attachBtn: { padding: 10 },
    input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 15, marginHorizontal: 5 },
    sendBtn: { backgroundColor: '#E31C25', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
});
