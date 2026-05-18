const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');

// Partners
router.get('/partners', contentController.getPartners);
router.post('/partners', contentController.createPartner);
router.put('/partners/:id', contentController.updatePartner);
router.delete('/partners/:id', contentController.deletePartner);

// Trending Players
router.get('/trending-players', contentController.getTrendingPlayers);
router.post('/trending-players', contentController.createTrendingPlayer);
router.put('/trending-players/:id', contentController.updateTrendingPlayer);
router.delete('/trending-players/:id', contentController.deleteTrendingPlayer);

// Polls
router.get('/polls', contentController.getPolls);
router.post('/polls', contentController.createPoll);
router.put('/polls/:id', contentController.updatePoll);
router.post('/polls/:id/vote', contentController.votePoll);
router.delete('/polls/:id', contentController.deletePoll);

// News
router.get('/news', contentController.getNews);
router.post('/news', contentController.createNews);
router.put('/news/:id', contentController.updateNews);
router.delete('/news/:id', contentController.deleteNews);

// Quotes
router.get('/quotes', contentController.getQuotes);
router.post('/quotes', contentController.createQuote);
router.put('/quotes/:id', contentController.updateQuote);
router.delete('/quotes/:id', contentController.deleteQuote);

// Highlights
router.get('/highlights', contentController.getHighlights);
router.post('/highlights', contentController.createHighlight);
router.put('/highlights/:id', contentController.updateHighlight);
router.delete('/highlights/:id', contentController.deleteHighlight);

// Ads
router.get('/ads', contentController.getAds);
router.post('/ads', contentController.createAd);
router.put('/ads/:id', contentController.updateAd);
router.delete('/ads/:id', contentController.deleteAd);

// Social
router.get('/social', contentController.getSocials);
router.post('/social', contentController.createSocial);
router.put('/social/:id', contentController.updateSocial);
router.delete('/social/:id', contentController.deleteSocial);

// Trivia
router.get('/trivia', contentController.getTrivia);
router.post('/trivia', contentController.createTrivia);
router.put('/trivia/:id', contentController.updateTrivia);
router.delete('/trivia/:id', contentController.deleteTrivia);

// Blogs
router.get('/blogs', contentController.getBlogs);
router.post('/blogs', contentController.createBlog);
router.put('/blogs/:id', contentController.updateBlog);
router.delete('/blogs/:id', contentController.deleteBlog);

// Banners
router.get('/banners', contentController.getBanners);
router.post('/banners', contentController.createBanner);
router.put('/banners/:id', contentController.updateBanner);
router.delete('/banners/:id', contentController.deleteBanner);

module.exports = router;

