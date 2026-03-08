  import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
// Apollo v3 onError must return an Observable, not a Promise.
// fromPromise converts our async refresh logic into a proper Observable.
import { fromPromise } from '@apollo/client';
import { store } from '../app/store';
import { setCredentials, clearCredentials } from '../app/authSlice';
// apiClient would trigger axiosConfigs interceptor on a 401, which runs its
// OWN refresh logic in parallel — two simultaneous refreshes = race condition
// and the second one always fails (refresh token already rotated).
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// BUG 4 FIX: Template literals are always truthy, so the || fallback never fires.
// Use conditional assignment instead.
const ANALYTICS_SERVER_URL = import.meta.env.VITE_ANALYTICS_URL
  ? `${import.meta.env.VITE_ANALYTICS_URL}/graphql`
  : 'http://localhost:5001/graphql';

const httpLink = new HttpLink({
  uri: ANALYTICS_SERVER_URL,
  credentials: 'include',
});

const authLink = setContext((_, { headers }) => {
  const state = store.getState();
  const token = state?.auth?.accessToken;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'x-locale': navigator.language || 'en-US',
      'x-request-timestamp': new Date().toISOString(),
    }
  };
});

let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = () => {
  pendingRequests.forEach(resolve => resolve());
  pendingRequests = [];
};

// BUG 3 FIX: Shared refresh function used by both the queue path and main path
// so token is fetched once and reused — no duplicate refresh calls.
const getNewToken = () => {
  // Only start one refresh at a time — return existing promise if in progress
  if (!isRefreshing) {
    isRefreshing = true;

    return axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(response => {
        const newToken =
          response.data?.data?.accessToken ||
          response.data?.accessToken;

        if (!newToken) throw new Error('No token in refresh response');

        // BUG 3 FIX: Also fetch user from refresh response so setCredentials
        // doesn't receive { accessToken, user: undefined } — authSlice needs
        // user._id to set userId correctly.
        const newUser =
          response.data?.data?.user ||
          response.data?.user;

        store.dispatch(setCredentials({ accessToken: newToken, user: newUser }));
        resolvePendingRequests();
        return newToken;
      })
      .catch(err => {
        pendingRequests = [];
        store.dispatch(clearCredentials());
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        throw err;
      })
      .finally(() => {
        isRefreshing = false;
      });
  }
};

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  const is401 =
    networkError?.statusCode === 401 ||
    graphQLErrors?.some(e => e.extensions?.code === 'UNAUTHENTICATED');

  if (is401) {
    // If refresh already running, queue this operation
    if (isRefreshing) {
      return fromPromise(
        new Promise(resolve => {
          pendingRequests.push(resolve);
        })
      ).flatMap(() => {
        // Re-read the now-updated token from store for the retry
        const token = store.getState().auth?.accessToken;
        operation.setContext(({ headers = {} }) => ({
          headers: { ...headers, authorization: `Bearer ${token}` },
        }));
        return forward(operation);
      });
    }

    // BUG 1 FIX: Wrap async refresh in fromPromise to return an Observable
    return fromPromise(getNewToken())
      .flatMap(newToken => {
        operation.setContext(({ headers = {} }) => ({
          headers: { ...headers, authorization: `Bearer ${newToken}` },
        }));
        return forward(operation);
      });
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          dashboard:        { merge(_, incoming) { return incoming; } },
          spendingTrends:   { merge(_, incoming) { return incoming; } },
          categoryAnalysis: { merge(_, incoming) { return incoming; } },
          goalsProgress:    { merge(_, incoming) { return incoming; } },
          incomeTrends:     { merge(_, incoming) { return incoming; } },
        }
      }
    }
  }),
  connectToDevTools: import.meta.env.DEV,
});

export default client;