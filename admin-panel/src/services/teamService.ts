import api from './api';

export interface Team {
    _id: string;
    name: string;
    code: string;
    logo: string;
    city?: string;
    captain?: string;
    players: { name: string; role: string; image?: string }[];
    points: number;
}

export const getTeams = async (sport?: string) => {
    const query = sport ? `?sport=${sport}` : '';
    const response = await api.get(`/teams${query}`);
    return response.data;
};

export const createTeam = async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
};

export const updateTeam = async (id: string, data: any) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
};

export const deleteTeam = async (id: string) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
};
