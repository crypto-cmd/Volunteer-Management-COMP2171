import { SupabaseClient } from "@supabase/supabase-js";
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

function mapRole(role: string | null | undefined): "Admin" | "Volunteer" {
    return role === "admin" ? "Admin" : "Volunteer";
}

export class VolunteerRepository {
    private supabase: SupabaseClient;

    constructor(supabaseClient: SupabaseClient) {
        this.supabase = supabaseClient;
    }

    async findAllVolunteers(): Promise<Volunteer[]> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('*');

        if (error) throw new Error(`Failed to fetch volunteers: ${error.message}`);

        return data.map(v => new Volunteer(v.id, v.name));
    }

    async findVolunteerById(id: string): Promise<Volunteer | null> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null; // Not found
            throw new Error(`Failed to fetch volunteer: ${error.message}`);
        }

        return new Volunteer(data.id, data.name);
    }

    async findByStudentIdAndPassword(studentId: string, password: string): Promise<UserProfile | null> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('id, name, role, email, phone, major, year_of_study')
            .eq('id', studentId)
            .eq('password', password)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to authenticate user: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async getVolunteerProfile(studentId: string): Promise<UserProfile | null> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('id, name, role, email, phone, major, year_of_study')
            .eq('id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async updateVolunteerProfile(studentId: string, updates: ProfileUpdates): Promise<UserProfile | null> {
        const payload = {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.email !== undefined ? { email: updates.email } : {}),
            ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
            ...(updates.major !== undefined ? { major: updates.major } : {}),
            ...(updates.yearOfStudy !== undefined ? { year_of_study: updates.yearOfStudy } : {}),
        };

        const { data, error } = await this.supabase
            .from('volunteers')
            .update(payload)
            .eq('id', studentId)
            .select('id, name, role, email, phone, major, year_of_study')
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to update profile: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async createVolunteerAccount(payload: RegisterPayload): Promise<UserProfile> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .insert({
                id: payload.studentId,
                name: payload.name,
                password: payload.password,
                role: payload.role || 'volunteer',
                email: payload.email || null,
                phone: payload.phone || null,
                major: payload.major || null,
                year_of_study: payload.yearOfStudy || null,
            })
            .select('id, name, role, email, phone, major, year_of_study')
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Account already exists for this student ID');
            }
            throw new Error(`Failed to create account: ${error.message}`);
        }

        return new UserProfile(
            data.id,
            data.name || "",
            mapRole(data.role),
            data.email || "",
            data.phone || "",
            data.major || "",
            data.year_of_study || ""
        );
    }

    async isAdmin(studentId: string): Promise<boolean> {
        const { data, error } = await this.supabase
            .from('volunteers')
            .select('role')
            .eq('id', studentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return false;
            throw new Error(`Failed to verify admin role: ${error.message}`);
        }

        return data.role === 'admin';
    }

    async getRecordsForVolunteer(volunteerId: string): Promise<TimesheetRecord[]> {
        const { data, error } = await this.supabase
            .from('timesheet_records')
            .select('*')
            .eq('volunteer_id', volunteerId);

        if (error) throw new Error(`Failed to fetch timesheet records: ${error.message}`);

        return data.map(r => new TimesheetRecord(
            r.id,
            r.record_date, // Mapped to DB column
            r.event_id || "",
            r.event_name || "Unknown Event",
            r.hours_worked // Mapped to DB column
        ));
    }

    async updateRecord(volunteerId: string, recordId: number, hoursWorked: number): Promise<TimesheetRecord | null> {
        // We use .select() at the end to return the updated row immediately
        const { data, error } = await this.supabase
            .from('timesheet_records')
            .update({ hours_worked: hoursWorked })
            .eq('id', recordId)
            .eq('volunteer_id', volunteerId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to update record: ${error.message}`);
        }

        return new TimesheetRecord(
            data.id,
            data.record_date,
            data.event_id || "",
            data.event_name || "Unknown Event",
            data.hours_worked
        );
    }

}