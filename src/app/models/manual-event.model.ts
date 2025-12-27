export interface ManualEvent {
    id: string;
    name: string;
    startTime: string; // ISO String for Date (fecha inicio)
    endTime?: string;  // ISO String for Date (fecha fin - opcional)
    timeStr: string; // HH:mm for specific time display
    description?: string;
}
