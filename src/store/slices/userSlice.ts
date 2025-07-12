import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userAPI } from '../../api/userAPI';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  position?: string;
  faceRegistered: boolean;
  faceDataUrl?: string;
  profileImageUrl?: string;
  settings: {
    notifications: boolean;
    biometricAuth: boolean;
    autoLocation: boolean;
  };
}

interface UserState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updatingProfile: boolean;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  updatingProfile: false,
};

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async () => {
    const response = await userAPI.getProfile();
    return response;
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserProfile>) => {
    const response = await userAPI.updateProfile(profileData);
    return response;
  }
);

export const registerFace = createAsyncThunk(
  'user/registerFace',
  async (faceData: string[]) => {
    const response = await userAPI.registerFace(faceData);
    return response;
  }
);

export const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings: Partial<UserProfile['settings']>) => {
    const response = await userAPI.updateSettings(settings);
    return response;
  }
);

export const fetchAdminStats = createAsyncThunk(
  'user/fetchAdminStats',
  async () => {
    const response = await userAPI.getAdminStats();
    return response;
  }
);

export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async () => {
    const response = await userAPI.getUsers();
    return response;
  }
);

export const fetchAttendanceReports = createAsyncThunk(
  'user/fetchAttendanceReports',
  async () => {
    const response = await userAPI.getAttendanceReports();
    return response;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.updatingProfile = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updatingProfile = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updatingProfile = false;
        state.error = action.error.message || 'Failed to update profile';
      })
      .addCase(registerFace.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.faceRegistered = true;
          state.profile.faceDataUrl = action.payload.faceDataUrl;
        }
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.settings = { ...state.profile.settings, ...action.payload.settings };
        }
      });
  },
});

export const { clearError, setProfile } = userSlice.actions;
export default userSlice.reducer; 