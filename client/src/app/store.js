import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import resetPasswordReducer from './resetPasswordSlice';
import transactionReducer from './transactionSlice';
import goalReducer from './goalSlice';

// Import setTokenGetter from all services
import { setTokenGetter as setAuthTokenGetter } from '../services/authService';
import { setTokenGetter as setResetPasswordTokenGetter } from '../services/resetPasswordService';
import { setTokenGetter as setGoalTokenGetter } from '../services/goalService';
import { setTokenGetter as setTransactionTokenGetter } from '../services/transactionService';

const store = configureStore({
    reducer: {
        auth: authReducer,
        passwordReset: resetPasswordReducer,
        transaction: transactionReducer,
        goals: goalReducer
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
setGoalTokenGetter(tokenGetter);
setTransactionTokenGetter(tokenGetter);

export { store };