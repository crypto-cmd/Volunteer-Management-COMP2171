import { VolunteerRepository } from "@repositories";
import { UserProfile, Volunteer, TimesheetRecord } from "@models";

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
    private readonly volunteerRepo: VolunteerRepository;

    constructor(volunteerRepo: VolunteerRepository) {
        this.volunteerRepo = volunteerRepo;
    }

    async searchVolunteers(query: string): Promise<Volunteer[]> {
        const all = await this.volunteerRepo.findAllVolunteers();
        const lowerQuery = query.toLowerCase();
        return lowerQuery ? all.filter(v => v.matchesFuzzy(lowerQuery)) : all;
    }

    async getVolunteerRecords(volunteerId: string): Promise<{ volunteer: Volunteer; records: TimesheetRecord[] } | null> {
        const volunteer = await this.volunteerRepo.findVolunteerById(volunteerId);
        if (!volunteer) return null;
        const records = await this.volunteerRepo.getRecordsForVolunteer(volunteerId);
        return { volunteer, records };
    }

    async updateRecord(volunteerId: string, recordId: number, hoursWorked: number): Promise<TimesheetRecord | null> {
        return this.volunteerRepo.updateRecord(volunteerId, recordId, hoursWorked);
    }

    async login(studentId: string, password: string): Promise<UserProfile | null> {
        return this.volunteerRepo.findByStudentIdAndPassword(studentId, password);
    }

    async getUserProfile(studentId: string): Promise<UserProfile | null> {
        return this.volunteerRepo.getVolunteerProfile(studentId);
    }

    async updateUserProfile(studentId: string, updates: ProfileUpdates): Promise<UserProfile | null> {
        return this.volunteerRepo.updateVolunteerProfile(studentId, updates);
    }

    async registerVolunteer(payload: RegisterPayload): Promise<UserProfile> {
        return this.volunteerRepo.createVolunteerAccount(payload);
    }

    async isAdmin(studentId: string): Promise<boolean> {
        return this.volunteerRepo.isAdmin(studentId);
    }
}
