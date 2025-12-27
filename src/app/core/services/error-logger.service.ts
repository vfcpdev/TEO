import { Injectable, signal } from '@angular/core';

export interface ErrorLog {
    timestamp: Date;
    level: 'ERROR' | 'WARNING' | 'INFO';
    context: string;
    message: string;
    details?: any;
}

@Injectable({
    providedIn: 'root'
})
export class ErrorLoggerService {
    private readonly MAX_LOGS = 100;
    private _errorHistory = signal<ErrorLog[]>([]);

    readonly errorHistory = this._errorHistory.asReadonly();

    constructor() { }

    logError(context: string, error: any): void {
        const errorLog: ErrorLog = {
            timestamp: new Date(),
            level: 'ERROR',
            context,
            message: this.extractErrorMessage(error),
            details: error
        };

        this.addLog(errorLog);
        console.error(`[${context}]`, error);
    }

    logWarning(context: string, message: string, details?: any): void {
        const warningLog: ErrorLog = {
            timestamp: new Date(),
            level: 'WARNING',
            context,
            message,
            details
        };

        this.addLog(warningLog);
        console.warn(`[${context}]`, message, details);
    }

    logInfo(context: string, message: string, details?: any): void {
        const infoLog: ErrorLog = {
            timestamp: new Date(),
            level: 'INFO',
            context,
            message,
            details
        };

        this.addLog(infoLog);
        console.log(`[${context}]`, message, details);
    }

    private addLog(log: ErrorLog): void {
        const current = this._errorHistory();
        const updated = [log, ...current].slice(0, this.MAX_LOGS);
        this._errorHistory.set(updated);
    }

    private extractErrorMessage(error: any): string {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.error?.message) return error.error.message;
        return 'Unknown error occurred';
    }

    getErrorHistory(): ErrorLog[] {
        return this._errorHistory();
    }

    clearHistory(): void {
        this._errorHistory.set([]);
    }

    exportLogs(): string {
        const logs = this._errorHistory();
        return JSON.stringify(logs, null, 2);
    }
}
