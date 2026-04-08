import { VolunteerRepository } from "@repositories";
import { type EventRequestStatus, UserProfile, Volunteer, TimesheetRecord } from "@models";

type ProfileUpdates = {
    name?: string;
    email?: string;
    phone?: string;
    major?: string;
    yearOfStudy?: string;
};

type RegisterPayload = {
    studentId: string;
    name: string;
    password: string;
    email?: string;
    phone?: string;
    major?: string;
    yearOfStudy?: string;
    role?: "admin" | "volunteer";
};

export class VolunteerService {
    private readonly repo: VolunteerRepository;

    constructor(repo: VolunteerRepository) {
        this.repo = repo;
    }

    async searchVolunteers(query: string): Promise<Volunteer[]> {
        const all = await this.repo.findAllVolunteers();
        const lowerQuery = query.toLowerCase();
        return lowerQuery ? all.filter(v => v.matchesFuzzy(lowerQuery)) : all;
    }

    async getVolunteerRecords(volunteerId: string): Promise<{ volunteer: Volunteer; records: TimesheetRecord[] } | null> {
        const volunteer = await this.repo.findVolunteerById(volunteerId);
        if (!volunteer) return null;
        const records = await this.repo.getRecordsForVolunteer(volunteerId);
        return { volunteer, records };
    }

    async updateRecord(volunteerId: string, recordId: number, hoursWorked: number): Promise<TimesheetRecord | null> {
        return this.repo.updateRecord(volunteerId, recordId, hoursWorked);
    }

    async getEventRequests(filters?: { eventId?: string; volunteerId?: string; status?: EventRequestStatus }) {
        return this.repo.getEventRequests(filters);
    }

    async createEventRequest(volunteerId: string, eventId: string) {
        return this.repo.createEventRequest(volunteerId, eventId);
    }

    async updateEventRequestStatus(requestId: number, status: EventRequestStatus) {
        return this.repo.updateEventRequestStatus(requestId, status);
    }

    async login(studentId: string, password: string): Promise<UserProfile | null> {
        return this.repo.findByStudentIdAndPassword(studentId, password);
    }

    async getUserProfile(studentId: string): Promise<UserProfile | null> {
        return this.repo.getVolunteerProfile(studentId);
    }

    async updateUserProfile(studentId: string, updates: ProfileUpdates): Promise<UserProfile | null> {
        return this.repo.updateVolunteerProfile(studentId, updates);
    }

    async registerVolunteer(payload: RegisterPayload): Promise<UserProfile> {
        return this.repo.createVolunteerAccount(payload);
    }

    async isAdmin(studentId: string): Promise<boolean> {
        return this.repo.isAdmin(studentId);
    }

    async getAnnouncements() {
        return this.repo.getAnnouncements();
    }

    async createAnnouncement(title: string, message: string, postedBy: string) {
        return this.repo.createAnnouncement(title, message, postedBy);
    }

    async getBadges() {
        return this.repo.getBadges();
    }

    async createBadge(name: string, description: string, icon: string) {
        return this.repo.createBadge(name, description, icon);
    }

    async getVolunteerBadges(volunteerId: string) {
        return this.repo.getVolunteerBadges(volunteerId);
    }

    async assignBadge(volunteerId: string, badgeId: number) {
        return this.repo.assignBadge(volunteerId, badgeId);
    }
}
