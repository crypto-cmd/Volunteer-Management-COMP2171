export class Volunteer {
    constructor(
        public readonly id: string,
        public readonly name: string,
    ) { }

    matchesFuzzy(query: string): boolean {
        if (!query) return true;
        const lowerName = this.name.toLowerCase();
        const lowerId = this.id.toLowerCase();
        if (lowerId.includes(query)) return true;

        let qi = 0;
        for (const ch of lowerName) {
            if (ch === query[qi]) qi++;
            if (qi === query.length) return true;
        }
        return false;
    }

    toJSON() {
        return { id: this.id, name: this.name };
    }
}

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
