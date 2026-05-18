const path = require('path');

// Load env from backend/.env
require('dotenv').config({
  path: path.resolve(__dirname, '../.env'),
});

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
app.set('io', io);

// Online Users Map
const onlineUsers = new Map();
app.set('onlineUsers', onlineUsers); // Expose for controllers

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('registerUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('sendMessage', async (messageData) => {
    const { senderId, receiverId, message, conversationId } = messageData;

    // Save to DB (Optional here if using REST for sending, but good for pure socket)
    // const Message = require('./models/Message.model');
    // await Message.create({ senderId, receiverId, message });

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', messageData);
    }
  });

  socket.on('markMessagesRead', async ({ senderId, receiverId }) => {
    // Mark messages from senderId to receiverId as read
    const Message = require('./models/Message.model');
    await Message.updateMany(
      { senderId, receiverId, read: false },
      { $set: { read: true } }
    );
  });

  socket.on('deleteMessage', (data) => {
    // data: { messageId, receiverId, deleteForEveryone: true }
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('messageDeleted', data);
    }
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);
    // Remove user from map & update lastSeen
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        // Update DB
        const User = require('./models/User.model');
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

        break;
      }
    }
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });
});

// Restart Trigger 2


(async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
