import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshToken, setInitialized } from '../app/authSlice';

export const useAuthInitialization = () => {
  const dispatch = useDispatch();
  const { isInitialized, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isInitialized) {
        try {
          // Try to refresh token on app startup
          await dispatch(refreshToken()).unwrap();
        } catch (error) {
          // No valid refresh token, user needs to login
          console.log('No valid refresh token found');
        } finally {
          dispatch(setInitialized());
        }
      }
    };

    initializeAuth();
  }, [dispatch, isInitialized]);

  return { isInitialized, isAuthenticated };
};