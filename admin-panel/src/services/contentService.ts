import api from './api';

export const contentService = {
    // Partners
    getPartners: async () => { return (await api.get('/content/partners')).data; },
    createPartner: async (data: any) => { return (await api.post('/content/partners', data)).data; },
    updatePartner: async (id: string, data: any) => { return (await api.put(`/content/partners/${id}`, data)).data; },
    deletePartner: async (id: string) => { return (await api.delete(`/content/partners/${id}`)).data; },

    // Trending Players
    getTrendingPlayers: async () => { return (await api.get('/content/trending-players')).data; },
    createTrendingPlayer: async (data: any) => { return (await api.post('/content/trending-players', data)).data; },
    updateTrendingPlayer: async (id: string, data: any) => { return (await api.put(`/content/trending-players/${id}`, data)).data; },
    deleteTrendingPlayer: async (id: string) => { return (await api.delete(`/content/trending-players/${id}`)).data; },

    // Polls
    getPolls: async () => { return (await api.get('/content/polls')).data; },
    createPoll: async (data: any) => { return (await api.post('/content/polls', data)).data; },
    updatePoll: async (id: string, data: any) => { return (await api.put(`/content/polls/${id}`, data)).data; },
    deletePoll: async (id: string) => { return (await api.delete(`/content/polls/${id}`)).data; },

    // News
    getNews: async () => { return (await api.get('/content/news')).data; },
    createNews: async (data: any) => { return (await api.post('/content/news', data)).data; },
    updateNews: async (id: string, data: any) => { return (await api.put(`/content/news/${id}`, data)).data; },
    deleteNews: async (id: string) => { return (await api.delete(`/content/news/${id}`)).data; },

    // Quotes
    getQuotes: async () => { return (await api.get('/content/quotes')).data; },
    createQuote: async (data: any) => { return (await api.post('/content/quotes', data)).data; },
    updateQuote: async (id: string, data: any) => { return (await api.put(`/content/quotes/${id}`, data)).data; },
    deleteQuote: async (id: string) => { return (await api.delete(`/content/quotes/${id}`)).data; },

    // Highlights
    getHighlights: async () => { return (await api.get('/content/highlights')).data; },
    createHighlight: async (data: any) => { return (await api.post('/content/highlights', data)).data; },
    updateHighlight: async (id: string, data: any) => { return (await api.put(`/content/highlights/${id}`, data)).data; },
    deleteHighlight: async (id: string) => { return (await api.delete(`/content/highlights/${id}`)).data; },

    // Ads
    getAds: async () => { return (await api.get('/content/ads')).data; },
    createAd: async (data: any) => { return (await api.post('/content/ads', data)).data; },
    updateAd: async (id: string, data: any) => { return (await api.put(`/content/ads/${id}`, data)).data; },
    deleteAd: async (id: string) => { return (await api.delete(`/content/ads/${id}`)).data; },

    // Social
    getSocials: async () => { return (await api.get('/content/social')).data; },
    createSocial: async (data: any) => { return (await api.post('/content/social', data)).data; },
    updateSocial: async (id: string, data: any) => { return (await api.put(`/content/social/${id}`, data)).data; },
    deleteSocial: async (id: string) => { return (await api.delete(`/content/social/${id}`)).data; },

    // Trivia
    getTrivia: async () => { return (await api.get('/content/trivia')).data; },
    createTrivia: async (data: any) => { return (await api.post('/content/trivia', data)).data; },
    updateTrivia: async (id: string, data: any) => { return (await api.put(`/content/trivia/${id}`, data)).data; },
    deleteTrivia: async (id: string) => { return (await api.delete(`/content/trivia/${id}`)).data; },
    
    // Blogs
    getBlogs: async () => { return (await api.get('/content/blogs')).data; },
    createBlog: async (data: any) => { return (await api.post('/content/blogs', data)).data; },
    updateBlog: async (id: string, data: any) => { return (await api.put(`/content/blogs/${id}`, data)).data; },
    deleteBlog: async (id: string) => { return (await api.delete(`/content/blogs/${id}`)).data; },

    // Banners
    getBanners: async (activeOnly = false) => { return (await api.get(`/content/banners?active=${activeOnly}`)).data; },
    createBanner: async (data: any) => { return (await api.post('/content/banners', data)).data; },
    updateBanner: async (id: string, data: any) => { return (await api.put(`/content/banners/${id}`, data)).data; },
    deleteBanner: async (id: string) => { return (await api.delete(`/content/banners/${id}`)).data; },
};
