export type EventRequestStatus = "Pending" | "Accepted" | "Declined";

export class EventRequest {
    constructor(
        public readonly id: number,
        public readonly eventId: string,
        public readonly volunteerId: string,
        public status: EventRequestStatus,
        public readonly requestedAt: string,
        public readonly eventName?: string,
        public readonly volunteerName?: string,
    ) { }

    setStatus(status: EventRequestStatus): void {
        this.status = status;
    }

    toJSON() {
        return {
            id: this.id,
            eventId: this.eventId,
            volunteerId: this.volunteerId,
            status: this.status,
            requestedAt: this.requestedAt,
            eventName: this.eventName,
            volunteerName: this.volunteerName,
        };
    }
}
