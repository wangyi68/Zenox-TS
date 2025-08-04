import { createLogger, format, transports, Logger } from 'winston';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// ANSI color codes for console output
export const Colors = {
  RESET: '\x1b[0m',
  BRIGHT: '\x1b[1m',
  DIM: '\x1b[2m',
  UNDERSCORE: '\x1b[4m',
  BLINK: '\x1b[5m',
  REVERSE: '\x1b[7m',
  HIDDEN: '\x1b[8m',
  
  // Foreground colors
  BLACK: '\x1b[30m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  
  // Background colors
  BG_BLACK: '\x1b[40m',
  BG_RED: '\x1b[41m',
  BG_GREEN: '\x1b[42m',
  BG_YELLOW: '\x1b[43m',
  BG_BLUE: '\x1b[44m',
  BG_MAGENTA: '\x1b[45m',
  BG_CYAN: '\x1b[46m',
  BG_WHITE: '\x1b[47m'
};

// Custom console format with colors
const consoleFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const colorMap: Record<string, string> = {
      error: Colors.RED,
      warn: Colors.YELLOW,
      info: Colors.CYAN,
      debug: Colors.MAGENTA,
      verbose: Colors.BLUE
    };
    
    const color = colorMap[level] || Colors.WHITE;
    const reset = Colors.RESET;
    
    let output = `${Colors.DIM}[${timestamp}]${reset} ${color}${level.toUpperCase()}${reset} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      output += ` ${Colors.DIM}${JSON.stringify(meta)}${reset}`;
    }
    
    if (stack) {
      output += `\n${Colors.RED}${stack}${reset}`;
    }
    
    return output;
  })
);

// File format without colors
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create logger instance
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: fileFormat,
  defaultMeta: { service: 'zenox-bot' },
  transports: [
    // Console transport
    new transports.Console({
      format: consoleFormat
    }),
    
    // File transports
    new transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new transports.File({
      filename: join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Daily rotation for all logs
    new transports.File({
      filename: join(logsDir, 'zenox.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 14 // Keep 2 weeks of logs
    })
  ]
});

// Custom logging methods with better formatting
export class ZenoxLogger {
  private logger: Logger;
  private context: string;

  constructor(context: string = 'Zenox') {
    this.logger = logger;
    this.context = context;
  }

  // Success messages
  success(message: string, meta?: any): void {
    this.logger.info(`${Colors.GREEN}✓${Colors.RESET} ${message}`, meta);
  }

  // Info messages
  info(message: string, meta?: any): void {
    this.logger.info(`${Colors.CYAN}ℹ${Colors.RESET} ${message}`, meta);
  }

  // Warning messages
  warn(message: string, meta?: any): void {
    this.logger.warn(`${Colors.YELLOW}⚠${Colors.RESET} ${message}`, meta);
  }

  // Error messages
  error(message: string, error?: Error | any, meta?: any): void {
    const errorInfo = error instanceof Error ? error.stack : error;
    this.logger.error(`${Colors.RED}✗${Colors.RESET} ${message}`, { 
      error: errorInfo,
      context: this.context,
      ...meta 
    });
  }

  // Debug messages
  debug(message: string, meta?: any): void {
    this.logger.debug(`${Colors.MAGENTA}🔍${Colors.RESET} ${message}`, meta);
  }

  // Database operations
  db(operation: string, collection: string, meta?: any): void {
    this.logger.info(`${Colors.BLUE}🗄${Colors.RESET} DB ${operation} on ${collection}`, meta);
  }

  // API calls
  api(method: string, url: string, status?: number, meta?: any): void {
    const statusColor = status && status >= 400 ? Colors.RED : Colors.GREEN;
    const statusIcon = status && status >= 400 ? '✗' : '✓';
    this.logger.info(`${statusColor}${statusIcon}${Colors.RESET} ${method} ${url}${status ? ` (${status})` : ''}`, meta);
  }

  // Discord events
  discord(event: string, guildId?: string, meta?: any): void {
    this.logger.info(`${Colors.MAGENTA}🎮${Colors.RESET} Discord ${event}${guildId ? ` in ${guildId}` : ''}`, meta);
  }

  // Command execution
  command(command: string, userId: string, guildId?: string, meta?: any): void {
    this.logger.info(`${Colors.CYAN}⚡${Colors.RESET} Command /${command} by ${userId}${guildId ? ` in ${guildId}` : ''}`, meta);
  }

  // Performance timing
  performance(operation: string, duration: number, meta?: any): void {
    const color = duration > 1000 ? Colors.RED : duration > 500 ? Colors.YELLOW : Colors.GREEN;
    this.logger.info(`${color}⏱${Colors.RESET} ${operation} took ${duration}ms`, meta);
  }

  // Startup/shutdown
  startup(message: string, meta?: any): void {
    this.logger.info(`${Colors.GREEN}🚀${Colors.RESET} ${message}`, meta);
  }

  shutdown(message: string, meta?: any): void {
    this.logger.info(`${Colors.YELLOW}🛑${Colors.RESET} ${message}`, meta);
  }

  // Table-like output for structured data
  table(title: string, data: Record<string, any>): void {
    const tableStr = Object.entries(data)
      .map(([key, value]) => `  ${Colors.DIM}${key}:${Colors.RESET} ${value}`)
      .join('\n');
    this.logger.info(`${Colors.CYAN}📊${Colors.RESET} ${title}\n${tableStr}`);
  }

  // Progress bar simulation
  progress(current: number, total: number, operation: string): void {
    const percentage = Math.round((current / total) * 100);
    const barLength = 20;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    this.logger.info(`${Colors.BLUE}📈${Colors.RESET} ${operation}: [${bar}] ${percentage}% (${current}/${total})`);
  }

  // Separator for visual organization
  separator(title?: string): void {
    const line = '─'.repeat(50);
    if (title) {
      this.logger.info(`${Colors.DIM}${line} ${title} ${line}${Colors.RESET}`);
    } else {
      this.logger.info(`${Colors.DIM}${line}${Colors.RESET}`);
    }
  }
}

// Create default logger instance
export const log = new ZenoxLogger();

// Export the winston logger for advanced usage
export { logger };

// Utility functions for quick logging
export const quickLog = {
  success: (msg: string) => log.success(msg),
  info: (msg: string) => log.info(msg),
  warn: (msg: string) => log.warn(msg),
  error: (msg: string, err?: any) => log.error(msg, err),
  debug: (msg: string) => log.debug(msg),
  db: (op: string, coll: string) => log.db(op, coll),
  api: (method: string, url: string, status?: number) => log.api(method, url, status),
  discord: (event: string, guildId?: string) => log.discord(event, guildId),
  command: (cmd: string, userId: string, guildId?: string) => log.command(cmd, userId, guildId),
  performance: (op: string, duration: number) => log.performance(op, duration),
  startup: (msg: string) => log.startup(msg),
  shutdown: (msg: string) => log.shutdown(msg),
  table: (title: string, data: Record<string, any>) => log.table(title, data),
  progress: (current: number, total: number, operation: string) => log.progress(current, total, operation),
  separator: (title?: string) => log.separator(title)
};