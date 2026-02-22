import React from 'react';
import { usePreferences } from '../hooks/usePreferences';
import { FaPalette, FaGlobe, FaDollarSign } from 'react-icons/fa';

export default function PreferenceSwitcher() {
  const { 
    theme, 
    language, 
    currency, 
    setTheme, 
    setLanguage, 
    setCurrency 
  } = usePreferences();

  return (
    <div className="d-flex gap-2 align-items-center">
      {/* Theme Switcher */}
      <div className="btn-group" role="group">
        <button
          type="button"
          className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setTheme('light')}
          title={t('light')}
        >
          ☀️
        </button>
        <button
          type="button"
          className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setTheme('dark')}
          title={t('dark')}
        >
          🌙
        </button>
        <button
          type="button"
          className={`btn btn-sm ${theme === 'auto' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setTheme('auto')}
          title={t('auto')}
        >
          🔄
        </button>
      </div>

      {/* Language Switcher */}
      <select
        className="form-select form-select-sm"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        title={t('language')}
        style={{ maxWidth: '120px' }}
      >
        <option value="en">{t('english')}</option>
        <option value="hi">{t('hindi')}</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="it">Italiano</option>
      </select>

      {/* Currency Switcher */}
      <select
        className="form-select form-select-sm"
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        title={t('currency')}
        style={{ maxWidth: '100px' }}
      >
        <option value="INR">{t('inr')}</option>
        <option value="USD">{t('usd')}</option>
        <option value="EUR">{t('eur')}</option>
        <option value="GBP">£ GBP</option>
        <option value="CAD">C$ CAD</option>
        <option value="AUD">A$ AUD</option>
      </select>
    </div>
  );
}
