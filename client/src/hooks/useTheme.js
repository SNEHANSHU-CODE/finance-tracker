import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTheme, setTheme } from '../app/settingsSlice';
import { useTranslation } from 'react-i18next';

export const useTheme = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const { i18n } = useTranslation();

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-theme' : '';
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    dispatch(setTheme(newTheme));
  };

  const setThemeValue = (newTheme) => {
    dispatch(setTheme(newTheme));
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
    isDark: theme === 'dark',
  };
};
