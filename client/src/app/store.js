import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import resetPasswordReducer from './resetPasswordSlice';
import transactionReducer from './transactionSlice';
import goalReducer from './goalSlice';
import reminderReducer from './reminderSlice';
import analyticsReducer from './analyticsSlice';
import chatReducer from './chatSlice';
import vaultReducer from './vaultSlice';
import budgetReducer from './budgetSlice';

import { setTokenGetter as setAuthTokenGetter } from '../services/authService';
import { setTokenGetter as setResetPasswordTokenGetter } from '../services/resetPasswordService';
import { setTokenGetter as setGoalTokenGetter } from '../services/goalService';
import { setTokenGetter as setTransactionTokenGetter } from '../services/transactionService';
import { setTokenGetter as setReminderTokenGetter } from '../services/reminderService';
import { setTokenGetter as setSettingsTokenGetter } from '../services/settingsService';
import { setTokenGetter as setAnalyticsTokenGetter } from '../services/analyticsService';
import { setTokenGetter as setChatTokenGetter, setUserIdGetter as setChatUserIdGetter } from '../services/chatService';
import { setTokenGetter as setVaultTokenGetter } from '../services/vaultService';
import { setTokenGetter as setBudgetTokenGetter } from '../services/budgetService';

const store = configureStore({
    reducer: {
        auth: authReducer,
        passwordReset: resetPasswordReducer,
        transaction: transactionReducer,
        goals: goalReducer,
        reminder: reminderReducer,
        analytics: analyticsReducer,
        chat: chatReducer,
        vault: vaultReducer,
        budget: budgetReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST'],
            },
        }),
});

const tokenGetter = () => {
    const state = store.getState();
    return state.auth.accessToken;
};

const userIdGetter = () => {
    const state = store.getState();
    const user = state.auth?.user;
    return user?.id || user?.userId || user?._id || null;
};

setAuthTokenGetter(tokenGetter);
setResetPasswordTokenGetter(tokenGetter);
setGoalTokenGetter(tokenGetter);
setTransactionTokenGetter(tokenGetter);
setReminderTokenGetter(tokenGetter);
setSettingsTokenGetter(tokenGetter);
setAnalyticsTokenGetter(tokenGetter);
setChatTokenGetter(tokenGetter);
setChatUserIdGetter(userIdGetter);
setVaultTokenGetter(tokenGetter);
setBudgetTokenGetter(tokenGetter);

export { store };