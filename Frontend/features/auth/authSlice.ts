import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

interface UserState {
    user: any | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

const initialState: UserState = {
    user: null,
    token: null,
    loading: false,
    error: null,
};

// Register
export const registerUser = createAsyncThunk(
    'auth/register',
    async (data: any, thunkAPI) => {
        try {
            return await authService.register(data);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Registration failed';
            return thunkAPI.rejectWithValue(message);
        }

    }
);

// Login
export const loginUser = createAsyncThunk(
    'auth/login',
    async (data: { email: string, password: string }, thunkAPI) => {
        try {
            return await authService.login(data);
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response.data.message);
        }
    }
);

// Fetch Profile
export const fetchProfile = createAsyncThunk(
    'auth/fetchProfile',
    async (_, thunkAPI) => {
        try {
            return await authService.getProfile();
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Fetch failed');
        }
    }
);

// Update Profile
export const updateUserProfile = createAsyncThunk(
    'auth/updateProfile',
    async (data: any, thunkAPI) => {
        try {
            return await authService.updateProfile(data);
        } catch (error: any) {
            if (error.response && error.response.status === 413) {
                return thunkAPI.rejectWithValue('Image too large. Please Restart Backend Server to apply the 50MB limit fix.');
            }
            return thunkAPI.rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
        },
        updateFollowStatus: (state, action) => {
            if (state.user) {
                // Ensure following array exists
                if (!state.user.following) state.user.following = [];
                
                const { userId, status } = action.payload;
                const index = state.user.following.findIndex((f: any) => {
                    const id = typeof f === 'string' ? f : (f.user?._id || f.user);
                    return id === userId;
                });

                if (status === 'none') {
                    if (index !== -1) state.user.following.splice(index, 1);
                } else {
                    if (index !== -1) {
                        state.user.following[index].status = status;
                    } else {
                        state.user.following.push({ user: userId, status, createdAt: new Date().toISOString() });
                    }
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data.user;
                state.token = action.payload.data.token;
            })
            .addCase(registerUser.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data.user;
                state.token = action.payload.data.token;
            })
            .addCase(loginUser.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchProfile.pending, (state) => { state.loading = true; })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data;
            })
            .addCase(fetchProfile.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateUserProfile.pending, (state) => { state.loading = true; })
            .addCase(updateUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.data;
            })
            .addCase(updateUserProfile.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { logout, updateFollowStatus } = authSlice.actions;
export default authSlice.reducer;
