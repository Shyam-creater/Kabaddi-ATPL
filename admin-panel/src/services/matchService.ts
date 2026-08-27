import api from './api';

export interface Match {
    _id: string;
    title: string;
    series: string;
    venue?: string;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
    sport?: 'cricket' | 'kabaddi' | 'football';
    matchType?: 'League' | 'Knockout' | 'Friendly';
    tournamentId?: string;
    teamAId?: string;
    teamBId?: string;
    teamA: { name: string; code: string; logo?: string };
    teamB: { name: string; code: string; logo?: string };

    teamAPlayers?: Array<{ user?: string; name?: string; position?: string; role?: string; jerseyNumber?: number; image?: string }>;
    teamBPlayers?: Array<{ user?: string; name?: string; position?: string; role?: string; jerseyNumber?: number; image?: string }>;
    assignedScorer?: string;

    scoreA?: any;
    scoreB?: any;
    extraPointsA?: number;
    extraPointsB?: number;
    allOutPointsA?: number;
    allOutPointsB?: number;
    raidPointsA?: number;
    raidPointsB?: number;
    superTackles?: number;

    period?: string;
    firstHalfStats?: any;
    secondHalfStats?: any;

    goalScorers?: Array<{ player: string; minute?: number; type?: string; team?: string }>;
    possession?: { teamA?: number; teamB?: number };
    playerStats?: Array<{ user?: string; name?: string; team?: string; position?: string; goals?: number; assists?: number; raidPoints?: number; tacklePoints?: number; bonusPoints?: number; otherPoints?: number; totalPoints?: number; [key: string]: any }>;

    target?: number;
    statusText?: string;
    winner?: string;

    tossWinner?: string;
    tossDecision?: string;
    oversLimit?: number;
    battingLineup?: Array<{
        name: string;
        position?: string;
        runs?: number;
        balls?: number;
        fours?: number;
        sixes?: number;
        status?: string;
        dismissal?: string;
    }>;
    bowlingLineup?: Array<{
        name: string;
        overs?: number;
        maidens?: number;
        runs?: number;
        wickets?: number;
        wides?: number;
        noballs?: number;
    }>;
    currentBatters?: Array<{
        name: string;
        runs?: number;
        balls?: number;
        fours?: number;
        sixes?: number;
        isStriker?: boolean;
    }>;
    currentBowler?: {
        name: string;
        overs?: number;
        maidens?: number;
        runs?: number;
        wickets?: number;
        wides?: number;
        noballs?: number;
    };
    commentary?: Array<{
        over?: number;
        ball?: number;
        time?: string;
        runs?: number;
        bowlerRuns?: number;
        bowler?: string;
        innings?: string;
        event?: string;
        description: string;
        timestamp?: string;
    }>;

    liveStreamUrl?: string;
    youtubeId?: string;
    hlsUrl?: string;
    previewVideoUrl?: string;
    recordedVideoUrl?: string;
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
