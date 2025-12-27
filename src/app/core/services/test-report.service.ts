import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TestReportService {
    private reportCounter = 1;
    private reportsBasePath = 'C:\\Users\\vfcp1\\.gemini\\antigravity\\brain\\98124a73-9367-4add-9fef-f4651ece3146\\reports';

    constructor() {
        // Load counter from localStorage if exists
        const savedCounter = localStorage.getItem('test-report-counter');
        if (savedCounter) {
            this.reportCounter = parseInt(savedCounter, 10);
        }
    }

    /**
     * Generates filename with format: test-report-NNN-YYYY-MM-DD-HHmmss.md
     */
    generateFilename(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const counterStr = String(this.reportCounter).padStart(3, '0');
        const timestamp = `${year}-${month}-${day}-${hours}${minutes}${seconds}`;

        return `test-report-${counterStr}-${timestamp}.md`;
    }

    /**
     * Saves test report content to file
     */
    async saveTestReport(content: string, title?: string): Promise<string> {
        const filename = this.generateFilename();
        const fullPath = `${this.reportsBasePath}\\${filename}`;

        // In a real implementation, this would write to filesystem
        // For now, we'll log and download via browser
        console.log(`📄 Test Report #${this.reportCounter}: ${filename}`);
        console.log(`Path: ${fullPath}`);
        console.log(content);

        // Trigger browser download
        this.downloadAsFile(content, filename);

        // Increment counter and save
        this.reportCounter++;
        localStorage.setItem('test-report-counter', String(this.reportCounter));

        return fullPath;
    }

    /**
     * Downloads content as .md file via browser
     */
    private downloadAsFile(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    /**
     * Gets the next report number
     */
    getNextReportNumber(): number {
        return this.reportCounter;
    }

    /**
     * Resets the counter (for testing)
     */
    resetCounter(): void {
        this.reportCounter = 1;
        localStorage.setItem('test-report-counter', '1');
    }
}
