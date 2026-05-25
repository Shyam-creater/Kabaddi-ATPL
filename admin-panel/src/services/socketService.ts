import io, { Socket } from 'socket.io-client';

// Match backend socket URL
// NOTE: change if your backend runs on a different IP/port
const SOCKET_URL = 'http://192.168.31.253:6899';

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      // Register user for online list
      this.socket?.emit('registerUser', userId);
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  onMatchUpdate(callback: (match: any) => void) {
    this.socket?.on('match:update', callback);
  }

  offMatchUpdate(callback: (match: any) => void) {
    this.socket?.off('match:update', callback);
  }
}

export default new SocketService();

