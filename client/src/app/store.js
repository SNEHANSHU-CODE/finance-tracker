import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import resetPasswordSlice from './resetPasswordSlice';
import transactionSlice from './transactionSlice';

// Import setTokenGetter from all services
import { setTokenGetter as setAuthTokenGetter } from '../services/authService';
import { setTokenGetter as setResetPasswordTokenGetter } from '../services/resetPasswordService';
import { setTokenGetter as setTransactionTokenGetter } from '../services/transactionService';

const store = configureStore({
    reducer: {
        auth: authReducer,
        passwordReset: resetPasswordSlice,
        transaction: transactionSlice
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

// Create a single token getter function
const tokenGetter = () => {
    const state = store.getState();
    return state.auth.accessToken;
};

// Set up token getter for all services
setAuthTokenGetter(tokenGetter);
setResetPasswordTokenGetter(tokenGetter);
setTransactionTokenGetter(tokenGetter);

export { store };