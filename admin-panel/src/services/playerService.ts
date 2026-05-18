import api from './api';

export const playerService = {
    getPlayers: async () => { return (await api.get('/players')).data; },
    createPlayer: async (data: any) => { return (await api.post('/players', data)).data; },
    updatePlayer: async (id: string, data: any) => { return (await api.put(`/players/${id}`, data)).data; },
    deletePlayer: async (id: string) => { return (await api.delete(`/players/${id}`)).data; },
};
