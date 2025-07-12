import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { attendanceAPI } from '../../api/attendanceAPI';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  type: 'check-in' | 'check-out';
  location?: {
    latitude: number;
    longitude: number;
  };
  faceVerified: boolean;
  confidence: number;
  imageUrl?: string;
}

interface AttendanceState {
  records: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  loading: boolean;
  error: string | null;
  markingAttendance: boolean;
}

const initialState: AttendanceState = {
  records: [],
  todayRecord: null,
  loading: false,
  error: null,
  markingAttendance: false,
};

export const markAttendance = createAsyncThunk(
  'attendance/mark',
  async (data: { 
    type: 'check-in' | 'check-out';
    faceData: string;
    location?: { latitude: number; longitude: number };
  }) => {
    const response = await attendanceAPI.markAttendance(data);
    return response;
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/fetchHistory',
  async (filters?: { startDate?: string; endDate?: string; userId?: string }) => {
    const response = await attendanceAPI.getAttendanceHistory(filters);
    return response;
  }
);

export const fetchTodayAttendance = createAsyncThunk(
  'attendance/fetchToday',
  async () => {
    const response = await attendanceAPI.getTodayAttendance();
    return response;
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setMarkingAttendance: (state, action: PayloadAction<boolean>) => {
      state.markingAttendance = action.payload;
    },
    addAttendanceRecord: (state, action: PayloadAction<AttendanceRecord>) => {
      state.records.unshift(action.payload);
      if (action.payload.type === 'check-in') {
        state.todayRecord = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(markAttendance.pending, (state) => {
        state.markingAttendance = true;
        state.error = null;
      })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.markingAttendance = false;
        state.records.unshift(action.payload);
        if (action.payload.type === 'check-in') {
          state.todayRecord = action.payload;
        }
      })
      .addCase(markAttendance.rejected, (state, action) => {
        state.markingAttendance = false;
        state.error = action.error.message || 'Failed to mark attendance';
      })
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch attendance history';
      })
      .addCase(fetchTodayAttendance.fulfilled, (state, action) => {
        state.todayRecord = action.payload;
      });
  },
});

export const { clearError, setMarkingAttendance, addAttendanceRecord } = attendanceSlice.actions;
export default attendanceSlice.reducer; 