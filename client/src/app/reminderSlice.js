// store/reminderSlice.js (Fixed)
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

export const deleteReminder = createAsyncThunk(
  'reminder/delete',
  async (id, { rejectWithValue }) => {
    try {
      const res = await reminderService.deleteReminder(id);
      return { id, reminder: res.reminder };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateReminder = createAsyncThunk(
  'reminder/update',
  async ({ id, ...data }, { rejectWithValue }) => { // Fixed: Destructure id from payload
    try {
      const res = await reminderService.updateReminder(id, data);
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
    },
    // Add optimistic update for better UX
    optimisticUpdate: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.events.findIndex(event => event.id === id);
      if (index !== -1) {
        state.events[index] = { ...state.events[index], ...updates };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Reminders
      .addCase(fetchReminders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.map(r => ({
          id: r._id,
          title: r.title,
          date: r.date,
          description: r.description || '',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        }));
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Reminder
      .addCase(createReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push({
          id: action.payload._id,
          title: action.payload.title,
          date: action.payload.date,
          description: action.payload.description || '',
          createdAt: action.payload.createdAt,
          updatedAt: action.payload.updatedAt
        });
      })
      .addCase(createReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Reminder
      .addCase(updateReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(event => event.id === action.payload._id);
        if (index !== -1) {
          state.events[index] = {
            id: action.payload._id,
            title: action.payload.title,
            date: action.payload.date,
            description: action.payload.description || '',
            createdAt: action.payload.createdAt,
            updatedAt: action.payload.updatedAt
          };
        }
      })
      .addCase(updateReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Reminder
      .addCase(deleteReminder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter(event => event.id !== action.payload.id);
      })
      .addCase(deleteReminder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearReminderError, optimisticUpdate } = reminderSlice.actions;
export default reminderSlice.reducer;