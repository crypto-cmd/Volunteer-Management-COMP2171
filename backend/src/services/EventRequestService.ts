import { EventRequestRepository } from "@repositories";
import { type EventRequestStatus } from "@models";

export class EventRequestService {
    private readonly eventRequestRepo: EventRequestRepository;

    constructor(eventRequestRepo: EventRequestRepository) {
        this.eventRequestRepo = eventRequestRepo;
    }

    async getEventRequests(filters?: { eventId?: string; volunteerId?: string; status?: EventRequestStatus }) {
        return this.eventRequestRepo.getEventRequests(filters);
    }

    async createEventRequest(volunteerId: string, eventId: string) {
        return this.eventRequestRepo.createEventRequest(volunteerId, eventId);
    }

    async updateEventRequestStatus(requestId: number, status: EventRequestStatus) {
        return this.eventRequestRepo.updateEventRequestStatus(requestId, status);
    }
}
