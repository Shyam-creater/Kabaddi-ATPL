const mongoose = require('mongoose');

const sportSchemaField = {
    type: String,
    enum: ['All', 'Cricket', 'Kabaddi', 'Football'],
    default: 'Kabaddi'
};

const PartnerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String, required: true }, // URL or base64
    link: { type: String, default: '' },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const TrendingPlayerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    image: { type: String, required: true }, // URL or base64 (acts as thumbnail for video)
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    rank: { type: Number, default: 0 },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const PollSchema = new mongoose.Schema({
    question: { type: String, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    votesA: { type: Number, default: 0 },
    votesB: { type: Number, default: 0 },
    active: { type: Boolean, default: true }, // Only one active poll usually
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const NewsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    time: { type: String, default: 'Just now' },
    link: { type: String, default: '' },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const QuoteSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true },
    image: { type: String, default: '' },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const HighlightSchema = new mongoose.Schema({
    title: { type: String, required: true },
    duration: { type: String, required: true },
    image: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const AdSchema = new mongoose.Schema({
    text: { type: String, required: true },
    buttonText: { type: String, default: 'Play Now' },
    link: { type: String, default: '' },
    active: { type: Boolean, default: true },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const SocialSchema = new mongoose.Schema({
    user: { type: String, required: true }, // @handle
    content: { type: String, required: true },
    image: { type: String, default: '' },
    likes: { type: String, default: '0' },
    platform: { type: String, default: 'twitter' },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const TriviaSchema = new mongoose.Schema({
    fact: { type: String, required: true },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const BlogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    excerpt: { type: String, default: '' },
    content: { type: String, required: true },
    image: { type: String, default: '' },
    author: { type: String, default: 'Aattum TPL' },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    published: { type: Boolean, default: true },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    text: { type: String, required: true },
    image: { type: String, required: true },
    active: { type: Boolean, default: true },
    link: { type: String, default: '/tournament' },
    sport: sportSchemaField,
    createdAt: { type: Date, default: Date.now }
});

const Partner = mongoose.model('Partner', PartnerSchema);
const TrendingPlayer = mongoose.model('TrendingPlayer', TrendingPlayerSchema);
const Poll = mongoose.model('Poll', PollSchema);
const News = mongoose.model('News', NewsSchema);
const Quote = mongoose.model('Quote', QuoteSchema);
const Highlight = mongoose.model('Highlight', HighlightSchema);
const Ad = mongoose.model('Ad', AdSchema);
const Social = mongoose.model('Social', SocialSchema);
const Trivia = mongoose.model('Trivia', TriviaSchema);
const Blog = mongoose.model('Blog', BlogSchema);
const Banner = mongoose.model('Banner', BannerSchema);

module.exports = { Partner, TrendingPlayer, Poll, News, Quote, Highlight, Ad, Social, Trivia, Blog, Banner };
