import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import resetPasswordReducer from './resetPasswordSlice';
import transactionReducer from './transactionSlice';
import goalReducer from './goalSlice';
import reminderReducer from './reminderSlice';
import analyticsReducer from './analyticsSlice';
import chatReducer from './chatSlice';

// Import setTokenGetter from all services
import { setTokenGetter as setAuthTokenGetter } from '../services/authService';
import { setTokenGetter as setResetPasswordTokenGetter } from '../services/resetPasswordService';
import { setTokenGetter as setGoalTokenGetter, setGuestMode as setGoalGuestMode } from '../services/goalService';
import { setTokenGetter as setTransactionTokenGetter, setGuestMode as setTransactionGuestMode } from '../services/transactionService';
import { setTokenGetter as setReminderTokenGetter } from '../services/reminderService';
import { setTokenGetter as setSettingsTokenGetter } from '../services/settingsService';
import { setTokenGetter as setAnalyticsTokenGetter } from '../services/analyticsService';
import { setTokenGetter as setChatTokenGetter, setUserIdGetter as setChatUserIdGetter } from '../services/chatService';

const store = configureStore({
    reducer: {
        auth: authReducer,
        passwordReset: resetPasswordReducer,
        transaction: transactionReducer,
        goals: goalReducer,
        reminder: reminderReducer,
        analytics: analyticsReducer,
        chat: chatReducer,
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

// Create a userId getter function
const userIdGetter = () => {
    const state = store.getState();
    const user = state.auth?.user;
    const result = user?.id || user?.userId || user?._id || null;
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/eaf63283-b7fa-4e57-ad18-e6d76a13fb5f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'store.js:45',message:'userIdGetter called',data:{hasAuth:!!state.auth,hasUser:!!user,userId:result,userKeys:user?Object.keys(user):null,isAuthenticated:state.auth?.isAuthenticated},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v2',hypothesisId:'E'})}).catch(()=>{});
    }
    // #endregion
    return result;
};

// Create a guest mode getter function
const guestModeGetter = () => {
    const state = store.getState();
    return state.auth.isGuest;
};

// Set up token getter for all services
setAuthTokenGetter(tokenGetter);
setResetPasswordTokenGetter(tokenGetter);
setGoalTokenGetter(tokenGetter);
setTransactionTokenGetter(tokenGetter);
setReminderTokenGetter(tokenGetter);
setSettingsTokenGetter(tokenGetter);
setAnalyticsTokenGetter(tokenGetter);
setChatTokenGetter(tokenGetter);
setChatUserIdGetter(userIdGetter);

// Export getters for use in services
if (typeof window !== 'undefined') {
    window.__REDUX_GETTERS__ = {
        tokenGetter,
        userIdGetter,
        guestModeGetter
    };
}

// Set up guest mode for services that support it
setGoalGuestMode(guestModeGetter());
setTransactionGuestMode(guestModeGetter());

// Subscribe to store changes to update guest mode
store.subscribe(() => {
    const isGuest = guestModeGetter();
    setGoalGuestMode(isGuest);
    setTransactionGuestMode(isGuest);
});

export { store };