export class TimesheetRecord {
    constructor(
        public readonly id: number,
        public readonly date: string,
        public readonly eventName: string,
        public hoursWorked: number,
    ) { }

    updateHours(hours: number): void {
        if (typeof hours !== "number" || hours < 0) {
            throw new Error("Invalid hoursWorked value");
        }
        this.hoursWorked = hours;
    }

    toJSON() {
        return {
            id: this.id,
            date: this.date,
            eventName: this.eventName,
            hoursWorked: this.hoursWorked,
        };
    }
}
