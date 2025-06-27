import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import reminderService from '../services/reminderService';

export const fetchReminders = createAsyncThunk(
  'reminder/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await reminderService.getReminders();
      return res.reminders || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const createReminder = createAsyncThunk(
  'reminder/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await reminderService.createReminder(data);
      return res.reminder;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const googleConnect = createAsyncThunk(
  'reminder/googleConnect',
  async (_, { rejectWithValue }) => {
    try {
      const res = await reminderService.googleConnect();
      const { url } = res;
      window.location.href = url; // ✅ Redirect to Google
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const reminderSlice = createSlice({
  name: 'reminder',
  initialState: {
    events: [],
    loading: false,
    error: null
  },
  reducers: {
    clearReminderError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.map(r => ({
          title: r.title,
          date: r.date
        }));
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push({
          title: action.payload.title,
          date: action.payload.date
        });
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearReminderError } = reminderSlice.actions;
export default reminderSlice.reducer;

