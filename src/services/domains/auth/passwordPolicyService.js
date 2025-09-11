/**
 * Password Policy Service
 * Enforces enterprise-grade password policies and security requirements
 */
export class PasswordPolicyService {
  static POLICY_RULES = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    MIN_SPECIAL_CHARS: 1,
    PREVENT_COMMON_PASSWORDS: true,
    PREVENT_USER_INFO: true,
    PASSWORD_HISTORY_COUNT: 5,
    MAX_AGE_DAYS: 90,
    MIN_AGE_HOURS: 24,
  };

  static STRENGTH_LEVELS = {
    VERY_WEAK: "very_weak",
    WEAK: "weak",
    MODERATE: "moderate",
    STRONG: "strong",
    VERY_STRONG: "very_strong",
  };

  static COMMON_PASSWORDS = [
    "password",
    "password123",
    "123456",
    "123456789",
    "qwerty",
    "abc123",
    "password1",
    "admin",
    "welcome",
    "login",
    "passw0rd",
    "12345678",
    "iloveyou",
    "princess",
    "rockyou",
    "football",
    "monkey",
    "dragon",
    "master",
    "sunshine",
  ];

  /**
   * Validate password against all policy rules
   */
  static validatePassword(password, userInfo = {}) {
    const result = {
      isValid: true,
      score: 0,
      strength: this.STRENGTH_LEVELS.VERY_WEAK,
      errors: [],
      warnings: [],
      suggestions: [],
    };

    // Basic validation
    this.validateLength(password, result);
    this.validateCharacterRequirements(password, result);
    this.validateCommonPasswords(password, result);
    this.validateUserInfo(password, userInfo, result);

    // Calculate strength score
    result.score = this.calculateStrengthScore(password);
    result.strength = this.getStrengthLevel(result.score);

    // Generate suggestions
    result.suggestions = this.generateSuggestions(password);

    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Validate password length
   */
  static validateLength(password, result) {
    if (password.length < this.POLICY_RULES.MIN_LENGTH) {
      result.errors.push(
        `Password must be at least ${this.POLICY_RULES.MIN_LENGTH} characters long`
      );
    }

    if (password.length > this.POLICY_RULES.MAX_LENGTH) {
      result.errors.push(
        `Password must not exceed ${this.POLICY_RULES.MAX_LENGTH} characters`
      );
    }
  }

  /**
   * Validate character requirements
   */
  static validateCharacterRequirements(password, result) {
    if (this.POLICY_RULES.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      result.errors.push("Password must contain at least one uppercase letter");
    }

    if (this.POLICY_RULES.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      result.errors.push("Password must contain at least one lowercase letter");
    }

    if (this.POLICY_RULES.REQUIRE_NUMBERS && !/\d/.test(password)) {
      result.errors.push("Password must contain at least one number");
    }

    if (this.POLICY_RULES.REQUIRE_SPECIAL_CHARS) {
      const specialChars = password.match(
        /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/g
      );
      const specialCharCount = specialChars ? specialChars.length : 0;

      if (specialCharCount < this.POLICY_RULES.MIN_SPECIAL_CHARS) {
        result.errors.push(
          `Password must contain at least ${this.POLICY_RULES.MIN_SPECIAL_CHARS} special character(s)`
        );
      }
    }
  }

  /**
   * Validate against common passwords
   */
  static validateCommonPasswords(password, result) {
    if (!this.POLICY_RULES.PREVENT_COMMON_PASSWORDS) return;

    const lowercasePassword = password.toLowerCase();

    if (this.COMMON_PASSWORDS.includes(lowercasePassword)) {
      result.errors.push("Password is too common and easily guessable");
    }

    // Check for keyboard patterns
    if (this.isKeyboardPattern(password)) {
      result.warnings.push(
        "Password contains keyboard patterns which are less secure"
      );
    }

    // Check for repeated characters
    if (this.hasRepeatedCharacters(password)) {
      result.warnings.push(
        "Password contains repeated characters which reduces security"
      );
    }
  }

  /**
   * Validate against user information
   */
  static validateUserInfo(password, userInfo, result) {
    if (!this.POLICY_RULES.PREVENT_USER_INFO) return;

    const lowercasePassword = password.toLowerCase();
    const fieldsToCheck = [
      "username",
      "email",
      "firstName",
      "lastName",
      "company",
    ];

    fieldsToCheck.forEach((field) => {
      if (userInfo[field]) {
        const value = userInfo[field].toLowerCase();
        if (
          lowercasePassword.includes(value) ||
          value.includes(lowercasePassword)
        ) {
          result.errors.push(
            `Password must not contain personal information (${field})`
          );
        }
      }
    });
  }

  /**
   * Calculate password strength score (0-100)
   */
  static calculateStrengthScore(password) {
    let score = 0;

    // Length bonus
    score += Math.min(password.length * 2, 25);

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\d/.test(password)) score += 5;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) score += 10;

    // Complexity bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 15);

    // Pattern penalties
    if (this.isKeyboardPattern(password)) score -= 10;
    if (this.hasRepeatedCharacters(password)) score -= 5;
    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) score -= 25;

    // Entropy bonus
    const entropy = this.calculateEntropy(password);
    score += Math.min(entropy / 2, 20);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get strength level based on score
   */
  static getStrengthLevel(score) {
    if (score < 20) return this.STRENGTH_LEVELS.VERY_WEAK;
    if (score < 40) return this.STRENGTH_LEVELS.WEAK;
    if (score < 60) return this.STRENGTH_LEVELS.MODERATE;
    if (score < 80) return this.STRENGTH_LEVELS.STRONG;
    return this.STRENGTH_LEVELS.VERY_STRONG;
  }

  /**
   * Generate password improvement suggestions
   */
  static generateSuggestions(password) {
    const suggestions = [];

    if (password.length < 12) {
      suggestions.push(
        "Consider using a longer password (12+ characters) for better security"
      );
    }

    if (!/[A-Z].*[A-Z]/.test(password)) {
      suggestions.push("Use multiple uppercase letters in different positions");
    }

    if (!/\d.*\d/.test(password)) {
      suggestions.push("Include multiple numbers for added complexity");
    }

    if (
      !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`].*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(
        password
      )
    ) {
      suggestions.push("Use multiple special characters for enhanced security");
    }

    if (!this.hasRandomPattern(password)) {
      suggestions.push("Avoid predictable patterns and sequences");
    }

    suggestions.push("Consider using a passphrase with random words");
    suggestions.push(
      "Mix character types throughout the password, not just at the beginning or end"
    );

    return suggestions;
  }

  /**
   * Check for keyboard patterns
   */
  static isKeyboardPattern(password) {
    const patterns = [
      "qwerty",
      "asdf",
      "zxcv",
      "1234",
      "abcd",
      "qwertyuiop",
      "asdfghjkl",
      "zxcvbnm",
      "123456789",
      "abcdefgh",
    ];

    const lowercasePassword = password.toLowerCase();
    return patterns.some(
      (pattern) =>
        lowercasePassword.includes(pattern) ||
        lowercasePassword.includes(pattern.split("").reverse().join(""))
    );
  }

  /**
   * Check for repeated characters
   */
  static hasRepeatedCharacters(password) {
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Check for random pattern
   */
  static hasRandomPattern(password) {
    // Check for ascending/descending sequences
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);

      if (
        (char2 === char1 + 1 && char3 === char2 + 1) ||
        (char2 === char1 - 1 && char3 === char2 - 1)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate password entropy
   */
  static calculateEntropy(password) {
    let charsetSize = 0;

    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/\d/.test(password)) charsetSize += 10;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password))
      charsetSize += 32;

    return Math.log2(Math.pow(charsetSize, password.length));
  }

  /**
   * Generate secure password suggestion
   */
  static generateSecurePassword(length = 16, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
      excludeSimilar = true,
    } = options;

    let charset = "";

    if (includeLowercase) {
      charset += excludeSimilar
        ? "abcdefghjkmnpqrstuvwxyz"
        : "abcdefghijklmnopqrstuvwxyz";
    }

    if (includeUppercase) {
      charset += excludeSimilar
        ? "ABCDEFGHJKMNPQRSTUVWXYZ"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }

    if (includeNumbers) {
      charset += excludeSimilar ? "23456789" : "0123456789";
    }

    if (includeSpecialChars) {
      charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    }

    let password = "";

    // Ensure at least one character from each required type
    if (includeLowercase)
      password += this.getRandomChar(charset.match(/[a-z]/g).join(""));
    if (includeUppercase)
      password += this.getRandomChar(charset.match(/[A-Z]/g).join(""));
    if (includeNumbers)
      password += this.getRandomChar(charset.match(/\d/g).join(""));
    if (includeSpecialChars)
      password += this.getRandomChar("!@#$%^&*()_+-=[]{}|;:,.<>?");

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += this.getRandomChar(charset);
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => 0.5 - Math.random())
      .join("");
  }

  /**
   * Get random character from charset
   */
  static getRandomChar(charset) {
    return charset.charAt(Math.floor(Math.random() * charset.length));
  }

  /**
   * Check if password needs to be changed based on age
   */
  static isPasswordExpired(lastChangedDate) {
    if (!lastChangedDate) return true;

    const daysSinceChange =
      (Date.now() - new Date(lastChangedDate).getTime()) /
      (1000 * 60 * 60 * 24);
    return daysSinceChange > this.POLICY_RULES.MAX_AGE_DAYS;
  }

  /**
   * Check if password can be changed (minimum age)
   */
  static canChangePassword(lastChangedDate) {
    if (!lastChangedDate) return true;

    const hoursSinceChange =
      (Date.now() - new Date(lastChangedDate).getTime()) / (1000 * 60 * 60);
    return hoursSinceChange >= this.POLICY_RULES.MIN_AGE_HOURS;
  }

  /**
   * Validate password against history
   */
  static validatePasswordHistory(newPassword, passwordHistory = []) {
    if (!this.POLICY_RULES.PASSWORD_HISTORY_COUNT) return true;

    const recentPasswords = passwordHistory.slice(
      0,
      this.POLICY_RULES.PASSWORD_HISTORY_COUNT
    );
    return !recentPasswords.includes(newPassword);
  }

  /**
   * Get password policy summary for UI display
   */
  static getPolicyRules() {
    return {
      minLength: this.POLICY_RULES.MIN_LENGTH,
      maxLength: this.POLICY_RULES.MAX_LENGTH,
      requireUppercase: this.POLICY_RULES.REQUIRE_UPPERCASE,
      requireLowercase: this.POLICY_RULES.REQUIRE_LOWERCASE,
      requireNumbers: this.POLICY_RULES.REQUIRE_NUMBERS,
      requireSpecialChars: this.POLICY_RULES.REQUIRE_SPECIAL_CHARS,
      minSpecialChars: this.POLICY_RULES.MIN_SPECIAL_CHARS,
      maxAgeDays: this.POLICY_RULES.MAX_AGE_DAYS,
      minAgeHours: this.POLICY_RULES.MIN_AGE_HOURS,
      passwordHistoryCount: this.POLICY_RULES.PASSWORD_HISTORY_COUNT,
    };
  }
}

export default PasswordPolicyService;
