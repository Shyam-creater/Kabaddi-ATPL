import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import api, { USE_LOCAL_BACKEND } from './api';

const LOCAL_SOCKET_URL = 'https://back.aattumtpl.com';
const LIVE_SOCKET_URL = 'https://back.aattumtpl.com';

const SOCKET_URL = USE_LOCAL_BACKEND ? LOCAL_SOCKET_URL : LIVE_SOCKET_URL;

class SocketService {
    socket: Socket | null = null;

    connect(userId: string) {
        if (!this.socket) {
            this.socket = io(SOCKET_URL);

            this.socket.on('connect', () => {
                console.log('✅ Connected to socket server');
                // Register user
                this.socket?.emit('registerUser', userId);
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    sendMessage(messageData: any) {
        this.socket?.emit('sendMessage', messageData);
    }

    markMessagesRead(senderId: string, receiverId: string) {
        this.socket?.emit('markMessagesRead', { senderId, receiverId });
    }

    deleteMessage(data: { messageId: string, receiverId: string, deleteForEveryone: boolean }) {
        this.socket?.emit('deleteMessage', data);
    }

    onMessage(callback: (msg: any) => void) {
        this.socket?.on('receiveMessage', callback);
    }

    onOnlineUsers(callback: (users: string[]) => void) {
        this.socket?.on('getOnlineUsers', callback);
    }

    removeListener(eventName: string, callback?: any) {
        if (callback) {
            this.socket?.off(eventName, callback);
        } else {
            this.socket?.off(eventName);
        }
    }

    // Listen for delete
    onMessageDeleted(callback: (data: any) => void) {
        this.socket?.on('messageDeleted', callback);
    }

    // --- MATCH EVENTS ---
    onMatchUpdate(callback: (match: any) => void) {
        this.socket?.on('match:update', callback);
    }

    onTournamentUpdate(callback: (data: any) => void) {
        this.socket?.on('tournament:update', callback);
    }

    onTournamentCreate(callback: (data: any) => void) {
        this.socket?.on('tournament:create', callback);
    }

    onTournamentDelete(callback: (data: any) => void) {
        this.socket?.on('tournament:delete', callback);
    }

    // --- FOLLOW EVENTS ---
    onFollowRequest(callback: (data: { from: { id: string, name: string, image: string } }) => void) {
        this.socket?.on('followRequest', callback);
    }

    onFollowAccepted(callback: (data: { from: { id: string, name: string, image: string } }) => void) {
        this.socket?.on('followAccepted', callback);
    }

    // File Upload
    async uploadFile(formData: FormData) {
        try {
            const res = await api.post('/messages/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data; // { url: '...', type: 'image' }
        } catch (error) {
            console.error('File Upload Error:', error);
            throw error;
        }
    }
}

export default new SocketService();
