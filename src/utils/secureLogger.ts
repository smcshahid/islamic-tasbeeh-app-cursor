/**
 * Secure Logging Utility
 * Prevents sensitive data from being logged in production environments
 */
export interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

export const LOG_LEVELS: LogLevel = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  DEBUG: 'debug'
};

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /("password":|"token":|"key":|"secret":|"auth":|"credential"):[\s]*"[^"]*"/gi,
  /("email":|"mail"):[\s]*"[^"]*"/gi,
  /("phone":|"mobile"):[\s]*"[^"]*"/gi,
  /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi,
  /(eyJ[A-Za-z0-9\-._~+/]+=*)/gi, // JWT tokens
  /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/gi, // Email addresses
];

class SecureLogger {
  private isProduction: boolean;
  private enableLogging: boolean;
  private logLevel: string;

  constructor() {
    this.isProduction = process.env.EXPO_PUBLIC_APP_ENV === 'production';
    this.enableLogging = process.env.EXPO_PUBLIC_ENABLE_LOGGING === 'true';
    this.logLevel = process.env.EXPO_PUBLIC_LOG_LEVEL || 'error';
  }

  /**
   * Sanitize data to prevent sensitive information from being logged
   */
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      return this.sanitizeObject(data);
    }
    
    return data;
  }

  /**
   * Sanitize string data
   */
  private sanitizeString(str: string): string {
    let sanitized = str;
    
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        if (match.includes(':')) {
          const [key, ...rest] = match.split(':');
          return `${key}: "[REDACTED]"`;
        }
        return '[REDACTED]';
      });
    });
    
    return sanitized;
  }

  /**
   * Sanitize object data
   */
  private sanitizeObject(obj: any): any {
    const sanitized = { ...obj };
    
    const sensitiveKeys = [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'email', 'mail', 'phone', 'mobile', 'address', 'ssn'
    ];
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sensitiveKey => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      } else if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeString(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  /**
   * Check if logging is enabled for the given level
   */
  private shouldLog(level: string): boolean {
    if (this.isProduction && !this.enableLogging) {
      return false;
    }
    
    const levelPriority = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    const currentLevelPriority = levelPriority[this.logLevel as keyof typeof levelPriority] || 3;
    const messageLevelPriority = levelPriority[level as keyof typeof levelPriority] || 3;
    
    return messageLevelPriority >= currentLevelPriority;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `[${timestamp}][${level.toUpperCase()}]${contextStr} ${message}`;
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, context);
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    console.info(formattedMessage, sanitizedData);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, context);
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    console.warn(formattedMessage, sanitizedData);
  }

  /**
   * Log error message
   */
  error(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message, context);
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    console.error(formattedMessage, sanitizedData);
    
    // In production, you might want to send errors to a logging service
    if (this.isProduction && data?.error) {
      this.reportToLoggingService(message, sanitizedData);
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, context);
    const sanitizedData = data ? this.sanitizeData(data) : undefined;
    
    console.debug(formattedMessage, sanitizedData);
  }

  /**
   * Report critical errors to external logging service (placeholder)
   */
  private reportToLoggingService(message: string, data?: any): void {
    // TODO: Implement integration with external logging service
    // Examples: Sentry, LogRocket, Crashlytics, etc.
    // This should be implemented based on your chosen logging provider
    
    // For now, just ensure we don't log sensitive data
    const sanitizedError = {
      message,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'mobile-app',
      platform: typeof window !== 'undefined' ? 'web' : 'mobile'
    };
    
    // In a real implementation, you would send this to your logging service
    console.error('[PRODUCTION_ERROR]', sanitizedError);
  }

  /**
   * Create a context-specific logger
   */
  createContextLogger(context: string) {
    return {
      info: (message: string, data?: any) => this.info(message, data, context),
      warn: (message: string, data?: any) => this.warn(message, data, context),
      error: (message: string, data?: any) => this.error(message, data, context),
      debug: (message: string, data?: any) => this.debug(message, data, context),
    };
  }
}

// Export singleton instance
export const secureLogger = new SecureLogger();

// Export convenience functions
export const logInfo = (message: string, data?: any, context?: string) => 
  secureLogger.info(message, data, context);

export const logWarn = (message: string, data?: any, context?: string) => 
  secureLogger.warn(message, data, context);

export const logError = (message: string, data?: any, context?: string) => 
  secureLogger.error(message, data, context);

export const logDebug = (message: string, data?: any, context?: string) => 
  secureLogger.debug(message, data, context);

export default secureLogger; 