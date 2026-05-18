const { Partner, TrendingPlayer, Poll, News, Quote, Highlight, Ad, Social, Trivia, Blog, Banner } = require('../models/content.model');

// --- GENERIC CRUD HELPERS ---
const getAll = (Model) => async (req, res) => {
    try {
        const items = await Model.find().sort({ createdAt: -1 });
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

// POLLS (Special logic: vote)
exports.getPolls = async (req, res) => {
    try {
        const polls = await Poll.find({ active: true }).sort({ createdAt: -1 });
        res.json(polls);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createPoll = async (req, res) => {
    try {
        if (req.body.active) await Poll.updateMany({}, { active: false });
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

// BANNER (Special logic: only one active)
exports.getBanners = async (req, res) => {
    try {
        const activeOnly = req.query.active === 'true';
        const query = activeOnly ? { active: true } : {};
        const banners = await Banner.find(query).sort({ createdAt: -1 });
        res.json(banners);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
exports.createBanner = async (req, res) => {
    try {
        if (req.body.active) await Banner.updateMany({}, { active: false });
        const banner = new Banner(req.body);
        await banner.save();
        res.status(201).json(banner);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.updateBanner = async (req, res) => {
    try {
        if (req.body.active) await Banner.updateMany({ _id: { $ne: req.params.id } }, { active: false });
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(banner);
    } catch (error) { res.status(400).json({ message: error.message }); }
};
exports.deleteBanner = deleteOne(Banner);

// ADS (Special logic: ensure only one active if needed, but generic is fine for now)

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

// Blog - returns only published blogs for public API
exports.getBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ published: true }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createBlog = createOne(Blog);
exports.updateBlog = updateOne(Blog);
exports.deleteBlog = deleteOne(Blog);
