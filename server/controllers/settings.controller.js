const User = require('../models/userModel');

const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const settings = {
      language: user.preferences?.language || 'en',
      currency: user.preferences?.currency || 'INR',
      theme: user.preferences?.theme || 'light',
    };

    res.status(200).json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { language, currency, theme } = req.body;

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update preferences
    if (language !== undefined) {
      user.preferences.language = language;
    }
    if (currency !== undefined) {
      user.preferences.currency = currency;
    }
    if (theme !== undefined) {
      user.preferences.theme = theme;
    }

    await user.save();

    const updatedSettings = {
      language: user.preferences.language,
      currency: user.preferences.currency,
      theme: user.preferences.theme,
    };

    res.status(200).json(updatedSettings);
  } catch (error) {
    console.error('Update settings error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};