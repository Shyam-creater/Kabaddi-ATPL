import api from './api';

const buildUrl = (path: string, params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
            searchParams.append(key, String(val));
        }
    });
    const queryString = searchParams.toString();
    return queryString ? `${path}?${queryString}` : path;
};

export const contentService = {
    // Partners
    getPartners: async (sport?: string) => { return (await api.get(buildUrl('/content/partners', { sport }))).data; },
    createPartner: async (data: any) => { return (await api.post('/content/partners', data)).data; },
    updatePartner: async (id: string, data: any) => { return (await api.put(`/content/partners/${id}`, data)).data; },
    deletePartner: async (id: string) => { return (await api.delete(`/content/partners/${id}`)).data; },

    // Trending Players
    getTrendingPlayers: async (sport?: string) => { return (await api.get(buildUrl('/content/trending-players', { sport }))).data; },
    createTrendingPlayer: async (data: any) => { return (await api.post('/content/trending-players', data)).data; },
    updateTrendingPlayer: async (id: string, data: any) => { return (await api.put(`/content/trending-players/${id}`, data)).data; },
    deleteTrendingPlayer: async (id: string) => { return (await api.delete(`/content/trending-players/${id}`)).data; },

    // Polls
    getPolls: async (sport?: string) => { return (await api.get(buildUrl('/content/polls', { sport }))).data; },
    createPoll: async (data: any) => { return (await api.post('/content/polls', data)).data; },
    updatePoll: async (id: string, data: any) => { return (await api.put(`/content/polls/${id}`, data)).data; },
    deletePoll: async (id: string) => { return (await api.delete(`/content/polls/${id}`)).data; },

    // News
    getNews: async (sport?: string) => { return (await api.get(buildUrl('/content/news', { sport }))).data; },
    createNews: async (data: any) => { return (await api.post('/content/news', data)).data; },
    updateNews: async (id: string, data: any) => { return (await api.put(`/content/news/${id}`, data)).data; },
    deleteNews: async (id: string) => { return (await api.delete(`/content/news/${id}`)).data; },

    // Quotes
    getQuotes: async (sport?: string) => { return (await api.get(buildUrl('/content/quotes', { sport }))).data; },
    createQuote: async (data: any) => { return (await api.post('/content/quotes', data)).data; },
    updateQuote: async (id: string, data: any) => { return (await api.put(`/content/quotes/${id}`, data)).data; },
    deleteQuote: async (id: string) => { return (await api.delete(`/content/quotes/${id}`)).data; },

    // Highlights
    getHighlights: async (sport?: string) => { return (await api.get(buildUrl('/content/highlights', { sport }))).data; },
    createHighlight: async (data: any) => { return (await api.post('/content/highlights', data)).data; },
    updateHighlight: async (id: string, data: any) => { return (await api.put(`/content/highlights/${id}`, data)).data; },
    deleteHighlight: async (id: string) => { return (await api.delete(`/content/highlights/${id}`)).data; },

    // Ads
    getAds: async (sport?: string) => { return (await api.get(buildUrl('/content/ads', { sport }))).data; },
    createAd: async (data: any) => { return (await api.post('/content/ads', data)).data; },
    updateAd: async (id: string, data: any) => { return (await api.put(`/content/ads/${id}`, data)).data; },
    deleteAd: async (id: string) => { return (await api.delete(`/content/ads/${id}`)).data; },

    // Social
    getSocials: async (sport?: string) => { return (await api.get(buildUrl('/content/social', { sport }))).data; },
    createSocial: async (data: any) => { return (await api.post('/content/social', data)).data; },
    updateSocial: async (id: string, data: any) => { return (await api.put(`/content/social/${id}`, data)).data; },
    deleteSocial: async (id: string) => { return (await api.delete(`/content/social/${id}`)).data; },

    // Trivia
    getTrivia: async (sport?: string) => { return (await api.get(buildUrl('/content/trivia', { sport }))).data; },
    createTrivia: async (data: any) => { return (await api.post('/content/trivia', data)).data; },
    updateTrivia: async (id: string, data: any) => { return (await api.put(`/content/trivia/${id}`, data)).data; },
    deleteTrivia: async (id: string) => { return (await api.delete(`/content/trivia/${id}`)).data; },
    
    // Blogs
    getBlogs: async (sport?: string) => { return (await api.get(buildUrl('/content/blogs', { sport }))).data; },
    createBlog: async (data: any) => { return (await api.post('/content/blogs', data)).data; },
    updateBlog: async (id: string, data: any) => { return (await api.put(`/content/blogs/${id}`, data)).data; },
    deleteBlog: async (id: string) => { return (await api.delete(`/content/blogs/${id}`)).data; },

    // Banners
    getBanners: async (activeOnly = false, sport?: string) => { return (await api.get(buildUrl('/content/banners', { active: activeOnly, sport }))).data; },
    createBanner: async (data: any) => { return (await api.post('/content/banners', data)).data; },
    updateBanner: async (id: string, data: any) => { return (await api.put(`/content/banners/${id}`, data)).data; },
    deleteBanner: async (id: string) => { return (await api.delete(`/content/banners/${id}`)).data; },
};
