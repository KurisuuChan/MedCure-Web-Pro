// Intelligent Notification Rules Engine
export class NotificationRulesEngine {
  constructor() {
    this.rules = new Map();
    this.userPreferences = new Map();
    this.contextAnalyzer = new ContextAnalyzer();
  }

  // Rule: Critical notifications always go to all channels
  addCriticalRule() {
    this.addRule('critical_notifications', {
      condition: (notification) => notification.priority === 'CRITICAL',
      channels: ['desktop', 'toast', 'email', 'sms'],
      immediate: true,
      persistent: true,
      sound: true
    });
  }

  // Rule: During business hours, use desktop + toast
  addBusinessHoursRule() {
    this.addRule('business_hours', {
      condition: (notification) => this.isBusinessHours() && !this.isCritical(notification),
      channels: ['desktop', 'toast'],
      sound: notification.priority === 'HIGH'
    });
  }

  // Rule: After hours, use email for non-critical
  addAfterHoursRule() {
    this.addRule('after_hours', {
      condition: (notification) => !this.isBusinessHours() && !this.isCritical(notification),
      channels: ['email'],
      delay: 300000 // 5 minutes delay for batching
    });
  }

  // Rule: User is away, batch notifications
  addUserAwayRule() {
    this.addRule('user_away', {
      condition: (notification) => this.contextAnalyzer.isUserAway(),
      action: 'batch',
      batchInterval: 900000, // 15 minutes
      summaryChannel: 'email'
    });
  }

  // Intelligent channel selection
  async determineChannels(notification) {
    const context = await this.contextAnalyzer.analyze();
    const userPrefs = this.getUserPreferences(notification.userId);
    
    let selectedChannels = [];
    
    for (const [ruleName, rule] of this.rules) {
      if (rule.condition(notification, context, userPrefs)) {
        if (rule.channels) {
          selectedChannels.push(...rule.channels);
        }
        if (rule.action === 'batch') {
          return this.handleBatching(notification, rule);
        }
      }
    }

    // Remove duplicates and respect user preferences
    return [...new Set(selectedChannels)].filter(channel => 
      userPrefs.enabledChannels.includes(channel)
    );
  }

  isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    return day >= 1 && day <= 5 && hour >= 8 && hour <= 18;
  }

  isCritical(notification) {
    return ['CRITICAL', 'HIGH'].includes(notification.priority);
  }
}

// Context analyzer for smart notification delivery
class ContextAnalyzer {
  async analyze() {
    return {
      userActiveState: await this.getUserActiveState(),
      systemLoad: await this.getSystemLoad(),
      currentPage: this.getCurrentPage(),
      recentNotifications: await this.getRecentNotifications(),
      timeOfDay: this.getTimeOfDay(),
      dayOfWeek: this.getDayOfWeek()
    };
  }

  async isUserAway() {
    const lastActivity = await this.getLastUserActivity();
    return Date.now() - lastActivity > 300000; // 5 minutes
  }

  getCurrentPage() {
    return window.location.pathname;
  }

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}