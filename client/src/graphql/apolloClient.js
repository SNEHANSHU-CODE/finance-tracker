import { ApolloClient, InMemoryCache, createHttpLink, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { store } from '../app/store'; // Redux store

// Analytics Server GraphQL endpoint
const ANALYTICS_SERVER_URL = (import.meta.env.VITE_ANALYTICS_URL + '/graphql') || 'http://localhost:5001/graphql';

const httpLink = new HttpLink({
  uri: ANALYTICS_SERVER_URL,
  credentials: 'include', // Include cookies if using session auth
});

const authLink = setContext((_, { headers }) => {
  // Get token from Redux store (auth state)
  const state = store.getState();
  const token = state?.auth?.accessToken;
  
  console.log('🔐 Apollo Auth Link:', { 
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
  });

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      'x-locale': navigator.language || 'en-US',
      'x-request-timestamp': new Date().toISOString(),
    }
  }
});

// Create Apollo Client with caching and error handling
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({
    typePolicies: {
      // Cache query results by user ID
      Query: {
        fields: {
          dashboard: {
            merge(existing, incoming) {
              return incoming;
            }
          },
          spendingTrends: {
            merge(existing, incoming) {
              return incoming;
            }
          },
          categoryAnalysis: {
            merge(existing, incoming) {
              return incoming;
            }
          },
          goalsProgress: {
            merge(existing, incoming) {
              return incoming;
            }
          },
          incomeTrends: {
            merge(existing, incoming) {
              return incoming;
            }
          }
        }
      }
    }
  }),
  connectToDevTools: import.meta.env.DEV, // Enable Apollo DevTools in development
});

export default client;