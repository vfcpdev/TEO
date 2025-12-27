import { Injectable } from '@angular/core';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARNING = 2,
  ERROR = 3
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.DEBUG;

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warning(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.WARNING) {
      console.warn(`[WARNING] ${message}`, ...args);
    }
  }

  error(message: string, error?: any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, error, ...args);
      // TODO: Send to error tracking service (Sentry, Firebase Crashlytics, etc.)
    }
  }
}
