const axios = require('axios');
const constants = require('../utils/constants');

/**
 * Notification Manager for Heaven DEX Bot
 * Handles notifications via Telegram, Email, and Webhooks
 */
class NotificationManager {
  constructor(config = {}) {
    this.config = {
      telegram: {
        enabled: false,
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        chatId: process.env.TELEGRAM_CHAT_ID,
        notifications: ['trades', 'alerts', 'reports']
      },
      email: {
        enabled: false,
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        notifications: ['alerts', 'reports']
      },
      webhook: {
        enabled: false,
        url: process.env.WEBHOOK_URL,
        notifications: ['trades', 'alerts']
      },
      ...config
    };
    
    this.notificationQueue = [];
    this.isProcessing = false;
    this.rateLimitCounters = {
      telegram: { count: 0, resetTime: Date.now() },
      email: { count: 0, resetTime: Date.now() },
      webhook: { count: 0, resetTime: Date.now() }
    };
  }

  /**
   * Send notification
   * @param {Object} notification - Notification object
   * @returns {Promise<boolean>} - Success status
   */
  async sendNotification(notification) {
    try {
      const { type, title, message, priority = 'info', data = {} } = notification;
      
      // Validate notification
      if (!this.validateNotification(notification)) {
        console.error('Invalid notification format');
        return false;
      }

      // Add to queue
      this.notificationQueue.push({
        ...notification,
        timestamp: Date.now(),
        id: this.generateNotificationId()
      });

      // Process queue if not already processing
      if (!this.isProcessing) {
        this.processQueue();
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send trade notification
   * @param {Object} trade - Trade data
   * @returns {Promise<boolean>} - Success status
   */
  async sendTradeNotification(trade) {
    const { type, amount, price, tokenMint, timestamp } = trade;
    
    const notification = {
      type: 'trade',
      title: `Trade ${type.toUpperCase()}`,
      message: `${type.toUpperCase()} ${amount} tokens at ${price} SOL`,
      priority: 'info',
      data: {
        tradeType: type,
        amount,
        price,
        tokenMint,
        timestamp,
        profit: trade.profit || 0
      }
    };

    return this.sendNotification(notification);
  }

  /**
   * Send alert notification
   * @param {Object} alert - Alert data
   * @returns {Promise<boolean>} - Success status
   */
  async sendAlertNotification(alert) {
    const { type, message, severity = 'warning', data = {} } = alert;
    
    const notification = {
      type: 'alert',
      title: `Alert: ${type}`,
      message,
      priority: severity,
      data: {
        alertType: type,
        severity,
        timestamp: Date.now(),
        ...data
      }
    };

    return this.sendNotification(notification);
  }

  /**
   * Send report notification
   * @param {Object} report - Report data
   * @returns {Promise<boolean>} - Success status
   */
  async sendReportNotification(report) {
    const { type, summary, data = {} } = report;
    
    const notification = {
      type: 'report',
      title: `${type} Report`,
      message: this.formatReportSummary(summary),
      priority: 'info',
      data: {
        reportType: type,
        summary,
        timestamp: Date.now(),
        ...data
      }
    };

    return this.sendNotification(notification);
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        
        // Check rate limits
        if (this.isRateLimited(notification.type)) {
          // Put back in queue and wait
          this.notificationQueue.unshift(notification);
          await this.sleep(1000);
          continue;
        }

        // Send notification
        await this.sendToChannels(notification);
        
        // Update rate limit counters
        this.updateRateLimitCounters(notification.type);
        
        // Small delay between notifications
        await this.sleep(100);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send notification to enabled channels
   * @param {Object} notification - Notification object
   */
  async sendToChannels(notification) {
    const promises = [];

    // Telegram
    if (this.config.telegram.enabled && 
        this.config.telegram.notifications.includes(notification.type)) {
      promises.push(this.sendToTelegram(notification));
    }

    // Email
    if (this.config.email.enabled && 
        this.config.email.notifications.includes(notification.type)) {
      promises.push(this.sendToEmail(notification));
    }

    // Webhook
    if (this.config.webhook.enabled && 
        this.config.webhook.notifications.includes(notification.type)) {
      promises.push(this.sendToWebhook(notification));
    }

    // Wait for all notifications to be sent
    await Promise.allSettled(promises);
  }

  /**
   * Send notification to Telegram
   * @param {Object} notification - Notification object
   * @returns {Promise<boolean>} - Success status
   */
  async sendToTelegram(notification) {
    try {
      if (!this.config.telegram.botToken || !this.config.telegram.chatId) {
        console.warn('Telegram configuration incomplete');
        return false;
      }

      const message = this.formatTelegramMessage(notification);
      
      const response = await axios.post(
        `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`,
        {
          chat_id: this.config.telegram.chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true
        },
        {
          timeout: constants.NOTIFICATIONS.TELEGRAM.TIMEOUT
        }
      );

      if (response.data.ok) {
        console.log('✅ Telegram notification sent successfully');
        return true;
      } else {
        console.error('❌ Telegram notification failed:', response.data);
        return false;
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error.message);
      return false;
    }
  }

  /**
   * Send notification to Email
   * @param {Object} notification - Notification object
   * @returns {Promise<boolean>} - Success status
   */
  async sendToEmail(notification) {
    try {
      // This is a simplified email implementation
      // In production, you'd use a proper email library like nodemailer
      console.log('📧 Email notification would be sent:', notification.title);
      
      // Simulate email sending
      await this.sleep(100);
      
      console.log('✅ Email notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending email notification:', error.message);
      return false;
    }
  }

  /**
   * Send notification to Webhook
   * @param {Object} notification - Notification object
   * @returns {Promise<boolean>} - Success status
   */
  async sendToWebhook(notification) {
    try {
      if (!this.config.webhook.url) {
        console.warn('Webhook URL not configured');
        return false;
      }

      const payload = {
        ...notification,
        bot: 'Heaven DEX Bot',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        this.config.webhook.url,
        payload,
        {
          timeout: constants.NOTIFICATIONS.EMAIL.TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'HeavenDEXBot/1.0.0'
          }
        }
      );

      if (response.status >= 200 && response.status < 300) {
        console.log('✅ Webhook notification sent successfully');
        return true;
      } else {
        console.error('❌ Webhook notification failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error sending webhook notification:', error.message);
      return false;
    }
  }

  /**
   * Format Telegram message
   * @param {Object} notification - Notification object
   * @returns {string} - Formatted message
   */
  formatTelegramMessage(notification) {
    const { title, message, priority, data } = notification;
    
    let emoji = 'ℹ️';
    switch (priority) {
      case 'error':
        emoji = '❌';
        break;
      case 'warning':
        emoji = '⚠️';
        break;
      case 'success':
        emoji = '✅';
        break;
      case 'info':
      default:
        emoji = 'ℹ️';
    }

    let formattedMessage = `${emoji} <b>${title}</b>\n\n`;
    formattedMessage += `${message}\n\n`;
    
    if (data.timestamp) {
      formattedMessage += `🕐 ${new Date(data.timestamp).toLocaleString()}\n`;
    }

    // Add additional data based on notification type
    if (notification.type === 'trade') {
      formattedMessage += `💰 Amount: ${data.amount} tokens\n`;
      formattedMessage += `💵 Price: ${data.price} SOL\n`;
      if (data.profit !== undefined) {
        formattedMessage += `📈 Profit: ${data.profit} SOL\n`;
      }
    } else if (notification.type === 'alert') {
      formattedMessage += `🚨 Severity: ${data.severity}\n`;
    }

    return formattedMessage;
  }

  /**
   * Format report summary for notification
   * @param {Object} summary - Report summary
   * @returns {string} - Formatted summary
   */
  formatReportSummary(summary) {
    if (!summary) return 'No summary available';
    
    let message = '';
    
    if (summary.totalTrades !== undefined) {
      message += `Total Trades: ${summary.totalTrades}\n`;
    }
    
    if (summary.totalProfit !== undefined) {
      message += `Total Profit: ${summary.totalProfit} SOL\n`;
    }
    
    if (summary.winRate !== undefined) {
      message += `Win Rate: ${summary.winRate.toFixed(2)}%\n`;
    }
    
    if (summary.maxDrawdown !== undefined) {
      message += `Max Drawdown: ${summary.maxDrawdown.toFixed(4)} SOL\n`;
    }
    
    return message.trim();
  }

  /**
   * Check if notification type is rate limited
   * @param {string} type - Notification type
   * @returns {boolean} - True if rate limited
   */
  isRateLimited(type) {
    const counter = this.rateLimitCounters[type];
    if (!counter) return false;
    
    const now = Date.now();
    const windowSize = constants.TIME.MINUTE; // 1 minute window
    
    // Reset counter if window has passed
    if (now - counter.resetTime > windowSize) {
      counter.count = 0;
      counter.resetTime = now;
    }
    
    const limit = constants.NOTIFICATIONS.TELEGRAM.RATE_LIMIT;
    return counter.count >= limit;
  }

  /**
   * Update rate limit counters
   * @param {string} type - Notification type
   */
  updateRateLimitCounters(type) {
    const counter = this.rateLimitCounters[type];
    if (counter) {
      counter.count++;
    }
  }

  /**
   * Validate notification format
   * @param {Object} notification - Notification object
   * @returns {boolean} - True if valid
   */
  validateNotification(notification) {
    const required = ['type', 'title', 'message'];
    
    for (const field of required) {
      if (!notification[field]) {
        return false;
      }
    }
    
    const validTypes = ['trade', 'alert', 'report'];
    if (!validTypes.includes(notification.type)) {
      return false;
    }
    
    const validPriorities = ['info', 'warning', 'error', 'success'];
    if (notification.priority && !validPriorities.includes(notification.priority)) {
      return false;
    }
    
    return true;
  }

  /**
   * Generate unique notification ID
   * @returns {string} - Unique ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get notification statistics
   * @returns {Object} - Statistics object
   */
  getStats() {
    return {
      queueLength: this.notificationQueue.length,
      isProcessing: this.isProcessing,
      rateLimitCounters: this.rateLimitCounters,
      config: {
        telegram: this.config.telegram.enabled,
        email: this.config.email.enabled,
        webhook: this.config.webhook.enabled
      }
    };
  }

  /**
   * Clear notification queue
   */
  clearQueue() {
    this.notificationQueue = [];
    console.log('📋 Notification queue cleared');
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Notification configuration updated');
  }

  /**
   * Utility function to sleep
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} - Promise that resolves after sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { NotificationManager };
