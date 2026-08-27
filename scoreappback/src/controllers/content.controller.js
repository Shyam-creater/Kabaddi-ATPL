const { Partner, TrendingPlayer, Poll, News, Quote, Highlight, Ad, Social, Trivia, Blog, Banner } = require('../models/content.model');

// Helper to construct sport query filter
const getSportFilter = (sportParam) => {
    if (!sportParam || sportParam === 'All') return {};
    return {
        $or: [
            { sport: sportParam },
            { sport: 'All' },
            { sport: { $exists: false } },
            { sport: null }
        ]
    };
};

// --- GENERIC CRUD HELPERS ---
const getAll = (Model) => async (req, res) => {
    try {
        const sportFilter = getSportFilter(req.query.sport);
        const items = await Model.find(sportFilter).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createOne = (Model) => async (req, res) => {
    try {
        const item = new Model(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateOne = (Model) => async (req, res) => {
    try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteOne = (Model) => async (req, res) => {
    try {
        await Model.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- SPECIFIC CONTROLLERS ---

// POLLS (Special logic: vote & sport filter)
exports.getPolls = async (req, res) => {
    try {
        const activeOnly = req.query.active === 'true';
        const baseQuery = activeOnly ? { active: true } : {};
        const sportFilter = getSportFilter(req.query.sport);
        const query = sportFilter.$or 
            ? { $and: [baseQuery, { $or: sportFilter.$or }] } 
            : baseQuery;
        const polls = await Poll.find(query).sort({ createdAt: -1 });
        res.json(polls);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createPoll = async (req, res) => {
    try {
        const targetSport = req.body.sport || 'Kabaddi';
        if (req.body.active) {
            await Poll.updateMany(
                { $or: [{ sport: targetSport }, { sport: 'All' }] },
                { active: false }
            );
        }
        const poll = new Poll(req.body);
        await poll.save();
        res.status(201).json(poll);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updatePoll = updateOne(Poll);
exports.deletePoll = deleteOne(Poll);
exports.votePoll = async (req, res) => {
    try {
        const { option } = req.body;
        const update = option === 'A' ? { $inc: { votesA: 1 } } : { $inc: { votesB: 1 } };
        const poll = await Poll.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(poll);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

// BANNER (Special logic: sport filter and active status)
exports.getBanners = async (req, res) => {
    try {
        const activeOnly = req.query.active === 'true';
        const baseQuery = activeOnly ? { active: true } : {};
        const sportFilter = getSportFilter(req.query.sport);
        const query = sportFilter.$or 
            ? { $and: [baseQuery, { $or: sportFilter.$or }] } 
            : baseQuery;
        const banners = await Banner.find(query).sort({ createdAt: -1 });
        res.json(banners);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createBanner = async (req, res) => {
    try {
        const targetSport = req.body.sport || 'Kabaddi';
        if (req.body.active) {
            await Banner.updateMany(
                { $or: [{ sport: targetSport }, { sport: 'All' }] },
                { active: false }
            );
        }
        const banner = new Banner(req.body);
        await banner.save();
        res.status(201).json(banner);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateBanner = async (req, res) => {
    try {
        const targetSport = req.body.sport || 'Kabaddi';
        if (req.body.active) {
            await Banner.updateMany(
                { _id: { $ne: req.params.id }, $or: [{ sport: targetSport }, { sport: 'All' }] },
                { active: false }
            );
        }
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(banner);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteBanner = deleteOne(Banner);

// EXPORTS
exports.getPartners = getAll(Partner);
exports.createPartner = createOne(Partner);
exports.updatePartner = updateOne(Partner);
exports.deletePartner = deleteOne(Partner);

exports.getTrendingPlayers = getAll(TrendingPlayer);
exports.createTrendingPlayer = createOne(TrendingPlayer);
exports.updateTrendingPlayer = updateOne(TrendingPlayer);
exports.deleteTrendingPlayer = deleteOne(TrendingPlayer);

exports.getNews = getAll(News);
exports.createNews = createOne(News);
exports.updateNews = updateOne(News);
exports.deleteNews = deleteOne(News);

exports.getQuotes = getAll(Quote);
exports.createQuote = createOne(Quote);
exports.updateQuote = updateOne(Quote);
exports.deleteQuote = deleteOne(Quote);

exports.getHighlights = getAll(Highlight);
exports.createHighlight = createOne(Highlight);
exports.updateHighlight = updateOne(Highlight);
exports.deleteHighlight = deleteOne(Highlight);

exports.getAds = getAll(Ad);
exports.createAd = createOne(Ad);
exports.updateAd = updateOne(Ad);
exports.deleteAd = deleteOne(Ad);

exports.getSocials = getAll(Social);
exports.createSocial = createOne(Social);
exports.updateSocial = updateOne(Social);
exports.deleteSocial = deleteOne(Social);

exports.getTrivia = getAll(Trivia);
exports.createTrivia = createOne(Trivia);
exports.updateTrivia = updateOne(Trivia);
exports.deleteTrivia = deleteOne(Trivia);

// Blog - returns published blogs with optional sport filter
exports.getBlogs = async (req, res) => {
    try {
        const sportFilter = getSportFilter(req.query.sport);
        const query = sportFilter.$or 
            ? { $and: [{ published: true }, { $or: sportFilter.$or }] } 
            : { published: true };
        const blogs = await Blog.find(query).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createBlog = createOne(Blog);
exports.updateBlog = updateOne(Blog);
exports.deleteBlog = deleteOne(Blog);
