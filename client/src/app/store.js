import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import resetPasswordReducer from './resetPasswordSlice';
import transactionReducer from './transactionSlice';
import goalReducer from './goalSlice';
import reminderReducer from './reminderSlice';
import analyticsReducer from './analyticsSlice';

// Import setTokenGetter from all services
import { setTokenGetter as setAuthTokenGetter } from '../services/authService';
import { setTokenGetter as setResetPasswordTokenGetter } from '../services/resetPasswordService';
import { setTokenGetter as setGoalTokenGetter } from '../services/goalService';
import { setTokenGetter as setTransactionTokenGetter } from '../services/transactionService';
import { setTokenGetter as setReminderTokenGetter } from '../services/reminderService';
import { setTokenGetter as setSettingsTokenGetter } from '../services/settingsService';
import { setTokenGetter as setAnalyticsTokenGetter } from '../services/analyticsService';

const store = configureStore({
    reducer: {
        auth: authReducer,
        passwordReset: resetPasswordReducer,
        transaction: transactionReducer,
        goals: goalReducer,
        reminder: reminderReducer,
        analytics: analyticsReducer
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
setReminderTokenGetter(tokenGetter);
setSettingsTokenGetter(tokenGetter);
setAnalyticsTokenGetter(tokenGetter);

export { store };