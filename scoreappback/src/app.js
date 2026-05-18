const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const messageRoutes = require('./routes/message.routes');
const cricketMatchRoutes = require('./routes/cricket/match.routes');
const teamRoutes = require('./routes/team.routes'); // Added teamRoutes
const lookingRoutes = require('./routes/looking.routes');
const productRoutes = require('./routes/product.routes');

const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
const path = require('path');

app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/cricket', cricketMatchRoutes);
app.use('/api/kabaddi', require('./routes/kabaddi/match.routes'));
app.use('/api/football', require('./routes/football/match.routes'));
app.use('/api/matches', require('./routes/match.routes'));
app.use('/api/teams', teamRoutes);
app.use('/api/players', require('./routes/player.routes'));
app.use('/api/gallery', require('./routes/gallery.routes'));
app.use('/api/content', require('./routes/content.routes'));
app.use('/api/tournaments', require('./routes/tournament.routes'));
app.use('/api/registrations', require('./routes/playerRegistration.routes'));
app.use('/api/looking', lookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/notifications', require('./routes/notification.routes'));

// Error Handler
app.use(errorHandler);

module.exports = app;
