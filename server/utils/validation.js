class ValidationUtils {
  static validateEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    return password && password.length >= 6;
  }

  static validateUsername(username) {
    return username && username.length >= 3 && username.length <= 30;
  }

  static validateRegisterInput(data) {
    const errors = [];
    const { username, email, password } = data;

    if (!username) {
      errors.push('Username is required');
    } else if (!this.validateUsername(username)) {
      errors.push('Username must be between 3 and 30 characters');
    }

    if (!email) {
      errors.push('Email is required');
    } else if (!this.validateEmail(email)) {
      errors.push('Please enter a valid email');
    }

    if (!password) {
      errors.push('Password is required');
    } else if (!this.validatePassword(password)) {
      errors.push('Password must be at least 6 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateLoginInput(data) {
    const errors = [];
    const { email, password } = data;

    if (!email) {
      errors.push('Email is required');
    }

    if (!password) {
      errors.push('Password is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = ValidationUtils;