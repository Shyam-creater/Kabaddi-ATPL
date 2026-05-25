import api from './api';

export interface Team {
    name: string;
    code: string;
    logo?: string;
}

export interface Score {
    runs?: number;
    wickets?: number;
    overs?: number;
}

export interface Match {
    _id: string;
    title: string;
    series: string;
    venue?: string; // Added
    sport?: 'cricket' | 'kabaddi' | 'football'; // Added
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
    teamA: Team;
    teamB: Team;
    scoreA: number | Score; // Can be number or object
    scoreB: number | Score;
    statusText?: string;
    date: string;
    // Context specific
    period?: string; // Kabaddi
    half?: string;   // Football
    time?: string;   // Football
    // Video URLs
    liveStreamUrl?: string;    // LIVE: stream URL
    youtubeId?: string;        // YouTube Video/Stream ID
    hlsUrl?: string;           // HLS Stream URL (.m3u8)
    previewVideoUrl?: string;  // UPCOMING: teaser/promo
    recordedVideoUrl?: string; // COMPLETED: highlights/full match
}

class MatchService {
    // Get all matches from unified endpoint (optionally filter by status if backend supports it filtering on array, but for now we fetch all and filter client side or let backend handle simple status query if generic)
    async getMatches(status?: string, caller?: string) {
        try {
            console.log('[MatchService.getMatches] CALLED BY:', caller || 'unknown');
            // Note: The new unified endpoint is /matches/all. 
            // If specific sport endpoint is needed we can add that logic, but requirement is "All Matches".
            const response = await api.get('/matches/all', {
                headers: {
                    'x-client-caller': caller || 'unknown'
                }
            });
            const allMatches = response.data;

            if (status) {
                return allMatches.filter((m: Match) => m.status === status);
            }
            return allMatches;
        } catch (error) {
            console.error('Error fetching matches:', error);
            throw error;
        }
    }

    // Get single match details - Logic needs to know which sport endpoint to hit or use a unified 'get by ID' if exists. 
    // Currently backend only had specific get by IDs. 
    // We can assume for now we might need to know the sport or try all. 
    // However, the ID usually is unique enough. 
    // For this prototype, let's just stick to the list usage which is primary. 
    async getMatchById(id: string) {
        try {
            // Try cricket first (legacy default)
            // Ideally backend provides a single /api/matches/:id endpoint that looks up all collections.
            // For now, let's just try cricket. If it fails, we might need a better strategy or unified ID lookup.
            const response = await api.get(`/cricket/matches/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching match details:', error);
            throw error;
        }
    }
}

export default new MatchService();
