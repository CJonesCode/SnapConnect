/**
 * Centralized logging service for the application.
 * This service provides a structured way to log messages and events,
 * making it easier to debug and monitor the application's behavior.
 * It can be extended to integrate with third-party logging services like Sentry.
 */

// Define log levels for structured logging
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

/**
 * Logs a message with a specific level and optional context data.
 *
 * @param level - The level of the log (e.g., INFO, ERROR).
 * @param message - The primary log message.
 * @param data - Optional structured data to include with the log.
 */
function log(level: LogLevel, message: string, data?: object) {
  const timestamp = new Date().toISOString();
  console.log(
    JSON.stringify(
      {
        timestamp,
        level,
        message,
        ...data,
      },
      null,
      2,
    ),
  );
}

export const logger = {
  /**
   * Logs an informational message. Use for general application flow events.
   * @param message - The log message.
   * @param data - Optional data object.
   */
  info: (message: string, data?: object) => log('INFO', message, data),

  /**
   * Logs a warning message. Use for potential issues that don't break the app.
   * @param message - The log message.
   * @param data - Optional data object.
   */
  warn: (message: string, data?: object) => log('WARN', message, data),

  /**
   * Logs an error message. Use for exceptions and errors.
   * @param message - The log message.
   * @param data - Optional data object.
   */
  error: (message: string, data?: object) => log('ERROR', message, data),

  /**
   * Logs a debug message. Use for detailed, verbose information useful during development.
   * @param message - The log message.
   * @param data - Optional data object.
   */
  debug: (message: string, data?: object) => log('DEBUG', message, data),
};
