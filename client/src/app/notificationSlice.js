import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../services/notificationService';

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationService.getNotifications();
      // controller returns { success, data: { notifications[], unreadCount } }
      return res.data?.notifications || res.data || [];
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationService.getUnreadCount();
      // controller returns { success, data: { unreadCount } }
      return res.data?.unreadCount ?? 0;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationService.markAllRead();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const markOneRead = createAsyncThunk(
  'notifications/markOneRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markOneRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.deleteNotification(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
  items: [],          // full notification objects
  unreadCount: 0,
  panelOpen: false,
  loading: false,
  error: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Called by chatService socket listener when server pushes a new notification
    addNotification(state, action) {
      const incoming = action.payload;
      const exists = state.items.some(n => n._id === incoming._id);
      if (!exists) {
        state.items.unshift(incoming); // newest first
        if (!incoming.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount + 1);
        }
      }
    },

    setPanelOpen(state, action) {
      state.panelOpen = action.payload;
    },

    // Optimistic local clear (used alongside markAllRead thunk)
    clearUnreadBadge(state) {
      state.unreadCount = 0;
      state.items = state.items.map(n => ({ ...n, isRead: true }));
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        // Recount from actual items (don't trust stale unreadCount)
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchUnreadCount
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })

      // markAllRead
      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map(n => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      })

      // markOneRead
      .addCase(markOneRead.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.items.find(n => n._id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      // deleteNotification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const id = action.payload;
        const item = state.items.find(n => n._id === id);
        if (item && !item.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items = state.items.filter(n => n._id !== id);
      });
  },
});

export const { addNotification, setPanelOpen, clearUnreadBadge } = notificationSlice.actions;
export default notificationSlice.reducer;