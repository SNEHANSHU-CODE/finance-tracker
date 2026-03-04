import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vaultService from '../services/vaultService';

export const fetchDocuments = createAsyncThunk('vault/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await vaultService.getAll();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const uploadDocument = createAsyncThunk('vault/upload', async (payload, { rejectWithValue }) => {
  try {
    const res = await vaultService.upload(payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteDocument = createAsyncThunk('vault/delete', async (id, { rejectWithValue }) => {
  try {
    await vaultService.remove(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchDocumentById = createAsyncThunk('vault/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await vaultService.getOne(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const vaultSlice = createSlice({
  name: 'vault',
  initialState: {
    documents: [],
    activeDocument: null,
    loading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    setActiveDocument: (state, action) => { state.activeDocument = action.payload; },
    clearActiveDocument: (state) => { state.activeDocument = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDocuments.fulfilled, (state, action) => { state.loading = false; state.documents = action.payload; })
      .addCase(fetchDocuments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(uploadDocument.pending, (state) => { state.uploading = true; state.error = null; })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.uploading = false;
        state.documents.unshift(action.payload);
      })
      .addCase(uploadDocument.rejected, (state, action) => { state.uploading = false; state.error = action.payload; })

      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d._id !== action.payload);
        if (state.activeDocument?._id === action.payload) state.activeDocument = null;
      })

      .addCase(fetchDocumentById.pending, (state) => { state.loading = true; })
      .addCase(fetchDocumentById.fulfilled, (state, action) => { state.loading = false; state.activeDocument = action.payload; })
      .addCase(fetchDocumentById.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { setActiveDocument, clearActiveDocument, clearError } = vaultSlice.actions;
export default vaultSlice.reducer;