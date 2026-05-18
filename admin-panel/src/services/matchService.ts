import api from './api';

export interface Match {
    _id: string;
    title: string;
    series: string;
    venue?: string; // Added location support
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
    sport?: 'cricket' | 'kabaddi' | 'football'; // Distinguish sports
    teamA: { name: string; code: string; logo?: string };
    teamB: { name: string; code: string; logo?: string };

    // Cricket
    scoreA?: { runs: number; wickets: number; overs: number };
    scoreB?: { runs: number; wickets: number; overs: number };

    // Kabaddi / Football (Unified simpler structure if needed, or separate)
    // For Kabaddi: just scoreA (number) and scoreB (number) at root level of response
    // For Football: same, scoreA (number) and scoreB (number)
    // Note: The API returns flat scoreA/scoreB for non-cricket usually, but let's handle dynamically

    // Common
    statusText?: string;
    target?: number;
    winner?: string;

    // Context-aware Video URLs
    liveStreamUrl?: string;    // LIVE match – stream URL (YouTube Live, HLS, etc.)
    youtubeId?: string;        // YouTube Video/Stream ID
    hlsUrl?: string;           // HLS Stream URL (.m3u8)
    previewVideoUrl?: string;  // UPCOMING match – teaser/promo video
    recordedVideoUrl?: string; // COMPLETED match – full match or highlights
}

// Updated to fetch ALL matches from the unified endpoint
export const getMatches = async () => {
    const response = await api.get('/matches/all');
    return response.data;
};

// Create based on sport type
export const createMatch = async (matchData: any) => {
    // Post to unified endpoint, backend handles sport type
    const response = await api.post('/matches', matchData);
    return response.data;
};

export const updateMatch = async (id: string, matchData: any, sport: string = 'cricket') => {
    // Put to unified endpoint
    // Ensure sport is in the body, which it typically is for update forms
    const dataWithSport = { ...matchData, sport };
    const response = await api.put(`/matches/${id}`, dataWithSport);
    return response.data;
};

export const deleteMatch = async (id: string, sport: string = 'cricket') => {
    // Delete from unified endpoint with query param
    const response = await api.delete(`/matches/${id}?sport=${sport}`);
    return response.data;
};
