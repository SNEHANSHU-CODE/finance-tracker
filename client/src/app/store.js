import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { setTokenGetter } from '../services/authService';

const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

// Set up token getter for authService
setTokenGetter(() => {
    const state = store.getState();
    return state.auth.accessToken;
});

export { store };